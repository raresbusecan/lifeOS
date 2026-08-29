import { runAgent, } from "../agentRunner/agentRunner.js";
import { runAgentLoop, } from "../agent/loop.js";
import { TaskStore, } from "../workflow/taskStore.js";
import { WorkflowCoordinator, } from "../workflow/workflowCoordinator.js";
import { createTaskContract, } from "../workflow/taskContract.js";
import { assertValidImpactMap, } from "../workflow/impactMap.js";
function parseJson(content, label) {
    const cleaned = content
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
    try {
        return JSON.parse(cleaned);
    }
    catch (error) {
        throw new Error(`${label} returned invalid JSON: ${error instanceof Error
            ? error.message
            : String(error)}`);
    }
}
function buildAgentInput(task, context) {
    return [
        `Task ID: ${task.id}`,
        `Title: ${task.title}`,
        `Description: ${task.description}`,
        "",
        "Task scope:",
        JSON.stringify(task.scope, null, 2),
        "",
        context,
    ].join("\n");
}
function createContractFromAnalysis(task, planner, analyst) {
    const acceptanceCriteria = [
        ...planner.recommendations,
        ...planner.findings,
    ]
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 10);
    const requiredTests = analyst.recommendations
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 10);
    return createTaskContract({
        taskId: task.id,
        objective: task.description,
        acceptanceCriteria: acceptanceCriteria.length > 0
            ? acceptanceCriteria
            : [task.description],
        scope: {
            files: [...task.scope.files],
            components: [...task.scope.components],
            behavior: [...task.scope.behavior],
            exclusions: [...task.scope.exclusions],
        },
        constraints: [
            "Do not modify files outside the approved scope.",
        ],
        requiredTests,
        dependencies: analyst.files
            .map((file) => file.trim())
            .filter(Boolean),
    });
}
function createImpactMap(task, analyst, architect) {
    const impactMap = {
        filesToModify: [
            ...task.scope.files,
            ...analyst.files,
            ...architect.files,
        ].filter((value, index, values) => value.trim().length > 0 &&
            values.indexOf(value) === index),
        filesToCreate: [],
        testsToModify: [],
        testsToCreate: [],
        componentsAffected: [
            ...task.scope.components,
        ],
        componentsProtected: [
            ...task.scope.exclusions,
        ],
        architectureRisks: [
            ...architect.risks,
        ],
        confidence: Math.min(1, Math.max(0, architect.confidence)),
    };
    assertValidImpactMap(impactMap);
    return impactMap;
}
function buildCoderInput(task, contract, impactMap) {
    return [
        buildAgentInput(task, [
            "You are now executing the implementation phase.",
            "Use the repository tools to inspect and modify the repository.",
            "Actually implement the task.",
        ].join("\n")),
        "",
        "Task Contract:",
        JSON.stringify(contract, null, 2),
        "",
        "Impact Map:",
        JSON.stringify(impactMap, null, 2),
    ].join("\n");
}
function buildTesterInput(task, contract, impactMap) {
    return [
        buildAgentInput(task, [
            "You are now executing the testing phase.",
            "Inspect the implementation and run the relevant tests.",
            "Do not modify source files.",
            "",
            "Return ONLY a JSON TestResult object with:",
            '{ "type": "PASS" | "REWORK" | "NEW_TASK",',
            `  "relatedTaskId": "${task.id}",`,
            '  "summary": string,',
            '  "details": string,',
            '  "expectedBehavior": string,',
            '  "actualBehavior": string,',
            '  "files": string[],',
            '  "components": string[] }',
        ].join("\n")),
        "",
        "Task Contract:",
        JSON.stringify(contract, null, 2),
        "",
        "Impact Map:",
        JSON.stringify(impactMap, null, 2),
    ].join("\n");
}
export async function orchestrateTask(task, options) {
    const store = new TaskStore();
    store.add(task);
    const workflow = new WorkflowCoordinator(store);
    let currentTask = task;
    /*
     * PLANNER
     */
    const planner = await runAgent({
        role: "PLANNER",
        input: buildAgentInput(currentTask, "Plan the task and establish the intended outcome."),
        timeoutMs: options.timeoutMs,
    });
    if (planner.status === "BLOCKED" ||
        planner.status === "FAILED") {
        throw new Error(`Planner blocked the task: ${planner.findings.join("; ")}`);
    }
    /*
     * ANALYST
     *
     * The existing workflow does not have a separate
     * ANALYST status, so analysis is performed while the
     * task is in its analysis/council phase.
     */
    const analyst = await runAgent({
        role: "ANALYST",
        input: buildAgentInput(currentTask, [
            "Analyze the repository and the task.",
            "Identify dependencies, relevant files, risks and existing behavior.",
        ].join("\n")),
        timeoutMs: options.timeoutMs,
    });
    if (analyst.status === "BLOCKED" ||
        analyst.status === "FAILED") {
        throw new Error(`Analyst blocked the task: ${analyst.findings.join("; ")}`);
    }
    /*
     * COUNCIL
     */
    if (currentTask.status === "PROPOSED") {
        currentTask =
            workflow.getTask(currentTask.id);
        store.transition(currentTask.id, "COUNCIL", "Task entered Council orchestration.");
    }
    const architect = await runAgent({
        role: "ARCHITECT",
        input: buildAgentInput(currentTask, [
            "Assess architectural impact.",
            "Identify affected components, compatibility concerns and risks.",
        ].join("\n")),
        timeoutMs: options.timeoutMs,
    });
    if (architect.status === "BLOCKED" ||
        architect.status === "FAILED") {
        throw new Error(`Architect blocked the task: ${architect.findings.join("; ")}`);
    }
    /*
     * CONTRACT
     */
    const contract = createContractFromAnalysis(currentTask, planner, analyst);
    workflow.attachContract(contract);
    currentTask =
        store.transition(currentTask.id, "CONTRACT_READY", "Task Contract approved by orchestration.");
    /*
     * IMPACT
     */
    const impactMap = createImpactMap(currentTask, analyst, architect);
    const taskWithImpact = {
        ...currentTask,
        impactMap,
    };
    store.update(taskWithImpact);
    currentTask =
        store.transition(currentTask.id, "IMPACT_APPROVED", "Impact Map validated and approved.");
    /*
     * GIT
     */
    const git = await runAgent({
        role: "GIT",
        input: buildAgentInput(currentTask, [
            "Verify repository readiness for implementation.",
            "Check that the intended changes remain inside the approved scope.",
        ].join("\n")),
        timeoutMs: options.timeoutMs,
    });
    if (git.status === "BLOCKED" ||
        git.status === "FAILED") {
        throw new Error(`Git agent blocked the task: ${git.findings.join("; ")}`);
    }
    currentTask =
        store.transition(currentTask.id, "GIT_READY", "Git readiness verified.");
    /*
     * CODER
     *
     * Important: the Coder uses runAgentLoop,
     * not runAgent, because implementation requires
     * repository tools.
     */
    const coder = await runAgentLoop(options.repositoryRoot, [
        {
            role: "system",
            content: "You are the Coder for LifeOS. Implement the task using repository tools. Respect the Task Contract and Impact Map. Actually modify the repository.",
        },
        {
            role: "user",
            content: buildCoderInput(currentTask, contract, impactMap),
        },
    ], {
        chatModel: "qwen3-coder:30b",
        maxSteps: options.maxCodingSteps ?? 12,
    });
    currentTask =
        store.transition(currentTask.id, "CODING", "Coder started implementation.");
    currentTask =
        store.transition(currentTask.id, "IMPLEMENTED", "Coder completed implementation.");
    currentTask =
        store.transition(currentTask.id, "TESTING", "Implementation submitted for testing.");
    /*
     * TESTER
     */
    const testerOutput = await runAgent({
        role: "TESTER",
        input: buildTesterInput(currentTask, contract, impactMap),
        timeoutMs: options.timeoutMs,
    });
    if (testerOutput.status === "BLOCKED" ||
        testerOutput.status === "FAILED") {
        throw new Error(`Tester failed to produce a valid testing decision: ${testerOutput.findings.join("; ")}`);
    }
    const tester = parseJson(testerOutput.findings[0] ?? "", "Tester");
    const workflowTesting = workflow.handleTestResult(currentTask.id, tester);
    return {
        task: workflowTesting.task,
        contract,
        impactMap,
        planner,
        analyst,
        architect,
        git,
        coderAnswer: coder.answer,
        tester,
    };
}

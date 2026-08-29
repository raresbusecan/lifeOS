import {
    runAgent,
    type RunAgentOptions,
  } from "../agentRunner/agentRunner.js";
  
  import {
    runAgentLoop,
    type AgentLoopResult,
  } from "../agent/loop.js";
  
  import type {
    AgentRole,
  } from "../agentRunner/agentRole.js";
  
  import type {
    AgentOutput,
  } from "../agentRunner/agentOutput.js";
  
  import {
    createTaskContract,
    type TaskContract,
  } from "./taskContract.js";
  
  import type {
    ImpactMap,
  } from "./impactMap.js";
  
  import type {
    Task,
  } from "./task.js";
  
  import {
    WorkflowCoordinator,
  } from "./workflowCoordinator.js";
  
  import {
    TaskStore,
  } from "./taskStore.js";
  
  export interface DepartmentRunOptions {
    repositoryRoot: string;
    agentTimeoutMs?: number;
    chatModel?: string;
    maxAgentSteps?: number;
  }
  
  export interface DepartmentAgentResult {
    role: AgentRole;
    output: AgentOutput;
  }
  
  export interface DepartmentOrchestrationResult {
    task: Task;
    contract: TaskContract;
    impactMap: ImpactMap;
    agents: DepartmentAgentResult[];
    coder: AgentLoopResult;
  }
  
  function requireReady(
    role: AgentRole,
    output: AgentOutput,
  ): void {
    if (output.status !== "READY") {
      throw new Error(
        `${role} agent did not return READY. Status: ${output.status}.`,
      );
    }
  }
  
  function unique(
    values: string[],
  ): string[] {
    return [...new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    )];
  }
  
  function buildContract(
    task: Task,
    planner: AgentOutput,
    analyst: AgentOutput,
    architect: AgentOutput,
  ): TaskContract {
    return createTaskContract({
      taskId: task.id,
      objective: task.description,
      acceptanceCriteria: unique([
        ...planner.recommendations,
        ...analyst.recommendations,
      ]),
      scope: {
        files: unique([
          ...task.scope.files,
          ...planner.files,
          ...analyst.files,
          ...architect.files,
        ]),
        components: unique([
          ...task.scope.components,
        ]),
        behavior: unique([
          ...task.scope.behavior,
          task.description,
        ]),
        exclusions: unique([
          ...task.scope.exclusions,
        ]),
      },
      constraints: unique([
        "Do not modify files outside the approved scope.",
        ...analyst.risks,
      ]),
      requiredTests: unique([
        "Verify the requested behavior.",
        ...planner.recommendations.filter(
          (item) =>
            item.toLowerCase().includes("test"),
        ),
      ]),
      dependencies: unique([
        ...analyst.findings,
      ]),
    });
  }
  
  function buildImpactMap(
    task: Task,
    analyst: AgentOutput,
    architect: AgentOutput,
  ): ImpactMap {
    const filesToModify = unique([
      ...task.scope.files,
      ...analyst.files,
      ...architect.files,
    ]);
  
    return {
      filesToModify,
      filesToCreate: [],
      testsToModify: [],
      testsToCreate: [],
      componentsAffected: unique([
        ...task.scope.components,
      ]),
      componentsProtected: unique([
        ...task.scope.exclusions,
      ]),
      architectureRisks: unique([
        ...analyst.risks,
        ...architect.risks,
      ]),
      confidence: Math.min(
        analyst.confidence,
        architect.confidence,
      ),
    };
  }
  
  async function runDepartmentAgent(
    role: AgentRole,
    task: Task,
    context: string,
    options: DepartmentRunOptions,
  ): Promise<DepartmentAgentResult> {
    const input = [
      `Task ID: ${task.id}`,
      `Title: ${task.title}`,
      `Description: ${task.description}`,
      "",
      `Task status: ${task.status}`,
      `Task department: ${task.department}`,
      "",
      "Task scope:",
      JSON.stringify(task.scope, null, 2),
      "",
      context,
    ].join("\n");
  
    const runOptions: RunAgentOptions = {
      role,
      input,
      ...(options.agentTimeoutMs !== undefined
        ? { timeoutMs: options.agentTimeoutMs }
        : {}),
    };
  
    const output = await runAgent(runOptions);
  
    requireReady(role, output);
  
    return {
      role,
      output,
    };
  }
  
  export async function runDepartmentOrchestration(
    taskId: string,
    store: TaskStore,
    options: DepartmentRunOptions,
  ): Promise<DepartmentOrchestrationResult> {
    const workflow = new WorkflowCoordinator(store);
  
    let task = workflow.getTask(taskId);
  
    if (
      task.status !== "PROPOSED" &&
      task.status !== "COUNCIL"
    ) {
      throw new Error(
        `Department orchestration requires PROPOSED or COUNCIL status. Current status: ${task.status}.`,
      );
    }
  
    if (task.status === "PROPOSED") {
      task = store.transition(
        task.id,
        "COUNCIL",
        "Department orchestration started.",
      );
    }
  
    const planner = await runDepartmentAgent(
      "PLANNER",
      task,
      [
        "Define the objective and acceptance criteria.",
        "Do not modify the repository.",
      ].join("\n"),
      options,
    );
  
    const analyst = await runDepartmentAgent(
      "ANALYST",
      task,
      [
        "Analyze the repository implications of the task.",
        "Identify dependencies, risks and relevant files.",
        "",
        "Planner findings:",
        ...planner.output.findings,
        "",
        "Planner recommendations:",
        ...planner.output.recommendations,
      ].join("\n"),
      options,
    );
  
    const architect = await runDepartmentAgent(
      "ARCHITECT",
      task,
      [
        "Determine the architectural impact.",
        "Identify affected files/components and architectural risks.",
        "",
        "Planner findings:",
        ...planner.output.findings,
        "",
        "Analyst findings:",
        ...analyst.output.findings,
      ].join("\n"),
      options,
    );
  
    const contract = buildContract(
      task,
      planner.output,
      analyst.output,
      architect.output,
    );
  
    workflow.attachContract(contract);
  
    task = workflow.getTask(task.id);
  
    if (task.status === "COUNCIL") {
      task = store.transition(
        task.id,
        "CONTRACT_READY",
        "Planner, Analyst and Architect completed the council phase.",
      );
    }
  
    const impactMap = buildImpactMap(
      task,
      analyst.output,
      architect.output,
    );
  
    task = {
      ...task,
      impactMap,
    };
  
    store.update(task);
  
    task = store.transition(
      task.id,
      "IMPACT_APPROVED",
      "Impact Map validated by department orchestration.",
    );
  
    const git = await runDepartmentAgent(
      "GIT",
      task,
      [
        "Verify repository readiness for implementation.",
        "Do not modify implementation files.",
        "",
        `Approved files: ${impactMap.filesToModify.join(", ") || "none specified"}`,
      ].join("\n"),
      options,
    );
  
    if (git.output.status !== "READY") {
      throw new Error(
        "GIT agent did not approve repository readiness.",
      );
    }
  
    task = store.transition(
      task.id,
      "GIT_READY",
      "GIT agent approved implementation readiness.",
    );
  
    task = store.transition(
      task.id,
      "CODING",
      "CODER agent starting implementation.",
    );
  
    const coder = await runAgentLoop(
      options.repositoryRoot,
      [
        {
          role: "system",
          content: [
            "You are the LifeOS CODER department.",
            "Implement the task using repository tools.",
            "You must obey the Task Contract and Impact Map.",
            "Only modify approved files.",
            "Use write_file when implementation changes are required.",
            "",
            "Task Contract:",
            JSON.stringify(contract, null, 2),
            "",
            "Impact Map:",
            JSON.stringify(impactMap, null, 2),
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `Implement task ${task.id}.`,
            task.title,
            task.description,
            "",
            "Complete the implementation and verify the resulting repository state.",
          ].join("\n"),
        },
      ],
      {
        chatModel: options.chatModel,
        maxSteps: options.maxAgentSteps ?? 8,
      },
    );
  
    task = store.transition(
      task.id,
      "IMPLEMENTED",
      "CODER agent completed implementation.",
    );
  
    task = store.transition(
      task.id,
      "TESTING",
      "Implementation handed to TESTER.",
    );
  
    return {
      task,
      contract,
      impactMap,
      agents: [
        planner,
        analyst,
        architect,
        git,
      ],
      coder,
    };
  }
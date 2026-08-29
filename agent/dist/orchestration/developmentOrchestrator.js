import { WorkflowCoordinator } from "../workflow/workflowCoordinator.js";
import { AgentOrchestrator } from "../agentRunner/agentOrchestrator.js";
import { OrganizationState, } from "../organization/organizationState.js";
import { DepartmentContextBuilder, } from "../organization/departmentContext.js";
const DEVELOPMENT_FLOW = [
    {
        department: "PLANNING",
        role: "PLANNER",
    },
    {
        department: "ANALYSIS",
        role: "ANALYST",
    },
    {
        department: "ARCHITECTURE",
        role: "ARCHITECT",
    },
    {
        department: "DEVELOPMENT",
        role: "CODER",
    },
    {
        department: "TESTING",
        role: "TESTER",
    },
];
export class DevelopmentOrchestrator {
    store;
    agents;
    workflow;
    organization;
    contextBuilder;
    constructor(store, options = {}) {
        this.store = store;
        this.agents = new AgentOrchestrator({
            timeoutMs: options.timeoutMs,
        });
        this.workflow = new WorkflowCoordinator(this.store);
        this.organization = new OrganizationState();
        this.contextBuilder = new DepartmentContextBuilder(this.organization);
    }
    async run(taskId) {
        const task = this.workflow.getTask(taskId);
        this.organization.initializeTask(taskId);
        const agents = [];
        for (const stage of DEVELOPMENT_FLOW) {
            const result = await this.runDepartment(task, stage.department, stage.role);
            agents.push(result);
        }
        return {
            task: this.workflow.getTask(taskId),
            agents,
        };
    }
    async runDepartment(task, department, role) {
        const context = this.contextBuilder.build(task.id, department, role);
        const input = [
            context.instructions,
            "",
            "TASK:",
            `ID: ${task.id}`,
            `TITLE: ${task.title}`,
            `DESCRIPTION: ${task.description}`,
            "",
            "TASK SCOPE:",
            JSON.stringify(task.scope, null, 2),
            "",
            "ORGANIZATIONAL CONTEXT:",
            JSON.stringify({
                previousExecutions: context.previousExecutions,
                previousDecisions: context.previousDecisions,
                previousReports: context.previousReports,
                existingArtifacts: context.existingArtifacts,
            }, null, 2),
        ].join("\n");
        const startedAt = new Date().toISOString();
        const agentResult = await this.agents.run(role, input);
        const completedAt = new Date().toISOString();
        const answer = agentResult.output
            ? JSON.stringify(agentResult.output, null, 2)
            : "";
        this.organization.recordExecution({
            taskId: task.id,
            department,
            role,
            startedAt,
            completedAt,
            status: "COMPLETED",
            inputSummary: input,
            outputSummary: answer,
            decisions: [],
            findings: agentResult.output?.findings ?? [],
            risks: agentResult.output?.risks ?? [],
            artifacts: agentResult.output?.files ?? [],
        });
        this.organization.recordReport(task.id, {
            department,
            role,
            summary: answer,
            findings: agentResult.output?.findings ?? [],
            recommendations: agentResult.output?.recommendations ?? [],
            risks: agentResult.output?.risks ?? [],
            files: agentResult.output?.files ?? [],
            confidence: agentResult.output?.confidence ?? 0,
            createdAt: completedAt,
        });
        return {
            taskId: task.id,
            department,
            role,
            answer,
        };
    }
    getOrganizationState(taskId) {
        return this.organization.getSnapshot(taskId);
    }
    getDepartmentContext(taskId, role) {
        return this.contextBuilder.buildForRole(taskId, role);
    }
}

import type { Task } from "../workflow/task.js";
import {
  TaskStore,
} from "../workflow/taskStore.js";
import {
  WorkflowCoordinator,
} from "../workflow/workflowCoordinator.js";
import {
  createTaskContract,
} from "../workflow/taskContract.js";
import type {
  ImpactMap,
} from "../workflow/impactMap.js";
import {
  runAgentLoop,
} from "../agent/loop.js";

export type DevelopmentAgentRole =
  | "PLANNER"
  | "ANALYST"
  | "ARCHITECT"
  | "CODER"
  | "TESTER";

export interface DevelopmentAgentResult {
  role: DevelopmentAgentRole;
  answer: string;
}

export interface DevelopmentOrchestrationResult {
  task: Task;
  agents: DevelopmentAgentResult[];
}

export interface DevelopmentOrchestratorOptions {
  chatModel?: string;
  maxAgentSteps?: number;
}

export class DevelopmentOrchestrator {
  private readonly workflow: WorkflowCoordinator;

  constructor(
    private readonly store: TaskStore,
    private readonly options: DevelopmentOrchestratorOptions = {},
  ) {
    this.workflow = new WorkflowCoordinator(
      this.store,
    );
  }

  async run(
    taskId: string,
  ): Promise<DevelopmentOrchestrationResult> {
    let task = this.workflow.getTask(taskId);

    const agents: DevelopmentAgentResult[] = [];

    const planner = await this.runAgent(
      "PLANNER",
      this.buildPlannerPrompt(task),
    );
    agents.push(planner);

    const analyst = await this.runAgent(
      "ANALYST",
      this.buildAnalystPrompt(
        task,
        planner.answer,
      ),
    );
    agents.push(analyst);

    const architect = await this.runAgent(
      "ARCHITECT",
      this.buildArchitectPrompt(
        task,
        planner.answer,
        analyst.answer,
      ),
    );
    agents.push(architect);

    /*
     * The first orchestration milestone is:
     *
     * PLANNER -> ANALYST -> ARCHITECT
     *
     * We deliberately do not start CODER yet.
     *
     * The next step is to turn the architect output into:
     *   1. TaskContract
     *   2. ImpactMap
     *   3. CONTRACT_READY
     *   4. IMPACT_APPROVED
     *   5. GIT_READY
     *
     * That gives us a deterministic boundary before allowing
     * the coding agent to modify the repository.
     */

    task = this.workflow.getTask(taskId);

    return {
      task,
      agents,
    };
  }

  private async runAgent(
    role: DevelopmentAgentRole,
    prompt: string,
  ): Promise<DevelopmentAgentResult> {
    const result = await runAgentLoop(
      process.cwd(),
      [
        {
          role: "system",
          content: [
            "You are a development department agent.",
            `Your department role is ${role}.`,
            "Analyze the task and return a concise professional result.",
            "Do not claim that files were modified unless you actually used a tool.",
          ].join(" "),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      {
        chatModel: this.options.chatModel,
        maxSteps: this.options.maxAgentSteps,
      },
    );

    return {
      role,
      answer: result.answer,
    };
  }

  private buildPlannerPrompt(
    task: Task,
  ): string {
    return [
      "PLAN THIS DEVELOPMENT TASK.",
      "",
      `Task ID: ${task.id}`,
      `Title: ${task.title}`,
      `Description: ${task.description}`,
      "",
      "Scope:",
      JSON.stringify(task.scope, null, 2),
      "",
      "Produce:",
      "- objective",
      "- expected outcome",
      "- acceptance criteria",
      "- implementation direction",
      "- important risks",
    ].join("\n");
  }

  private buildAnalystPrompt(
    task: Task,
    plannerAnswer: string,
  ): string {
    return [
      "ANALYZE THIS DEVELOPMENT TASK.",
      "",
      `Task ID: ${task.id}`,
      `Title: ${task.title}`,
      `Description: ${task.description}`,
      "",
      "Planner result:",
      plannerAnswer,
      "",
      "Analyze:",
      "- repository behavior",
      "- dependencies",
      "- affected files",
      "- affected components",
      "- risks",
      "- constraints",
      "",
      "Do not modify files.",
    ].join("\n");
  }

  private buildArchitectPrompt(
    task: Task,
    plannerAnswer: string,
    analystAnswer: string,
  ): string {
    return [
      "ASSESS THE ARCHITECTURAL IMPACT OF THIS DEVELOPMENT TASK.",
      "",
      `Task ID: ${task.id}`,
      `Title: ${task.title}`,
      `Description: ${task.description}`,
      "",
      "Planner result:",
      plannerAnswer,
      "",
      "Analyst result:",
      analystAnswer,
      "",
      "Define:",
      "- implementation boundary",
      "- files to modify",
      "- files to create",
      "- components affected",
      "- components protected",
      "- architectural risks",
      "- tests required",
      "- confidence",
      "",
      "Do not modify files.",
    ].join("\n");
  }
}


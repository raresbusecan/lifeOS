import type { AgentOutput } from "../agentRunner/agentOutput.js";
import type { AgentRole } from "../agentRunner/agentRole.js";
import {
  AgentOrchestrator,
} from "../agentRunner/agentOrchestrator.js";

import type { Task } from "./task.js";
import type { TaskContract } from "./taskContract.js";
import type { WorkflowCoordinator } from "./workflowCoordinator.js";

export interface AgentWorkflowResult {
  task: Task;
  executions: AgentExecutionResult[];
}

export interface AgentExecutionResult {
  role: AgentRole;
  output: AgentOutput;
}

export interface AgentWorkflowOptions {
  timeoutMs?: number;
}

function buildTaskContext(
  task: Task,
  contract?: TaskContract,
): string {
  return [
    `Task ID: ${task.id}`,
    `Title: ${task.title}`,
    `Description: ${task.description}`,
    `Current status: ${task.status}`,
    `Department: ${task.department}`,
    "",
    "Task scope:",
    JSON.stringify(task.scope, null, 2),
    "",
    "Task contract:",
    contract
      ? JSON.stringify(contract, null, 2)
      : "No TaskContract attached.",
    "",
    "Impact Map:",
    task.impactMap
      ? JSON.stringify(task.impactMap, null, 2)
      : "No Impact Map attached.",
  ].join("\n");
}

function assertReady(
  task: Task,
  allowed: Task["status"][],
): void {
  if (!allowed.includes(task.status)) {
    throw new Error(
      `Agent workflow cannot start for task ${task.id} in status ${task.status}. Expected one of: ${allowed.join(", ")}.`,
    );
  }
}

export class AgentWorkflow {
  private readonly agents: AgentOrchestrator;

  constructor(
    private readonly coordinator: WorkflowCoordinator,
    options: AgentWorkflowOptions = {},
  ) {
    this.agents =
      new AgentOrchestrator({
        timeoutMs: options.timeoutMs,
      });
  }

  async runAnalysis(
    taskId: string,
  ): Promise<AgentWorkflowResult> {
    const task =
      this.coordinator.getTask(taskId);

    assertReady(task, [
      "ANALYSIS",
    ]);

    const contract =
      this.coordinator.getContract(taskId);

    const executions: AgentExecutionResult[] = [];

    const planner =
      await this.agents.run(
        "PLANNER",
        [
          "Analyze this LifeOS task and determine the intended outcome.",
          "",
          buildTaskContext(task, contract),
        ].join("\n"),
      );

    executions.push(planner);

    const analyst =
      await this.agents.run(
        "ANALYST",
        [
          "Analyze this LifeOS task and the repository.",
          "Identify dependencies, risks, relevant existing behavior, and affected files.",
          "",
          buildTaskContext(task, contract),
          "",
          "Planner result:",
          JSON.stringify(
            planner.output,
            null,
            2,
          ),
        ].join("\n"),
      );

    executions.push(analyst);

    const architect =
      await this.agents.run(
        "ARCHITECT",
        [
          "Assess the architectural impact of this LifeOS task.",
          "",
          buildTaskContext(task, contract),
          "",
          "Planner result:",
          JSON.stringify(
            planner.output,
            null,
            2,
          ),
          "",
          "Analyst result:",
          JSON.stringify(
            analyst.output,
            null,
            2,
          ),
        ].join("\n"),
      );

    executions.push(architect);

    return {
      task:
        this.coordinator.getTask(taskId),
      executions,
    };
  }

  async runCoding(
    taskId: string,
  ): Promise<AgentWorkflowResult> {
    const task =
      this.coordinator.getTask(taskId);

    assertReady(task, [
      "GIT_READY",
      "FIX_REQUIRED",
      "REWORK",
    ]);

    const contract =
      this.coordinator.getContract(taskId);

    const executions: AgentExecutionResult[] = [];

    const git =
      await this.agents.run(
        "GIT",
        [
          "Verify repository status and scope compliance before coding.",
          "",
          buildTaskContext(task, contract),
        ].join("\n"),
      );

    executions.push(git);

    if (
      git.output.status === "BLOCKED" ||
      git.output.status === "FAILED"
    ) {
      return {
        task:
          this.coordinator.getTask(taskId),
        executions,
      };
    }

    const coder =
      await this.agents.run(
        "CODER",
        [
          "Implement this task.",
          "Use the repository tools when necessary.",
          "Respect the Task Contract and Impact Map strictly.",
          "Do not modify files outside the approved scope.",
          "",
          buildTaskContext(task, contract),
          "",
          "Git verification:",
          JSON.stringify(
            git.output,
            null,
            2,
          ),
        ].join("\n"),
      );

    executions.push(coder);

    return {
      task:
        this.coordinator.getTask(taskId),
      executions,
    };
  }

  async runTesting(
    taskId: string,
  ): Promise<AgentWorkflowResult> {
    const task =
      this.coordinator.getTask(taskId);

    assertReady(task, [
      "TESTING",
    ]);

    const contract =
      this.coordinator.getContract(taskId);

    const tester =
      await this.agents.run(
        "TESTER",
        [
          "Verify the implementation.",
          "Run the required tests and check the acceptance criteria.",
          "Do not modify implementation files.",
          "",
          buildTaskContext(task, contract),
        ].join("\n"),
      );

    return {
      task:
        this.coordinator.getTask(taskId),
      executions: [
        tester,
      ],
    };
  }
}
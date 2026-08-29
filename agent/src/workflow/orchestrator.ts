import type { TestResult } from "./testing.js";
import type { TaskContract } from "./taskContract.js";
import type { Task } from "./task.js";

import { TaskStore } from "./taskStore.js";
import { WorkflowGuard } from "./workflowGuard.js";
import { runCodingPhase } from "./workflowRunner.js";
import { handleWorkflowTestResult } from "./workflowRunner.js";

export interface OrchestratorResult {
  task: Task;
  phase: string;
}

export class WorkflowOrchestrator {
  private readonly guard: WorkflowGuard;

  constructor(
    private readonly store: TaskStore,
  ) {
    this.guard = new WorkflowGuard(store);
  }

  getTask(taskId: string): Task {
    const task = this.store.get(taskId);

    if (!task) {
      throw new Error(
        `Task ${taskId} does not exist.`,
      );
    }

    return task;
  }

  getContract(
    taskId: string,
  ): TaskContract | undefined {
    return this.store.getContract(taskId);
  }

  attachContract(
    contract: TaskContract,
  ): void {
    this.store.attachContract(contract);
  }

  startCoding(
    taskId: string,
  ): OrchestratorResult {
    const task = this.getTask(taskId);

    const result = runCodingPhase(
      task,
      this.guard,
    );

    return {
      task: result.task,
      phase: "CODING",
    };
  }

  handleTestResult(
    taskId: string,
    result: TestResult,
  ): OrchestratorResult {
    const task = this.getTask(taskId);

    const outcome = handleWorkflowTestResult(
      task,
      result,
      this.guard,
      this.store,
    );

    return {
      task: outcome.task,
      phase: outcome.task.status,
    };
  }
}
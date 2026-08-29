import type {
  Task,
  TaskStatus,
} from "./task.js";

import {
  TaskStore,
} from "./taskStore.js";

import {
  assertValidImpactMap,
} from "./impactMap.js";

const OFFICIAL_WORKFLOW_STATUSES = new Set<TaskStatus>([
  "CREATED",
  "ANALYSIS",
  "COUNCIL",
  "CONTRACT_READY",
  "IMPACT_APPROVED",
  "GIT_READY",
  "CODING",
  "IMPLEMENTED",
  "TESTING",
  "TRIAGE",
  "FIX_REQUIRED",
  "REVIEW",
  "DONE",
  "BLOCKED",
  "CANCELLED",
]);

export class WorkflowGuard {
  constructor(
    private readonly store: TaskStore,
  ) {}

  getTask(
    taskId: string,
  ): Task {
    const task = this.store.get(taskId);

    if (!task) {
      throw new Error(
        `Task ${taskId} does not exist.`,
      );
    }

    return task;
  }

  transition(
    taskId: string,
    nextStatus: TaskStatus,
    reason: string,
  ): Task {
    const task = this.getTask(taskId);

    if (
      !OFFICIAL_WORKFLOW_STATUSES.has(
        task.status,
      )
    ) {
      throw new Error(
        `Task ${task.id} uses legacy status ${task.status} and cannot be advanced by Workflow Guard.`,
      );
    }

    if (
      !OFFICIAL_WORKFLOW_STATUSES.has(
        nextStatus,
      )
    ) {
      throw new Error(
        `Workflow Guard does not allow legacy status ${nextStatus}.`,
      );
    }

    if (
      nextStatus === "DONE" &&
      task.status !== "REVIEW"
    ) {
      throw new Error(
        "A task can only become DONE after REVIEW.",
      );
    }

    const CONTRACT_REQUIRED_STATUSES: Set<TaskStatus> = new Set([
      "CONTRACT_READY",
      "IMPACT_APPROVED",
      "GIT_READY",
      "CODING",
    ]);

    if (
      CONTRACT_REQUIRED_STATUSES.has(nextStatus) &&
      !this.store.hasContract(task.id)
    ) {
      throw new Error(
        `Task ${task.id} must have an attached TaskContract before moving to ${nextStatus}.`,
      );
    }

    if (
      task.status === "CONTRACT_READY" &&
      nextStatus === "IMPACT_APPROVED"
    ) {
      if (!task.impactMap) {
        throw new Error(
          `Task ${task.id} must have an Impact Map before moving to IMPACT_APPROVED.`,
        );
      }

      try {
        assertValidImpactMap(task.impactMap);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impact Map is invalid.";

        throw new Error(
          `Task ${task.id} has an invalid Impact Map: ${message}`,
        );
      }
    }

    return this.store.transition(
      task.id,
      nextStatus,
      reason,
    );
  }
}

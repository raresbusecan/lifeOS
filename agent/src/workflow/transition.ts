import type {
  Task,
  TaskStatus,
} from "./task.js";

import {
  canTransition,
} from "./transitions.js";

export function transitionTask(
  task: Task,
  nextStatus: TaskStatus,
): Task {
  if (
    task.status === nextStatus
  ) {
    throw new Error(
      `Task ${task.id} is already in status ${nextStatus}.`,
    );
  }

  if (
    !canTransition(
      task.status,
      nextStatus,
    )
  ) {
    throw new Error(
      `Invalid task transition: ${task.status} -> ${nextStatus}.`,
    );
  }

  return {
    ...task,
    status: nextStatus,
  };
}
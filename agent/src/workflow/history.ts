import type {
  TaskStatus,
} from "./task.js";

export interface TaskTransition {
  from: TaskStatus;
  to: TaskStatus;
  reason: string;
  timestamp: string;
}

export function appendTransition(
  history: readonly TaskTransition[],
  transition: TaskTransition,
): TaskTransition[] {
  return [
    ...history,
    transition,
  ];
}

export function createTransition(
  from: TaskStatus,
  to: TaskStatus,
  reason: string,
  timestamp = new Date().toISOString(),
): TaskTransition {
  const normalizedReason =
    reason.trim();

  if (!normalizedReason) {
    throw new Error(
      "Transition reason cannot be empty.",
    );
  }

  return {
    from,
    to,
    reason: normalizedReason,
    timestamp,
  };
}
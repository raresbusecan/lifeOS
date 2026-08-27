import type {
  TaskStatus,
} from "./task.js";

const transitions: Record<
  TaskStatus,
  readonly TaskStatus[]
> = {
  PROPOSED: [
    "COUNCIL",
    "CANCELLED",
  ],

  COUNCIL: [
    "READY",
    "BLOCKED",
    "CANCELLED",
  ],

  READY: [
    "CODING",
    "CANCELLED",
  ],

  CODING: [
    "TESTING",
    "BLOCKED",
  ],

  TESTING: [
    "DONE",
    "REWORK",
    "BLOCKED",
  ],

  REWORK: [
    "CODING",
    "COUNCIL",
    "BLOCKED",
  ],

  DONE: [],

  BLOCKED: [
    "COUNCIL",
    "CANCELLED",
  ],

  CANCELLED: [],
};

export function getAllowedTransitions(
  status: TaskStatus,
): readonly TaskStatus[] {
  return transitions[status];
}

export function canTransition(
  from: TaskStatus,
  to: TaskStatus,
): boolean {
  return transitions[from].includes(to);
}
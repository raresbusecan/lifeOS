import type {
  Task,
} from "./task.js";

import type {
  TestResult,
} from "./testing.js";

import {
  handleTestResult,
  type TestingOutcome,
} from "./testingHandler.js";

import {
  WorkflowGuard,
} from "./workflowGuard.js";

import {
  TaskStore,
} from "./taskStore.js";

export interface WorkflowRunResult {
  task: Task;
}

export interface WorkflowTestingResult {
  task: Task;
  result: TestingOutcome;
}

export function runCodingPhase(
  task: Task,
  guard: WorkflowGuard,
): WorkflowRunResult {
  if (task.status !== "GIT_READY") {
    throw new Error(
      `Coding phase can only start for a task in GIT_READY status. Current status: ${task.status}.`,
    );
  }

  const codingTask =
    guard.transition(
      task.id,
      "CODING",
      "Task moved to CODING.",
    );

  const implementedTask =
    guard.transition(
      codingTask.id,
      "IMPLEMENTED",
      "Coding phase completed.",
    );

  const testingTask =
    guard.transition(
      implementedTask.id,
      "TESTING",
      "Task moved to TESTING.",
    );

  return {
    task: testingTask,
  };
}


export function handleWorkflowTestResult(
  task: Task,
  result: TestResult,
  guard: WorkflowGuard,
  store: TaskStore,
): WorkflowTestingResult {
  if (task.status !== "TESTING") {
    throw new Error(
      `Testing phase can only handle a task in TESTING status. Current status: ${task.status}.`,
    );
  }

  const outcome =
    handleTestResult(
      task,
      result,
      guard,
      store,
    );

  return {
    task: outcome.task,
    result: outcome,
  };
}
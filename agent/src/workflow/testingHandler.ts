import type {
  Task,
} from "./task.js";

import type {
  TestResult,
} from "./testing.js";

import {
  validateTestResult,
} from "./testing.js";

import {
  classifyTestResultScope,
  type ScopeClassificationResult,
} from "./scopeClassifier.js";

import {
  createChildTask,
} from "./taskFactory.js";

import {
  TaskStore,
} from "./taskStore.js";

export interface TestingOutcome {
  task: Task;

  resultType:
    | "PASS"
    | "REWORK"
    | "NEW_TASK";

  scope:
    | ScopeClassificationResult
    | null;

  newTask: Task | null;
}

export function handleTestResult(
  task: Task,
  result: TestResult,
  store: TaskStore,
): TestingOutcome {
  validateTestResult(
    task,
    result,
  );

  if (
    task.status !== "TESTING"
  ) {
    throw new Error(
      `Testing result can only be handled for a task in TESTING status. Current status: ${task.status}.`,
    );
  }

  if (
    result.type === "PASS"
  ) {
    const completedTask =
      store.transition(
        task.id,
        "DONE",
        "Testing passed.",
      );

    return {
      task: completedTask,
      resultType: "PASS",
      scope: null,
      newTask: null,
    };
  }

  const scope =
    classifyTestResultScope(
      task,
      result,
    );

  if (
    scope.classification ===
    "IN_SCOPE"
  ) {
    const reworkTask =
      store.transition(
        task.id,
        "REWORK",
        "Testing failed due to an in-scope issue.",
      );

    return {
      task: reworkTask,
      resultType: "REWORK",
      scope,
      newTask: null,
    };
  }

  const completedTask =
    store.transition(
      task.id,
      "DONE",
      "Testing failed due to an out-of-scope issue; original task completed.",
    );

  const sequence =
    store.getNextChildSequence(
      task.id,
    );

  const newTask =
    createChildTask(
      completedTask,
      {
        title: result.summary,
        description: result.details,
        scope: {
          files: result.files ?? [],
          components:
            result.components ?? [],
          behavior:
            result.expectedBehavior
              ? [
                  result.expectedBehavior,
                ]
              : [],
          exclusions: [],
        },
      },
      sequence,
    );

  store.add(
    newTask,
  );

  return {
    task: completedTask,
    resultType: "NEW_TASK",
    scope,
    newTask,
  };
}
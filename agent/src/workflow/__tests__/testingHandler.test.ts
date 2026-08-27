import assert from "node:assert/strict";

import {
  createTask,
} from "../taskFactory.js";

import {
  TaskStore,
} from "../taskStore.js";

import {
  handleTestResult,
} from "../testingHandler.js";

const store =
  new TaskStore();

const task =
  createTask({
    id: "TASK-TESTING-HISTORY",
    title: "Testing history",
    description:
      "Verify testing handler records workflow history.",
    status: "TESTING",
    scope: {
      files: [
        "src/example.ts",
      ],
      components: [
        "ExampleComponent",
      ],
      behavior: [
        "Example behavior",
      ],
      exclusions: [],
    },
  });

store.add(task);

const passResult = {
  type: "PASS" as const,
  summary: "Tests passed.",
  details:
    "All required tests passed successfully.",
  relatedTaskId:
    task.id,
};

const outcome =
  handleTestResult(
    task,
    passResult,
    store,
  );

assert.equal(
  outcome.resultType,
  "PASS",
);

assert.equal(
  outcome.task.status,
  "DONE",
);

assert.equal(
  store.get(
    task.id,
  )?.status,
  "DONE",
);

const history =
  store.getHistory(
    task.id,
  );

assert.equal(
  history.length,
  1,
);

assert.equal(
  history[0]?.from,
  "TESTING",
);

assert.equal(
  history[0]?.to,
  "DONE",
);

assert.equal(
  history[0]?.reason,
  "Testing passed.",
);

assert.ok(
  history[0]?.timestamp,
);

console.log(
  "Testing handler history integration test passed",
);

const reworkStore =
  new TaskStore();

const reworkTask =
  createTask({
    id: "TASK-REWORK-HISTORY",
    title: "Testing rework history",
    description:
      "Verify testing handler records rework history.",
    status: "TESTING",
    scope: {
      files: [
        "src/example.ts",
      ],
      components: [
        "ExampleComponent",
      ],
      behavior: [
        "Example behavior",
      ],
      exclusions: [],
    },
  });

reworkStore.add(
  reworkTask,
);

const failedResult = {
  type: "REWORK" as const,
  summary: "Test failed.",
  details:
    "ExampleComponent does not satisfy the expected behavior.",
  relatedTaskId:
    reworkTask.id,
  expectedBehavior:
    "ExampleComponent should satisfy the expected behavior.",
  actualBehavior:
    "ExampleComponent does not satisfy the expected behavior.",
  files: [
    "src/example.ts",
  ],
  components: [
    "ExampleComponent",
  ],
};

const reworkOutcome =
  handleTestResult(
    reworkTask,
    failedResult,
    reworkStore,
  );

assert.equal(
  reworkOutcome.resultType,
  "REWORK",
);

assert.equal(
  reworkOutcome.task.status,
  "REWORK",
);

assert.equal(
  reworkOutcome.task.attempts,
  1,
);

const reworkHistory =
  reworkStore.getHistory(
    reworkTask.id,
  );

assert.equal(
  reworkHistory.length,
  1,
);

assert.equal(
  reworkHistory[0]?.from,
  "TESTING",
);

assert.equal(
  reworkHistory[0]?.to,
  "REWORK",
);

assert.equal(
  reworkHistory[0]?.reason,
  "Testing failed due to an in-scope issue.",
);

assert.ok(
  reworkHistory[0]?.timestamp,
);

console.log(
  "Testing handler rework history integration test passed",
);

const childStore =
  new TaskStore();

const parentTask =
  createTask({
    id: "TASK-NEW-TASK-HISTORY",
    title: "Original task",
    description:
      "Verify out-of-scope testing findings create a child task.",
    status: "TESTING",
    scope: {
      files: [
        "src/original.ts",
      ],
      components: [
        "OriginalComponent",
      ],
      behavior: [
        "Original behavior",
      ],
      exclusions: [],
    },
  });

childStore.add(
  parentTask,
);

const newTaskResult = {
  type: "NEW_TASK" as const,
  summary:
    "New issue discovered.",
  details:
    "The tester discovered an issue outside the original task scope.",
  relatedTaskId:
    parentTask.id,
  expectedBehavior:
    "The newly discovered behavior should work correctly.",
  actualBehavior:
    "The newly discovered behavior does not work correctly.",
  files: [
    "src/new-issue.ts",
  ],
  components: [
    "NewIssueComponent",
  ],
};

const childOutcome =
  handleTestResult(
    parentTask,
    newTaskResult,
    childStore,
  );

assert.equal(
  childOutcome.resultType,
  "NEW_TASK",
);

assert.equal(
  childOutcome.task.status,
  "DONE",
);

assert.ok(
  childOutcome.newTask,
);

const createdChild =
  childOutcome.newTask!;

assert.equal(
  createdChild.parentTaskId,
  parentTask.id,
);

assert.equal(
  createdChild.id,
  `${parentTask.id}-CHILD-001`,
);

assert.equal(
  createdChild.title,
  newTaskResult.summary,
);

assert.equal(
  createdChild.description,
  newTaskResult.details,
);

assert.deepEqual(
  createdChild.scope.files,
  newTaskResult.files,
);

assert.deepEqual(
  createdChild.scope.components,
  newTaskResult.components,
);

assert.deepEqual(
  createdChild.scope.behavior,
  [
    newTaskResult.expectedBehavior,
  ],
);

assert.equal(
  childStore.has(
    createdChild.id,
  ),
  true,
);

const childHistory =
  childStore.getHistory(
    parentTask.id,
  );

assert.equal(
  childHistory.length,
  1,
);

assert.equal(
  childHistory[0]?.from,
  "TESTING",
);

assert.equal(
  childHistory[0]?.to,
  "DONE",
);

assert.equal(
  childHistory[0]?.reason,
  "Testing failed due to an out-of-scope issue; original task completed.",
);

assert.ok(
  childHistory[0]?.timestamp,
);

console.log(
  "Testing handler NEW_TASK history integration test passed",
);
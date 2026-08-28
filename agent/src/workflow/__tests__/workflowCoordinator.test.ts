import assert from "node:assert/strict";

import {
  createTask,
} from "../taskFactory.js";

import {
  TaskStore,
} from "../taskStore.js";

import {
  WorkflowCoordinator,
} from "../workflowCoordinator.js";

import {
  createTaskContract,
} from "../taskContract.js";

const store =
  new TaskStore();

const coordinator =
  new WorkflowCoordinator(
    store,
  );

const task =
  createTask({
    id: "TASK-COORDINATOR-001",
    title: "Coordinator test",
    description:
      "Verify workflow coordinator starts the official coding flow.",
    status: "GIT_READY",
    scope: {
      files: [
        "src/example.ts",
      ],
      components: [
        "ExampleComponent",
      ],
      behavior: [
        "Example behavior works correctly.",
      ],
      exclusions: [],
    },
  });

store.add(
  task,
);

coordinator.attachContract(
  createTaskContract({
    taskId: task.id,
    objective: task.description,
    scope: task.scope,
  }),
);

//
// START CODING
//
// GIT_READY -> CODING -> IMPLEMENTED -> TESTING
//

const codingResult =
  coordinator.startCoding(
    task.id,
  );

assert.equal(
  codingResult.task.id,
  task.id,
);

assert.equal(
  codingResult.task.status,
  "TESTING",
);

assert.equal(
  codingResult.task.attempts,
  0,
);

const storedAfterCoding =
  coordinator.getTask(
    task.id,
  );

assert.equal(
  storedAfterCoding.status,
  "TESTING",
);

const codingHistory =
  store.getHistory(
    task.id,
  );

assert.equal(
  codingHistory.length,
  3,
);

assert.equal(
  codingHistory[0]?.from,
  "GIT_READY",
);

assert.equal(
  codingHistory[0]?.to,
  "CODING",
);

assert.equal(
  codingHistory[1]?.from,
  "CODING",
);

assert.equal(
  codingHistory[1]?.to,
  "IMPLEMENTED",
);

assert.equal(
  codingHistory[2]?.from,
  "IMPLEMENTED",
);

assert.equal(
  codingHistory[2]?.to,
  "TESTING",
);

//
// PASS
//
// TESTING -> TRIAGE -> REVIEW -> DONE
//

const passResult =
  coordinator.handleTestResult(
    task.id,
    {
      type: "PASS",
      relatedTaskId:
        task.id,
      summary:
        "Tests passed.",
      details:
        "All required tests passed.",
    },
  );

assert.equal(
  passResult.result.resultType,
  "PASS",
);

assert.equal(
  passResult.task.id,
  task.id,
);

assert.equal(
  passResult.task.status,
  "DONE",
);

assert.equal(
  passResult.result.newTask,
  null,
);

const finalTask =
  coordinator.getTask(
    task.id,
  );

assert.equal(
  finalTask.status,
  "DONE",
);

const finalHistory =
  store.getHistory(
    task.id,
  );

assert.equal(
  finalHistory.length,
  6,
);

assert.equal(
  finalHistory[3]?.from,
  "TESTING",
);

assert.equal(
  finalHistory[3]?.to,
  "TRIAGE",
);

assert.equal(
  finalHistory[4]?.from,
  "TRIAGE",
);

assert.equal(
  finalHistory[4]?.to,
  "REVIEW",
);

assert.equal(
  finalHistory[5]?.from,
  "REVIEW",
);

assert.equal(
  finalHistory[5]?.to,
  "DONE",
);

//
// MISSING TASK
//

assert.throws(
  () =>
    coordinator.getTask(
      "TASK-DOES-NOT-EXIST",
    ),
  /Task TASK-DOES-NOT-EXIST does not exist/,
);

assert.throws(
  () =>
    coordinator.startCoding(
      "TASK-DOES-NOT-EXIST",
    ),
  /Task TASK-DOES-NOT-EXIST does not exist/,
);

assert.throws(
  () =>
    coordinator.handleTestResult(
      "TASK-DOES-NOT-EXIST",
      {
        type: "PASS",
        relatedTaskId:
          "TASK-DOES-NOT-EXIST",
        summary:
          "Tests passed.",
        details:
          "All required tests passed.",
      },
    ),
  /Task TASK-DOES-NOT-EXIST does not exist/,
);

console.log(
  "Workflow coordinator test passed",
);

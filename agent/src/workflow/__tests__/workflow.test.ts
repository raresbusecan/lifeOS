import assert from "node:assert/strict";

import {
  moveTask,
} from "../workflow.js";

import type {
  Task,
} from "../task.js";

function createTask(
  status: Task["status"],
  attempts = 0,
): Task {
  return {
    id: "TASK-001",
    title: "Workflow test",
    description:
      "Test workflow state and attempt enforcement.",
    status,
    department:
      status === "TESTING" ||
      status === "REWORK"
        ? "TESTER"
        : "COUNCIL",
    attempts,
    scope: {
      files: [],
      components: [],
      behavior: [],
      exclusions: [],
    },
    parentTaskId: null,
  };
}

const proposed =
  createTask("PROPOSED");

const council =
  moveTask(
    proposed,
    "COUNCIL",
  );

assert.equal(
  council.status,
  "COUNCIL",
);

const ready =
  moveTask(
    council,
    "READY",
  );

assert.equal(
  ready.status,
  "READY",
);

const coding =
  moveTask(
    ready,
    "CODING",
  );

assert.equal(
  coding.status,
  "CODING",
);

const testing =
  moveTask(
    coding,
    "TESTING",
  );

assert.equal(
  testing.status,
  "TESTING",
);

assert.equal(
  testing.attempts,
  0,
);

const rework =
  moveTask(
    testing,
    "REWORK",
  );

assert.equal(
  rework.status,
  "REWORK",
);

assert.equal(
  rework.attempts,
  1,
);

const codingAgain =
  moveTask(
    rework,
    "CODING",
  );

assert.equal(
  codingAgain.status,
  "CODING",
);

assert.equal(
  codingAgain.attempts,
  1,
);

const testingAgain =
  moveTask(
    codingAgain,
    "TESTING",
  );

assert.equal(
  testingAgain.status,
  "TESTING",
);

const secondRework =
  moveTask(
    testingAgain,
    "REWORK",
  );

assert.equal(
  secondRework.attempts,
  2,
);

const codingThird =
  moveTask(
    secondRework,
    "CODING",
  );

const testingThird =
  moveTask(
    codingThird,
    "TESTING",
  );

const thirdRework =
  moveTask(
    testingThird,
    "REWORK",
  );

assert.equal(
  thirdRework.attempts,
  3,
);

assert.throws(
  () =>
    moveTask(
      thirdRework,
      "CODING",
    ),
  /Invalid task transition|maximum of 3 attempts/,
);

console.log(
  "Workflow attempt enforcement test passed",
);
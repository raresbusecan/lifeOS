import assert from "node:assert/strict";

import {
  createTask,
} from "../taskFactory.js";

import {
  assertValidTask,
  validateTask,
} from "../taskValidator.js";

const validTask =
  createTask({
    id: "TASK-001",
    title: "Test task",
    description:
      "Validate the task contract.",
    scope: {
      files: [
        "src/workflow/task.ts",
      ],
      components: [
        "workflow",
      ],
      behavior: [
        "Validate task structure",
      ],
      exclusions: [
        "frontend",
        "backend",
      ],
    },
  });

const validResult =
  validateTask(validTask);

assert.equal(
  validResult.valid,
  true,
);

assert.deepEqual(
  validResult.errors,
  [],
);

assert.doesNotThrow(() => {
  assertValidTask(validTask);
});

const invalidTask = {
  ...validTask,
  id: "",
};

const invalidResult =
  validateTask(invalidTask);

assert.equal(
  invalidResult.valid,
  false,
);

assert.ok(
  invalidResult.errors.includes(
    "id must be a non-empty string.",
  ),
);

const invalidAttempts = {
  ...validTask,
  attempts: -1,
};

const invalidAttemptsResult =
  validateTask(invalidAttempts);

assert.equal(
  invalidAttemptsResult.valid,
  false,
);

assert.ok(
  invalidAttemptsResult.errors.includes(
    "attempts must be an integer greater than or equal to 0.",
  ),
);

const invalidStatus = {
  ...validTask,
  status: "INVALID_STATUS",
};

const invalidStatusResult =
  validateTask(invalidStatus);

assert.equal(
  invalidStatusResult.valid,
  false,
);

assert.ok(
  invalidStatusResult.errors.includes(
    "status must be a valid TaskStatus.",
  ),
);

const invalidScope = {
  ...validTask,
  scope: {
    files: "not-an-array",
    components: [],
    behavior: [],
    exclusions: [],
  },
};

const invalidScopeResult =
  validateTask(invalidScope);

assert.equal(
  invalidScopeResult.valid,
  false,
);

assert.ok(
  invalidScopeResult.errors.includes(
    "scope.files must be an array of strings.",
  ),
);

const invalidParent = {
  ...validTask,
  parentTaskId: 123,
};

const invalidParentResult =
  validateTask(invalidParent);

assert.equal(
  invalidParentResult.valid,
  false,
);

assert.ok(
  invalidParentResult.errors.includes(
    "parentTaskId must be a string or null.",
  ),
);

assert.throws(
  () => {
    assertValidTask(invalidTask);
  },
  /Invalid task:/,
);

console.log(
  "Task validator test passed",
);
import assert from "node:assert/strict";

import {
  assertValidImpactMap,
  type ImpactMap,
} from "../impactMap.js";

import {
  createTask,
} from "../taskFactory.js";

import {
  validateTask,
} from "../taskValidator.js";

const validImpactMap: ImpactMap = {
  filesToModify: [
    "src/workflow/task.ts",
  ],
  filesToCreate: [
    "src/workflow/impactMap.ts",
  ],
  testsToModify: [],
  testsToCreate: [
    "src/workflow/__tests__/impactMap.test.ts",
  ],
  componentsAffected: [
    "workflow",
  ],
  componentsProtected: [
    "taskStore",
  ],
  architectureRisks: [],
  confidence: 0.8,
};

assert.doesNotThrow(() => {
  assertValidImpactMap(validImpactMap);
});

const missingField = {
  ...validImpactMap,
  filesToModify: undefined,
} as unknown as ImpactMap;

assert.throws(
  () => {
    assertValidImpactMap(missingField);
  },
  /filesToModify must be an array/,
);

const invalidArrayValue = {
  ...validImpactMap,
  componentsAffected: [
    "workflow",
    "",
  ],
} as ImpactMap;

assert.throws(
  () => {
    assertValidImpactMap(invalidArrayValue);
  },
  /componentsAffected must contain only non-empty strings/,
);

const nonStringInArray = {
  ...validImpactMap,
  testsToCreate: [123],
} as unknown as ImpactMap;

assert.throws(
  () => {
    assertValidImpactMap(nonStringInArray);
  },
  /testsToCreate must contain only non-empty strings/,
);

const invalidConfidenceTooHigh = {
  ...validImpactMap,
  confidence: 1.5,
} as ImpactMap;

assert.throws(
  () => {
    assertValidImpactMap(invalidConfidenceTooHigh);
  },
  /confidence must be a number between 0 and 1/,
);

const invalidConfidenceNotANumber = {
  ...validImpactMap,
  confidence: "high",
} as unknown as ImpactMap;

assert.throws(
  () => {
    assertValidImpactMap(invalidConfidenceNotANumber);
  },
  /confidence must be a number between 0 and 1/,
);

const baseTask =
  createTask({
    id: "TASK-IMPACTMAP-001",
    title: "Test task with impact map",
    description:
      "Validate impact map integration on task.",
    scope: {
      files: [
        "src/workflow/task.ts",
      ],
      components: [
        "workflow",
      ],
      behavior: [
        "Validate impact map",
      ],
      exclusions: [],
    },
  });

const taskWithoutImpactMap =
  validateTask(baseTask);

assert.equal(
  taskWithoutImpactMap.valid,
  true,
);

assert.deepEqual(
  taskWithoutImpactMap.errors,
  [],
);

const taskWithValidImpactMap = {
  ...baseTask,
  impactMap: validImpactMap,
};

const taskWithValidImpactMapResult =
  validateTask(taskWithValidImpactMap);

assert.equal(
  taskWithValidImpactMapResult.valid,
  true,
);

assert.deepEqual(
  taskWithValidImpactMapResult.errors,
  [],
);

const taskWithInvalidImpactMap = {
  ...baseTask,
  impactMap: invalidConfidenceTooHigh,
};

const taskWithInvalidImpactMapResult =
  validateTask(taskWithInvalidImpactMap);

assert.equal(
  taskWithInvalidImpactMapResult.valid,
  false,
);

assert.ok(
  taskWithInvalidImpactMapResult.errors.some(
    (error) =>
      error.startsWith("impactMap:"),
  ),
);

console.log(
  "Impact Map test passed",
);
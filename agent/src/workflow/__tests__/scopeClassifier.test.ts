import assert from "node:assert/strict";

import {
  createTask,
} from "../taskFactory.js";

import {
  classifyTestResultScope,
} from "../scopeClassifier.js";

const task =
  createTask({
    id: "TASK-001",
    title:
      "Authentication implementation",
    description:
      "Implement authentication flow.",
    scope: {
      files: [
        "src/auth/login.ts",
      ],
      components: [
        "authentication",
        "session",
      ],
      behavior: [
        "User remains authenticated after login.",
      ],
      exclusions: [
        "src/validation.ts",
        "validation",
      ],
    },
  });

const inScopeByFile =
  classifyTestResultScope(
    task,
    {
      type: "REWORK",
      relatedTaskId: task.id,
      summary:
        "Login implementation is broken",
      details:
        "The login implementation does not preserve authentication.",
      expectedBehavior:
        "User remains authenticated after login.",
      actualBehavior:
        "User is logged out immediately.",
      files: [
        "src/auth/login.ts",
      ],
      components: [
        "authentication",
      ],
    },
  );

assert.equal(
  inScopeByFile.classification,
  "IN_SCOPE",
);

assert.deepEqual(
  inScopeByFile.matchedFiles,
  [
    "src/auth/login.ts",
  ],
);

assert.deepEqual(
  inScopeByFile.matchedComponents,
  [
    "authentication",
  ],
);

const inScopeByComponent =
  classifyTestResultScope(
    task,
    {
      type: "REWORK",
      relatedTaskId: task.id,
      summary:
        "Session behavior is incorrect",
      details:
        "The session expires unexpectedly.",
      expectedBehavior:
        "User remains authenticated after login.",
      actualBehavior:
        "The user is logged out after login.",
      components: [
        "session",
      ],
    },
  );

assert.equal(
  inScopeByComponent.classification,
  "IN_SCOPE",
);

assert.deepEqual(
  inScopeByComponent.matchedComponents,
  [
    "session",
  ],
);

const outOfScopeByFile =
  classifyTestResultScope(
    task,
    {
      type: "NEW_TASK",
      relatedTaskId: task.id,
      summary:
        "Validation bug discovered",
      details:
        "Validation accepts malformed input.",
      expectedBehavior:
        "Malformed input should be rejected.",
      actualBehavior:
        "Malformed input is accepted.",
      files: [
        "src/validation.ts",
      ],
      components: [
        "validation",
      ],
    },
  );

assert.equal(
  outOfScopeByFile.classification,
  "OUT_OF_SCOPE",
);

assert.deepEqual(
  outOfScopeByFile.excludedFiles,
  [
    "src/validation.ts",
  ],
);

assert.deepEqual(
  outOfScopeByFile.excludedComponents,
  [
    "validation",
  ],
);

const outOfScopeByUnknown =
  classifyTestResultScope(
    task,
    {
      type: "NEW_TASK",
      relatedTaskId: task.id,
      summary:
        "Unrelated database problem",
      details:
        "A database problem was discovered.",
      expectedBehavior:
        "Database queries should succeed.",
      actualBehavior:
        "Database queries fail.",
      files: [
        "src/database/query.ts",
      ],
      components: [
        "database",
      ],
    },
  );

assert.equal(
  outOfScopeByUnknown.classification,
  "OUT_OF_SCOPE",
);

assert.deepEqual(
  outOfScopeByUnknown.matchedFiles,
  [],
);

assert.deepEqual(
  outOfScopeByUnknown.matchedComponents,
  [],
);

const inScopeByBehavior =
  classifyTestResultScope(
    task,
    {
      type: "REWORK",
      relatedTaskId: task.id,
      summary:
        "Authentication behavior is wrong",
      details:
        "Login succeeds but the session is not preserved.",
      expectedBehavior:
        "User remains authenticated after login.",
      actualBehavior:
        "User is not authenticated after login.",
    },
  );

assert.equal(
  inScopeByBehavior.classification,
  "IN_SCOPE",
);

assert.ok(
  inScopeByBehavior.matchedBehavior.length >
    0,
);

const excludedWins =
  classifyTestResultScope(
    task,
    {
      type: "NEW_TASK",
      relatedTaskId: task.id,
      summary:
        "Validation problem",
      details:
        "Validation behavior is incorrect.",
      expectedBehavior:
        "Validation should reject invalid input.",
      actualBehavior:
        "Validation accepts invalid input.",
      files: [
        "src/validation.ts",
      ],
      components: [
        "authentication",
        "validation",
      ],
    },
  );

assert.equal(
  excludedWins.classification,
  "OUT_OF_SCOPE",
);

assert.ok(
  excludedWins.excludedFiles.length > 0 ||
    excludedWins.excludedComponents.length >
      0,
);

console.log(
  "Scope classifier test passed",
);
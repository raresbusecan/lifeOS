import assert from "node:assert/strict";

import {
  createTask,
} from "../taskFactory.js";

import {
  TaskStore,
} from "../taskStore.js";

import {
  WorkflowGuard,
} from "../workflowGuard.js";

import {
  runCodingPhase,
  handleWorkflowTestResult,
} from "../workflowRunner.js";

//
// PASS FLOW
//
// GIT_READY -> CODING -> IMPLEMENTED -> TESTING
// -> TRIAGE -> REVIEW -> DONE
//

const passStore =
  new TaskStore();

const passGuard =
  new WorkflowGuard(
    passStore,
  );

const passTask =
  createTask({
    id: "TASK-RUNNER-PASS",
    title: "Workflow runner PASS test",
    description:
      "Verify GIT_READY to CODING to IMPLEMENTED to TESTING to TRIAGE to REVIEW to DONE.",
    status: "GIT_READY",
    scope: {
      files: [
        "src/auth/login.ts",
      ],
      components: [
        "authentication",
      ],
      behavior: [
        "User remains authenticated after login.",
      ],
      exclusions: [],
    },
  });

passStore.add(
  passTask,
);

const passRun =
  runCodingPhase(
    passTask,
    passGuard,
  );

assert.equal(
  passRun.task.id,
  passTask.id,
);

assert.equal(
  passRun.task.status,
  "TESTING",
);

assert.equal(
  passRun.task.attempts,
  0,
);

const passStored =
  passStore.get(
    passTask.id,
  );

assert.ok(
  passStored,
);

assert.equal(
  passStored.status,
  "TESTING",
);

const passHistory =
  passStore.getHistory(
    passTask.id,
  );

assert.equal(
  passHistory.length,
  3,
);

assert.equal(
  passHistory[0]?.from,
  "GIT_READY",
);

assert.equal(
  passHistory[0]?.to,
  "CODING",
);

assert.equal(
  passHistory[0]?.reason,
  "Task moved to CODING.",
);

assert.equal(
  passHistory[1]?.from,
  "CODING",
);

assert.equal(
  passHistory[1]?.to,
  "IMPLEMENTED",
);

assert.equal(
  passHistory[1]?.reason,
  "Coding phase completed.",
);

assert.equal(
  passHistory[2]?.from,
  "IMPLEMENTED",
);

assert.equal(
  passHistory[2]?.to,
  "TESTING",
);

assert.equal(
  passHistory[2]?.reason,
  "Task moved to TESTING.",
);

const passOutcome =
  handleWorkflowTestResult(
    passRun.task,
    {
      type: "PASS",
      relatedTaskId:
        passTask.id,
      summary:
        "Authentication tests passed.",
      details:
        "All authentication behavior passed testing.",
    },
    passGuard,
    passStore,
  );

assert.equal(
  passOutcome.result.resultType,
  "PASS",
);

assert.equal(
  passOutcome.task.status,
  "DONE",
);

assert.equal(
  passOutcome.result.newTask,
  null,
);

assert.equal(
  passStore.get(
    passTask.id,
  )?.status,
  "DONE",
);

assert.equal(
  passStore.getHistory(
    passTask.id,
  ).length,
  6,
);

const passFinalHistory =
  passStore.getHistory(
    passTask.id,
  );

assert.equal(
  passFinalHistory[3]?.from,
  "TESTING",
);

assert.equal(
  passFinalHistory[3]?.to,
  "TRIAGE",
);

assert.equal(
  passFinalHistory[4]?.from,
  "TRIAGE",
);

assert.equal(
  passFinalHistory[4]?.to,
  "REVIEW",
);

assert.equal(
  passFinalHistory[5]?.from,
  "REVIEW",
);

assert.equal(
  passFinalHistory[5]?.to,
  "DONE",
);

assert.throws(
  () =>
    handleWorkflowTestResult(
      passOutcome.task,
      {
        type: "PASS",
        relatedTaskId:
          passTask.id,
        summary:
          "Authentication tests passed again.",
        details:
          "This task is already DONE.",
      },
      passGuard,
      passStore,
    ),
  /Testing phase can only handle a task in TESTING status/,
);

//
// REWORK FLOW
//
// GIT_READY -> CODING -> IMPLEMENTED -> TESTING
// -> TRIAGE -> FIX_REQUIRED
//

const reworkStore =
  new TaskStore();

const reworkGuard =
  new WorkflowGuard(
    reworkStore,
  );

const reworkTask =
  createTask({
    id: "TASK-RUNNER-REWORK",
    title: "Workflow runner REWORK test",
    description:
      "Verify in-scope testing failure creates a fix-required state.",
    status: "GIT_READY",
    scope: {
      files: [
        "src/auth/login.ts",
      ],
      components: [
        "authentication",
      ],
      behavior: [
        "User remains authenticated after login.",
      ],
      exclusions: [],
    },
  });

reworkStore.add(
  reworkTask,
);

const reworkRun =
  runCodingPhase(
    reworkTask,
    reworkGuard,
  );

assert.equal(
  reworkRun.task.status,
  "TESTING",
);

const reworkOutcome =
  handleWorkflowTestResult(
    reworkRun.task,
    {
      type: "REWORK",
      relatedTaskId:
        reworkTask.id,
      summary:
        "Authentication behavior failed.",
      details:
        "The login flow does not preserve authentication.",
      expectedBehavior:
        "User remains authenticated after login.",
      actualBehavior:
        "User is logged out immediately after login.",
      files: [
        "src/auth/login.ts",
      ],
      components: [
        "authentication",
      ],
    },
    reworkGuard,
    reworkStore,
  );

assert.equal(
  reworkOutcome.result.resultType,
  "REWORK",
);

assert.equal(
  reworkOutcome.task.status,
  "FIX_REQUIRED",
);

assert.equal(
  reworkOutcome.task.attempts,
  1,
);

assert.equal(
  reworkOutcome.result.newTask,
  null,
);

assert.equal(
  reworkStore.get(
    reworkTask.id,
  )?.status,
  "FIX_REQUIRED",
);

const reworkHistory =
  reworkStore.getHistory(
    reworkTask.id,
  );

assert.equal(
  reworkHistory.length,
  5,
);

assert.equal(
  reworkHistory[3]?.from,
  "TESTING",
);

assert.equal(
  reworkHistory[3]?.to,
  "TRIAGE",
);

assert.equal(
  reworkHistory[4]?.from,
  "TRIAGE",
);

assert.equal(
  reworkHistory[4]?.to,
  "FIX_REQUIRED",
);

//
// NEW TASK FLOW
//
// GIT_READY -> CODING -> IMPLEMENTED -> TESTING
// -> TRIAGE -> REVIEW -> DONE + CHILD
//

const childStore =
  new TaskStore();

const childGuard =
  new WorkflowGuard(
    childStore,
  );

const childParent =
  createTask({
    id: "TASK-RUNNER-NEW",
    title: "Workflow runner NEW_TASK test",
    description:
      "Verify out-of-scope testing finding creates child task.",
    status: "GIT_READY",
    scope: {
      files: [
        "src/auth/login.ts",
      ],
      components: [
        "authentication",
      ],
      behavior: [
        "User remains authenticated after login.",
      ],
      exclusions: [],
    },
  });

childStore.add(
  childParent,
);

const childRun =
  runCodingPhase(
    childParent,
    childGuard,
  );

assert.equal(
  childRun.task.status,
  "TESTING",
);

const childOutcome =
  handleWorkflowTestResult(
    childRun.task,
    {
      type: "NEW_TASK",
      relatedTaskId:
        childParent.id,
      summary:
        "Database issue discovered.",
      details:
        "The tester discovered a database problem outside the authentication scope.",
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
    childGuard,
    childStore,
  );

assert.equal(
  childOutcome.result.resultType,
  "NEW_TASK",
);

assert.equal(
  childOutcome.task.status,
  "DONE",
);

assert.ok(
  childOutcome.result.newTask,
);

const childTask =
  childOutcome.result.newTask;

assert.equal(
  childTask?.parentTaskId,
  childParent.id,
);

assert.equal(
  childTask?.id,
  `${childParent.id}-CHILD-001`,
);

assert.equal(
  childTask?.title,
  "Database issue discovered.",
);

assert.equal(
  childTask?.description,
  "The tester discovered a database problem outside the authentication scope.",
);

assert.deepEqual(
  childTask?.scope.files,
  [
    "src/database/query.ts",
  ],
);

assert.deepEqual(
  childTask?.scope.components,
  [
    "database",
  ],
);

assert.deepEqual(
  childTask?.scope.behavior,
  [
    "Database queries should succeed.",
  ],
);

assert.equal(
  childStore.has(
    `${childParent.id}-CHILD-001`,
  ),
  true,
);

assert.equal(
  childStore.getChildren(
    childParent.id,
  ).length,
  1,
);

const childHistory =
  childStore.getHistory(
    childParent.id,
  );

assert.equal(
  childHistory.length,
  6,
);

assert.equal(
  childHistory[3]?.from,
  "TESTING",
);

assert.equal(
  childHistory[3]?.to,
  "TRIAGE",
);

assert.equal(
  childHistory[4]?.from,
  "TRIAGE",
);

assert.equal(
  childHistory[4]?.to,
  "REVIEW",
);

assert.equal(
  childHistory[5]?.from,
  "REVIEW",
);

assert.equal(
  childHistory[5]?.to,
  "DONE",
);

//
// INVALID START
//

const invalidStore =
  new TaskStore();

const invalidGuard =
  new WorkflowGuard(
    invalidStore,
  );

const invalidTask =
  createTask({
    id: "TASK-RUNNER-INVALID",
    title: "Invalid runner test",
    description:
      "Verify coding phase requires GIT_READY.",
    status: "TESTING",
  });

invalidStore.add(
  invalidTask,
);

assert.throws(
  () =>
    runCodingPhase(
      invalidTask,
      invalidGuard,
    ),
  /Coding phase can only start for a task in GIT_READY status/,
);

//
// INVALID TEST RESULT STATE
//

assert.throws(
  () =>
    handleWorkflowTestResult(
      passOutcome.task,
      {
        type: "PASS",
        relatedTaskId:
          passTask.id,
        summary:
          "Authentication tests passed again.",
        details:
          "This task is already DONE.",
      },
      passGuard,
      passStore,
    ),
  /Testing phase can only handle a task in TESTING status/,
);

//
// MISSING TASK FOR RUNNER
//

const missingStore =
  new TaskStore();

const missingGuard =
  new WorkflowGuard(
    missingStore,
  );

const missingTask =
  createTask({
    id: "TASK-RUNNER-MISSING",
    title: "Missing task",
    description:
      "Task used to verify runner behavior.",
    status: "GIT_READY",
  });

assert.throws(
  () =>
    runCodingPhase(
      missingTask,
      missingGuard,
    ),
  /Task TASK-RUNNER-MISSING does not exist/,
);

console.log(
  "Workflow runner PASS orchestration test passed",
);

console.log(
  "Workflow runner REWORK orchestration test passed",
);

console.log(
  "Workflow runner NEW_TASK orchestration test passed",
);

console.log(
  "Workflow runner validation test passed",
);

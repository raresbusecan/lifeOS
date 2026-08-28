import assert from "node:assert/strict";
import { createTask, } from "../taskFactory.js";
import { TaskStore, } from "../taskStore.js";
import { WorkflowCoordinator, } from "../workflowCoordinator.js";
//
// PASS FLOW
//
// READY
// -> CODING
// -> TESTING
// -> DONE
//
const passStore = new TaskStore();
const passTask = createTask({
    id: "TASK-COORDINATOR-PASS",
    title: "Coordinator PASS test",
    description: "Verify coordinator executes the PASS workflow.",
    status: "READY",
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
passStore.add(passTask);
const passCoordinator = new WorkflowCoordinator(passStore);
//
// Coordinator must retrieve
// the task from the store.
//
const retrievedPassTask = passCoordinator.getTask(passTask.id);
assert.equal(retrievedPassTask.id, passTask.id);
assert.equal(retrievedPassTask.status, "READY");
//
// Start coding phase.
//
const passRun = passCoordinator.startCoding(passTask.id);
assert.equal(passRun.task.id, passTask.id);
assert.equal(passRun.task.status, "TESTING");
assert.equal(passRun.task.attempts, 0);
//
// TaskStore must contain
// the TESTING state.
//
assert.equal(passStore.get(passTask.id)?.status, "TESTING");
//
// Handle PASS.
//
const passOutcome = passCoordinator.handleTestResult(passTask.id, {
    type: "PASS",
    relatedTaskId: passTask.id,
    summary: "Authentication tests passed.",
    details: "All authentication tests passed successfully.",
});
assert.equal(passOutcome.task.id, passTask.id);
assert.equal(passOutcome.task.status, "DONE");
assert.equal(passOutcome.result.resultType, "PASS");
assert.equal(passOutcome.result.newTask, null);
//
// Store must contain DONE.
//
assert.equal(passStore.get(passTask.id)?.status, "DONE");
//
// Full history must exist.
//
const passHistory = passStore.getHistory(passTask.id);
assert.equal(passHistory.length, 3);
assert.deepEqual(passHistory.map((entry) => `${entry.from}->${entry.to}`), [
    "READY->CODING",
    "CODING->TESTING",
    "TESTING->DONE",
]);
//
// REWORK FLOW
//
// READY
// -> CODING
// -> TESTING
// -> REWORK
//
const reworkStore = new TaskStore();
const reworkTask = createTask({
    id: "TASK-COORDINATOR-REWORK",
    title: "Coordinator REWORK test",
    description: "Verify coordinator executes an in-scope rework.",
    status: "READY",
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
reworkStore.add(reworkTask);
const reworkCoordinator = new WorkflowCoordinator(reworkStore);
const reworkRun = reworkCoordinator.startCoding(reworkTask.id);
assert.equal(reworkRun.task.status, "TESTING");
const reworkOutcome = reworkCoordinator.handleTestResult(reworkTask.id, {
    type: "REWORK",
    relatedTaskId: reworkTask.id,
    summary: "Authentication behavior failed.",
    details: "The login flow does not preserve authentication.",
    expectedBehavior: "User remains authenticated after login.",
    actualBehavior: "User is logged out immediately after login.",
    files: [
        "src/auth/login.ts",
    ],
    components: [
        "authentication",
    ],
});
assert.equal(reworkOutcome.task.status, "REWORK");
assert.equal(reworkOutcome.task.attempts, 1);
assert.equal(reworkOutcome.result.resultType, "REWORK");
assert.equal(reworkOutcome.result.newTask, null);
assert.equal(reworkStore.get(reworkTask.id)?.status, "REWORK");
assert.equal(reworkStore.get(reworkTask.id)?.attempts, 1);
const reworkHistory = reworkStore.getHistory(reworkTask.id);
assert.equal(reworkHistory.length, 3);
assert.deepEqual(reworkHistory.map((entry) => `${entry.from}->${entry.to}`), [
    "READY->CODING",
    "CODING->TESTING",
    "TESTING->REWORK",
]);
//
// NEW TASK FLOW
//
// READY
// -> CODING
// -> TESTING
// -> DONE
// + CHILD
//
const childStore = new TaskStore();
const childTask = createTask({
    id: "TASK-COORDINATOR-NEW",
    title: "Coordinator NEW_TASK test",
    description: "Verify coordinator creates a child task for an out-of-scope finding.",
    status: "READY",
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
childStore.add(childTask);
const childCoordinator = new WorkflowCoordinator(childStore);
const childRun = childCoordinator.startCoding(childTask.id);
assert.equal(childRun.task.status, "TESTING");
const childOutcome = childCoordinator.handleTestResult(childTask.id, {
    type: "NEW_TASK",
    relatedTaskId: childTask.id,
    summary: "Database issue discovered.",
    details: "The tester discovered a database issue outside the original task scope.",
    expectedBehavior: "Database queries should succeed.",
    actualBehavior: "Database queries fail.",
    files: [
        "src/database/query.ts",
    ],
    components: [
        "database",
    ],
});
assert.equal(childOutcome.task.status, "DONE");
assert.equal(childOutcome.result.resultType, "NEW_TASK");
assert.ok(childOutcome.result.newTask);
const createdChild = childOutcome.result.newTask;
assert.equal(createdChild.parentTaskId, childTask.id);
assert.equal(createdChild.id, `${childTask.id}-CHILD-001`);
assert.equal(createdChild.title, "Database issue discovered.");
assert.equal(createdChild.description, "The tester discovered a database issue outside the original task scope.");
assert.deepEqual(createdChild.scope.files, [
    "src/database/query.ts",
]);
assert.deepEqual(createdChild.scope.components, [
    "database",
]);
assert.deepEqual(createdChild.scope.behavior, [
    "Database queries should succeed.",
]);
assert.equal(childStore.has(createdChild.id), true);
assert.equal(childStore.get(childTask.id)?.status, "DONE");
//
// Coordinator must use the same
// TaskStore history.
//
const childHistory = childStore.getHistory(childTask.id);
assert.equal(childHistory.length, 3);
assert.deepEqual(childHistory.map((entry) => `${entry.from}->${entry.to}`), [
    "READY->CODING",
    "CODING->TESTING",
    "TESTING->DONE",
]);
//
// VALIDATION
//
// Unknown task IDs must be rejected.
//
assert.throws(() => passCoordinator.getTask("TASK-DOES-NOT-EXIST"), /Task TASK-DOES-NOT-EXIST does not exist/);
assert.throws(() => passCoordinator.startCoding("TASK-DOES-NOT-EXIST"), /Task TASK-DOES-NOT-EXIST does not exist/);
assert.throws(() => passCoordinator.handleTestResult("TASK-DOES-NOT-EXIST", {
    type: "PASS",
    relatedTaskId: "TASK-DOES-NOT-EXIST",
    summary: "Unknown task.",
    details: "Unknown task test.",
}), /Task TASK-DOES-NOT-EXIST does not exist/);
//
// Coordinator must use the current
// state from TaskStore.
//
// The PASS task is already DONE,
// so starting coding again must fail.
//
assert.throws(() => passCoordinator.startCoding(passTask.id), /Coding phase can only start for a task in READY status/);
//
// A DONE task cannot receive
// another testing result.
//
assert.throws(() => passCoordinator.handleTestResult(passTask.id, {
    type: "PASS",
    relatedTaskId: passTask.id,
    summary: "Duplicate testing result.",
    details: "The task is already DONE.",
}), /Testing phase can only handle a task in TESTING status/);
console.log("Workflow coordinator integration test passed");

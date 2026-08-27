import assert from "node:assert/strict";
import { createTask, } from "../taskFactory.js";
import { TaskStore, } from "../taskStore.js";
import { runCodingPhase, handleWorkflowTestResult, } from "../workflowRunner.js";
//
// PASS FLOW
//
// READY -> CODING -> TESTING -> DONE
//
const passStore = new TaskStore();
const passTask = createTask({
    id: "TASK-RUNNER-PASS",
    title: "Workflow runner PASS test",
    description: "Verify READY to CODING to TESTING to DONE.",
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
const passRun = runCodingPhase(passTask, passStore);
assert.equal(passRun.task.id, passTask.id);
assert.equal(passRun.task.status, "TESTING");
assert.equal(passRun.task.attempts, 0);
const passStored = passStore.get(passTask.id);
assert.ok(passStored);
assert.equal(passStored.status, "TESTING");
const passHistory = passStore.getHistory(passTask.id);
assert.equal(passHistory.length, 2);
assert.equal(passHistory[0]?.from, "READY");
assert.equal(passHistory[0]?.to, "CODING");
assert.equal(passHistory[0]?.reason, "Task moved to CODING.");
assert.equal(passHistory[1]?.from, "CODING");
assert.equal(passHistory[1]?.to, "TESTING");
assert.equal(passHistory[1]?.reason, "Task moved to TESTING.");
const passOutcome = handleWorkflowTestResult(passRun.task, {
    type: "PASS",
    relatedTaskId: passTask.id,
    summary: "Authentication tests passed.",
    details: "All authentication behavior passed testing.",
}, passStore);
assert.equal(passOutcome.result.resultType, "PASS");
assert.equal(passOutcome.task.status, "DONE");
assert.equal(passOutcome.result.newTask, null);
assert.equal(passStore.get(passTask.id)?.status, "DONE");
assert.equal(passStore.getHistory(passTask.id).length, 3);
assert.equal(passStore.getHistory(passTask.id)[2]?.from, "TESTING");
assert.equal(passStore.getHistory(passTask.id)[2]?.to, "DONE");
//
// REWORK FLOW
//
// READY -> CODING -> TESTING -> REWORK
//
const reworkStore = new TaskStore();
const reworkTask = createTask({
    id: "TASK-RUNNER-REWORK",
    title: "Workflow runner REWORK test",
    description: "Verify in-scope testing failure creates rework.",
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
const reworkRun = runCodingPhase(reworkTask, reworkStore);
assert.equal(reworkRun.task.status, "TESTING");
const reworkOutcome = handleWorkflowTestResult(reworkRun.task, {
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
}, reworkStore);
assert.equal(reworkOutcome.result.resultType, "REWORK");
assert.equal(reworkOutcome.task.status, "REWORK");
assert.equal(reworkOutcome.task.attempts, 1);
assert.equal(reworkOutcome.result.newTask, null);
assert.equal(reworkStore.get(reworkTask.id)?.status, "REWORK");
const reworkHistory = reworkStore.getHistory(reworkTask.id);
assert.equal(reworkHistory.length, 3);
assert.equal(reworkHistory[2]?.from, "TESTING");
assert.equal(reworkHistory[2]?.to, "REWORK");
assert.equal(reworkHistory[2]?.reason, "Testing failed due to an in-scope issue.");
//
// NEW TASK FLOW
//
// READY -> CODING -> TESTING
// -> DONE + CHILD
//
const childStore = new TaskStore();
const childParent = createTask({
    id: "TASK-RUNNER-NEW",
    title: "Workflow runner NEW_TASK test",
    description: "Verify out-of-scope testing finding creates child task.",
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
childStore.add(childParent);
const childRun = runCodingPhase(childParent, childStore);
assert.equal(childRun.task.status, "TESTING");
const childOutcome = handleWorkflowTestResult(childRun.task, {
    type: "NEW_TASK",
    relatedTaskId: childParent.id,
    summary: "Database issue discovered.",
    details: "The tester discovered a database problem outside the authentication scope.",
    expectedBehavior: "Database queries should succeed.",
    actualBehavior: "Database queries fail.",
    files: [
        "src/database/query.ts",
    ],
    components: [
        "database",
    ],
}, childStore);
assert.equal(childOutcome.result.resultType, "NEW_TASK");
assert.equal(childOutcome.task.status, "DONE");
assert.ok(childOutcome.result.newTask);
const childTask = childOutcome.result.newTask;
assert.equal(childTask?.parentTaskId, childParent.id);
assert.equal(childTask?.id, `${childParent.id}-CHILD-001`);
assert.equal(childTask?.title, "Database issue discovered.");
assert.equal(childTask?.description, "The tester discovered a database problem outside the authentication scope.");
assert.deepEqual(childTask?.scope.files, [
    "src/database/query.ts",
]);
assert.deepEqual(childTask?.scope.components, [
    "database",
]);
assert.deepEqual(childTask?.scope.behavior, [
    "Database queries should succeed.",
]);
assert.equal(childStore.has(`${childParent.id}-CHILD-001`), true);
assert.equal(childStore.getChildren(childParent.id).length, 1);
const childHistory = childStore.getHistory(childParent.id);
assert.equal(childHistory.length, 3);
assert.equal(childHistory[2]?.from, "TESTING");
assert.equal(childHistory[2]?.to, "DONE");
assert.equal(childHistory[2]?.reason, "Testing failed due to an out-of-scope issue; original task completed.");
//
// INVALID START
//
const invalidStore = new TaskStore();
const invalidTask = createTask({
    id: "TASK-RUNNER-INVALID",
    title: "Invalid runner test",
    description: "Verify coding phase requires READY.",
    status: "TESTING",
});
invalidStore.add(invalidTask);
assert.throws(() => runCodingPhase(invalidTask, invalidStore), /Coding phase can only start for a task in READY status/);
//
// INVALID TEST RESULT STATE
//
assert.throws(() => handleWorkflowTestResult(invalidTask, {
    type: "PASS",
    relatedTaskId: invalidTask.id,
    summary: "Invalid result.",
    details: "The task is not in a valid testing state.",
}, invalidStore), /Testing phase can only handle a task in TESTING status/);
//
// MISSING TASK FOR RUNNER
//
const missingStore = new TaskStore();
const missingTask = createTask({
    id: "TASK-RUNNER-MISSING",
    title: "Missing task",
    description: "Task used to verify runner behavior.",
    status: "READY",
});
assert.throws(() => runCodingPhase(missingTask, missingStore), /Task TASK-RUNNER-MISSING does not exist/);
console.log("Workflow runner PASS orchestration test passed");
console.log("Workflow runner REWORK orchestration test passed");
console.log("Workflow runner NEW_TASK orchestration test passed");
console.log("Workflow runner validation test passed");

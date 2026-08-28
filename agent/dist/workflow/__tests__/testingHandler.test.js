import assert from "node:assert/strict";
import { createTask, } from "../taskFactory.js";
import { TaskStore, } from "../taskStore.js";
import { WorkflowGuard, } from "../workflowGuard.js";
import { handleTestResult, } from "../testingHandler.js";
//
// PASS FLOW
//
// TESTING -> TRIAGE -> REVIEW -> DONE
//
const store = new TaskStore();
const guard = new WorkflowGuard(store);
const task = createTask({
    id: "TASK-TESTING-HISTORY",
    title: "Testing history",
    description: "Verify testing handler records workflow history.",
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
    type: "PASS",
    summary: "Tests passed.",
    details: "All required tests passed successfully.",
    relatedTaskId: task.id,
};
const outcome = handleTestResult(task, passResult, guard, store);
assert.equal(outcome.resultType, "PASS");
assert.equal(outcome.task.status, "DONE");
assert.equal(store.get(task.id)?.status, "DONE");
const history = store.getHistory(task.id);
assert.equal(history.length, 3);
assert.equal(history[0]?.from, "TESTING");
assert.equal(history[0]?.to, "TRIAGE");
assert.equal(history[0]?.reason, "Testing passed; task moved to TRIAGE.");
assert.equal(history[1]?.from, "TRIAGE");
assert.equal(history[1]?.to, "REVIEW");
assert.equal(history[1]?.reason, "Triage passed; task moved to REVIEW.");
assert.equal(history[2]?.from, "REVIEW");
assert.equal(history[2]?.to, "DONE");
assert.equal(history[2]?.reason, "Review approved; task completed.");
assert.ok(history[0]?.timestamp);
assert.ok(history[1]?.timestamp);
assert.ok(history[2]?.timestamp);
console.log("Testing handler PASS history integration test passed");
//
// REWORK FLOW
//
// TESTING -> TRIAGE -> FIX_REQUIRED
//
const reworkStore = new TaskStore();
const reworkGuard = new WorkflowGuard(reworkStore);
const reworkTask = createTask({
    id: "TASK-REWORK-HISTORY",
    title: "Testing rework history",
    description: "Verify testing handler records rework history.",
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
reworkStore.add(reworkTask);
const failedResult = {
    type: "REWORK",
    summary: "Test failed.",
    details: "ExampleComponent does not satisfy the expected behavior.",
    relatedTaskId: reworkTask.id,
    expectedBehavior: "ExampleComponent should satisfy the expected behavior.",
    actualBehavior: "ExampleComponent does not satisfy the expected behavior.",
    files: [
        "src/example.ts",
    ],
    components: [
        "ExampleComponent",
    ],
};
const reworkOutcome = handleTestResult(reworkTask, failedResult, reworkGuard, reworkStore);
assert.equal(reworkOutcome.resultType, "REWORK");
assert.equal(reworkOutcome.task.status, "FIX_REQUIRED");
assert.equal(reworkOutcome.task.attempts, 1);
assert.equal(reworkStore.get(reworkTask.id)?.status, "FIX_REQUIRED");
const reworkHistory = reworkStore.getHistory(reworkTask.id);
assert.equal(reworkHistory.length, 2);
assert.equal(reworkHistory[0]?.from, "TESTING");
assert.equal(reworkHistory[0]?.to, "TRIAGE");
assert.equal(reworkHistory[0]?.reason, "Testing result received; task moved to TRIAGE.");
assert.equal(reworkHistory[1]?.from, "TRIAGE");
assert.equal(reworkHistory[1]?.to, "FIX_REQUIRED");
assert.equal(reworkHistory[1]?.reason, "Testing failed due to an in-scope issue.");
assert.ok(reworkHistory[0]?.timestamp);
assert.ok(reworkHistory[1]?.timestamp);
console.log("Testing handler REWORK history integration test passed");
//
// NEW TASK FLOW
//
// TESTING -> TRIAGE -> REVIEW -> DONE + CHILD
//
const childStore = new TaskStore();
const childGuard = new WorkflowGuard(childStore);
const parentTask = createTask({
    id: "TASK-NEW-TASK-HISTORY",
    title: "Original task",
    description: "Verify out-of-scope testing findings create a child task.",
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
childStore.add(parentTask);
const newTaskResult = {
    type: "NEW_TASK",
    summary: "New issue discovered.",
    details: "The tester discovered an issue outside the original task scope.",
    relatedTaskId: parentTask.id,
    expectedBehavior: "The newly discovered behavior should work correctly.",
    actualBehavior: "The newly discovered behavior does not work correctly.",
    files: [
        "src/new-issue.ts",
    ],
    components: [
        "NewIssueComponent",
    ],
};
const childOutcome = handleTestResult(parentTask, newTaskResult, childGuard, childStore);
assert.equal(childOutcome.resultType, "NEW_TASK");
assert.equal(childOutcome.task.status, "DONE");
assert.ok(childOutcome.newTask);
const createdChild = childOutcome.newTask;
assert.equal(createdChild.parentTaskId, parentTask.id);
assert.equal(createdChild.id, `${parentTask.id}-CHILD-001`);
assert.equal(createdChild.title, newTaskResult.summary);
assert.equal(createdChild.description, newTaskResult.details);
assert.deepEqual(createdChild.scope.files, newTaskResult.files);
assert.deepEqual(createdChild.scope.components, newTaskResult.components);
assert.deepEqual(createdChild.scope.behavior, [
    newTaskResult.expectedBehavior,
]);
assert.equal(childStore.has(createdChild.id), true);
assert.equal(childStore.getChildren(parentTask.id).length, 1);
const childHistory = childStore.getHistory(parentTask.id);
assert.equal(childHistory.length, 3);
assert.equal(childHistory[0]?.from, "TESTING");
assert.equal(childHistory[0]?.to, "TRIAGE");
assert.equal(childHistory[0]?.reason, "Testing result received; task moved to TRIAGE.");
assert.equal(childHistory[1]?.from, "TRIAGE");
assert.equal(childHistory[1]?.to, "REVIEW");
assert.equal(childHistory[1]?.reason, "Triage passed; task moved to REVIEW.");
assert.equal(childHistory[2]?.from, "REVIEW");
assert.equal(childHistory[2]?.to, "DONE");
assert.equal(childHistory[2]?.reason, "Review approved; task completed.");
assert.ok(childHistory[0]?.timestamp);
assert.ok(childHistory[1]?.timestamp);
assert.ok(childHistory[2]?.timestamp);
console.log("Testing handler NEW_TASK history integration test passed");

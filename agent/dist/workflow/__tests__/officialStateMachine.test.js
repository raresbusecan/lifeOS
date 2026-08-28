import assert from "node:assert/strict";
import { createTask, } from "../taskFactory.js";
import { moveTask, } from "../workflow.js";
function createOfficialTask() {
    return createTask({
        id: "TASK-OFFICIAL-STATE-MACHINE",
        title: "Official state-machine task",
        description: "Verify the workflow states defined in the development plan.",
        status: "CREATED",
    });
}
function moveThrough(statuses) {
    let task = createOfficialTask();
    for (const status of statuses) {
        task = moveTask(task, status);
    }
    return task;
}
const completedTask = moveThrough([
    "ANALYSIS",
    "COUNCIL",
    "CONTRACT_READY",
    "IMPACT_APPROVED",
    "GIT_READY",
    "CODING",
    "IMPLEMENTED",
    "TESTING",
    "TRIAGE",
    "REVIEW",
    "DONE",
]);
assert.equal(completedTask.status, "DONE");
let retryTask = moveThrough([
    "ANALYSIS",
    "COUNCIL",
    "CONTRACT_READY",
    "IMPACT_APPROVED",
    "GIT_READY",
    "CODING",
    "IMPLEMENTED",
    "TESTING",
    "TRIAGE",
    "FIX_REQUIRED",
]);
assert.equal(retryTask.attempts, 1);
retryTask = moveTask(retryTask, "CODING");
retryTask = moveTask(retryTask, "IMPLEMENTED");
retryTask = moveTask(retryTask, "TESTING");
retryTask = moveTask(retryTask, "TRIAGE");
retryTask = moveTask(retryTask, "FIX_REQUIRED");
retryTask = moveTask(retryTask, "CODING");
retryTask = moveTask(retryTask, "IMPLEMENTED");
retryTask = moveTask(retryTask, "TESTING");
retryTask = moveTask(retryTask, "TRIAGE");
retryTask = moveTask(retryTask, "FIX_REQUIRED");
assert.equal(retryTask.attempts, 3);
assert.throws(() => moveTask(retryTask, "CODING"), /maximum of 3 attempts/);
const councilTask = moveTask(retryTask, "COUNCIL");
assert.equal(councilTask.status, "COUNCIL");
assert.throws(() => moveTask(createOfficialTask(), "CODING"), /Invalid task transition: CREATED -> CODING/);
console.log("Official state-machine test passed");

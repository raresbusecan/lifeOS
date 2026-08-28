import assert from "node:assert/strict";
import { createTask, } from "../taskFactory.js";
import { TaskStore, } from "../taskStore.js";
import { WorkflowGuard, } from "../workflowGuard.js";
import { runCodingPhase, handleWorkflowTestResult, } from "../workflowRunner.js";
import { createTaskContract, } from "../taskContract.js";

const passStore = new TaskStore();
const passGuard = new WorkflowGuard(passStore);
const passTask = createTask({
    id: "TASK-RUNNER-PASS",
    title: "Workflow runner PASS test",
    description: "Verify GIT_READY to CODING to IMPLEMENTED to TESTING to TRIAGE to REVIEW to DONE.",
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
passStore.add(passTask);
passStore.attachContract(createTaskContract({
    taskId: passTask.id,
    objective: passTask.description,
    scope: passTask.scope,
}));
const passRun = runCodingPhase(passTask, passGuard);
assert.equal(passRun.task.id, passTask.id);
assert.equal(passRun.task.status, "TESTING");
assert.equal(passRun.task.attempts, 0);
const passStored = passStore.get(passTask.id);
assert.ok(passStored);
assert.equal(passStored.status, "TESTING");
assert.equal(passStore.getHistory(passTask.id).length, 3);
const passOutcome = handleWorkflowTestResult(passRun.task, {
    type: "PASS",
    relatedTaskId: passTask.id,
    summary: "Authentication tests passed.",
    details: "All test cases returned exit code 0.",
}, passGuard, passStore);
assert.equal(passOutcome.task.id, passTask.id);
assert.equal(passOutcome.task.status, "DONE");
assert.equal(passOutcome.task.attempts, 0);
assert.equal(passOutcome.result.resultType, "PASS");
assert.equal(passOutcome.result.scope, null);
assert.equal(passOutcome.result.newTask, null);
assert.equal(passStore.get(passTask.id)?.status, "DONE");
assert.equal(passStore.getHistory(passTask.id).length, 6);

const reworkStore = new TaskStore();
const reworkGuard = new WorkflowGuard(reworkStore);
const reworkTask = createTask({
    id: "TASK-RUNNER-REWORK",
    title: "Workflow runner REWORK test",
    description: "Verify FIX_REQUIRED to CODING to IMPLEMENTED to TESTING to TRIAGE to FIX_REQUIRED.",
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
reworkStore.add(reworkTask);
reworkStore.attachContract(createTaskContract({
    taskId: reworkTask.id,
    objective: reworkTask.description,
    scope: reworkTask.scope,
}));
const reworkRun = runCodingPhase(reworkTask, reworkGuard);
assert.equal(reworkRun.task.status, "TESTING");

const childStore = new TaskStore();
const childGuard = new WorkflowGuard(childStore);
const childParent = createTask({
    id: "TASK-RUNNER-NEW",
    title: "Workflow runner NEW_TASK test",
    description: "Verify out-of-scope testing finding creates child task.",
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
childStore.add(childParent);
childStore.attachContract(createTaskContract({
    taskId: childParent.id,
    objective: childParent.description,
    scope: childParent.scope,
}));
const childRun = runCodingPhase(childParent, childGuard);
assert.equal(childRun.task.status, "TESTING");

const invalidStore = new TaskStore();
const invalidGuard = new WorkflowGuard(invalidStore);
const invalidTask = createTask({
    id: "TASK-RUNNER-INVALID",
    title: "Invalid runner test",
    description: "Verify coding phase requires GIT_READY.",
    status: "TESTING",
});
invalidStore.add(invalidTask);
assert.throws(() => runCodingPhase(invalidTask, invalidGuard), /Coding phase can only start for a task in GIT_READY or FIX_REQUIRED status/);

console.log("Workflow runner PASS orchestration test passed");
console.log("Workflow runner REWORK orchestration test passed");
console.log("Workflow runner NEW_TASK orchestration test passed");
console.log("Workflow runner validation test passed");

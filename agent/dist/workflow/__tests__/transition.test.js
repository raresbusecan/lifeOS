import assert from "node:assert/strict";
import { transitionTask, } from "../transition.js";
const task = {
    id: "TASK-001",
    title: "Test workflow transition",
    description: "Verify that task status transitions are enforced.",
    status: "PROPOSED",
    department: "COUNCIL",
    attempts: 0,
    scope: {
        files: [],
        components: [],
        behavior: [],
        exclusions: [],
    },
    parentTaskId: null,
};
const councilTask = transitionTask(task, "COUNCIL");
assert.equal(councilTask.status, "COUNCIL");
assert.equal(councilTask.id, task.id);
assert.equal(councilTask.title, task.title);
assert.equal(councilTask.attempts, task.attempts);
assert.equal(task.status, "PROPOSED");
assert.throws(() => transitionTask(task, "CODING"), /Invalid task transition/);
assert.throws(() => transitionTask(councilTask, "CODING"), /Invalid task transition/);
const readyTask = transitionTask(councilTask, "READY");
assert.equal(readyTask.status, "READY");
const codingTask = transitionTask(readyTask, "CODING");
assert.equal(codingTask.status, "CODING");
const testingTask = transitionTask(codingTask, "TESTING");
assert.equal(testingTask.status, "TESTING");
const reworkTask = transitionTask(testingTask, "REWORK");
assert.equal(reworkTask.status, "REWORK");
assert.throws(() => transitionTask(reworkTask, "DONE"), /Invalid task transition/);
assert.throws(() => transitionTask(task, "PROPOSED"), /already in status/);
console.log("Task transition engine test passed");

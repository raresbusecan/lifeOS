import assert from "node:assert/strict";
import { createTask, } from "../taskFactory.js";
import { TaskStore, } from "../taskStore.js";
const store = new TaskStore();
const task = createTask({
    id: "TASK-HISTORY",
    title: "History test",
    description: "Test task transition history.",
    status: "PROPOSED",
    scope: {
        files: [],
        components: [],
        behavior: [],
        exclusions: [],
    },
});
store.add(task);
assert.deepEqual(store.getHistory(task.id), []);
const council = store.transition(task.id, "COUNCIL", "Task accepted for council review.");
assert.equal(council.status, "COUNCIL");
let history = store.getHistory(task.id);
assert.equal(history.length, 1);
assert.equal(history[0]?.from, "PROPOSED");
assert.equal(history[0]?.to, "COUNCIL");
assert.equal(history[0]?.reason, "Task accepted for council review.");
assert.ok(history[0]?.timestamp);
const ready = store.transition(task.id, "READY", "Council approved the task.");
assert.equal(ready.status, "READY");
const coding = store.transition(task.id, "CODING", "Task assigned for implementation.");
assert.equal(coding.status, "CODING");
history =
    store.getHistory(task.id);
assert.equal(history.length, 3);
assert.deepEqual(history.map((entry) => `${entry.from}->${entry.to}`), [
    "PROPOSED->COUNCIL",
    "COUNCIL->READY",
    "READY->CODING",
]);
//
// Returned history must be a copy.
// External mutation must not modify
// the stored history.
//
history.push({
    from: "CODING",
    to: "TESTING",
    reason: "Fake external mutation.",
    timestamp: new Date().toISOString(),
});
assert.equal(store.getHistory(task.id).length, 3);
//
// Invalid transitions must not create
// history entries.
//
assert.throws(() => store.transition(task.id, "DONE", "Invalid direct transition."), /Invalid task transition/);
assert.equal(store.getHistory(task.id).length, 3);
//
// Empty reasons are rejected.
//
assert.throws(() => store.transition(task.id, "TESTING", "   "), /Transition reason cannot be empty/);
assert.equal(store.getHistory(task.id).length, 3);
console.log("Task transition history integration test passed");

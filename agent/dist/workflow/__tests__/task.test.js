import assert from "node:assert/strict";
const scope = {
    files: [
        "src/workflow/task.ts",
    ],
    components: [
        "workflow",
    ],
    behavior: [
        "Defines the task contract",
    ],
    exclusions: [
        "frontend",
        "backend",
    ],
};
const task = {
    id: "TASK-001",
    title: "Define task contract",
    description: "Create the initial workflow task contract.",
    status: "PROPOSED",
    department: "COUNCIL",
    attempts: 0,
    scope,
    parentTaskId: null,
};
const statuses = [
    "PROPOSED",
    "COUNCIL",
    "READY",
    "CODING",
    "TESTING",
    "REWORK",
    "DONE",
    "BLOCKED",
    "CANCELLED",
];
const departments = [
    "COUNCIL",
    "CODER",
    "TESTER",
];
assert.ok(task.id);
assert.ok(task.title);
assert.ok(task.description);
assert.equal(task.status, "PROPOSED");
assert.equal(task.department, "COUNCIL");
assert.equal(task.attempts, 0);
assert.equal(task.parentTaskId, null);
assert.ok(statuses.includes(task.status));
assert.ok(departments.includes(task.department));
assert.ok(Array.isArray(task.scope.files));
assert.ok(Array.isArray(task.scope.components));
assert.ok(Array.isArray(task.scope.behavior));
assert.ok(Array.isArray(task.scope.exclusions));
console.log("Task contract test passed");

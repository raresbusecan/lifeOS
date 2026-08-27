import assert from "node:assert/strict";
import { createTask, } from "../taskFactory.js";
import { validateTestResult, } from "../testing.js";
const task = createTask({
    id: "TASK-001",
    title: "Authentication implementation",
    description: "Implement authentication flow.",
});
validateTestResult(task, {
    type: "PASS",
    relatedTaskId: task.id,
    summary: "Authentication tests passed",
    details: "All expected authentication behavior works correctly.",
});
validateTestResult(task, {
    type: "REWORK",
    relatedTaskId: task.id,
    summary: "Authentication flow is incorrect",
    details: "The implementation does not preserve the authenticated session.",
    expectedBehavior: "The authenticated session should remain available after navigation.",
    actualBehavior: "The session is lost after navigation.",
});
validateTestResult(task, {
    type: "NEW_TASK",
    relatedTaskId: task.id,
    summary: "Validation layer contains unrelated bug",
    details: "A validation problem was discovered outside the authentication implementation.",
    expectedBehavior: "Invalid input should be rejected by the validation layer.",
    actualBehavior: "Invalid input is accepted by the validation layer.",
    files: [
        "src/validation.ts",
    ],
    components: [
        "validation",
    ],
});
assert.throws(() => validateTestResult(task, {
    type: "PASS",
    relatedTaskId: "TASK-999",
    summary: "Wrong task",
    details: "This result belongs to another task.",
}), /belongs to task/);
assert.throws(() => validateTestResult(task, {
    type: "REWORK",
    relatedTaskId: task.id,
    summary: "Missing expected behavior",
    details: "Implementation failed.",
    actualBehavior: "Wrong behavior.",
}), /expected behavior/);
assert.throws(() => validateTestResult(task, {
    type: "REWORK",
    relatedTaskId: task.id,
    summary: "Missing actual behavior",
    details: "Implementation failed.",
    expectedBehavior: "Correct behavior.",
}), /actual behavior/);
assert.throws(() => validateTestResult(task, {
    type: "NEW_TASK",
    relatedTaskId: task.id,
    summary: "Unrelated issue",
    details: "Another problem was discovered.",
    expectedBehavior: "Expected behavior.",
    actualBehavior: "Actual behavior.",
}), /affected files or components/);
assert.throws(() => validateTestResult(task, {
    type: "NEW_TASK",
    relatedTaskId: task.id,
    summary: "",
    details: "Some details.",
    expectedBehavior: "Expected behavior.",
    actualBehavior: "Actual behavior.",
    files: [
        "src/example.ts",
    ],
}), /summary cannot be empty/);
assert.throws(() => validateTestResult(task, {
    type: "PASS",
    relatedTaskId: task.id,
    summary: "Valid summary",
    details: "",
}), /details cannot be empty/);
console.log("Testing result validation test passed");

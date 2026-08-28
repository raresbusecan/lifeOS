import assert from "node:assert/strict";
import { createTaskContract, validateTaskContract, assertValidTaskContract, } from "../taskContract.js";
const validContract = createTaskContract({
    taskId: "TASK-001",
    objective: "Implement task contract schema",
    acceptanceCriteria: [
        "Schema must validate objective and scope",
        "Validation must fail for invalid contract fields",
    ],
    scope: {
        files: ["src/workflow/taskContract.ts"],
        components: ["TaskContract"],
        behavior: ["Validates task contract schema"],
        exclusions: [],
    },
    constraints: ["Do not break existing workflow"],
    requiredTests: ["src/workflow/__tests__/taskContract.test.ts"],
    dependencies: ["src/workflow/task.ts"],
});
assert.equal(validContract.taskId, "TASK-001");
assert.equal(validContract.objective, "Implement task contract schema");
assert.equal(validContract.acceptanceCriteria.length, 2);
assert.equal(validContract.constraints.length, 1);
assert.equal(validContract.requiredTests.length, 1);
assert.equal(validContract.dependencies.length, 1);
const validResult = validateTaskContract(validContract);
assert.equal(validResult.valid, true);
assert.equal(validResult.errors.length, 0);
const invalidContract = {
    taskId: "",
    objective: " ",
    acceptanceCriteria: "not-an-array",
    scope: null,
    constraints: [123],
    requiredTests: [],
    dependencies: [],
};
const invalidResult = validateTaskContract(invalidContract);
assert.equal(invalidResult.valid, false);
assert.ok(invalidResult.errors.length > 0);
assert.throws(() => assertValidTaskContract(invalidContract), /Invalid task contract:/);
console.log("Task contract unit tests passed");

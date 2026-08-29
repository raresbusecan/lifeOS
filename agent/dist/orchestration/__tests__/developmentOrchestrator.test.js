import assert from "node:assert/strict";
import { DevelopmentOrchestrator, } from "../developmentOrchestrator.js";
import { TaskStore, } from "../../workflow/taskStore.js";
const store = new TaskStore();
store.add({
    id: "E2E-001",
    title: "Create E2E proof file",
    description: "Create src/e2e-proof.txt containing exactly ORGOS_E2E_OK.",
    status: "PROPOSED",
    department: "COUNCIL",
    attempts: 0,
    scope: {
        files: [
            "src/e2e-proof.txt",
        ],
        components: [],
        behavior: [
            "Create the proof file with exact content.",
        ],
        exclusions: [],
    },
    parentTaskId: null,
});
const orchestrator = new DevelopmentOrchestrator(store, {
    maxAgentSteps: 8,
});
const result = await orchestrator.run("E2E-001");
console.log("Development orchestration result:", JSON.stringify(result, null, 2));
assert.equal(result.task.id, "E2E-001");
assert.equal(result.agents.length, 5);
assert.deepEqual(result.agents.map((agent) => agent.role), [
    "PLANNER",
    "ANALYST",
    "ARCHITECT",
    "CODER",
    "TESTER",
]);
for (const agent of result.agents) {
    assert.ok(typeof agent.answer === "string", `${agent.role} must return an answer`);
    assert.ok(agent.answer.trim().length > 0, `${agent.role} answer must not be empty`);
}
assert.equal(result.task.status, "PROPOSED");
console.log("Development orchestrator Planner → Analyst → Architect → Coder → Tester test passed");

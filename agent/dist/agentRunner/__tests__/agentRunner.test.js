import assert from "node:assert/strict";
import { runAgent } from "../agentRunner.js";
const output = await runAgent({
    role: "CODER",
    input: [
        "This is a connectivity and output-contract check, not a real coding task.",
        "Respond with a JSON object matching the required output contract exactly.",
        'Set "status" to "READY", include one short string in "findings",',
        'leave "recommendations", "files" and "risks" as empty arrays,',
        'and set "confidence" to 1.',
    ].join(" "),
});
console.log("Agent output:", output);
assert.equal(typeof output.status, "string");
assert.ok([
    "READY",
    "NEEDS_CLARIFICATION",
    "BLOCKED",
    "FAILED",
].includes(output.status));
assert.ok(Array.isArray(output.findings));
assert.ok(Array.isArray(output.recommendations));
assert.ok(Array.isArray(output.files));
assert.ok(Array.isArray(output.risks));
assert.equal(typeof output.confidence, "number");
assert.ok(output.confidence >= 0 &&
    output.confidence <= 1);
console.log("Agent Runner live Ollama test passed");

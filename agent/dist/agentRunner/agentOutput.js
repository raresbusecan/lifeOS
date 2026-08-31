const VALID_STATUSES = [
    "READY",
    "NEEDS_CLARIFICATION",
    "BLOCKED",
    "FAILED",
];
function assertStringArray(value, fieldName) {
    if (!Array.isArray(value)) {
        throw new Error(`Agent output ${fieldName} must be an array.`);
    }
    for (const item of value) {
        if (typeof item !== "string") {
            throw new Error(`Agent output ${fieldName} must contain only strings.`);
        }
    }
}
function assertRiskArray(value) {
    if (!Array.isArray(value)) {
        throw new Error("Agent output risks must be an array.");
    }
}
export function assertValidAgentOutput(output) {
    if (!output || typeof output !== "object") {
        throw new Error("Agent output is required.");
    }
    if (typeof output.status !== "string" ||
        !VALID_STATUSES.includes(output.status)) {
        throw new Error(`Agent output status must be one of: ${VALID_STATUSES.join(", ")}.`);
    }
    if (typeof output.summary !== "string") {
        throw new Error("Agent output summary must be a string.");
    }
    assertStringArray(output.facts, "facts");
    assertStringArray(output.inferences, "inferences");
    assertStringArray(output.proposals, "proposals");
    assertRiskArray(output.risks);
    assertStringArray(output.artifacts, "artifacts");
    assertStringArray(output.evidence, "evidence");
    if (typeof output.nextAction !== "string" ||
        !output.nextAction.trim()) {
        throw new Error("Agent output nextAction must be a non-empty string.");
    }
    // Compatibility fields used by the current DCS runtime.
    assertStringArray(output.findings, "findings");
    assertStringArray(output.recommendations, "recommendations");
    assertStringArray(output.files, "files");
    if (typeof output.confidence !== "number" ||
        !Number.isFinite(output.confidence) ||
        output.confidence < 0 ||
        output.confidence > 1) {
        throw new Error("Agent output confidence must be a number between 0 and 1.");
    }
}

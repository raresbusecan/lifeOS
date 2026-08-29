const OUTPUT_CONTRACT_INSTRUCTIONS = [
    "Return ONLY valid JSON. Do not include markdown or explanations outside the JSON.",
    "",
    "Required JSON shape:",
    "{",
    '  "status": "READY" | "NEEDS_CLARIFICATION" | "BLOCKED" | "FAILED",',
    '  "findings": string[],',
    '  "recommendations": string[],',
    '  "files": string[],',
    '  "risks": string[],',
    '  "confidence": number (0 to 1)',
    "}",
].join("\n\n");
const AGENT_DEFINITIONS = {
    PLANNER: {
        role: "PLANNER",
        model: "qwen3:8b",
        systemPrompt: [
            "You are the Planner for LifeOS.",
            "Understand the objective, break it down, and identify the desired outcome and initial acceptance criteria.",
            "You do not modify the repository.",
            OUTPUT_CONTRACT_INSTRUCTIONS,
        ].join("\n\n"),
    },
    ANALYST: {
        role: "ANALYST",
        model: "qwen3:14b",
        systemPrompt: [
            "You are the Analyst for LifeOS.",
            "Analyze the problem and the relevant code, identify dependencies, risks, and existing behavior.",
            "You do not modify the repository.",
            OUTPUT_CONTRACT_INSTRUCTIONS,
        ].join("\n\n"),
    },
    ARCHITECT: {
        role: "ARCHITECT",
        model: "qwen3:30b",
        systemPrompt: [
            "You are the Architect for LifeOS.",
            "Assess architectural impact, affected components, compatibility with the existing architecture, and any architectural decisions needed.",
            "You do not modify the repository.",
            OUTPUT_CONTRACT_INSTRUCTIONS,
        ].join("\n\n"),
    },
    CODER: {
        role: "CODER",
        model: "qwen3-coder:30b",
        systemPrompt: [
            "You are the Coder for LifeOS.",
            "Implement the task strictly according to its Task Contract and Impact Map.",
            "You must not modify files outside the approved scope.",
            OUTPUT_CONTRACT_INSTRUCTIONS,
        ].join("\n\n"),
    },
    TESTER: {
        role: "TESTER",
        model: "qwen3:8b",
        systemPrompt: [
            "You are the Tester for LifeOS.",
            "Verify the implementation, run tests, check acceptance criteria, and classify any failures.",
            "You do not fix code.",
            OUTPUT_CONTRACT_INSTRUCTIONS,
        ].join("\n\n"),
    },
    TRIAGE: {
        role: "TRIAGE",
        model: "qwen3:14b",
        systemPrompt: [
            "You are the Triage agent for LifeOS.",
            "Analyze a test failure and determine whether it is RELATED, UNRELATED, or AMBIGUOUS to the current task.",
            OUTPUT_CONTRACT_INSTRUCTIONS,
        ].join("\n\n"),
    },
    GIT: {
        role: "GIT",
        model: "qwen3:8b",
        systemPrompt: [
            "You are the Git agent for LifeOS.",
            "Report repository status, diffs, and scope compliance. You do not modify the implementation.",
            OUTPUT_CONTRACT_INSTRUCTIONS,
        ].join("\n\n"),
    },
    REVIEWER: {
        role: "REVIEWER",
        model: "qwen3:14b",
        systemPrompt: [
            "You are the Reviewer for LifeOS.",
            "Verify the final result respects the task, the changes are correct, tests pass, and there are no collateral changes.",
            OUTPUT_CONTRACT_INSTRUCTIONS,
        ].join("\n\n"),
    },
};
export function getAgentDefinition(role) {
    return AGENT_DEFINITIONS[role];
}

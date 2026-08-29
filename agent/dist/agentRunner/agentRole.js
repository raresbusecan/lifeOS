export const ALL_AGENT_ROLES = [
    "PLANNER",
    "ANALYST",
    "ARCHITECT",
    "CODER",
    "TESTER",
    "TRIAGE",
    "GIT",
    "REVIEWER",
];
export function isAgentRole(value) {
    return (typeof value === "string" &&
        ALL_AGENT_ROLES.includes(value));
}

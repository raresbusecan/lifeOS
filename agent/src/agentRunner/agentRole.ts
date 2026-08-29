export type AgentRole =
  | "PLANNER"
  | "ANALYST"
  | "ARCHITECT"
  | "CODER"
  | "TESTER"
  | "TRIAGE"
  | "GIT"
  | "REVIEWER";

export const ALL_AGENT_ROLES: AgentRole[] = [
  "PLANNER",
  "ANALYST",
  "ARCHITECT",
  "CODER",
  "TESTER",
  "TRIAGE",
  "GIT",
  "REVIEWER",
];

export function isAgentRole(
  value: unknown,
): value is AgentRole {
  return (
    typeof value === "string" &&
    ALL_AGENT_ROLES.includes(
      value as AgentRole,
    )
  );
}
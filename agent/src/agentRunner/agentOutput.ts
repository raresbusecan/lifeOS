export type AgentOutputStatus =
  | "READY"
  | "NEEDS_CLARIFICATION"
  | "BLOCKED"
  | "FAILED";

export interface AgentOutput {
  status: AgentOutputStatus;
  findings: string[];
  recommendations: string[];
  files: string[];
  risks: string[];
  confidence: number;
}

const VALID_STATUSES: AgentOutputStatus[] = [
  "READY",
  "NEEDS_CLARIFICATION",
  "BLOCKED",
  "FAILED",
];

function assertStringArray(
  value: unknown,
  fieldName: string,
): asserts value is string[] {
  if (!Array.isArray(value)) {
    throw new Error(
      `Agent output ${fieldName} must be an array.`,
    );
  }

  for (const item of value) {
    if (typeof item !== "string") {
      throw new Error(
        `Agent output ${fieldName} must contain only strings.`,
      );
    }
  }
}

export function assertValidAgentOutput(
  output: AgentOutput,
): void {
  if (!output || typeof output !== "object") {
    throw new Error(
      "Agent output is required.",
    );
  }

  if (
    typeof output.status !== "string" ||
    !VALID_STATUSES.includes(output.status)
  ) {
    throw new Error(
      `Agent output status must be one of: ${VALID_STATUSES.join(", ")}.`,
    );
  }

  assertStringArray(output.findings, "findings");
  assertStringArray(output.recommendations, "recommendations");
  assertStringArray(output.files, "files");
  assertStringArray(output.risks, "risks");

  if (
    typeof output.confidence !== "number" ||
    !Number.isFinite(output.confidence) ||
    output.confidence < 0 ||
    output.confidence > 1
  ) {
    throw new Error(
      "Agent output confidence must be a number between 0 and 1.",
    );
  }
}

import {
  OllamaChatClient,
  type OllamaChatMessage,
} from "../llm/ollama.js";

import {
  getAgentDefinition,
} from "./agentDefinition.js";

import type {
  AgentRole,
} from "./agentRole.js";

import {
  assertValidAgentOutput,
  type AgentOutput,
  type AgentOutputStatus,
} from "./agentOutput.js";

const DEFAULT_AGENT_TIMEOUT_MS = 5 * 60 * 1000;

const DEFAULT_NEXT_ACTION =
  "Continue task execution.";

export interface RunAgentOptions {
  role: AgentRole;
  input: string;
  timeoutMs?: number;
}

/* -------------------------------------------------------------------------- */
/* Generic helpers                                                           */
/* -------------------------------------------------------------------------- */

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function getString(
  value: unknown,
): string | undefined {
  return typeof value === "string"
    ? value.trim()
    : undefined;
}

function asStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueStrings(
  values: string[],
): string[] {
  return [
    ...new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

function clampConfidence(
  value: unknown,
  fallback = 0.9,
): number {
  if (typeof value !== "number") {
    return fallback;
  }

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(
    1,
    Math.max(0, value),
  );
}

/* -------------------------------------------------------------------------- */
/* JSON / code-fence handling                                                 */
/* -------------------------------------------------------------------------- */

function stripCodeFence(
  content: string,
): string {
  return content
    .trim()
    .replace(
      /^```(?:json|text|yaml|yml)?\s*/i,
      "",
    )
    .replace(
      /\s*```$/i,
      "",
    )
    .trim();
}

/**
 * Extract the first complete JSON object from an Ollama response.
 *
 * This deliberately understands quoted strings and escaped quotes so that
 * braces inside JSON strings do not break extraction.
 */
function extractJsonObject(
  content: string,
): string {
  const start = content.indexOf("{");

  if (start === -1) {
    throw new Error(
      "Agent response does not contain a JSON object.",
    );
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (
    let index = start;
    index < content.length;
    index += 1
  ) {
    const character = content[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === "\\") {
        escaped = true;
        continue;
      }

      if (character === '"') {
        inString = false;
      }

      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return content.slice(
          start,
          index + 1,
        );
      }
    }
  }

  throw new Error(
    "Agent response contains an incomplete JSON object.",
  );
}

/* -------------------------------------------------------------------------- */
/* Structured-text fallback                                                  */
/* -------------------------------------------------------------------------- */

function parseScalar(
  value: string,
): string {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') &&
      trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") &&
      trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseListValue(
  lines: string[],
  startIndex: number,
): {
  value: string[];
  nextIndex: number;
} {
  const values: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];

    const match = line.match(
      /^\s*-\s+(.*)$/,
    );

    if (!match) {
      break;
    }

    values.push(
      parseScalar(match[1]),
    );

    index += 1;
  }

  return {
    value: values,
    nextIndex: index,
  };
}

function parseStructuredText(
  content: string,
): AgentOutput {
  const lines = stripCodeFence(content)
    .split(/\r?\n/);

  const scalarValues: Record<
    string,
    string
  > = {};

  const listValues: Record<
    string,
    string[]
  > = {};

  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (
      !line ||
      line === "{" ||
      line === "}"
    ) {
      index += 1;
      continue;
    }

    const match = line.match(
      /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/,
    );

    if (!match) {
      index += 1;
      continue;
    }

    const [, key, rawValue] = match;

    if (rawValue === "") {
      const parsed = parseListValue(
        lines,
        index + 1,
      );

      if (parsed.value.length > 0) {
        listValues[key] =
          parsed.value;

        index = parsed.nextIndex;
        continue;
      }
    }

    scalarValues[key] =
      parseScalar(rawValue);

    index += 1;
  }

  const rawStatus =
    scalarValues.status ??
    "READY";

  const status =
    normalizeStatus(rawStatus);

  const findings =
    listValues.findings ??
    listValues.evidence ??
    [];

  const proposals =
    listValues.proposals ??
    listValues.recommendations ??
    (
      scalarValues.nextAction
        ? [scalarValues.nextAction]
        : []
    );

  const files =
    listValues.files ??
    [];

  const risks =
    listValues.risks ??
    [];

  const facts =
    listValues.facts ??
    [];

  const inferences =
    listValues.inferences ??
    [];

  const evidence =
    listValues.evidence ??
    [];

  const artifacts =
    listValues.artifacts ??
    [];

  const nextAction =
    scalarValues.nextAction ??
    proposals[0] ??
    DEFAULT_NEXT_ACTION;

  const output: AgentOutput = {
    status,
    summary:
      scalarValues.summary ??
      nextAction,

    facts,
    inferences,
    proposals,
    risks,
    artifacts,
    evidence,
    nextAction,
    findings,
    recommendations:
      proposals.length > 0
        ? proposals
        : [nextAction],
    files,
    confidence: 0.5,
  };

  assertValidAgentOutput(output);

  return output;
}

/* -------------------------------------------------------------------------- */
/* DCS extraction                                                             */
/* -------------------------------------------------------------------------- */

function extractTaskSummary(
  value: unknown,
): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return (
    getString(value.title) ??
    getString(value.summary) ??
    getString(value.problem) ??
    getString(value.currentBehavior) ??
    getString(value.recommendation)
  );
}

function extractTaskEvidence(
  value: unknown,
): string[] {
  if (!isRecord(value)) {
    return [];
  }

  const evidence: string[] = [];

  for (
    const key of [
      "problem",
      "evidence",
      "currentBehavior",
      "proposedChange",
      "impact",
      "risk",
      "reversibility",
      "recommendation",
      "decision",
    ]
  ) {
    const rawValue =
      value[key];

    if (typeof rawValue === "string") {
      const text = rawValue.trim();

      if (text) {
        evidence.push(
          `${key}: ${text}`,
        );
      }

      continue;
    }

    if (isRecord(rawValue)) {
      for (
        const [
          nestedKey,
          nestedValue,
        ] of Object.entries(rawValue)
      ) {
        if (
          typeof nestedValue ===
          "string"
        ) {
          const text =
            nestedValue.trim();

          if (text) {
            evidence.push(
              `${key}.${nestedKey}: ${text}`,
            );
          }
        }
      }
    }
  }

  return uniqueStrings(evidence);
}

function extractCapabilityFindings(
  value: unknown,
): string[] {
  if (!isRecord(value)) {
    return [];
  }

  const findings: string[] = [];

  for (
    const [
      capability,
      rawCapability,
    ] of Object.entries(value)
  ) {
    /*
     * Compact form:
     *
     * "scanner": "IMPLEMENTED"
     */
    if (
      typeof rawCapability ===
      "string"
    ) {
      findings.push(
        `${capability}: ${rawCapability}`,
      );

      continue;
    }

    /*
     * Structured form:
     *
     * "scanner": {
     *   "status": "IMPLEMENTED",
     *   "reason": "..."
     * }
     */
    if (!isRecord(rawCapability)) {
      continue;
    }

    const status =
      getString(
        rawCapability.status,
      );

    const evidence =
      getString(
        rawCapability.evidence,
      ) ??
      getString(
        rawCapability.reason,
      ) ??
      getString(
        rawCapability.description,
      );

    if (status) {
      findings.push(
        `${capability}: ${status}${
          evidence
            ? ` — ${evidence}`
            : ""
        }`,
      );

      continue;
    }

    if (evidence) {
      findings.push(
        `${capability}: ${evidence}`,
      );
    }
  }

  return findings;
}

function extractAuditFindings(
  value: unknown,
): string[] {
  if (!isRecord(value)) {
    return [];
  }

  const findings: string[] = [];

  const orderedKeys = [
    "implemented",
    "partial",
    "oldOrUnused",
    "reusable",
    "mustChange",
    "missing",
    "unknown",

    // Legacy / descriptive DCS names
    "whatActuallyWorks",
    "whatIsPartial",
    "whatIsOldOrUnused",
    "whatIsReusable",
    "whatMustChange",
    "whatIsMissing",
    "whatIsUnknown",
  ];

  for (const key of orderedKeys) {
    const rawValue = value[key];

    if (typeof rawValue === "string") {
      findings.push(
        `${key}: ${rawValue}`,
      );
      continue;
    }

    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (typeof item === "string") {
          const trimmed = item.trim();

          if (trimmed) {
            findings.push(
              `${key}: ${trimmed}`,
            );
          }
        }
      }
    }
  }

  // Preserve additional useful string-valued fields.
  for (const [key, rawValue] of Object.entries(value)) {
    if (
      orderedKeys.includes(key) ||
      key === "nextAction"
    ) {
      continue;
    }

    if (typeof rawValue === "string") {
      const trimmed = rawValue.trim();

      if (trimmed) {
        findings.push(
          `${key}: ${trimmed}`,
        );
      }
    }
  }

  return findings;
}

/* -------------------------------------------------------------------------- */
/* nextAction extraction                                                      */
/* -------------------------------------------------------------------------- */

function extractNextAction(
  value: unknown,
): string {
  if (
    typeof value ===
    "string"
  ) {
    const result = value.trim();

    return result ||
      DEFAULT_NEXT_ACTION;
  }

  if (!isRecord(value)) {
    return DEFAULT_NEXT_ACTION;
  }

  /*
   * Preferred DCS representation.
   */
  for (
    const key of [
      "description",
      "action",
      "output",
      "title",
      "task",
      "id",
    ]
  ) {
    const candidate =
      getString(value[key]);

    if (candidate) {
      return candidate;
    }
  }

  return DEFAULT_NEXT_ACTION;
}

function extractDcsNextAction(
  value: Record<
    string,
    unknown
  >,
): string {
  const direct =
    extractNextAction(
      value.nextAction,
    );

  if (
    direct !==
    DEFAULT_NEXT_ACTION
  ) {
    return direct;
  }

  const locations = [
    value.auditSummary,
    value.findings,
    value.task,
  ];

  for (
    const location of locations
  ) {
    if (
      !isRecord(location)
    ) {
      continue;
    }

    const nested =
      extractNextAction(
        location.nextAction,
      );

    if (
      nested !==
      DEFAULT_NEXT_ACTION
    ) {
      return nested;
    }
  }

  /*
   * DCS analyst responses commonly use
   * `nextStep` instead of `nextAction`.
   */
  const nextStep =
    value.nextStep;

  if (isRecord(nextStep)) {
    for (
      const [
        key,
        rawValue,
      ] of Object.entries(nextStep)
    ) {
      if (
        typeof rawValue ===
        "string"
      ) {
        const text =
          rawValue.trim();

        if (text) {
          return `${key}: ${text}`;
        }
      }
    }
  }

  if (
    typeof nextStep ===
    "string"
  ) {
    const text =
      nextStep.trim();

    if (text) {
      return text;
    }
  }

  /*
   * Analyst output may expose the next step
   * through currentImplementation or capability.
   */
  const implementation =
    value.currentImplementation;

  if (isRecord(implementation)) {
    const entries =
      Object.entries(
        implementation,
      );

    const firstUnimplemented =
      entries.find(
        ([, rawValue]) =>
          typeof rawValue ===
            "string" &&
          /not implemented/i.test(
            rawValue,
          ),
      );

    if (firstUnimplemented) {
      return `Implement ${firstUnimplemented[0]}.`;
    }
  }

  return DEFAULT_NEXT_ACTION;
}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

function normalizeStatus(
  value: unknown,
): AgentOutputStatus {
  const status =
    typeof value === "string"
      ? value
          .trim()
          .toUpperCase()
      : "READY";

  switch (status) {
    case "NEEDS_CLARIFICATION":
      return "NEEDS_CLARIFICATION";

    case "BLOCKED":
      return "BLOCKED";

    case "FAILED":
      return "FAILED";

    case "ACTIVE":
    case "COMPLETE":
    case "COMPLETED":
    case "READY":
    default:
      return "READY";
  }
}

/* -------------------------------------------------------------------------- */
/* DCS normalization                                                          */
/* -------------------------------------------------------------------------- */


function normalizeDcsOutput(
  value: Record<string, unknown>,
): AgentOutput {
  const task = isRecord(value.task)
    ? value.task
    : undefined;

  const capabilities = value.capabilities;
  const findingsValue = value.findings;
  const auditSummary = value.auditSummary;

  // DCS models have returned several task shapes:
  // - task.title
  // - task.problem
  // - task.summary
  // - top-level summary/title/problem
  const taskSummary =
    extractTaskSummary(task) ??
    getString(task?.title) ??
    getString(task?.summary) ??
    getString(task?.problem) ??
    getString(value.summary) ??
    getString(value.title) ??
    getString(value.problem);

  const taskEvidence =
    extractTaskEvidence(task);

  const capabilityFindings =
    extractCapabilityFindings(
      capabilities,
    );

  const rawFindings =
    asStringArray(findingsValue);

  const structuredFindings =
    isRecord(findingsValue)
      ? extractAuditFindings(
          findingsValue,
        )
      : [];

  const auditSummaryFindings =
    extractAuditFindings(
      auditSummary,
    );

  const findings =
    uniqueStrings([
      ...capabilityFindings,
      ...structuredFindings,
      ...auditSummaryFindings,
      ...rawFindings,
    ]);

  const explicitFacts =
    asStringArray(value.facts);

  const explicitInferences =
    asStringArray(value.inferences);

  const explicitProposals =
    asStringArray(value.proposals);

  const explicitRecommendations =
    asStringArray(value.recommendations);

  const explicitRisks =
    asStringArray(value.risks);

  const explicitEvidence =
    asStringArray(value.evidence);

  const explicitArtifacts =
    asStringArray(value.artifacts);

  const explicitFiles =
    asStringArray(value.files);

  const nextAction =
    extractDcsNextAction(value);

  const facts =
    uniqueStrings([
      ...explicitFacts,
      ...capabilityFindings,
    ]);

  const evidence =
    explicitEvidence.length > 0
      ? uniqueStrings(explicitEvidence)
      : uniqueStrings([
          ...taskEvidence,
          ...findings,
        ]);

  const proposals =
    explicitProposals.length > 0
      ? explicitProposals
      : explicitRecommendations.length > 0
        ? explicitRecommendations
        : nextAction !== DEFAULT_NEXT_ACTION
          ? [nextAction]
          : [];

  const recommendations =
    explicitRecommendations.length > 0
      ? explicitRecommendations
      : proposals.length > 0
        ? proposals
        : nextAction !== DEFAULT_NEXT_ACTION
          ? [nextAction]
          : [];

  const artifacts =
    uniqueStrings(explicitArtifacts);

  const files =
    uniqueStrings(explicitFiles);

  const summary =
    getString(value.summary) ??
    taskSummary ??
    getString(value.recommendation) ??
    getString(task?.recommendation) ??
    (
      findings.length > 0
        ? findings.join(" ")
        : nextAction
    );

  const output: AgentOutput = {
    status:
      normalizeStatus(value.status),

    summary,

    facts,

    inferences:
      explicitInferences,

    proposals,

    risks:
      uniqueStrings(explicitRisks),

    artifacts,

    evidence,

    nextAction,

    findings,

    recommendations,

    files,

    confidence:
      clampConfidence(
        value.confidence,
        0.9,
      ),
  };

  assertValidAgentOutput(output);

  return output;
}


/* -------------------------------------------------------------------------- */
/* Canonical AgentOutput                                                      */
/* -------------------------------------------------------------------------- */

function normalizeCanonicalOutput(
  value: Record<
    string,
    unknown
  >,
): AgentOutput {
  const facts =
    asStringArray(
      value.facts,
    );

  const inferences =
    asStringArray(
      value.inferences,
    );

  const proposals =
    asStringArray(
      value.proposals,
    );

  const risks =
    asStringArray(
      value.risks,
    );

  const artifacts =
    asStringArray(
      value.artifacts,
    );

  const evidence =
    asStringArray(
      value.evidence,
    );

  const findings =
    asStringArray(
      value.findings,
    );

  const recommendations =
    asStringArray(
      value.recommendations,
    );

  const files =
    asStringArray(
      value.files,
    );

  const nextAction =
    getString(
      value.nextAction,
    ) ??
    recommendations[0] ??
    proposals[0] ??
    DEFAULT_NEXT_ACTION;

  const output: AgentOutput = {
    status:
      normalizeStatus(
        value.status,
      ),

    summary:
      getString(value.summary) ??
      nextAction,

    facts,

    inferences,

    proposals,

    risks,

    artifacts,

    evidence,

    nextAction,

    findings:
      findings.length > 0
        ? findings
        : facts,

    recommendations:
      recommendations.length > 0
        ? recommendations
        : proposals.length > 0
          ? proposals
          : [nextAction],

    files,

    confidence:
      clampConfidence(
        value.confidence,
        1,
      ),
  };

  assertValidAgentOutput(
    output,
  );

  return output;
}

/* -------------------------------------------------------------------------- */
/* Legacy output                                                              */
/* -------------------------------------------------------------------------- */

function normalizeLegacyOutput(
  value: Record<
    string,
    unknown
  >,
): AgentOutput {
  const findings =
    asStringArray(
      value.findings,
    );

  const recommendations =
    asStringArray(
      value.recommendations,
    );

  const files =
    asStringArray(
      value.files,
    );

  const risks =
    asStringArray(
      value.risks,
    );

  const nextAction =
    recommendations[0] ??
    DEFAULT_NEXT_ACTION;

  const output: AgentOutput = {
    status:
      normalizeStatus(
        value.status,
      ),

    summary:
      getString(
        value.summary,
      ) ??
      findings.join(" ") ??
      nextAction,

    facts:
      findings,

    inferences:
      [],

    proposals:
      recommendations,

    risks,

    artifacts:
      files,

    evidence:
      [],

    nextAction,

    findings,

    recommendations,

    files,

    confidence:
      clampConfidence(
        value.confidence,
        0.5,
      ),
  };

  assertValidAgentOutput(
    output,
  );

  return output;
}

/* -------------------------------------------------------------------------- */
/* Main normalization                                                         */
/* -------------------------------------------------------------------------- */

function normalizeAgentOutput(
  parsed: unknown,
): AgentOutput {
  if (!isRecord(parsed)) {
    throw new Error(
      "Agent response must be a JSON object.",
    );
  }

  const value = parsed;

  /*
   * DCS-native response.
   *
   * Do this BEFORE canonical/legacy detection because
   * DCS responses may contain only task/capabilities/
   * findings/nextAction.
   */
  const hasDcsShape =
  value.task !== undefined ||
  value.capabilities !== undefined ||
  value.capability !== undefined ||
  value.auditSummary !== undefined ||
  value.currentImplementation !== undefined ||
  value.nextStep !== undefined ||
  (
    value.nextAction !== undefined &&
    !(
      typeof value.summary === "string" &&
      Array.isArray(value.facts) &&
      Array.isArray(value.inferences) &&
      Array.isArray(value.proposals)
    )
  );

if (hasDcsShape) {
  return normalizeDcsOutput(
    value,
  );
}

  /*
   * Canonical AgentOutput.
   */
  const hasCanonicalShape =
    typeof value.summary ===
      "string" &&
    Array.isArray(
      value.facts,
    ) &&
    Array.isArray(
      value.inferences,
    ) &&
    Array.isArray(
      value.proposals,
    ) &&
    Array.isArray(
      value.artifacts,
    ) &&
    Array.isArray(
      value.evidence,
    );

  if (hasCanonicalShape) {
    return normalizeCanonicalOutput(
      value,
    );
  }

  /*
   * Legacy compact contract.
   */
  const hasLegacyShape =
    typeof value.status ===
      "string" &&
    Array.isArray(
      value.findings,
    ) &&
    Array.isArray(
      value.recommendations,
    ) &&
    Array.isArray(
      value.files,
    ) &&
    Array.isArray(
      value.risks,
    );

  if (hasLegacyShape) {
    return normalizeLegacyOutput(
      value,
    );
  }

  throw new Error(
    "Agent response does not match the DCS agent-result contract.",
  );
}

/* -------------------------------------------------------------------------- */
/* Parser                                                                     */
/* -------------------------------------------------------------------------- */

function parseAgentOutput(
  content: string,
): AgentOutput {
  const cleaned =
    stripCodeFence(content);

  /*
   * First attempt: response is pure JSON.
   */
  try {
    const parsed =
      JSON.parse(cleaned);

    return normalizeAgentOutput(
      parsed,
    );
  } catch {
    /*
     * Second attempt: JSON embedded in prose/code.
     */
    try {
      const extracted =
        extractJsonObject(
          cleaned,
        );

      const parsed =
        JSON.parse(extracted);

      return normalizeAgentOutput(
        parsed,
      );
    } catch {
      /*
       * Last resort: structured text parser.
       */
      return parseStructuredText(
        content,
      );
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Agent execution                                                            */
/* -------------------------------------------------------------------------- */

export async function runAgent(
  options: RunAgentOptions,
): Promise<AgentOutput> {
  const definition =
    getAgentDefinition(
      options.role,
    );

  if (!definition.model) {
    throw new Error(
      `No model configured for agent role ${options.role}.`,
    );
  }

  const trimmedInput =
    options.input.trim();

  if (!trimmedInput) {
    throw new Error(
      "Cannot run an agent with empty input.",
    );
  }

  const client =
    new OllamaChatClient({
      model:
        definition.model,

      timeoutMs:
        options.timeoutMs ??
        DEFAULT_AGENT_TIMEOUT_MS,
    });

  const messages:
    OllamaChatMessage[] = [
      {
        role: "system",
        content:
          definition.systemPrompt,
      },
      {
        role: "user",
        content:
          trimmedInput,
      },
    ];

  const response =
    await client.chat(
      messages,
    );

  console.log(
    `[${options.role}] RAW OLLAMA RESPONSE:`,
    response,
  );

  return parseAgentOutput(
    response,
  );
}


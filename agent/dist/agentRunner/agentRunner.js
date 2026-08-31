import { OllamaChatClient, } from "../llm/ollama.js";
import { getAgentDefinition, } from "./agentDefinition.js";
import { assertValidAgentOutput, } from "./agentOutput.js";
const DEFAULT_AGENT_TIMEOUT_MS = 5 * 60 * 1000;
/**
 * Removes markdown code fences without assuming the response
 * is necessarily valid JSON.
 */
function stripCodeFence(content) {
    return content
        .trim()
        .replace(/^```(?:json|text|yaml|yml)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
}
/**
 * Extracts the first complete JSON object from arbitrary text.
 *
 * Handles:
 * - nested objects
 * - arrays
 * - strings containing braces
 * - escaped quotes
 */
function extractJsonObject(content) {
    const start = content.indexOf("{");
    if (start === -1) {
        throw new Error("Agent response does not contain a JSON object.");
    }
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < content.length; index += 1) {
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
                return content.slice(start, index + 1);
            }
        }
    }
    throw new Error("Agent response contains an incomplete JSON object.");
}
function parseScalar(value) {
    const trimmed = value.trim();
    if (trimmed.length >= 2 &&
        ((trimmed.startsWith('"') &&
            trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") &&
                trimmed.endsWith("'")))) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}
function parseListValue(lines, startIndex) {
    const result = [];
    let index = startIndex;
    while (index < lines.length) {
        const raw = lines[index];
        if (!raw) {
            index += 1;
            continue;
        }
        const trimmed = raw.trim();
        if (!trimmed) {
            index += 1;
            continue;
        }
        if (!trimmed.startsWith("-")) {
            break;
        }
        const item = trimmed
            .replace(/^-\s*/, "")
            .trim();
        if (item) {
            result.push(parseScalar(item));
        }
        index += 1;
    }
    return {
        value: result,
        nextIndex: index,
    };
}
/**
 * Normalizes both the current DCS contract and the old compact
 * agent contract into AgentOutput.
 */
function normalizeAgentOutput(parsed) {
    if (!parsed ||
        typeof parsed !== "object") {
        throw new Error("Agent response must be a JSON object.");
    }
    const value = parsed;
    /*
     * Canonical DCS output.
     */
    if (typeof value.summary === "string" &&
        Array.isArray(value.facts) &&
        Array.isArray(value.inferences) &&
        Array.isArray(value.proposals) &&
        Array.isArray(value.artifacts) &&
        Array.isArray(value.evidence) &&
        typeof value.nextAction === "string") {
        const facts = value.facts;
        const proposals = value.proposals;
        const artifacts = value.artifacts;
        const risks = Array.isArray(value.risks)
            ? value.risks
            : [];
        const recommendations = proposals.length > 0
            ? proposals
            : [value.nextAction];
        return {
            status: typeof value.status === "string"
                ? value.status
                : "READY",
            summary: value.summary,
            facts,
            inferences: value.inferences,
            proposals,
            risks,
            artifacts,
            evidence: value.evidence,
            nextAction: value.nextAction,
            findings: facts,
            recommendations,
            files: artifacts,
            confidence: typeof value.confidence === "number"
                ? value.confidence
                : 1,
        };
    }
    /*
     * Legacy compact output.
     */
    if (typeof value.status === "string" &&
        Array.isArray(value.findings) &&
        Array.isArray(value.recommendations) &&
        Array.isArray(value.files) &&
        Array.isArray(value.risks) &&
        typeof value.confidence === "number") {
        const findings = value.findings;
        const recommendations = value.recommendations;
        const files = value.files;
        return {
            status: value.status,
            summary: findings.join(" "),
            facts: findings,
            inferences: [],
            proposals: recommendations,
            risks: value.risks,
            artifacts: files,
            evidence: [],
            nextAction: recommendations[0] ??
                "Continue task execution.",
            findings,
            recommendations,
            files,
            confidence: value.confidence,
        };
    }
    /*
     * DCS audit/document response.
     *
     * Example:
     *
     * {
     *   "id": "DCS-001",
     *   "task": {
     *     "title": "...",
     *     "problem": "...",
     *     "evidence": {...},
     *     "currentBehavior": {...},
     *     "proposedChange": {...},
     *     "recommendation": {...},
     *     "decision": {...}
     *   },
     *   "nextAction": "..."
     * }
     */
    if (value.task &&
        typeof value.task === "object") {
        const task = value.task;
        const nextAction = typeof value.nextAction === "string"
            ? value.nextAction
            : typeof task.nextAction === "string"
                ? task.nextAction
                : "Continue task execution.";
        const summary = typeof task.title === "string"
            ? task.title
            : typeof task.proposedChange === "string"
                ? task.proposedChange
                : typeof task.recommendation === "string"
                    ? task.recommendation
                    : "DCS task audit completed.";
        const facts = [];
        const evidence = [];
        const artifacts = [];
        const risks = [];
        /*
         * Problem.
         */
        if (typeof task.problem === "string") {
            facts.push(`Problem: ${task.problem}`);
        }
        /*
         * Evidence may be either:
         *
         * string
         *
         * or:
         *
         * {
         *   scanner: "...",
         *   hashing: "..."
         * }
         */
        if (typeof task.evidence === "string") {
            evidence.push(task.evidence);
        }
        else if (task.evidence &&
            typeof task.evidence === "object") {
            const taskEvidence = task.evidence;
            for (const [capability, value] of Object.entries(taskEvidence)) {
                evidence.push(`${capability}: ${String(value)}`);
            }
        }
        /*
         * Current behavior is the most important
         * part of DCS-001.
         */
        if (task.currentBehavior &&
            typeof task.currentBehavior === "object") {
            const currentBehavior = task.currentBehavior;
            for (const [capability, classification] of Object.entries(currentBehavior)) {
                facts.push(`${capability}: ${String(classification)}`);
            }
        }
        /*
         * Proposed change.
         */
        if (typeof task.proposedChange === "string") {
            facts.push(`Proposed change: ${task.proposedChange}`);
        }
        else if (task.proposedChange &&
            typeof task.proposedChange === "object") {
            const proposedChange = task.proposedChange;
            for (const [capability, change] of Object.entries(proposedChange)) {
                facts.push(`Proposed change — ${capability}: ${String(change)}`);
            }
        }
        /*
         * Recommendation.
         */
        if (typeof task.recommendation === "string") {
            facts.push(`Recommendation: ${task.recommendation}`);
        }
        else if (task.recommendation &&
            typeof task.recommendation === "object") {
            const recommendation = task.recommendation;
            for (const [capability, recommendationValue] of Object.entries(recommendation)) {
                facts.push(`Recommendation — ${capability}: ${String(recommendationValue)}`);
            }
        }
        /*
         * Risk.
         */
        if (typeof task.risk === "string") {
            risks.push(task.risk);
        }
        else if (task.risk &&
            typeof task.risk === "object") {
            const risk = task.risk;
            for (const [capability, riskValue] of Object.entries(risk)) {
                risks.push(`${capability}: ${String(riskValue)}`);
            }
        }
        /*
         * Decision.
         */
        if (typeof task.decision === "string") {
            facts.push(`Decision: ${task.decision}`);
        }
        else if (task.decision &&
            typeof task.decision === "object") {
            const decision = task.decision;
            for (const [capability, decisionValue] of Object.entries(decision)) {
                facts.push(`Decision — ${capability}: ${String(decisionValue)}`);
            }
        }
        /*
         * Alternatives.
         */
        if (task.alternatives &&
            typeof task.alternatives === "object") {
            const alternatives = task.alternatives;
            for (const [capability, alternative] of Object.entries(alternatives)) {
                facts.push(`Alternative — ${capability}: ${String(alternative)}`);
            }
        }
        /*
         * Impact.
         */
        if (task.impact &&
            typeof task.impact === "object") {
            const impact = task.impact;
            for (const [capability, impactValue] of Object.entries(impact)) {
                facts.push(`Impact — ${capability}: ${String(impactValue)}`);
            }
        }
        /*
         * Reversibility.
         */
        if (task.reversibility &&
            typeof task.reversibility === "object") {
            const reversibility = task.reversibility;
            for (const [capability, reversibilityValue] of Object.entries(reversibility)) {
                facts.push(`Reversibility — ${capability}: ${String(reversibilityValue)}`);
            }
        }
        /*
         * Artifacts from task response.
         */
        if (Array.isArray(task.artifacts)) {
            artifacts.push(...task.artifacts);
        }
        const recommendations = [nextAction];
        return {
            status: "READY",
            summary,
            facts,
            inferences: [],
            proposals: recommendations,
            risks,
            artifacts,
            evidence,
            nextAction,
            findings: facts,
            recommendations,
            files: artifacts,
            confidence: typeof value.confidence === "number"
                ? value.confidence
                : 0.9,
        };
    }
    throw new Error("Agent response does not match the DCS agent-result contract.");
}
function parseStructuredText(content) {
    const lines = content
        .replace(/^```(?:text|yaml|yml)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .split(/\r?\n/);
    const scalarValues = {};
    const listValues = {};
    let index = 0;
    while (index < lines.length) {
        const line = lines[index].trim();
        if (!line ||
            line === "{" ||
            line === "}") {
            index += 1;
            continue;
        }
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
        if (!match) {
            index += 1;
            continue;
        }
        const [, key, rawValue] = match;
        if (rawValue === "") {
            const parsed = parseListValue(lines, index + 1);
            if (parsed.value.length > 0) {
                listValues[key] =
                    parsed.value;
                index =
                    parsed.nextIndex;
                continue;
            }
        }
        scalarValues[key] =
            parseScalar(rawValue);
        index += 1;
    }
    const statusMap = {
        READY: "READY",
        ACTIVE: "READY",
        COMPLETE: "READY",
        COMPLETED: "READY",
        NEEDS_CLARIFICATION: "NEEDS_CLARIFICATION",
        BLOCKED: "BLOCKED",
        FAILED: "FAILED",
    };
    const rawStatus = scalarValues.status ??
        "FAILED";
    const status = statusMap[rawStatus] ??
        "FAILED";
    const summary = scalarValues.summary ??
        scalarValues.nextAction ??
        "Agent returned structured text instead of JSON.";
    const findings = listValues.findings ??
        listValues.evidence ??
        [];
    const recommendations = listValues.recommendations ??
        listValues.proposals ??
        (scalarValues.nextAction
            ? [scalarValues.nextAction]
            : []);
    const files = listValues.files ??
        listValues.artifacts ??
        [];
    const risks = listValues.risks ??
        [];
    const facts = listValues.facts ??
        [];
    const inferences = listValues.inferences ??
        [];
    const proposals = listValues.proposals ??
        [];
    const evidence = listValues.evidence ??
        [];
    const artifacts = listValues.artifacts ??
        [];
    const nextAction = scalarValues.nextAction ??
        recommendations[0] ??
        "Continue task execution.";
    return {
        status,
        summary,
        facts,
        inferences,
        proposals,
        evidence,
        artifacts,
        nextAction,
        findings,
        recommendations,
        files,
        risks,
        confidence: 0.5,
    };
}
/**
 * Parses all known Ollama response formats.
 */
function parseAgentOutput(content) {
    const original = content.trim();
    if (!original) {
        throw new Error("Agent returned an empty response.");
    }
    /*
     * Attempt 1:
     * Strip markdown fence and parse directly.
     */
    const cleaned = stripCodeFence(original);
    try {
        const parsed = JSON.parse(cleaned);
        const normalized = normalizeAgentOutput(parsed);
        assertValidAgentOutput(normalized);
        return normalized;
    }
    catch {
        // Continue with extraction.
    }
    /*
     * Attempt 2:
     * Extract JSON object from arbitrary surrounding text.
     *
     * This is important for responses such as:
     *
     * ```json
     * { ... }
     * ```
     */
    try {
        const extracted = extractJsonObject(original);
        const parsed = JSON.parse(extracted);
        const normalized = normalizeAgentOutput(parsed);
        assertValidAgentOutput(normalized);
        return normalized;
    }
    catch {
        // Continue with structured text.
    }
    /*
     * Attempt 3:
     * Structured text / YAML-like fallback.
     */
    try {
        const structured = parseStructuredText(original);
        assertValidAgentOutput(structured);
        return structured;
    }
    catch (error) {
        throw new Error(`Unable to parse agent response. ${error instanceof Error
            ? error.message
            : String(error)}`);
    }
}
export async function runAgent(options) {
    const definition = getAgentDefinition(options.role);
    if (!definition.model) {
        throw new Error(`No model configured for agent role ${options.role}.`);
    }
    const trimmedInput = options.input.trim();
    if (!trimmedInput) {
        throw new Error("Cannot run an agent with empty input.");
    }
    const client = new OllamaChatClient({
        model: definition.model,
        timeoutMs: options.timeoutMs ??
            DEFAULT_AGENT_TIMEOUT_MS,
    });
    const messages = [
        {
            role: "system",
            content: definition.systemPrompt,
        },
        {
            role: "user",
            content: trimmedInput,
        },
    ];
    const response = await client.chat(messages);
    console.log(`[${options.role}] RAW OLLAMA RESPONSE:`, response);
    return parseAgentOutput(response);
}

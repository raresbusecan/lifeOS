import {
  OllamaChatClient,
  type OllamaChatMessage,
} from "../llm/ollama.js";

import {
  getAgentDefinition,
} from "./agentDefinition.js";

import type { AgentRole } from "./agentRole.js";

import {
  assertValidAgentOutput,
  type AgentOutput,
} from "./agentOutput.js";

const DEFAULT_AGENT_TIMEOUT_MS = 5 * 60 * 1000;

export interface RunAgentOptions {
  role: AgentRole;
  input: string;
  timeoutMs?: number;
}

function stripCodeFence(
  content: string,
): string {
  return content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseAgentOutput(
  content: string,
): AgentOutput {
  const cleaned =
    stripCodeFence(content);

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new Error(
      `Agent returned invalid JSON: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );
  }

  const output =
    parsed as AgentOutput;

  assertValidAgentOutput(output);

  return output;
}

export async function runAgent(
  options: RunAgentOptions,
): Promise<AgentOutput> {
  const definition =
    getAgentDefinition(options.role);

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

    const client = new OllamaChatClient({
    model: definition.model,
    timeoutMs: options.timeoutMs ?? DEFAULT_AGENT_TIMEOUT_MS,
  });

  const messages: OllamaChatMessage[] = [
    {
      role: "system",
      content: definition.systemPrompt,
    },
    {
      role: "user",
      content: trimmedInput,
    },
  ];

  const response =
    await client.chat(messages);

  return parseAgentOutput(response);
}
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

function parseAgentOutput(
  content: string,
): AgentOutput {
  const cleaned = stripCodeFence(content);

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const extracted =
      extractJsonObject(cleaned);

    try {
      parsed = JSON.parse(extracted);
    } catch (error) {
      throw new Error(
        `Agent returned invalid JSON: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }

  const output = parsed as AgentOutput;

  assertValidAgentOutput(output);

  return output;
}

export async function runAgent(
  options: RunAgentOptions,
): Promise<AgentOutput> {
  const definition = getAgentDefinition(
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

  /*
   * Local-only execution.
   *
   * The model is selected by AgentDefinition.
   * runAgent awaits the complete response before returning,
   * therefore agents invoked sequentially by the workflow
   * never run concurrently through this function.
   */
  const client = new OllamaChatClient({
    model: definition.model,
    timeoutMs:
      options.timeoutMs ??
      DEFAULT_AGENT_TIMEOUT_MS,
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

console.log(
  `[${options.role}] RAW OLLAMA RESPONSE:`,
  response,
);

return parseAgentOutput(response);
}
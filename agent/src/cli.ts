import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  runAgentLoop,
} from "./agent/loop.js";

import type {
  OllamaChatMessage,
} from "./llm/ollama.js";

export interface AgentCliOptions {
  repositoryRoot: string;
  chatModel?: string;
}

export async function startAgentCli(
  options: AgentCliOptions,
): Promise<void> {
  const readline =
    createInterface({
      input,
      output,
      terminal: true,
    });

  const messages: OllamaChatMessage[] = [];

  console.log("");
  console.log("LifeOS Agent — Interactive Mode");
  console.log("Type your question and press Enter.");
  console.log("Type 'exit' or 'quit' to stop.");
  console.log("");

  try {
    while (true) {
      const inputText =
        await readline.question("You: ");

      const text =
        inputText.trim();

      if (!text) {
        continue;
      }

      if (
        text.toLowerCase() === "exit" ||
        text.toLowerCase() === "quit"
      ) {
        console.log("");
        console.log("Goodbye.");
        break;
      }

      messages.push({
        role: "user",
        content: text,
      });

      try {
        const result =
          await runAgentLoop(
            options.repositoryRoot,
            messages,
            {
              chatModel:
                options.chatModel,
            },
          );

        messages.push({
          role: "assistant",
          content: result.answer,
        });

        console.log("");
        console.log("Agent:");
        console.log(result.answer);
        console.log("");
      } catch (error) {
        messages.pop();

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        console.error("");
        console.error(
          `Agent error: ${message}`,
        );
        console.error("");
      }
    }
  } finally {
    readline.close();
  }
}
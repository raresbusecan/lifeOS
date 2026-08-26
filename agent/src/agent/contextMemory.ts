import type {
  Conversation,
  ConversationMessage,
} from "./memory.js";

export interface ConversationContextOptions {
  maxMessages?: number;
  maxCharacters?: number;
}

export interface ConversationContext {
  messages: ConversationMessage[];
  truncated: boolean;
  characterCount: number;
}

const DEFAULT_MAX_MESSAGES = 12;
const DEFAULT_MAX_CHARACTERS = 12000;

export function buildConversationContext(
  conversation: Conversation,
  options: ConversationContextOptions = {},
): ConversationContext {
  const maxMessages =
    options.maxMessages ??
    DEFAULT_MAX_MESSAGES;

  const maxCharacters =
    options.maxCharacters ??
    DEFAULT_MAX_CHARACTERS;

  const allMessages =
    conversation.messages;

  const selected: ConversationMessage[] = [];

  let characterCount = 0;

  for (
    let index = allMessages.length - 1;
    index >= 0;
    index--
  ) {
    const message = allMessages[index];

    if (!message) {
      continue;
    }

    const messageCharacters =
      message.content.length;

    if (
      selected.length >= maxMessages
    ) {
      break;
    }

    if (
      selected.length > 0 &&
      characterCount + messageCharacters >
        maxCharacters
    ) {
      break;
    }

    selected.push(message);
    characterCount += messageCharacters;
  }

  selected.reverse();

  return {
    messages: selected,
    truncated:
      selected.length <
      allMessages.length,
    characterCount,
  };
}

export function formatConversationContext(
  context: ConversationContext,
): string {
  if (context.messages.length === 0) {
    return "No previous conversation context.";
  }

  const lines = [
    "Previous conversation:",
    "",
  ];

  for (const message of context.messages) {
    lines.push(
      `${message.role.toUpperCase()}:`,
      message.content,
      "",
    );
  }

  if (context.truncated) {
    lines.push(
      "[Earlier conversation omitted because the context limit was reached.]",
      "",
    );
  }

  return lines.join("\n");
}

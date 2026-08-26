import assert from "node:assert/strict";

import type {
  Conversation,
} from "../memory.js";

import {
  buildConversationContext,
  formatConversationContext,
} from "../contextMemory.js";

const conversation: Conversation = {
  version: 1,
  id: "test",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: Array.from(
    { length: 20 },
    (_, index) => ({
      role:
        index % 2 === 0
          ? "user" as const
          : "assistant" as const,
      content:
        `Message ${index + 1}`,
      createdAt:
        new Date().toISOString(),
    }),
  ),
};

const context =
  buildConversationContext(
    conversation,
    {
      maxMessages: 6,
      maxCharacters: 1000,
    },
  );

assert.equal(
  context.messages.length,
  6,
);

assert.equal(
  context.messages[0]?.content,
  "Message 15",
);

assert.equal(
  context.messages[5]?.content,
  "Message 20",
);

assert.equal(
  context.truncated,
  true,
);

assert.ok(
  context.characterCount > 0,
);

const formatted =
  formatConversationContext(
    context,
  );

assert.ok(
  formatted.includes(
    "Message 15",
  ),
);

assert.ok(
  formatted.includes(
    "Message 20",
  ),
);

assert.ok(
  formatted.includes(
    "Earlier conversation omitted",
  ),
);

console.log(
  "Context memory test passed",
);

console.log(
  `Messages selected: ${context.messages.length}`,
);

console.log(
  `Characters: ${context.characterCount}`,
);

console.log(
  `Truncated: ${context.truncated}`,
);

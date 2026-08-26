import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import {
  indexSemantic,
} from "../../indexer/semanticIndex.js";

import {
  queryAgent,
} from "../query.js";

import {
  loadConversation,
} from "../memory.js";

const repositoryRoot = await mkdtemp(
  resolve(
    tmpdir(),
    "lifeos-query-memory-test-",
  ),
);

try {
  await mkdir(
    resolve(repositoryRoot, "src"),
    {
      recursive: true,
    },
  );

  await writeFile(
    resolve(
      repositoryRoot,
      "src",
      "auth.ts",
    ),
    [
      "export function login(username: string, password: string) {",
      "  return authenticate(username, password);",
      "}",
      "",
      "export function authenticate(username: string, password: string) {",
      "  return username.length > 0 && password.length > 0;",
      "}",
      "",
      "export function logout() {",
      "  return true;",
      "}",
    ].join("\n"),
    "utf8",
  );

  console.log(
    "Indexing test repository...",
  );

  const index =
    await indexSemantic(
      repositoryRoot,
    );

  assert.equal(index.files, 1);
  assert.ok(index.chunks > 0);
  assert.equal(
    index.embeddingsCreated,
    index.chunks,
  );

  console.log(
    `Indexed chunks: ${index.chunks}`,
  );

  const first =
    await queryAgent(
      repositoryRoot,
      "How does authentication work?",
      {
        limit: 3,
        minScore: 0.2,
      },
    );

  assert.ok(first.conversationId);
  assert.ok(first.answer);
  assert.ok(first.sources.length > 0);

  const second =
    await queryAgent(
      repositoryRoot,
      "Which files explain that authentication?",
      {
        conversationId:
          first.conversationId,
        limit: 3,
        minScore: 0.2,
      },
    );

  assert.equal(
    second.conversationId,
    first.conversationId,
  );

  assert.ok(second.answer);
  assert.ok(second.sources.length > 0);

  const conversation =
    await loadConversation(
      repositoryRoot,
      first.conversationId,
    );

  assert.ok(conversation);

  assert.equal(
    conversation.messages.length,
    4,
  );

  assert.equal(
    conversation.messages[0]?.role,
    "user",
  );

  assert.equal(
    conversation.messages[1]?.role,
    "assistant",
  );

  assert.equal(
    conversation.messages[2]?.role,
    "user",
  );

  assert.equal(
    conversation.messages[3]?.role,
    "assistant",
  );

  assert.equal(
    conversation.messages[0]?.content,
    "How does authentication work?",
  );

  assert.equal(
    conversation.messages[2]?.content,
    "Which files explain that authentication?",
  );

  console.log(
    "Query memory integration test passed",
  );

  console.log(
    `Conversation: ${first.conversationId}`,
  );

  console.log(
    `Messages: ${conversation.messages.length}`,
  );

  console.log(
    `First sources: ${first.sources.length}`,
  );

  console.log(
    `Second sources: ${second.sources.length}`,
  );
} finally {
  await rm(repositoryRoot, {
    recursive: true,
    force: true,
  });
}
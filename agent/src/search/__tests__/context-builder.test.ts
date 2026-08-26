import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import {
  buildSearchContext,
} from "../contextBuilder.js";

const repositoryRoot = await mkdtemp(
  resolve(
    tmpdir(),
    "lifeos-context-test-",
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
    resolve(repositoryRoot, "src", "auth.ts"),
    [
      "export function login(username: string, password: string) {",
      "  return authenticate(username, password);",
      "}",
      "",
      "export function logout() {",
      "  return clearSession();",
      "}",
    ].join("\n"),
    "utf8",
  );

  const context =
    await buildSearchContext(
      repositoryRoot,
      "How does authentication work?",
      [
        {
          query:
            "How does authentication work?",
          chunkId: "src/auth.ts:1-3",
          path: "src/auth.ts",
          startLine: 1,
          endLine: 3,
          contentHash: "a".repeat(64),
          score: 0.6039,
          embedding: [],
        },
      ],
    );

  assert.equal(
    context.sources.length,
    1,
  );

  assert.ok(
    context.text.includes(
      "How does authentication work?",
    ),
  );

  assert.ok(
    context.text.includes(
      "src/auth.ts",
    ),
  );

  assert.ok(
    context.text.includes(
      "authenticate(username, password)",
    ),
  );

  console.log(
    "Context builder test passed",
  );

  console.log(
    `Sources: ${context.sources.length}`,
  );

  console.log(context.text);
} finally {
  await rm(
    repositoryRoot,
    {
      recursive: true,
      force: true,
    },
  );
}

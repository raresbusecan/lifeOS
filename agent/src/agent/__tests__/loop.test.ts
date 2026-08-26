import assert from "node:assert/strict";
import {
  mkdtemp,
  rm,
  mkdir,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import {
  runAgentLoop,
} from "../loop.js";

const repositoryRoot = await mkdtemp(
  resolve(
    tmpdir(),
    "lifeos-agent-loop-test-",
  ),
);

try {
  await mkdir(
    resolve(repositoryRoot, "src"),
    { recursive: true },
  );

  await writeFile(
    resolve(repositoryRoot, "src", "auth.ts"),
    [
      "export function login(username: string, password: string) {",
      "  return authenticate(username, password);",
      "}",
    ].join("\n"),
    "utf8",
  );

  const result = await runAgentLoop(
    repositoryRoot,
    [
      {
        role: "system",
        content: [
        "You are the LifeOS repository assistant.",
        "",
        "You have access to repository tools.",
        "You MUST use the available tools to inspect the repository before answering.",
        "Never guess or rely on prior knowledge about repository contents.",
        "When you need repository information, call a tool instead of describing a tool call in text.",
        "After receiving tool results, decide whether you need another tool.",
        "When you have enough information, stop calling tools and provide the final answer.",
        "",
        "Answer using only information obtained from the repository.",
      ].join("\n"),
      },
      {
        role: "user",
        content:
          "Find the authentication implementation and explain it.",
      },
    ],
    {
      maxSteps: 8,
    },
  );

  assert.ok(result.answer);
  assert.ok(result.steps > 0);
  assert.ok(result.toolCalls > 0);

  console.log(
    "Agent loop test passed",
  );

  console.log(
    `Steps: ${result.steps}`,
  );

  console.log(
    `Tool calls: ${result.toolCalls}`,
  );

  console.log("");
  console.log("Answer:");
  console.log(result.answer);
} finally {
  await rm(repositoryRoot, {
    recursive: true,
    force: true,
  });
}

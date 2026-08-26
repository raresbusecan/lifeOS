import assert from "node:assert/strict";
import {
  mkdtemp,
  rm,
  mkdir,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { createPlan } from "../planner.js";
import { runAgentLoop } from "../loop.js";

const repositoryRoot = await mkdtemp(
  resolve(
    tmpdir(),
    "lifeos-planner-loop-test-",
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

  const plan = await createPlan(
    "Analyze the authentication implementation in the repository",
  );

  assert.ok(plan.goal);
  assert.ok(plan.steps.length > 0);

  console.log("");
  console.log("Plan:");
  for (const step of plan.steps) {
    console.log(
      `${step.id}: ${step.description}`,
    );
  }

  const planText = plan.steps
    .map(
      (step) =>
        `${step.id}: ${step.description}`,
    )
    .join("\n");

  const result = await runAgentLoop(
    repositoryRoot,
    [
      {
        role: "system",
        content: [
          "You are the LifeOS repository assistant.",
          "Use tools when repository information is needed.",
          "Answer using only information obtained from the repository.",
          "",
          "Execution plan:",
          planText,
        ].join("\n"),
      },
      {
        role: "user",
        content:
          "Analyze the authentication implementation in the repository.",
      },
    ],
    {
      maxSteps: 12,
    },
  );

  assert.ok(result.answer);
  assert.ok(result.steps > 0);
  assert.ok(result.toolCalls > 0);

  console.log("");
  console.log(
    "Planner + agent loop test passed",
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

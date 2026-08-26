import assert from "node:assert/strict";
import {
  mkdtemp,
  writeFile,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import {
  listTools,
  getTool,
  executeTool,
} from "../registry.js";

const repositoryRoot =
  await mkdtemp(
    resolve(
      tmpdir(),
      "lifeos-tool-registry-test-",
    ),
  );

try {
  await writeFile(
    resolve(
      repositoryRoot,
      "test.txt",
    ),
    "Registry works.",
    "utf8",
  );

  const tools = listTools();

  assert.equal(
    tools.length,
    2,
  );

  assert.equal(
    tools[0]?.name,
    "read_file",
  );

  assert.ok(
    getTool("read_file"),
  );

  assert.ok(
    getTool("list_files"),
  );

  assert.equal(
    getTool("does_not_exist"),
    undefined,
  );

  const result =
    await executeTool(
      repositoryRoot,
      {
        name: "read_file",
        arguments: {
          path: "test.txt",
        },
      },
    );

  assert.equal(
    result.success,
    true,
  );

  assert.equal(
    result.output,
    "Registry works.",
  );

  const unknown =
    await executeTool(
      repositoryRoot,
      {
        name: "does_not_exist",
        arguments: {},
      },
    );

  assert.equal(
    unknown.success,
    false,
  );

  assert.equal(
    unknown.output,
    "Unknown tool: does_not_exist",
  );

  console.log(
    "Tool registry test passed",
  );

  console.log(
    `Registered tools: ${tools.length}`,
  );

  console.log(
    `Tools: ${tools.map((tool) => tool.name).join(", ")}`,
  );

  console.log(
    "Execution through registry: OK",
  );

  console.log(
    "Unknown tool protection: OK",
  );
} finally {
  await rm(
    repositoryRoot,
    {
      recursive: true,
      force: true,
    },
  );
}

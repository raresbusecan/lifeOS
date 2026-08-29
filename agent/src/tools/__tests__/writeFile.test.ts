import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  executeWriteFile,
} from "../writeFile.js";

const repositoryRoot =
  await mkdtemp(
    join(tmpdir(), "lifeos-write-test-"),
  );

try {
  const result =
    await executeWriteFile(
      repositoryRoot,
      {
        name: "write_file",
        arguments: {
          path: "test-output.txt",
          content: "local write test",
        },
      },
    );

  assert.equal(
    result.success,
    true,
  );

  const content =
    await readFile(
      join(
        repositoryRoot,
        "test-output.txt",
      ),
      "utf8",
    );

  assert.equal(
    content,
    "local write test",
  );

  const traversal =
    await executeWriteFile(
      repositoryRoot,
      {
        name: "write_file",
        arguments: {
          path: "../outside.txt",
          content: "must not escape",
        },
      },
    );

  assert.equal(
    traversal.success,
    false,
  );

  console.log(
    "write_file test passed",
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
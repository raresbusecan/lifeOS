import assert from "node:assert/strict";
import {
  mkdtemp,
  writeFile,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import {
  executeReadFile,
} from "../readFile.js";

const repositoryRoot =
  await mkdtemp(
    resolve(
      tmpdir(),
      "lifeos-read-file-test-",
    ),
  );

try {
  await writeFile(
    resolve(
      repositoryRoot,
      "test.txt",
    ),
    "Hello from repository.",
    "utf8",
  );

  const valid =
    await executeReadFile(
      repositoryRoot,
      {
        name: "read_file",
        arguments: {
          path: "test.txt",
        },
      },
    );

  assert.equal(
    valid.success,
    true,
  );

  assert.equal(
    valid.output,
    "Hello from repository.",
  );

  const absolute =
    await executeReadFile(
      repositoryRoot,
      {
        name: "read_file",
        arguments: {
          path: "/etc/passwd",
        },
      },
    );

  assert.equal(
    absolute.success,
    false,
  );

  const traversal =
    await executeReadFile(
      repositoryRoot,
      {
        name: "read_file",
        arguments: {
          path: "../outside.txt",
        },
      },
    );

  assert.equal(
    traversal.success,
    false,
  );

  const missing =
    await executeReadFile(
      repositoryRoot,
      {
        name: "read_file",
        arguments: {
          path: "missing.txt",
        },
      },
    );

  assert.equal(
    missing.success,
    false,
  );

  console.log(
    "Read file tool test passed",
  );

  console.log(
    "Valid read: OK",
  );

  console.log(
    "Absolute path protection: OK",
  );

  console.log(
    "Path traversal protection: OK",
  );

  console.log(
    "Missing file handling: OK",
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

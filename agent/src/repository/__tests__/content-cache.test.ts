import { strict as assert } from "node:assert";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { getOrCreateContentCache } from "../content-cache.js";

const repositoryRoot = await mkdtemp(
  resolve(tmpdir(), "lifeos-content-cache-"),
);

const content = Array.from(
  { length: 200 },
  (_, index) => `line ${index + 1}`,
).join("\n");

const first = await getOrCreateContentCache(
  repositoryRoot,
  "test.ts",
  content,
);

assert.equal(first.reused, false);
assert.ok(first.entry.chunks.length > 1);

const second = await getOrCreateContentCache(
  repositoryRoot,
  "test.ts",
  content,
);

assert.equal(second.reused, true);
assert.equal(
  second.entry.contentHash,
  first.entry.contentHash,
);

assert.deepEqual(
  second.entry.chunks,
  first.entry.chunks,
);

const cacheDirectory = resolve(
  repositoryRoot,
  ".agent",
  "cache",
  "content",
);

const files = await readFile(
  resolve(
    cacheDirectory,
    `${first.entry.contentHash}.json`,
  ),
  "utf8",
);

assert.ok(files.includes('"chunks"'));
assert.ok(files.includes('"contentHash"'));

console.log("Content cache test passed");
console.log(`Chunks: ${first.entry.chunks.length}`);
console.log(`Hash: ${first.entry.contentHash}`);

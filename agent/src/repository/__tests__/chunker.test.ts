import { strict as assert } from "node:assert";
import { chunkContent } from "../chunker.js";

const content = Array.from(
  { length: 200 },
  (_, index) => `line ${index + 1}`,
).join("\n");

const chunks = chunkContent("test.ts", content);

assert.ok(chunks.length > 1);

assert.equal(chunks[0]?.startLine, 1);
assert.equal(chunks[0]?.endLine, 80);

assert.equal(chunks[1]?.startLine, 71);

for (const chunk of chunks) {
  assert.ok(chunk.contentHash.length === 64);
  assert.ok(chunk.chunkId.includes("test.ts"));
}

console.log(`Chunker test passed: ${chunks.length} chunks`);

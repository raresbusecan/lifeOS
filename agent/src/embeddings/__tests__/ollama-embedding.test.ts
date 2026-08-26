import assert from "node:assert/strict";
import { OllamaEmbeddingClient } from "../ollama.js";

const client = new OllamaEmbeddingClient();

console.log("Testing Ollama embeddings...");
console.log(`Model: ${client.getModel()}`);
console.log(`URL: ${client.getBaseUrl()}`);

const first = await client.embed(
  "LifeOS project architecture",
);

assert.ok(Array.isArray(first));
assert.equal(first.length, 768);

const second = await client.embed(
  "Repository indexing and semantic search",
);

assert.ok(Array.isArray(second));
assert.equal(second.length, 768);

assert.notDeepEqual(
  first,
  second,
);

const batch = await client.embedMany([
  "LifeOS",
  "Repository",
  "Semantic search",
]);

assert.equal(batch.length, 3);

for (const embedding of batch) {
  assert.equal(embedding.length, 768);
}

console.log("Ollama embedding test passed");
console.log(`Embedding dimensions: ${first.length}`);
console.log(`Batch embeddings: ${batch.length}`);

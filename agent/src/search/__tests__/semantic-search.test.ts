import assert from "node:assert/strict";
import {
  mkdtemp,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import {
  semanticSearch,
} from "../semanticSearch.js";

import {
  upsertVectorEntry,
} from "../vectorIndex.js";

const repositoryRoot = await mkdtemp(
  resolve(
    tmpdir(),
    "lifeos-semantic-search-test-",
  ),
);

try {
  const model = "nomic-embed-text";

  const queryClient = await import(
    "../../embeddings/ollama.js"
  );

  const client =
    new queryClient.OllamaEmbeddingClient({
      model,
    });

  const authEmbedding = await client.embed(
    "authentication login user password session",
  );

  const mathEmbedding = await client.embed(
    "mathematics numbers calculation arithmetic",
  );

  await upsertVectorEntry(
    repositoryRoot,
    {
      version: 1,
      chunkId: "src/auth.ts:1-10",
      path: "src/auth.ts",
      startLine: 1,
      endLine: 10,
      contentHash: "a".repeat(64),
      embedding: authEmbedding,
      model,
      dimensions: authEmbedding.length,
      indexedAt: new Date().toISOString(),
    },
  );

  await upsertVectorEntry(
    repositoryRoot,
    {
      version: 1,
      chunkId: "src/math.ts:1-10",
      path: "src/math.ts",
      startLine: 1,
      endLine: 10,
      contentHash: "b".repeat(64),
      embedding: mathEmbedding,
      model,
      dimensions: mathEmbedding.length,
      indexedAt: new Date().toISOString(),
    },
  );

  const results = await semanticSearch(
    repositoryRoot,
    "How does authentication work?",
    {
      model,
      limit: 2,
    },
  );

  assert.equal(results.length, 2);

  assert.equal(
    results[0]?.path,
    "src/auth.ts",
  );

  assert.ok(
    (results[0]?.score ?? 0) >
      (results[1]?.score ?? 0),
  );

  console.log(
    "Semantic search test passed",
  );

  console.log(
    `Results: ${results.length}`,
  );

  for (const result of results) {
    console.log(
      `${result.score.toFixed(4)} — ${result.path}:${result.startLine}-${result.endLine}`,
    );
  }
} finally {
  await rm(
    repositoryRoot,
    {
      recursive: true,
      force: true,
    },
  );
}

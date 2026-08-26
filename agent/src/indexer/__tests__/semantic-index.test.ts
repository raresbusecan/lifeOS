
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
  indexSemantic,
} from "../semanticIndex.js";

import {
  getVectorIndexStats,
} from "../../search/vectorIndex.js";

const repositoryRoot = await mkdtemp(
  resolve(tmpdir(), "lifeos-semantic-test-"),
);

try {
  await mkdir(
    resolve(repositoryRoot, "src"),
    { recursive: true },
  );

  /*
   * The default chunker uses:
   *   maxLines = 80
   *   overlapLines = 10
   *
   * 21 chunks therefore require more than 1,600 lines.
   *
   * We deliberately create 1,700 lines so this integration
   * test exercises more than one embedding batch when
   * EMBEDDING_BATCH_SIZE = 20.
   */
  const lines = Array.from(
    { length: 1700 },
    (_, index) => [
      `export const value${index + 1} = ${index + 1};`,
      `export function getValue${index + 1}() {`,
      `  return value${index + 1};`,
      `}`,
    ].join("\n"),
  );

  await writeFile(
    resolve(repositoryRoot, "src", "test.ts"),
    lines.join("\n"),
    "utf8",
  );

  const first = await indexSemantic(
    repositoryRoot,
  );

  assert.equal(first.files, 1);

  /*
   * The important assertion for Sub-task 1.1:
   * the test repository must produce more than one
   * batch of 20 chunks.
   */
  assert.ok(
    first.chunks > 20,
    `Expected more than 20 chunks, got ${first.chunks}`,
  );

  assert.equal(
    first.embeddingCacheHits,
    0,
  );

  assert.equal(
    first.embeddingsCreated,
    first.chunks,
  );

  assert.equal(
    first.vectorsIndexed,
    first.chunks,
  );

  const second = await indexSemantic(
    repositoryRoot,
  );

  assert.equal(second.files, 1);

  assert.equal(
    second.chunks,
    first.chunks,
  );

  assert.equal(
    second.embeddingCacheHits,
    second.chunks,
  );

  assert.equal(
    second.embeddingsCreated,
    0,
  );

  assert.equal(
    second.vectorsIndexed,
    second.chunks,
  );

  const stats = await getVectorIndexStats(
    repositoryRoot,
    "nomic-embed-text",
    768,
  );

  assert.equal(
    stats.entries,
    first.chunks,
  );

  console.log(
    "Semantic index test passed",
  );

  console.log(
    `Files: ${second.files}`,
  );

  console.log(
    `Chunks: ${second.chunks}`,
  );

  console.log(
    `Embedding cache hits: ${second.embeddingCacheHits}`,
  );

  console.log(
    `Embeddings created on first run: ${first.embeddingsCreated}`,
  );

  console.log(
    `Embeddings created on second run: ${second.embeddingsCreated}`,
  );

  console.log(
    `Vectors: ${stats.entries}`,
  );
} finally {
  await rm(repositoryRoot, {
    recursive: true,
    force: true,
  });
}


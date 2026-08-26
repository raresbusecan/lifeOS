import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { indexSemantic, } from "../semanticIndex.js";
import { getVectorIndexStats, } from "../../search/vectorIndex.js";
const repositoryRoot = await mkdtemp(resolve(tmpdir(), "lifeos-semantic-test-"));
try {
    await mkdir(resolve(repositoryRoot, "src"), { recursive: true });
    await writeFile(resolve(repositoryRoot, "src", "test.ts"), [
        "export function calculateTotal(items: number[]) {",
        "  return items.reduce((sum, item) => sum + item, 0);",
        "}",
        "",
        "export function calculateAverage(items: number[]) {",
        "  if (items.length === 0) return 0;",
        "  return calculateTotal(items) / items.length;",
        "}",
        "",
        "export const description = 'numeric utilities';",
    ].join("\n"), "utf8");
    const first = await indexSemantic(repositoryRoot);
    assert.equal(first.files, 1);
    assert.ok(first.chunks > 0);
    assert.equal(first.embeddingCacheHits, 0);
    assert.equal(first.embeddingsCreated, first.chunks);
    assert.equal(first.vectorsIndexed, first.chunks);
    const second = await indexSemantic(repositoryRoot);
    assert.equal(second.files, 1);
    assert.equal(second.chunks, first.chunks);
    assert.equal(second.embeddingCacheHits, second.chunks);
    assert.equal(second.embeddingsCreated, 0);
    assert.equal(second.vectorsIndexed, second.chunks);
    const stats = await getVectorIndexStats(repositoryRoot, "nomic-embed-text", 768);
    assert.equal(stats.entries, first.chunks);
    console.log("Semantic index test passed");
    console.log(`Files: ${second.files}`);
    console.log(`Chunks: ${second.chunks}`);
    console.log(`Embedding cache hits: ${second.embeddingCacheHits}`);
    console.log(`Embeddings created on second run: ${second.embeddingsCreated}`);
    console.log(`Vectors: ${stats.entries}`);
}
finally {
    await rm(repositoryRoot, {
        recursive: true,
        force: true,
    });
}

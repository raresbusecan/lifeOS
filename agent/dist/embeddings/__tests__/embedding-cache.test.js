import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { getEmbeddingCacheEntry, saveEmbeddingCacheEntry, } from "../embedding-cache.js";
const repositoryRoot = await mkdtemp(resolve(tmpdir(), "lifeos-embedding-cache-"));
try {
    const embedding = Array.from({ length: 768 }, (_, index) => index / 768);
    const entry = {
        version: 1,
        chunkId: "test.ts:1-10",
        contentHash: "a".repeat(64),
        model: "nomic-embed-text",
        dimensions: 768,
        embedding,
        cachedAt: new Date().toISOString(),
    };
    const firstMiss = await getEmbeddingCacheEntry(repositoryRoot, entry.chunkId, entry.contentHash, entry.model, entry.dimensions);
    assert.equal(firstMiss, null);
    await saveEmbeddingCacheEntry(repositoryRoot, entry);
    const hit = await getEmbeddingCacheEntry(repositoryRoot, entry.chunkId, entry.contentHash, entry.model, entry.dimensions);
    assert.ok(hit);
    assert.equal(hit.chunkId, entry.chunkId);
    assert.equal(hit.contentHash, entry.contentHash);
    assert.equal(hit.model, entry.model);
    assert.equal(hit.dimensions, 768);
    assert.deepEqual(hit.embedding, embedding);
    const changedContent = await getEmbeddingCacheEntry(repositoryRoot, entry.chunkId, "b".repeat(64), entry.model, entry.dimensions);
    assert.equal(changedContent, null);
    const changedModel = await getEmbeddingCacheEntry(repositoryRoot, entry.chunkId, entry.contentHash, "different-model", entry.dimensions);
    assert.equal(changedModel, null);
    const cacheFile = resolve(repositoryRoot, ".agent", "cache", "embeddings", "index.json");
    const cacheContent = await readFile(cacheFile, "utf8");
    assert.ok(cacheContent.includes('"entries"'));
    assert.ok(cacheContent.includes('"test.ts:1-10"'));
    assert.ok(cacheContent.includes('"nomic-embed-text"'));
    console.log("Embedding cache test passed");
    console.log(`Dimensions: ${hit.dimensions}`);
    console.log(`Chunk: ${hit.chunkId}`);
}
finally {
    await rm(repositoryRoot, {
        recursive: true,
        force: true,
    });
}

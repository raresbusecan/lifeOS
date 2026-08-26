import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { getVectorIndexStats, searchVectors, upsertVectorEntry, } from "../vectorIndex.js";
const repositoryRoot = await mkdtemp(resolve(tmpdir(), "lifeos-vector-test-"));
try {
    const model = "nomic-embed-text";
    const dimensions = 3;
    await upsertVectorEntry(repositoryRoot, {
        version: 1,
        chunkId: "test.ts:1-10",
        path: "test.ts",
        startLine: 1,
        endLine: 10,
        contentHash: "a".repeat(64),
        embedding: [1, 0, 0],
        model,
        dimensions,
        indexedAt: new Date().toISOString(),
    });
    await upsertVectorEntry(repositoryRoot, {
        version: 1,
        chunkId: "other.ts:1-10",
        path: "other.ts",
        startLine: 1,
        endLine: 10,
        contentHash: "b".repeat(64),
        embedding: [0, 1, 0],
        model,
        dimensions,
        indexedAt: new Date().toISOString(),
    });
    const stats = await getVectorIndexStats(repositoryRoot, model, dimensions);
    assert.equal(stats.entries, 2);
    assert.equal(stats.model, model);
    assert.equal(stats.dimensions, dimensions);
    const results = await searchVectors(repositoryRoot, [0.9, 0.1, 0], {
        model,
        dimensions,
        limit: 2,
    });
    assert.equal(results.length, 2);
    assert.equal(results[0]?.chunkId, "test.ts:1-10");
    assert.ok((results[0]?.score ?? 0) >
        (results[1]?.score ?? 0));
    assert.ok((results[0]?.score ?? 0) > 0.9);
    console.log("Vector index test passed");
    console.log(`Entries: ${stats.entries}`);
    console.log(`Top result: ${results[0]?.chunkId}`);
    console.log(`Score: ${results[0]?.score.toFixed(6)}`);
}
finally {
    await rm(repositoryRoot, {
        recursive: true,
        force: true,
    });
}

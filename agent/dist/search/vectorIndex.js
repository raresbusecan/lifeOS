import { mkdir, readFile, writeFile, } from "node:fs/promises";
import { resolve } from "node:path";
function getIndexFile(repositoryRoot) {
    return resolve(repositoryRoot, ".agent", "cache", "vectors", "index.json");
}
function getIndexDirectory(repositoryRoot) {
    return resolve(repositoryRoot, ".agent", "cache", "vectors");
}
async function loadIndex(indexFile, model, dimensions) {
    try {
        const content = await readFile(indexFile, "utf8");
        const index = JSON.parse(content);
        if (index.version === 1 &&
            index.model === model &&
            index.dimensions === dimensions) {
            return index;
        }
    }
    catch {
        // Empty or invalid index.
    }
    return {
        version: 1,
        model,
        dimensions,
        updatedAt: new Date().toISOString(),
        entries: {},
    };
}
async function saveIndex(repositoryRoot, index) {
    const directory = getIndexDirectory(repositoryRoot);
    await mkdir(directory, {
        recursive: true,
    });
    index.updatedAt =
        new Date().toISOString();
    await writeFile(getIndexFile(repositoryRoot), JSON.stringify(index, null, 2) + "\n", "utf8");
}
function cosineSimilarity(a, b) {
    if (a.length !== b.length) {
        throw new Error(`Embedding dimensions do not match: ${a.length} !== ${b.length}`);
    }
    let dot = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < a.length; i++) {
        const valueA = a[i] ?? 0;
        const valueB = b[i] ?? 0;
        dot += valueA * valueB;
        magnitudeA += valueA * valueA;
        magnitudeB += valueB * valueB;
    }
    if (magnitudeA === 0 ||
        magnitudeB === 0) {
        return 0;
    }
    return (dot /
        (Math.sqrt(magnitudeA) *
            Math.sqrt(magnitudeB)));
}
export async function upsertVectorEntry(repositoryRoot, entry) {
    const index = await loadIndex(getIndexFile(repositoryRoot), entry.model, entry.dimensions);
    index.entries[entry.chunkId] = entry;
    await saveIndex(repositoryRoot, index);
}
export async function upsertVectorEntries(repositoryRoot, entries) {
    if (entries.length === 0) {
        return;
    }
    const first = entries[0];
    if (!first) {
        return;
    }
    const index = await loadIndex(getIndexFile(repositoryRoot), first.model, first.dimensions);
    for (const entry of entries) {
        if (entry.model !== first.model ||
            entry.dimensions !== first.dimensions) {
            throw new Error("All vector entries in a batch must use the same model and dimensions");
        }
        index.entries[entry.chunkId] = entry;
    }
    await saveIndex(repositoryRoot, index);
}
export async function removeVectorEntry(repositoryRoot, chunkId, model, dimensions) {
    const index = await loadIndex(getIndexFile(repositoryRoot), model, dimensions);
    if (!index.entries[chunkId]) {
        return false;
    }
    delete index.entries[chunkId];
    await saveIndex(repositoryRoot, index);
    return true;
}
export async function searchVectors(repositoryRoot, queryEmbedding, options) {
    const index = await loadIndex(getIndexFile(repositoryRoot), options.model, options.dimensions);
    if (queryEmbedding.length !==
        options.dimensions) {
        throw new Error(`Query embedding dimensions do not match index dimensions: ${queryEmbedding.length} !== ${options.dimensions}`);
    }
    const limit = options.limit ?? 10;
    const minScore = options.minScore ?? -1;
    const results = [];
    for (const entry of Object.values(index.entries)) {
        const score = cosineSimilarity(queryEmbedding, entry.embedding);
        if (score < minScore) {
            continue;
        }
        results.push({
            chunkId: entry.chunkId,
            path: entry.path,
            startLine: entry.startLine,
            endLine: entry.endLine,
            contentHash: entry.contentHash,
            score,
            embedding: entry.embedding,
        });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
}
export async function getVectorIndexStats(repositoryRoot, model, dimensions) {
    const index = await loadIndex(getIndexFile(repositoryRoot), model, dimensions);
    return {
        entries: Object.keys(index.entries).length,
        model: index.model,
        dimensions: index.dimensions,
    };
}

import { mkdir, readFile, writeFile, } from "node:fs/promises";
import { resolve } from "node:path";
async function loadCache(cacheFile, model, dimensions) {
    try {
        const content = await readFile(cacheFile, "utf8");
        const cache = JSON.parse(content);
        if (cache.version === 1 &&
            cache.model === model &&
            cache.dimensions === dimensions) {
            return cache;
        }
    }
    catch {
        // Cache miss.
    }
    return {
        version: 1,
        model,
        dimensions,
        updatedAt: new Date().toISOString(),
        entries: {},
    };
}
export async function getEmbeddingCacheEntry(repositoryRoot, chunkId, contentHash, model, dimensions) {
    const cacheFile = resolve(repositoryRoot, ".agent", "cache", "embeddings", "index.json");
    const cache = await loadCache(cacheFile, model, dimensions);
    const entry = cache.entries[chunkId];
    if (!entry ||
        entry.contentHash !== contentHash ||
        entry.model !== model ||
        entry.dimensions !== dimensions) {
        return null;
    }
    return entry;
}
export async function saveEmbeddingCacheEntry(repositoryRoot, entry) {
    const cacheDirectory = resolve(repositoryRoot, ".agent", "cache", "embeddings");
    const cacheFile = resolve(cacheDirectory, "index.json");
    const cache = await loadCache(cacheFile, entry.model, entry.dimensions);
    cache.entries[entry.chunkId] = entry;
    cache.updatedAt = new Date().toISOString();
    await mkdir(cacheDirectory, {
        recursive: true,
    });
    await writeFile(cacheFile, JSON.stringify(cache, null, 2) + "\n", "utf8");
}

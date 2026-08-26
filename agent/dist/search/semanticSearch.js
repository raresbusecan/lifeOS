import { OllamaEmbeddingClient, } from "../embeddings/ollama.js";
import { searchVectors, } from "./vectorIndex.js";
const DEFAULT_CACHE_SIZE = 100;
class EmbeddingLRUCache {
    maxSize;
    entries = new Map();
    constructor(maxSize = DEFAULT_CACHE_SIZE) {
        if (maxSize <= 0) {
            throw new Error("Embedding cache size must be greater than zero");
        }
        this.maxSize = maxSize;
    }
    get(key) {
        const embedding = this.entries.get(key);
        if (!embedding) {
            return undefined;
        }
        // Move the entry to the end so it becomes
        // the most recently used item.
        this.entries.delete(key);
        this.entries.set(key, embedding);
        return embedding;
    }
    set(key, embedding) {
        if (this.entries.has(key)) {
            this.entries.delete(key);
        }
        this.entries.set(key, embedding);
        while (this.entries.size > this.maxSize) {
            const oldestKey = this.entries.keys().next().value;
            if (oldestKey === undefined) {
                break;
            }
            this.entries.delete(oldestKey);
        }
    }
    clear() {
        this.entries.clear();
    }
    get size() {
        return this.entries.size;
    }
}
const embeddingCache = new EmbeddingLRUCache();
function buildEmbeddingCacheKey(model, query) {
    return JSON.stringify([
        model,
        query.trim(),
    ]);
}
function now() {
    return performance.now();
}
export async function semanticSearch(repositoryRoot, query, options = {}) {
    if (!query.trim()) {
        throw new Error("Search query cannot be empty");
    }
    const startedAt = now();
    const client = new OllamaEmbeddingClient({
        model: options.model,
    });
    const cacheKey = buildEmbeddingCacheKey(client.getModel(), query);
    let embedding = embeddingCache.get(cacheKey);
    let cacheHit = true;
    const embeddingStartedAt = now();
    if (!embedding) {
        cacheHit = false;
        embedding =
            await client.embed(query);
        embeddingCache.set(cacheKey, embedding);
    }
    const embeddingMs = now() - embeddingStartedAt;
    const vectorSearchStartedAt = now();
    const results = await searchVectors(repositoryRoot, embedding, {
        model: client.getModel(),
        dimensions: embedding.length,
        limit: options.limit ?? 10,
        minScore: options.minScore ?? 0,
    });
    const vectorSearchMs = now() - vectorSearchStartedAt;
    const totalMs = now() - startedAt;
    console.debug([
        "[semantic-search]",
        `embedding=${embeddingMs.toFixed(2)}ms`,
        `vectors=${vectorSearchMs.toFixed(2)}ms`,
        `total=${totalMs.toFixed(2)}ms`,
        `cache=${cacheHit ? "HIT" : "MISS"}`,
        `cacheSize=${embeddingCache.size}`,
    ].join(" "));
    return results.map((result) => ({
        ...result,
        query,
    }));
}
export function formatSemanticSearchResults(results) {
    if (results.length === 0) {
        return [
            "",
            "Semantic Search",
            "───────────────",
            "",
            "No relevant results found.",
            "",
        ].join("\n");
    }
    const lines = [
        "",
        "LifeOS Agent — Semantic Search",
        "───────────────────────────────",
        "",
        `Query: ${results[0]?.query ?? ""}`,
        `Results: ${results.length}`,
        "",
    ];
    for (const [index, result] of results.entries()) {
        lines.push(`${index + 1}. ${result.score.toFixed(4)} — ${result.path}:${result.startLine}-${result.endLine}`);
    }
    lines.push("");
    return lines.join("\n");
}

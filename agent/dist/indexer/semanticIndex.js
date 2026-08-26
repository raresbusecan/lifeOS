import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getOrCreateContentCache, } from "../repository/content-cache.js";
import { scanRepository, } from "../repository/scanner.js";
import { OllamaEmbeddingClient, } from "../embeddings/ollama.js";
import { getEmbeddingCacheEntry, saveEmbeddingCacheEntry, } from "../embeddings/embedding-cache.js";
import { upsertVectorEntry, } from "../search/vectorIndex.js";
const EMBEDDING_DIMENSIONS = 768;
const EMBEDDING_BATCH_SIZE = 20;
export async function indexSemantic(repositoryRoot, options = {}) {
    const client = new OllamaEmbeddingClient({
        model: options.model,
    });
    const files = await scanRepository(repositoryRoot);
    let chunks = 0;
    let embeddingCacheHits = 0;
    let embeddingsCreated = 0;
    let vectorsIndexed = 0;
    const dimensions = EMBEDDING_DIMENSIONS;
    let processedChunks = 0;
    let batch = [];
    const processBatch = async (items) => {
        if (items.length === 0) {
            return;
        }
        const uncached = items.filter((item) => item.embedding === null);
        if (uncached.length > 0) {
            console.log(`Generating embeddings: ${uncached.length} chunks`);
            const embeddings = await client.embedMany(uncached.map((item) => item.chunk.content));
            if (embeddings.length !== uncached.length) {
                throw new Error(`Ollama returned ${embeddings.length} embeddings for ${uncached.length} chunks`);
            }
            for (let index = 0; index < uncached.length; index++) {
                const item = uncached[index];
                const embedding = embeddings[index];
                if (!embedding) {
                    throw new Error(`Missing embedding for ${item.chunk.chunkId}`);
                }
                if (embedding.length !== dimensions) {
                    throw new Error(`Unexpected embedding dimensions for ${item.chunk.chunkId}: ${embedding.length} !== ${dimensions}`);
                }
                item.embedding = embedding;
                await saveEmbeddingCacheEntry(repositoryRoot, {
                    version: 1,
                    chunkId: item.chunk.chunkId,
                    contentHash: item.chunk.contentHash,
                    model: client.getModel(),
                    dimensions: embedding.length,
                    embedding,
                    cachedAt: new Date().toISOString(),
                });
                embeddingsCreated++;
            }
        }
        for (const item of items) {
            processedChunks++;
            console.log(`Embedding ${processedChunks}: ${item.chunk.chunkId}`);
            if (!item.embedding) {
                throw new Error(`Missing embedding for ${item.chunk.chunkId}`);
            }
            await upsertVectorEntry(repositoryRoot, {
                version: 1,
                chunkId: item.chunk.chunkId,
                path: item.chunk.path,
                startLine: item.chunk.startLine,
                endLine: item.chunk.endLine,
                contentHash: item.chunk.contentHash,
                embedding: item.embedding,
                model: client.getModel(),
                dimensions: item.embedding.length,
                indexedAt: new Date().toISOString(),
            });
            vectorsIndexed++;
        }
    };
    for (const file of files) {
        const absolutePath = resolve(repositoryRoot, file.path);
        const content = await readFile(absolutePath, "utf8");
        const contentResult = await getOrCreateContentCache(repositoryRoot, file.path, content);
        for (const chunk of contentResult.entry.chunks) {
            chunks++;
            const cached = await getEmbeddingCacheEntry(repositoryRoot, chunk.chunkId, chunk.contentHash, client.getModel(), dimensions);
            if (cached) {
                embeddingCacheHits++;
            }
            batch.push({
                chunk,
                embedding: cached?.embedding ?? null,
            });
            if (batch.length === EMBEDDING_BATCH_SIZE) {
                await processBatch(batch);
                batch = [];
            }
        }
    }
    await processBatch(batch);
    return {
        files: files.length,
        chunks,
        embeddingCacheHits,
        embeddingsCreated,
        vectorsIndexed,
    };
}
export function formatSemanticIndexResult(result) {
    return [
        "",
        "LifeOS Agent — Semantic Index",
        "──────────────────────────────",
        "",
        `Files:              ${result.files}`,
        `Chunks:             ${result.chunks}`,
        `Embedding cache:    ${result.embeddingCacheHits}`,
        `Embeddings created: ${result.embeddingsCreated}`,
        `Vectors indexed:    ${result.vectorsIndexed}`,
        "",
    ].join("\n");
}

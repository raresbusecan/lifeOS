import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  getOrCreateContentCache,
} from "../repository/content-cache.js";

import {
  scanRepository,
} from "../repository/scanner.js";

import {
  OllamaEmbeddingClient,
} from "../embeddings/ollama.js";

import {
  getEmbeddingCacheEntry,
  saveEmbeddingCacheEntry,
} from "../embeddings/embedding-cache.js";

import {
  upsertVectorEntry,
} from "../search/vectorIndex.js";

export interface SemanticIndexResult {
  files: number;
  chunks: number;
  embeddingCacheHits: number;
  embeddingsCreated: number;
  vectorsIndexed: number;
}

export async function indexSemantic(
  repositoryRoot: string,
  options: {
    model?: string;
  } = {},
): Promise<SemanticIndexResult> {
  const client = new OllamaEmbeddingClient({
    model: options.model,
  });

  const files = await scanRepository(
    repositoryRoot,
  );

  let chunks = 0;
  let embeddingCacheHits = 0;
  let embeddingsCreated = 0;
  let vectorsIndexed = 0;

  const dimensions = 768;

  let totalChunks = 0;

  for (const file of files) {
    const absolutePath = resolve(
      repositoryRoot,
      file.path,
    );

    const content = await readFile(
      absolutePath,
      "utf8",
    );

    const contentResult =
      await getOrCreateContentCache(
        repositoryRoot,
        file.path,
        content,
      );

    totalChunks += contentResult.entry.chunks.length;
  }

  console.log(
    `Semantic chunks discovered: ${totalChunks}`,
  );

  let processedChunks = 0;

  for (const file of files) {
    const absolutePath = resolve(
      repositoryRoot,
      file.path,
    );

    const content = await readFile(
      absolutePath,
      "utf8",
    );

    const contentResult =
      await getOrCreateContentCache(
        repositoryRoot,
        file.path,
        content,
      );

    for (const chunk of contentResult.entry.chunks) {
      chunks++;
      processedChunks++;

      console.log(
        `Embedding ${processedChunks}/${totalChunks}: ${chunk.chunkId}`,
      );

      const cached =
        await getEmbeddingCacheEntry(
          repositoryRoot,
          chunk.chunkId,
          chunk.contentHash,
          client.getModel(),
          dimensions,
        );

      let embedding: number[];

      if (cached) {
        embedding = cached.embedding;
        embeddingCacheHits++;
      } else {
        console.log(
          `  → generating embedding`,
        );

        embedding = await client.embed(
          chunk.content,
        );

        if (embedding.length !== dimensions) {
          throw new Error(
            `Unexpected embedding dimensions for ${chunk.chunkId}: ${embedding.length} !== ${dimensions}`,
          );
        }

        await saveEmbeddingCacheEntry(
          repositoryRoot,
          {
            version: 1,
            chunkId: chunk.chunkId,
            contentHash: chunk.contentHash,
            model: client.getModel(),
            dimensions: embedding.length,
            embedding,
            cachedAt: new Date().toISOString(),
          },
        );

        embeddingsCreated++;
      }

      await upsertVectorEntry(
        repositoryRoot,
        {
          version: 1,
          chunkId: chunk.chunkId,
          path: chunk.path,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          contentHash: chunk.contentHash,
          embedding,
          model: client.getModel(),
          dimensions: embedding.length,
          indexedAt: new Date().toISOString(),
        },
      );

      vectorsIndexed++;
    }
  }

  return {
    files: files.length,
    chunks,
    embeddingCacheHits,
    embeddingsCreated,
    vectorsIndexed,
  };
}

export function formatSemanticIndexResult(
  result: SemanticIndexResult,
): string {
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

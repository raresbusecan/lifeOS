export interface OllamaEmbedResponse {
  model: string;
  embeddings: number[][];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
}

export interface OllamaClientOptions {
  baseUrl?: string;
  model?: string;
}

interface EmbeddingCacheEntry {
  key: string;
  embedding: number[];
}

const DEFAULT_EMBEDDING_CACHE_SIZE = 100;

const embeddingCache = new Map<
  string,
  EmbeddingCacheEntry
>();

function getCacheKey(
  baseUrl: string,
  model: string,
  input: string,
): string {
  return [
    baseUrl,
    model,
    input,
  ].join("\n");
}

function getCachedEmbedding(
  key: string,
): number[] | undefined {
  const entry =
    embeddingCache.get(key);

  if (!entry) {
    return undefined;
  }

  // Refresh LRU position.
  embeddingCache.delete(key);
  embeddingCache.set(key, entry);

  return entry.embedding;
}

function setCachedEmbedding(
  key: string,
  embedding: number[],
): void {
  if (embeddingCache.has(key)) {
    embeddingCache.delete(key);
  }

  embeddingCache.set(key, {
    key,
    embedding,
  });

  while (
    embeddingCache.size >
    DEFAULT_EMBEDDING_CACHE_SIZE
  ) {
    const oldestKey =
      embeddingCache.keys().next().value;

    if (
      typeof oldestKey !== "string"
    ) {
      break;
    }

    embeddingCache.delete(
      oldestKey,
    );
  }
}

export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}

export function getEmbeddingCacheStats(): {
  size: number;
  maxSize: number;
} {
  return {
    size: embeddingCache.size,
    maxSize:
      DEFAULT_EMBEDDING_CACHE_SIZE,
  };
}

export class OllamaEmbeddingClient {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(
    options: OllamaClientOptions = {},
  ) {
    this.baseUrl =
      options.baseUrl ??
      process.env.OLLAMA_BASE_URL ??
      "http://localhost:11434";

    this.model =
      options.model ??
      process.env.OLLAMA_EMBED_MODEL ??
      "nomic-embed-text";
  }

  async embed(
    input: string,
  ): Promise<number[]> {
    if (!input.trim()) {
      throw new Error(
        "Cannot create embedding for empty input",
      );
    }

    const cacheKey =
      getCacheKey(
        this.baseUrl,
        this.model,
        input,
      );

    const cached =
      getCachedEmbedding(
        cacheKey,
      );

    if (cached) {
      return cached;
    }

    const response =
      await fetch(
        `${this.baseUrl}/api/embed`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            input,
          }),
        },
      );

    if (!response.ok) {
      const body =
        await response.text();

      throw new Error(
        `Ollama embedding request failed: ${response.status} ${response.statusText}: ${body}`,
      );
    }

    const result =
      (await response.json()) as OllamaEmbedResponse;

    const embedding =
      result.embeddings?.[0];

    if (
      !embedding ||
      embedding.length === 0
    ) {
      throw new Error(
        "Ollama returned no embedding",
      );
    }

    setCachedEmbedding(
      cacheKey,
      embedding,
    );

    return embedding;
  }

  async embedMany(
    inputs: string[],
  ): Promise<number[][]> {
    if (inputs.length === 0) {
      return [];
    }

    const results: number[][] =
      new Array(inputs.length);

    const missingInputs: string[] =
      [];
    const missingIndexes: number[] =
      [];

    for (
      let i = 0;
      i < inputs.length;
      i++
    ) {
      const input =
        inputs[i];

      if (!input?.trim()) {
        throw new Error(
          "Cannot create embedding for empty input",
        );
      }

      const cacheKey =
        getCacheKey(
          this.baseUrl,
          this.model,
          input,
        );

      const cached =
        getCachedEmbedding(
          cacheKey,
        );

      if (cached) {
        results[i] = cached;
      } else {
        missingInputs.push(
          input,
        );
        missingIndexes.push(i);
      }
    }

    if (
      missingInputs.length === 0
    ) {
      return results;
    }

    const response =
      await fetch(
        `${this.baseUrl}/api/embed`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            input: missingInputs,
          }),
        },
      );

    if (!response.ok) {
      const body =
        await response.text();

      throw new Error(
        `Ollama embedding request failed: ${response.status} ${response.statusText}: ${body}`,
      );
    }

    const result =
      (await response.json()) as OllamaEmbedResponse;

    if (
      !Array.isArray(
        result.embeddings,
      ) ||
      result.embeddings.length !==
        missingInputs.length
    ) {
      throw new Error(
        `Ollama returned ${result.embeddings?.length ?? 0} embeddings for ${missingInputs.length} inputs`,
      );
    }

    for (
      let i = 0;
      i < missingInputs.length;
      i++
    ) {
      const input =
        missingInputs[i];

      const embedding =
        result.embeddings[i];

      const originalIndex =
        missingIndexes[i];

      if (
        !input ||
        !embedding ||
        embedding.length === 0 ||
        originalIndex === undefined
      ) {
        throw new Error(
          "Ollama returned an invalid embedding",
        );
      }

      const cacheKey =
        getCacheKey(
          this.baseUrl,
          this.model,
          input,
        );

      setCachedEmbedding(
        cacheKey,
        embedding,
      );

      results[originalIndex] =
        embedding;
    }

    return results;
  }

  getModel(): string {
    return this.model;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
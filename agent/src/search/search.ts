import {
  OllamaEmbeddingClient,
} from "../embeddings/ollama.js";

import {
  searchVectors,
  type VectorSearchResult,
} from "./vectorIndex.js";

export interface SemanticSearchOptions {
  model?: string;
  limit?: number;
  minScore?: number;
}

export interface SemanticSearchResult
  extends VectorSearchResult {}

export async function semanticSearch(
  repositoryRoot: string,
  query: string,
  options: SemanticSearchOptions = {},
): Promise<SemanticSearchResult[]> {
  if (!query.trim()) {
    throw new Error(
      "Search query cannot be empty",
    );
  }

  const client =
    new OllamaEmbeddingClient({
      model: options.model,
    });

  const embedding =
    await client.embed(query);

  return searchVectors(
    repositoryRoot,
    embedding,
    {
      model: client.getModel(),
      dimensions: embedding.length,
      limit: options.limit ?? 10,
      minScore: options.minScore ?? 0,
    },
  );
}

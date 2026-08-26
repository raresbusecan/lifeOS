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
  extends VectorSearchResult {
  query: string;
}

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

  const client = new OllamaEmbeddingClient({
    model: options.model,
  });

  const embedding = await client.embed(
    query,
  );

  const results = await searchVectors(
    repositoryRoot,
    embedding,
    {
      model: client.getModel(),
      dimensions: embedding.length,
      limit: options.limit ?? 10,
      minScore: options.minScore ?? 0,
    },
  );

  return results.map((result) => ({
    ...result,
    query,
  }));
}

export function formatSemanticSearchResults(
  results: SemanticSearchResult[],
): string {
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
    lines.push(
      `${index + 1}. ${result.score.toFixed(4)} — ${result.path}:${result.startLine}-${result.endLine}`,
    );
  }

  lines.push("");

  return lines.join("\n");
}
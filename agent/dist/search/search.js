import { OllamaEmbeddingClient, } from "../embeddings/ollama.js";
import { searchVectors, } from "./vectorIndex.js";
export async function semanticSearch(repositoryRoot, query, options = {}) {
    if (!query.trim()) {
        throw new Error("Search query cannot be empty");
    }
    const client = new OllamaEmbeddingClient({
        model: options.model,
    });
    const embedding = await client.embed(query);
    return searchVectors(repositoryRoot, embedding, {
        model: client.getModel(),
        dimensions: embedding.length,
        limit: options.limit ?? 10,
        minScore: options.minScore ?? 0,
    });
}

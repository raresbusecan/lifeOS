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

export class OllamaEmbeddingClient {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(options: OllamaClientOptions = {}) {
    this.baseUrl =
      options.baseUrl ??
      process.env.OLLAMA_BASE_URL ??
      "http://localhost:11434";

    this.model =
      options.model ??
      process.env.OLLAMA_EMBED_MODEL ??
      "nomic-embed-text";
  }

  async embed(input: string): Promise<number[]> {
    if (!input.trim()) {
      throw new Error("Cannot create embedding for empty input");
    }

    const response = await fetch(
      `${this.baseUrl}/api/embed`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          input,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();

      throw new Error(
        `Ollama embedding request failed: ${response.status} ${response.statusText}: ${body}`,
      );
    }

    const result =
      (await response.json()) as OllamaEmbedResponse;

    const embedding = result.embeddings?.[0];

    if (!embedding || embedding.length === 0) {
      throw new Error(
        "Ollama returned no embedding",
      );
    }

    return embedding;
  }

  async embedMany(
    inputs: string[],
  ): Promise<number[][]> {
    if (inputs.length === 0) {
      return [];
    }

    const response = await fetch(
      `${this.baseUrl}/api/embed`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          input: inputs,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();

      throw new Error(
        `Ollama embedding request failed: ${response.status} ${response.statusText}: ${body}`,
      );
    }

    const result =
      (await response.json()) as OllamaEmbedResponse;

    if (
      !Array.isArray(result.embeddings) ||
      result.embeddings.length !== inputs.length
    ) {
      throw new Error(
        `Ollama returned ${result.embeddings?.length ?? 0} embeddings for ${inputs.length} inputs`,
      );
    }

    return result.embeddings;
  }

  getModel(): string {
    return this.model;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

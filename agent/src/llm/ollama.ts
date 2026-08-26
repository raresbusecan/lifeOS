export interface OllamaChatMessage {
  role:
    | "system"
    | "user"
    | "assistant"
    | "tool";
  content: string;
  tool_calls?: OllamaToolCall[];
  tool_name?: string;
}

export interface OllamaToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties?: Record<
        string,
        unknown
      >;
      required?: string[];
    };
  };
}

export interface OllamaToolCall {
  id?: string;
  function: {
    index?: number;
    name: string;
    arguments:
      | Record<string, unknown>
      | string;
  };
}

export interface OllamaChatResponse {
  model: string;
  message?: {
    role: string;
    content: string;
    tool_calls?: OllamaToolCall[];
  };
  done?: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaChatClientOptions {
  baseUrl?: string;
  model?: string;
}

export interface OllamaChatWithToolsResult {
  content: string;
  toolCalls: OllamaToolCall[];
}

export class OllamaChatClient {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(
    options: OllamaChatClientOptions = {},
  ) {
    this.baseUrl =
      options.baseUrl ??
      process.env.OLLAMA_BASE_URL ??
      "http://localhost:11434";

    this.model =
      options.model ??
      process.env.OLLAMA_CHAT_MODEL ??
      "qwen3-coder:30b";
  }

  async chat(
    messages: OllamaChatMessage[],
  ): Promise<string> {
    if (messages.length === 0) {
      throw new Error(
        "Cannot send an empty chat",
      );
    }

    const response = await fetch(
      `${this.baseUrl}/api/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
        }),
      },
    );

    if (!response.ok) {
      const body =
        await response.text();

      throw new Error(
        `Ollama chat request failed: ${response.status} ${response.statusText}: ${body}`,
      );
    }

    const result =
      (await response.json()) as OllamaChatResponse;

    const content =
      result.message?.content;

    if (
      typeof content !== "string" ||
      content.length === 0
    ) {
      throw new Error(
        "Ollama returned no chat response",
      );
    }

    return content;
  }

  async chatWithTools(
    messages: OllamaChatMessage[],
    tools: OllamaToolDefinition[],
  ): Promise<OllamaChatWithToolsResult> {
    if (messages.length === 0) {
      throw new Error(
        "Cannot send an empty chat",
      );
    }

    const response = await fetch(
      `${this.baseUrl}/api/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          tools,
          stream: false,
        }),
      },
    );

    if (!response.ok) {
      const body =
        await response.text();

      throw new Error(
        `Ollama chat request failed: ${response.status} ${response.statusText}: ${body}`,
      );
    }

    const result =
      (await response.json()) as OllamaChatResponse;

    return {
      content:
        result.message?.content ?? "",
      toolCalls:
        result.message?.tool_calls ?? [],
    };
  }

  getModel(): string {
    return this.model;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
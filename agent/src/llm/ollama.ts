
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

export type OllamaChatTokenHandler = (
  token: string,
) => void | Promise<void>;

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
    onToken?: OllamaChatTokenHandler,
  ): Promise<string> {
    if (messages.length === 0) {
      throw new Error(
        "Cannot send an empty chat",
      );
    }

    if (onToken) {
      return this.chatStream(
        messages,
        onToken,
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

  async chatStream(
    messages: OllamaChatMessage[],
    onToken: OllamaChatTokenHandler,
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
          Accept: "application/x-ndjson",
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
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

    if (!response.body) {
      throw new Error(
        "Ollama returned an empty response body",
      );
    }

    const reader =
      response.body.getReader();

    const decoder =
      new TextDecoder();

    let buffer = "";
    let content = "";
    let completed = false;

    try {
      while (true) {
        const { value, done } =
          await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(
          value,
          { stream: true },
        );

        const lines =
          buffer.split("\n");

        buffer =
          lines.pop() ?? "";

        for (const line of lines) {
          const trimmed =
            line.trim();

          if (!trimmed) {
            continue;
          }

          const chunk =
            this.parseStreamChunk(
              trimmed,
            );

          if (
            typeof chunk.message
              ?.content !== "string"
          ) {
            if (chunk.done) {
              completed = true;
            }

            continue;
          }

          const token =
            chunk.message.content;

          if (token.length > 0) {
            content += token;

            await onToken(token);
          }

          if (chunk.done) {
            completed = true;
          }
        }
      }

      const remaining =
        buffer.trim();

      if (remaining.length > 0) {
        const chunk =
          this.parseStreamChunk(
            remaining,
          );

        const token =
          chunk.message?.content;

        if (
          typeof token === "string" &&
          token.length > 0
        ) {
          content += token;

          await onToken(token);
        }

        if (chunk.done) {
          completed = true;
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!completed) {
      throw new Error(
        "Ollama chat stream ended before completion",
      );
    }

    if (content.length === 0) {
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

  private parseStreamChunk(
    line: string,
  ): OllamaChatResponse {
    try {
      return JSON.parse(
        line,
      ) as OllamaChatResponse;
    } catch (error) {
      throw new Error(
        `Failed to parse Ollama stream chunk: ${line}`,
        {
          cause: error,
        },
      );
    }
  }

  getModel(): string {
    return this.model;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

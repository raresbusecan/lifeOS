export class OllamaChatClient {
    baseUrl;
    model;
    timeoutMs;
    constructor(options = {}) {
        this.baseUrl =
            options.baseUrl ??
                process.env.OLLAMA_BASE_URL ??
                "http://localhost:11434";
        this.model =
            options.model ??
                process.env.OLLAMA_CHAT_MODEL ??
                "qwen3-coder:30b";
        this.timeoutMs = options.timeoutMs;
    }
    createAbortSignal() {
        if (!this.timeoutMs) {
            return undefined;
        }
        return AbortSignal.timeout(this.timeoutMs);
    }
    wrapAbortError(error) {
        if (error instanceof Error &&
            (error.name === "TimeoutError" ||
                error.name === "AbortError")) {
            return new Error(`Ollama request timed out after ${this.timeoutMs}ms.`);
        }
        return error instanceof Error
            ? error
            : new Error(String(error));
    }
    async chat(messages, onToken) {
        if (messages.length === 0) {
            throw new Error("Cannot send an empty chat");
        }
        if (onToken) {
            return this.chatStream(messages, onToken);
        }
        let response;
        try {
            response = await fetch(`${this.baseUrl}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.model,
                    messages,
                    stream: false,
                    think: false,
                }),
                signal: this.createAbortSignal(),
            });
        }
        catch (error) {
            throw this.wrapAbortError(error);
        }
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Ollama chat request failed: ${response.status} ${response.statusText}: ${body}`);
        }
        const result = (await response.json());
        const content = result.message?.content?.trim();
        if (content) {
            return content;
        }
        const toolCalls = result.message?.tool_calls ?? [];
        if (toolCalls.length > 0) {
            return "";
        }
        const thinking = result.message?.thinking?.trim();
        if (thinking) {
            throw new Error("Ollama returned thinking without a final chat response.");
        }
        throw new Error("Ollama returned no chat response.");
    }
    async chatStream(messages, onToken) {
        if (messages.length === 0) {
            throw new Error("Cannot send an empty chat");
        }
        let response;
        try {
            response = await fetch(`${this.baseUrl}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/x-ndjson",
                },
                body: JSON.stringify({
                    model: this.model,
                    messages,
                    stream: true,
                    think: false,
                }),
                signal: this.createAbortSignal(),
            });
        }
        catch (error) {
            throw this.wrapAbortError(error);
        }
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Ollama chat request failed: ${response.status} ${response.statusText}: ${body}`);
        }
        if (!response.body) {
            throw new Error("Ollama returned an empty response body");
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let content = "";
        let completed = false;
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer =
                    lines.pop() ?? "";
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) {
                        continue;
                    }
                    const chunk = this.parseStreamChunk(trimmed);
                    const token = chunk.message?.content;
                    if (typeof token ===
                        "string" &&
                        token.length > 0) {
                        content += token;
                        await onToken(token);
                    }
                    if (chunk.done) {
                        completed = true;
                    }
                }
            }
            const remaining = buffer.trim();
            if (remaining.length > 0) {
                const chunk = this.parseStreamChunk(remaining);
                const token = chunk.message?.content;
                if (typeof token ===
                    "string" &&
                    token.length > 0) {
                    content += token;
                    await onToken(token);
                }
                if (chunk.done) {
                    completed = true;
                }
            }
        }
        finally {
            reader.releaseLock();
        }
        if (!completed) {
            throw new Error("Ollama chat stream ended before completion");
        }
        if (content.trim().length === 0) {
            throw new Error("Ollama returned no chat response.");
        }
        return content;
    }
    async chatWithTools(messages, tools) {
        if (messages.length === 0) {
            throw new Error("Cannot send an empty chat");
        }
        let response;
        try {
            response = await fetch(`${this.baseUrl}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.model,
                    messages,
                    tools,
                    stream: false,
                    think: false,
                }),
                signal: this.createAbortSignal(),
            });
        }
        catch (error) {
            throw this.wrapAbortError(error);
        }
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Ollama chat request failed: ${response.status} ${response.statusText}: ${body}`);
        }
        const result = (await response.json());
        return {
            content: result.message?.content ?? "",
            toolCalls: result.message?.tool_calls ?? [],
        };
    }
    parseStreamChunk(line) {
        try {
            return JSON.parse(line);
        }
        catch (error) {
            throw new Error(`Failed to parse Ollama stream chunk: ${line}`, {
                cause: error,
            });
        }
    }
    getModel() {
        return this.model;
    }
    getBaseUrl() {
        return this.baseUrl;
    }
}

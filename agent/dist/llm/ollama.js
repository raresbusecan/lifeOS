export class OllamaChatClient {
    baseUrl;
    model;
    constructor(options = {}) {
        this.baseUrl =
            options.baseUrl ??
                process.env.OLLAMA_BASE_URL ??
                "http://localhost:11434";
        this.model =
            options.model ??
                process.env.OLLAMA_CHAT_MODEL ??
                "qwen3-coder:30b";
    }
    async chat(messages) {
        if (messages.length === 0) {
            throw new Error("Cannot send an empty chat");
        }
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                stream: false,
            }),
        });
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Ollama chat request failed: ${response.status} ${response.statusText}: ${body}`);
        }
        const result = (await response.json());
        const content = result.message?.content;
        if (typeof content !== "string" ||
            content.length === 0) {
            throw new Error("Ollama returned no chat response");
        }
        return content;
    }
    async chatWithTools(messages, tools) {
        if (messages.length === 0) {
            throw new Error("Cannot send an empty chat");
        }
        const response = await fetch(`${this.baseUrl}/api/chat`, {
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
        });
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
    getModel() {
        return this.model;
    }
    getBaseUrl() {
        return this.baseUrl;
    }
}

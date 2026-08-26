import { OllamaChatClient, } from "../llm/ollama.js";
export async function rewriteQuery(query, conversation, options = {}) {
    if (!query.trim()) {
        throw new Error("Query cannot be empty");
    }
    if (conversation.length === 0) {
        return query.trim();
    }
    const maxMessages = options.maxMessages ?? 6;
    const recentMessages = conversation.slice(-maxMessages);
    const conversationText = recentMessages
        .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
        .join("\n\n");
    const client = new OllamaChatClient({
        model: options.model,
    });
    const rewritten = await client.chat([
        {
            role: "system",
            content: [
                "You rewrite repository questions for semantic search.",
                "",
                "Use the previous conversation to resolve references such as:",
                "- it",
                "- that",
                "- this",
                "- there",
                "- the previous implementation",
                "- the login",
                "- that file",
                "",
                "Return exactly one standalone search query.",
                "Keep the query concise.",
                "Do not answer the question.",
                "Do not use markdown.",
            ].join("\n"),
        },
        {
            role: "user",
            content: [
                "Previous conversation:",
                "",
                conversationText,
                "",
                "Current question:",
                query,
            ].join("\n"),
        },
    ]);
    const result = rewritten
        .trim()
        .replace(/^["']|["']$/g, "");
    if (!result) {
        return query.trim();
    }
    return result;
}

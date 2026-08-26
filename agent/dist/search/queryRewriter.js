import { OllamaChatClient, } from "../llm/ollama.js";
function needsQueryRewrite(query) {
    const normalized = query
        .trim()
        .toLowerCase();
    if (!normalized) {
        return false;
    }
    const contextualPatterns = [
        /\b(it|this|that|these|those)\b/,
        /\bthere\b/,
        /\bhere\b/,
        /\bthe previous\b/,
        /\bthe above\b/,
        /\bthe same\b/,
        /\bthat file\b/,
        /\bthat implementation\b/,
        /\bthat function\b/,
        /\bthat code\b/,
        /\bthat approach\b/,
        /\bthe login\b/,
        /\band how\b/,
        /\band what\b/,
        /\band where\b/,
        /\band why\b/,
    ];
    return contextualPatterns.some((pattern) => pattern.test(normalized));
}
export async function rewriteQuery(query, conversation, options = {}) {
    if (!query.trim()) {
        throw new Error("Query cannot be empty");
    }
    if (conversation.length === 0) {
        return query.trim();
    }
    if (!needsQueryRewrite(query)) {
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

import { OllamaChatClient, } from "../llm/ollama.js";
import { semanticSearch, } from "../search/semanticSearch.js";
import { buildSearchContext, } from "../search/contextBuilder.js";
import { addMessage, createConversation, loadConversation, } from "./memory.js";
import { buildConversationContext, formatConversationContext, } from "./contextMemory.js";
import { rewriteQuery, } from "../search/queryRewriter.js";
function formatSources(results) {
    return results.map((result) => ({
        chunkId: result.chunkId,
        path: result.path,
        startLine: result.startLine,
        endLine: result.endLine,
        score: result.score,
    }));
}
export async function queryAgent(repositoryRoot, query, options = {}) {
    if (!query.trim()) {
        throw new Error("Query cannot be empty");
    }
    let conversation;
    if (options.conversationId) {
        conversation =
            await loadConversation(repositoryRoot, options.conversationId);
        if (!conversation) {
            throw new Error(`Conversation not found: ${options.conversationId}`);
        }
    }
    else {
        conversation =
            await createConversation(repositoryRoot);
    }
    const searchQuery = await rewriteQuery(query, conversation.messages, {
        model: options.chatModel,
        maxMessages: options.maxMemoryMessages ?? 6,
    });
    const results = await semanticSearch(repositoryRoot, searchQuery, {
        model: options.embeddingModel,
        limit: options.limit ?? 5,
        minScore: options.minScore ?? 0.2,
    });
    const context = await buildSearchContext(repositoryRoot, query, results);
    const conversationContext = buildConversationContext(conversation, {
        maxMessages: options.maxMemoryMessages ?? 12,
        maxCharacters: options.maxMemoryCharacters ??
            12000,
    });
    const chatClient = new OllamaChatClient({
        model: options.chatModel,
    });
    await addMessage(repositoryRoot, conversation.id, "user", query);
    const answer = await chatClient.chat([
        {
            role: "system",
            content: [
                "You are the LifeOS repository assistant.",
                "",
                "Answer questions using only the repository context provided by the user.",
                "Do not invent repository facts.",
                "If the context does not contain enough information, say so clearly.",
                "When useful, mention the relevant file and line range.",
                "",
                "Conversation memory may contain earlier discussion.",
                "Use it to understand follow-up questions, but repository context remains the source of truth.",
            ].join("\n"),
        },
        {
            role: "user",
            content: [
                formatConversationContext(conversationContext),
                "",
                context.text,
            ].join("\n"),
        },
    ]);
    await addMessage(repositoryRoot, conversation.id, "assistant", answer);
    return {
        query,
        answer,
        conversationId: conversation.id,
        sources: formatSources(results),
    };
}

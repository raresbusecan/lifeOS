import { mkdir, readFile, writeFile, } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
function getMemoryDirectory(repositoryRoot) {
    return resolve(repositoryRoot, ".agent", "memory");
}
function getConversationDirectory(repositoryRoot) {
    return resolve(getMemoryDirectory(repositoryRoot), "conversations");
}
function getConversationFile(repositoryRoot, conversationId) {
    return resolve(getConversationDirectory(repositoryRoot), `${conversationId}.json`);
}
function getConversationIndexFile(repositoryRoot) {
    return resolve(getMemoryDirectory(repositoryRoot), "index.json");
}
async function loadConversationIndex(repositoryRoot) {
    const indexFile = getConversationIndexFile(repositoryRoot);
    try {
        const content = await readFile(indexFile, "utf8");
        const index = JSON.parse(content);
        if (index.version === 1) {
            return index;
        }
    }
    catch {
        // Empty memory.
    }
    return {
        version: 1,
        conversations: [],
    };
}
async function saveConversationIndex(repositoryRoot, index) {
    const memoryDirectory = getMemoryDirectory(repositoryRoot);
    await mkdir(memoryDirectory, {
        recursive: true,
    });
    await writeFile(getConversationIndexFile(repositoryRoot), JSON.stringify(index, null, 2) + "\n", "utf8");
}
export async function createConversation(repositoryRoot) {
    const now = new Date().toISOString();
    const conversation = {
        version: 1,
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        messages: [],
    };
    await mkdir(getConversationDirectory(repositoryRoot), {
        recursive: true,
    });
    await saveConversation(repositoryRoot, conversation);
    return conversation;
}
export async function loadConversation(repositoryRoot, conversationId) {
    try {
        const content = await readFile(getConversationFile(repositoryRoot, conversationId), "utf8");
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
export async function saveConversation(repositoryRoot, conversation) {
    const directory = getConversationDirectory(repositoryRoot);
    await mkdir(directory, {
        recursive: true,
    });
    conversation.updatedAt =
        new Date().toISOString();
    await writeFile(getConversationFile(repositoryRoot, conversation.id), JSON.stringify(conversation, null, 2) + "\n", "utf8");
    const index = await loadConversationIndex(repositoryRoot);
    const existing = index.conversations.find((entry) => entry.id === conversation.id);
    const entry = {
        id: conversation.id,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.messages.length,
    };
    if (existing) {
        Object.assign(existing, entry);
    }
    else {
        index.conversations.push(entry);
    }
    index.conversations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    await saveConversationIndex(repositoryRoot, index);
}
export async function addMessage(repositoryRoot, conversationId, role, content) {
    const conversation = await loadConversation(repositoryRoot, conversationId);
    if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
    }
    if (!content.trim()) {
        throw new Error("Conversation message cannot be empty");
    }
    conversation.messages.push({
        role,
        content,
        createdAt: new Date().toISOString(),
    });
    await saveConversation(repositoryRoot, conversation);
    return conversation;
}
export async function listConversations(repositoryRoot) {
    const index = await loadConversationIndex(repositoryRoot);
    return index.conversations;
}

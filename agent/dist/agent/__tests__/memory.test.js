import assert from "node:assert/strict";
import { mkdtemp, rm, } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createConversation, loadConversation, addMessage, listConversations, } from "../memory.js";
const repositoryRoot = await mkdtemp(resolve(tmpdir(), "lifeos-memory-test-"));
try {
    const conversation = await createConversation(repositoryRoot);
    assert.ok(conversation.id);
    assert.equal(conversation.messages.length, 0);
    await addMessage(repositoryRoot, conversation.id, "user", "How does authentication work?");
    await addMessage(repositoryRoot, conversation.id, "assistant", "Authentication uses Laravel Sanctum.");
    const loaded = await loadConversation(repositoryRoot, conversation.id);
    assert.ok(loaded);
    assert.equal(loaded.messages.length, 2);
    assert.equal(loaded.messages[0]?.role, "user");
    assert.equal(loaded.messages[0]?.content, "How does authentication work?");
    assert.equal(loaded.messages[1]?.role, "assistant");
    assert.equal(loaded.messages[1]?.content, "Authentication uses Laravel Sanctum.");
    const conversations = await listConversations(repositoryRoot);
    assert.equal(conversations.length, 1);
    assert.equal(conversations[0]?.id, conversation.id);
    assert.equal(conversations[0]?.messageCount, 2);
    console.log("Conversation memory test passed");
    console.log(`Conversation: ${conversation.id}`);
    console.log(`Messages: ${loaded.messages.length}`);
    console.log(`Stored conversations: ${conversations.length}`);
}
finally {
    await rm(repositoryRoot, {
        recursive: true,
        force: true,
    });
}

import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile, } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { indexSemantic, } from "../../indexer/semanticIndex.js";
import { semanticSearch, } from "../../search/semanticSearch.js";
import { buildSearchContext, } from "../../search/contextBuilder.js";
import { rewriteQuery, } from "../../search/queryRewriter.js";
import { buildConversationContext, formatConversationContext, } from "../contextMemory.js";
import { createConversation, } from "../memory.js";
function measure(name, fn) {
    const start = performance.now();
    return Promise.resolve(fn()).then((value) => ({
        name,
        value,
        milliseconds: performance.now() - start,
    }));
}
const repositoryRoot = await mkdtemp(resolve(tmpdir(), "lifeos-performance-test-"));
try {
    await mkdir(resolve(repositoryRoot, "src"), { recursive: true });
    await writeFile(resolve(repositoryRoot, "src", "auth.ts"), [
        "export function login(username: string, password: string) {",
        "  return authenticate(username, password);",
        "}",
        "",
        "export function logout() {",
        "  clearSession();",
        "}",
        "",
        "export function authenticate(username: string, password: string) {",
        "  return username.length > 0 && password.length > 0;",
        "}",
    ].join("\n"), "utf8");
    await writeFile(resolve(repositoryRoot, "src", "payments.ts"), [
        "export function createPayment(amount: number) {",
        "  return { amount, status: 'pending' };",
        "}",
        "",
        "export function refundPayment(paymentId: string) {",
        "  return { paymentId, status: 'refunded' };",
        "}",
    ].join("\n"), "utf8");
    await writeFile(resolve(repositoryRoot, "src", "users.ts"), [
        "export function createUser(name: string) {",
        "  return { name, active: true };",
        "}",
        "",
        "export function deleteUser(id: string) {",
        "  return { id, deleted: true };",
        "}",
    ].join("\n"), "utf8");
    console.log("\n=== LifeOS Performance Benchmark ===\n");
    const indexMeasurement = await measure("Semantic index", () => indexSemantic(repositoryRoot));
    console.log(`${indexMeasurement.name.padEnd(28)} ${indexMeasurement.milliseconds.toFixed(2)} ms`);
    const conversation = await createConversation(repositoryRoot);
    const query = "Where is the login implemented?";
    const rewriteMeasurement = await measure("Query rewrite", () => rewriteQuery(query, conversation.messages, {
        maxMessages: 6,
    }));
    console.log(`${rewriteMeasurement.name.padEnd(28)} ${rewriteMeasurement.milliseconds.toFixed(2)} ms`);
    const searchMeasurement = await measure("Semantic search", () => semanticSearch(repositoryRoot, rewriteMeasurement.value, {
        limit: 5,
        minScore: 0.2,
    }));
    const cachedSearchMeasurement = await measure("Semantic search (cached)", () => semanticSearch(repositoryRoot, rewriteMeasurement.value, {
        limit: 5,
        minScore: 0.2,
    }));
    assert.deepEqual(cachedSearchMeasurement.value.map((result) => result.chunkId), searchMeasurement.value.map((result) => result.chunkId));
    assert.equal(cachedSearchMeasurement.value.length, searchMeasurement.value.length);
    console.log(`${searchMeasurement.name.padEnd(28)} ${searchMeasurement.milliseconds.toFixed(2)} ms`);
    console.log(`${cachedSearchMeasurement.name.padEnd(28)} ${cachedSearchMeasurement.milliseconds.toFixed(2)} ms`);
    const contextMeasurement = await measure("Context building", () => buildSearchContext(repositoryRoot, query, searchMeasurement.value));
    console.log(`${contextMeasurement.name.padEnd(28)} ${contextMeasurement.milliseconds.toFixed(2)} ms`);
    const conversationContextMeasurement = await measure("Conversation context", () => buildConversationContext(conversation, {
        maxMessages: 12,
        maxCharacters: 12000,
    }));
    console.log(`${conversationContextMeasurement.name.padEnd(28)} ${conversationContextMeasurement.milliseconds.toFixed(2)} ms`);
    console.log("\n=== Query Pipeline ===\n");
    const totalWithoutLlm = rewriteMeasurement.milliseconds +
        searchMeasurement.milliseconds +
        contextMeasurement.milliseconds +
        conversationContextMeasurement.milliseconds;
    console.log(`Query rewrite`.padEnd(28) +
        `${rewriteMeasurement.milliseconds.toFixed(2)} ms`);
    console.log(`Semantic search`.padEnd(28) +
        `${searchMeasurement.milliseconds.toFixed(2)} ms`);
    console.log(`Context building`.padEnd(28) +
        `${contextMeasurement.milliseconds.toFixed(2)} ms`);
    console.log(`Conversation context`.padEnd(28) +
        `${conversationContextMeasurement.milliseconds.toFixed(2)} ms`);
    console.log(`Total (without LLM)`.padEnd(28) +
        `${totalWithoutLlm.toFixed(2)} ms`);
    console.log("\n=== Search Results ===\n");
    console.log(`Rewritten query: ${rewriteMeasurement.value}`);
    console.log(`Sources: ${searchMeasurement.value.length}`);
    for (const result of searchMeasurement.value) {
        console.log(`${result.score.toFixed(4)} — ${result.path}:${result.startLine}-${result.endLine}`);
    }
    console.log("\n=== Benchmark Assertions ===\n");
    assert.ok(indexMeasurement.value.files > 0);
    assert.ok(indexMeasurement.value.chunks > 0);
    assert.ok(rewriteMeasurement.value.length > 0);
    assert.ok(searchMeasurement.value.length > 0);
    assert.ok(cachedSearchMeasurement.value.length > 0);
    assert.ok(contextMeasurement.value.sources.length > 0);
    assert.ok(contextMeasurement.value.text.length > 0);
    assert.ok(conversationContextMeasurement.value);
    const formattedConversation = formatConversationContext(conversationContextMeasurement.value);
    assert.equal(typeof formattedConversation, "string");
    console.log("All performance benchmark assertions passed");
    console.log("\n=== Performance Summary ===\n");
    console.log(`Indexing:           ${indexMeasurement.milliseconds.toFixed(2)} ms`);
    console.log(`Query rewrite:      ${rewriteMeasurement.milliseconds.toFixed(2)} ms`);
    console.log(`Semantic search:    ${searchMeasurement.milliseconds.toFixed(2)} ms`);
    console.log(`Cached search:      ${cachedSearchMeasurement.milliseconds.toFixed(2)} ms`);
    console.log(`Context building:   ${contextMeasurement.milliseconds.toFixed(2)} ms`);
    console.log(`Conversation:       ${conversationContextMeasurement.milliseconds.toFixed(2)} ms`);
    console.log(`Pipeline total:     ${totalWithoutLlm.toFixed(2)} ms`);
}
finally {
    await rm(repositoryRoot, {
        recursive: true,
        force: true,
    });
}

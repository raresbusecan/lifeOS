import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { queryAgent, } from "../query.js";
import { indexSemantic, } from "../../indexer/semanticIndex.js";
const repositoryRoot = await mkdtemp(resolve(tmpdir(), "lifeos-contextual-query-test-"));
try {
    await mkdir(resolve(repositoryRoot, "src"), { recursive: true });
    await writeFile(resolve(repositoryRoot, "src", "auth.ts"), [
        "export function login(username: string, password: string) {",
        "  return authenticate(username, password);",
        "}",
        "",
        "export function authenticate(username: string, password: string) {",
        "  return username.length > 0 && password.length > 0;",
        "}",
        "",
        "export function logout() {",
        "  clearSession();",
        "}",
    ].join("\n"), "utf8");
    await writeFile(resolve(repositoryRoot, "src", "payments.ts"), [
        "export function createPayment(amount: number) {",
        "  return { amount, status: 'pending' };",
        "}",
    ].join("\n"), "utf8");
    console.log("Indexing contextual query repository...");
    const semanticIndex = await indexSemantic(repositoryRoot);
    assert.equal(semanticIndex.files, 2);
    assert.ok(semanticIndex.chunks > 0);
    assert.equal(semanticIndex.vectorsIndexed, semanticIndex.chunks);
    // queryAgent will index the test repository
    // when the semantic index is missing.
    const first = await queryAgent(repositoryRoot, "How does authentication work?", {
        limit: 3,
        minScore: 0.2,
    });
    assert.ok(first.conversationId);
    assert.ok(first.answer);
    assert.ok(first.sources.length > 0);
    console.log("");
    console.log("First question:");
    console.log("How does authentication work?");
    console.log(`Sources: ${first.sources.length}`);
    const second = await queryAgent(repositoryRoot, "Where is the login implemented?", {
        conversationId: first.conversationId,
        limit: 3,
        minScore: 0.2,
    });
    assert.equal(second.conversationId, first.conversationId);
    assert.ok(second.answer);
    assert.ok(second.sources.length > 0);
    const authSource = second.sources.find((source) => source.path === "src/auth.ts");
    assert.ok(authSource, "Expected contextual search to find src/auth.ts");
    console.log("");
    console.log("Second question:");
    console.log("Where is the login implemented?");
    console.log(`Sources: ${second.sources.length}`);
    for (const [index, source] of second.sources.entries()) {
        console.log(`${index + 1}. ${source.path}:${source.startLine}-${source.endLine} — ${source.score.toFixed(4)}`);
    }
    console.log("");
    console.log("Contextual query integration test passed");
}
finally {
    await rm(repositoryRoot, {
        recursive: true,
        force: true,
    });
}

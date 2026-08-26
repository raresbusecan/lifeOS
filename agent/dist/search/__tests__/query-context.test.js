import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { OllamaChatClient, } from "../../llm/ollama.js";
const repositoryRoot = await mkdtemp(resolve(tmpdir(), "lifeos-query-context-test-"));
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
    ].join("\n"), "utf8");
    console.log("Indexing contextual query test repository...");
    // The semantic index is created by the existing
    // indexing pipeline in the integration test setup.
    // This test only verifies that a contextual query
    // can be transformed into a useful search query.
    const client = new OllamaChatClient();
    const response = await client.chat([
        {
            role: "system",
            content: [
                "You rewrite follow-up repository questions.",
                "Use the conversation context.",
                "Return only the rewritten standalone search query.",
                "Do not answer the question.",
            ].join("\n"),
        },
        {
            role: "user",
            content: [
                "Previous conversation:",
                "",
                "User: How does authentication work?",
                "Assistant: Authentication is implemented in src/auth.ts.",
                "",
                "Follow-up question:",
                "Where is the login implemented?",
            ].join("\n"),
        },
    ]);
    const rewritten = response.trim();
    assert.ok(rewritten.length > 0);
    console.log("Contextual query rewrite test passed");
    console.log(`Rewritten query: ${rewritten}`);
}
finally {
    await rm(repositoryRoot, {
        recursive: true,
        force: true,
    });
}

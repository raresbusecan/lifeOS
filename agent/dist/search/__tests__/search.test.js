import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { indexSemantic, } from "../../indexer/semanticIndex.js";
import { semanticSearch, } from "../semanticSearch.js";
const repositoryRoot = await mkdtemp(resolve(tmpdir(), "lifeos-search-test-"));
try {
    await mkdir(resolve(repositoryRoot, "src"), { recursive: true });
    await writeFile(resolve(repositoryRoot, "src", "auth.ts"), [
        "export function authenticateUser(",
        "  username: string,",
        "  password: string,",
        ") {",
        "  return username === 'admin' && password === 'secret';",
        "}",
        "",
        "export function logoutUser() {",
        "  return true;",
        "}",
    ].join("\n"), "utf8");
    await writeFile(resolve(repositoryRoot, "src", "math.ts"), [
        "export function add(a: number, b: number) {",
        "  return a + b;",
        "}",
        "",
        "export function multiply(a: number, b: number) {",
        "  return a * b;",
        "}",
    ].join("\n"), "utf8");
    const indexResult = await indexSemantic(repositoryRoot);
    assert.equal(indexResult.files, 2);
    assert.ok(indexResult.chunks >= 2);
    const results = await semanticSearch(repositoryRoot, "How does user authentication work?", {
        limit: 3,
    });
    assert.ok(results.length > 0);
    assert.equal(results[0]?.path, "src/auth.ts");
    assert.ok((results[0]?.score ?? 0) > 0);
    console.log("Semantic search test passed");
    console.log(`Indexed chunks: ${indexResult.chunks}`);
    console.log(`Results: ${results.length}`);
    for (const result of results) {
        console.log(`${result.score.toFixed(4)} — ${result.path}:${result.startLine}-${result.endLine}`);
    }
}
finally {
    await rm(repositoryRoot, {
        recursive: true,
        force: true,
    });
}

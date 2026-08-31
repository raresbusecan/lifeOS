import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { formatIndexResult, indexRepository, } from "./indexer/fileIndex.js";
import { formatContentIndexResult, indexContent, } from "./indexer/contentIndex.js";
import { formatSemanticIndexResult, indexSemantic, } from "./indexer/semanticIndex.js";
import { startAgentCli, } from "./cli.js";
import { runDcsRuntime } from "./runtime/dcsRuntime.js";
const repositoryRoot = resolve(process.cwd(), "..");
const stateFile = resolve(repositoryRoot, "PROJECT_STATE.md");
const instructionsFile = resolve(repositoryRoot, "AGENTS.md");
const agentDirectory = resolve(repositoryRoot, ".agent");
console.log("");
console.log("LifeOS Agent");
console.log("────────────");
console.log(`Repository: ${repositoryRoot}`);
console.log("Mode: READ_ONLY");
console.log("Model: qwen3-coder:30b");
console.log("Embeddings: nomic-embed-text");
console.log(`Project state: ${existsSync(stateFile)
    ? "OK"
    : "MISSING"}`);
console.log(`Instructions: ${existsSync(instructionsFile)
    ? "OK"
    : "MISSING"}`);
console.log(`Agent workspace: ${existsSync(agentDirectory)
    ? "OK"
    : "MISSING"}`);
console.log("");
const fileIndex = await indexRepository(repositoryRoot);
console.log(formatIndexResult(fileIndex));
const contentIndex = await indexContent(repositoryRoot);
console.log(formatContentIndexResult(contentIndex));
if (!process.argv.includes("--dcs")) {
    console.log("");
    console.log("Starting semantic index...");
    console.log("Ollama: http://localhost:11434");
    console.log("Model: nomic-embed-text");
    console.log("");
    const semanticIndex = await indexSemantic(repositoryRoot);
    console.log(formatSemanticIndexResult(semanticIndex));
}
const dcsMode = process.argv.includes("--dcs");
if (dcsMode) {
    console.log("");
    console.log("Starting DCS runtime...");
    console.log("");
    const result = await runDcsRuntime(repositoryRoot);
    console.log(JSON.stringify(result, null, 2));
}
else {
    await startAgentCli({
        repositoryRoot,
        chatModel: "qwen3-coder:30b",
    });
}

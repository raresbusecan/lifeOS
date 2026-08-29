import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { runAgentLoop } from "../loop.js";
const repositoryRoot = path.resolve(process.cwd(), "tmp-agent-write-test");
const targetPath = "write-test.txt";
const targetFile = path.join(repositoryRoot, targetPath);
await fs.rm(repositoryRoot, {
    recursive: true,
    force: true,
});
await fs.mkdir(repositoryRoot, {
    recursive: true,
});
const result = await runAgentLoop(repositoryRoot, [
    {
        role: "system",
        content: [
            "You are a coding agent.",
            "Use tools when necessary.",
            "When asked to create a file, actually use the write_file tool.",
        ].join(" "),
    },
    {
        role: "user",
        content: [
            `Create the file ${targetPath}.`,
            "Its complete content must be exactly:",
            "ORGOS_WRITE_TEST_OK",
            "After writing it, verify that it exists.",
            "Do not merely describe the action.",
        ].join(" "),
    },
], {
    maxSteps: 6,
});
console.log("Loop result:", result);
const exists = await fs
    .access(targetFile)
    .then(() => true)
    .catch(() => false);
assert.equal(exists, true, "write_file did not create the requested file");
const content = await fs.readFile(targetFile, "utf8");
assert.equal(content, "ORGOS_WRITE_TEST_OK");
assert.ok(result.toolCalls > 0, "Agent did not execute any tool calls");
await fs.rm(repositoryRoot, {
    recursive: true,
    force: true,
});
console.log("Agent write loop test passed");

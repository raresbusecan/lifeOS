import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile, } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { executeListFiles, } from "../listFiles.js";
const repositoryRoot = await mkdtemp(resolve(tmpdir(), "lifeos-list-files-test-"));
try {
    await mkdir(resolve(repositoryRoot, "src"), {
        recursive: true,
    });
    await mkdir(resolve(repositoryRoot, ".git"), {
        recursive: true,
    });
    await mkdir(resolve(repositoryRoot, ".agent"), {
        recursive: true,
    });
    await writeFile(resolve(repositoryRoot, "README.md"), "# LifeOS", "utf8");
    await writeFile(resolve(repositoryRoot, "src", "auth.ts"), "export function login() {}", "utf8");
    const root = await executeListFiles(repositoryRoot, {
        name: "list_files",
        arguments: {},
    });
    assert.equal(root.success, true);
    assert.ok(root.output.includes("README.md"));
    assert.ok(root.output.includes("src/"));
    assert.ok(!root.output.includes(".git"));
    assert.ok(!root.output.includes(".agent"));
    const src = await executeListFiles(repositoryRoot, {
        name: "list_files",
        arguments: {
            path: "src",
        },
    });
    assert.equal(src.success, true);
    assert.ok(src.output.includes("auth.ts"));
    const traversal = await executeListFiles(repositoryRoot, {
        name: "list_files",
        arguments: {
            path: "../",
        },
    });
    assert.equal(traversal.success, false);
    console.log("List files tool test passed");
    console.log("Repository listing: OK");
    console.log("Subdirectory listing: OK");
    console.log("Hidden infrastructure filtering: OK");
    console.log("Path traversal protection: OK");
}
finally {
    await rm(repositoryRoot, {
        recursive: true,
        force: true,
    });
}

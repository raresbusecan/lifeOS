import { createHash, } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync, } from "node:fs";
import { join, relative } from "node:path";
const IGNORED_DIRECTORIES = new Set([
    ".git",
    ".expo",
    ".next",
    ".turbo",
    "node_modules",
    "vendor",
    "dist",
    "build",
    "coverage",
    ".cache",
    "tmp",
    ".agent",
]);
const IGNORED_FILES = new Set([
    ".DS_Store",
]);
const TEXT_EXTENSIONS = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".mdx",
    ".php",
    ".css",
    ".scss",
    ".html",
    ".xml",
    ".yml",
    ".yaml",
    ".env.example",
    ".sql",
    ".sh",
    ".txt",
]);
function isTextFile(filePath) {
    const fileName = filePath.split("/").pop() ?? "";
    if (fileName === ".env.example") {
        return true;
    }
    const extensionIndex = fileName.lastIndexOf(".");
    if (extensionIndex === -1) {
        return false;
    }
    return TEXT_EXTENSIONS.has(fileName.slice(extensionIndex).toLowerCase());
}
function hashFile(filePath) {
    return createHash("sha256")
        .update(readFileSync(filePath))
        .digest("hex");
}
function scanDirectory(repositoryRoot, currentDirectory) {
    const results = [];
    for (const entry of readdirSync(currentDirectory)) {
        if (IGNORED_FILES.has(entry)) {
            continue;
        }
        const absolutePath = join(currentDirectory, entry);
        const stat = lstatSync(absolutePath);
        if (stat.isDirectory()) {
            if (IGNORED_DIRECTORIES.has(entry)) {
                continue;
            }
            results.push(...scanDirectory(repositoryRoot, absolutePath));
            continue;
        }
        if (!stat.isFile() || !isTextFile(absolutePath)) {
            continue;
        }
        results.push({
            path: relative(repositoryRoot, absolutePath),
            absolutePath,
            size: stat.size,
            mtimeMs: stat.mtimeMs,
            sha256: hashFile(absolutePath),
        });
    }
    return results;
}
export function scanRepository(repositoryRoot) {
    if (!existsSync(repositoryRoot)) {
        throw new Error(`Repository does not exist: ${repositoryRoot}`);
    }
    return scanDirectory(repositoryRoot, repositoryRoot).sort((a, b) => a.path.localeCompare(b.path));
}

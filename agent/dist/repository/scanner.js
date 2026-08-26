import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve, relative, extname } from "node:path";
import fg from "fast-glob";
const EXTENSIONS = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".json": "json",
    ".php": "php",
    ".md": "markdown",
    ".css": "css",
    ".scss": "scss",
    ".html": "html",
    ".yml": "yaml",
    ".yaml": "yaml",
    ".sql": "sql",
};
function detectLanguage(path) {
    return EXTENSIONS[extname(path).toLowerCase()] ?? "unknown";
}
async function sha256(filePath) {
    const content = await readFile(filePath);
    return createHash("sha256")
        .update(content)
        .digest("hex");
}
export async function scanRepository(repositoryRoot) {
    const absoluteRoot = resolve(repositoryRoot);
    const files = await fg([
        "**/*.{ts,tsx,js,jsx,php,json,md,css,scss,html,yml,yaml,sql}",
        "!**/node_modules/**",
        "!**/vendor/**",
        "!**/.git/**",
        "!**/.expo/**",
        "!**/dist/**",
        "!**/.agent/**",
    ], {
        cwd: absoluteRoot,
        onlyFiles: true,
        dot: true,
        unique: true,
    });
    const entries = [];
    for (const file of files) {
        const absolutePath = resolve(absoluteRoot, file);
        const fileStat = await stat(absolutePath);
        entries.push({
            path: relative(absoluteRoot, absolutePath),
            size: fileStat.size,
            mtimeMs: fileStat.mtimeMs,
            sha256: await sha256(absolutePath),
            language: detectLanguage(file),
            indexedAt: new Date().toISOString(),
        });
    }
    return entries.sort((a, b) => a.path.localeCompare(b.path));
}

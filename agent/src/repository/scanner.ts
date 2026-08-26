import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve, relative, extname } from "node:path";
import fg from "fast-glob";

export interface FileIndexEntry {
  path: string;
  size: number;
  mtimeMs: number;
  sha256: string;
  language: string;
  indexedAt: string;
}

const EXTENSIONS: Record<string, string> = {
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

function detectLanguage(path: string): string {
  return EXTENSIONS[extname(path).toLowerCase()] ?? "unknown";
}

async function sha256(filePath: string): Promise<string> {
  const content = await readFile(filePath);

  return createHash("sha256")
    .update(content)
    .digest("hex");
}

export async function scanRepository(
  repositoryRoot: string,
): Promise<FileIndexEntry[]> {
  const absoluteRoot = resolve(repositoryRoot);

  const files = await fg(
    [
      "**/*.{ts,tsx,js,jsx,php,json,md,css,scss,html,yml,yaml,sql}",
      "!**/node_modules/**",
      "!**/vendor/**",
      "!**/.git/**",
      "!**/.expo/**",
      "!**/dist/**",
      "!**/.agent/**",
    ],
    {
      cwd: absoluteRoot,
      onlyFiles: true,
      dot: true,
      unique: true,
    },
  );

  const entries: FileIndexEntry[] = [];

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

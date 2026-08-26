import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ContentChunk } from "./chunker.js";
import { chunkContent } from "./chunker.js";

export interface ContentCacheEntry {
  version: 1;
  path: string;
  contentHash: string;
  chunks: ContentChunk[];
  cachedAt: string;
}

function hashContent(content: string): string {
  return createHash("sha256")
    .update(content)
    .digest("hex");
}

export async function getOrCreateContentCache(
  repositoryRoot: string,
  path: string,
  content: string,
): Promise<{
  entry: ContentCacheEntry;
  reused: boolean;
}> {
  const contentHash = hashContent(content);

  const cacheDirectory = resolve(
    repositoryRoot,
    ".agent",
    "cache",
    "content",
  );

  const cacheFile = resolve(
    cacheDirectory,
    `${contentHash}.json`,
  );

  try {
    const cached = JSON.parse(
      await readFile(cacheFile, "utf8"),
    ) as ContentCacheEntry;

    if (
      cached.version === 1 &&
      cached.contentHash === contentHash &&
      cached.path === path
    ) {
      return {
        entry: cached,
        reused: true,
      };
    }
  } catch {
    // Cache miss. Generate the entry below.
  }

  const chunks = chunkContent(path, content);

  const entry: ContentCacheEntry = {
    version: 1,
    path,
    contentHash,
    chunks,
    cachedAt: new Date().toISOString(),
  };

  await mkdir(cacheDirectory, {
    recursive: true,
  });

  await writeFile(
    cacheFile,
    JSON.stringify(entry, null, 2) + "\n",
    "utf8",
  );

  return {
    entry,
    reused: false,
  };
}

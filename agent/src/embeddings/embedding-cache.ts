import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { resolve } from "node:path";

export interface EmbeddingCacheEntry {
  version: 1;
  chunkId: string;
  contentHash: string;
  model: string;
  dimensions: number;
  embedding: number[];
  cachedAt: string;
}

interface EmbeddingCacheFile {
  version: 1;
  model: string;
  dimensions: number;
  updatedAt: string;
  entries: Record<string, EmbeddingCacheEntry>;
}

async function loadCache(
  cacheFile: string,
  model: string,
  dimensions: number,
): Promise<EmbeddingCacheFile> {
  try {
    const content = await readFile(
      cacheFile,
      "utf8",
    );

    const cache =
      JSON.parse(content) as EmbeddingCacheFile;

    if (
      cache.version === 1 &&
      cache.model === model &&
      cache.dimensions === dimensions
    ) {
      return cache;
    }
  } catch {
    // Cache miss.
  }

  return {
    version: 1,
    model,
    dimensions,
    updatedAt: new Date().toISOString(),
    entries: {},
  };
}

export async function getEmbeddingCacheEntry(
  repositoryRoot: string,
  chunkId: string,
  contentHash: string,
  model: string,
  dimensions: number,
): Promise<EmbeddingCacheEntry | null> {
  const cacheFile = resolve(
    repositoryRoot,
    ".agent",
    "cache",
    "embeddings",
    "index.json",
  );

  const cache = await loadCache(
    cacheFile,
    model,
    dimensions,
  );

  const entry = cache.entries[chunkId];

  if (
    !entry ||
    entry.contentHash !== contentHash ||
    entry.model !== model ||
    entry.dimensions !== dimensions
  ) {
    return null;
  }

  return entry;
}

export async function saveEmbeddingCacheEntry(
  repositoryRoot: string,
  entry: EmbeddingCacheEntry,
): Promise<void> {
  const cacheDirectory = resolve(
    repositoryRoot,
    ".agent",
    "cache",
    "embeddings",
  );

  const cacheFile = resolve(
    cacheDirectory,
    "index.json",
  );

  const cache = await loadCache(
    cacheFile,
    entry.model,
    entry.dimensions,
  );

  cache.entries[entry.chunkId] = entry;
  cache.updatedAt = new Date().toISOString();

  await mkdir(cacheDirectory, {
    recursive: true,
  });

  await writeFile(
    cacheFile,
    JSON.stringify(cache, null, 2) + "\n",
    "utf8",
  );
}

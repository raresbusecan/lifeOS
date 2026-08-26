import { resolve } from "node:path";

import {
  loadFileCache,
  saveFileCache,
} from "../cache/fileCache.js";

import {
  scanRepository,
  type FileIndexEntry,
} from "../repository/scanner.js";

export interface IndexResult {
  scanned: number;
  cacheHits: number;
  added: number;
  changed: number;
  removed: number;
}

export async function indexRepository(
  repositoryRoot: string,
): Promise<IndexResult> {
  const cacheFile = resolve(
    repositoryRoot,
    ".agent",
    "cache",
    "files",
    "index.json",
  );

  const cache = loadFileCache(cacheFile);

  const scannedFiles = await scanRepository(
    repositoryRoot,
  );

  const currentPaths = new Set(
    scannedFiles.map((file) => file.path),
  );

  let cacheHits = 0;
  let added = 0;
  let changed = 0;

  for (const file of scannedFiles) {
    const previous = cache.files[file.path];

    if (
      previous &&
      previous.sha256 === file.sha256 &&
      previous.size === file.size &&
      previous.mtimeMs === file.mtimeMs
    ) {
      cacheHits++;
      continue;
    }

    if (previous) {
      changed++;
    } else {
      added++;
    }

    cache.files[file.path] = file;
  }

  let removed = 0;

  for (const path of Object.keys(cache.files)) {
    if (!currentPaths.has(path)) {
      delete cache.files[path];
      removed++;
    }
  }

  saveFileCache(cacheFile, cache);

  return {
    scanned: scannedFiles.length,
    cacheHits,
    added,
    changed,
    removed,
  };
}

export function formatIndexResult(
  result: IndexResult,
): string {
  return [
    "",
    "LifeOS Agent — File Index",
    "──────────────────────────",
    "",
    `Files scanned: ${result.scanned}`,
    `Cache hits:    ${result.cacheHits}`,
    `New files:     ${result.added}`,
    `Changed files: ${result.changed}`,
    `Removed files: ${result.removed}`,
    "",
  ].join("\n");
}

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  getOrCreateContentCache,
} from "../repository/content-cache.js";

import {
  scanRepository,
} from "../repository/scanner.js";

export interface ContentIndexResult {
  files: number;
  chunks: number;
  cacheHits: number;
  indexed: number;
}

export async function indexContent(
  repositoryRoot: string,
): Promise<ContentIndexResult> {
  const files = await scanRepository(repositoryRoot);

  let chunks = 0;
  let cacheHits = 0;
  let indexed = 0;

  for (const file of files) {
    const absolutePath = resolve(
      repositoryRoot,
      file.path,
    );

    const content = await readFile(
      absolutePath,
      "utf8",
    );

    const result = await getOrCreateContentCache(
      repositoryRoot,
      file.path,
      content,
    );

    chunks += result.entry.chunks.length;

    if (result.reused) {
      cacheHits++;
    } else {
      indexed++;
    }
  }

  return {
    files: files.length,
    chunks,
    cacheHits,
    indexed,
  };
}

export function formatContentIndexResult(
  result: ContentIndexResult,
): string {
  return [
    "",
    "LifeOS Agent — Content Index",
    "─────────────────────────────",
    "",
    `Files:       ${result.files}`,
    `Chunks:      ${result.chunks}`,
    `Cache hits:  ${result.cacheHits}`,
    `Indexed:     ${result.indexed}`,
    "",
  ].join("\n");
}

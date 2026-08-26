import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

import type { FileIndexEntry } from "../repository/scanner.js";

export interface FileCache {
  version: 1;
  files: Record<string, FileIndexEntry>;
}

export function loadFileCache(cacheFile: string): FileCache {
  if (!existsSync(cacheFile)) {
    return {
      version: 1,
      files: {},
    };
  }

  return JSON.parse(
    readFileSync(cacheFile, "utf8"),
  ) as FileCache;
}

export function saveFileCache(
  cacheFile: string,
  cache: FileCache,
): void {
  mkdirSync(dirname(cacheFile), {
    recursive: true,
  });

  writeFileSync(
    cacheFile,
    JSON.stringify(cache, null, 2) + "\n",
    "utf8",
  );
}

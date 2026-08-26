import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chunkContent } from "./chunker.js";
function hashContent(content) {
    return createHash("sha256")
        .update(content)
        .digest("hex");
}
export async function getOrCreateContentCache(repositoryRoot, path, content) {
    const contentHash = hashContent(content);
    const cacheDirectory = resolve(repositoryRoot, ".agent", "cache", "content");
    const cacheFile = resolve(cacheDirectory, `${contentHash}.json`);
    try {
        const cached = JSON.parse(await readFile(cacheFile, "utf8"));
        if (cached.version === 1 &&
            cached.contentHash === contentHash &&
            cached.path === path) {
            return {
                entry: cached,
                reused: true,
            };
        }
    }
    catch {
        // Cache miss. Generate the entry below.
    }
    const chunks = chunkContent(path, content);
    const entry = {
        version: 1,
        path,
        contentHash,
        chunks,
        cachedAt: new Date().toISOString(),
    };
    await mkdir(cacheDirectory, {
        recursive: true,
    });
    await writeFile(cacheFile, JSON.stringify(entry, null, 2) + "\n", "utf8");
    return {
        entry,
        reused: false,
    };
}

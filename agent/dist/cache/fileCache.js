import { existsSync, mkdirSync, readFileSync, writeFileSync, } from "node:fs";
import { dirname } from "node:path";
export function loadFileCache(cacheFile) {
    if (!existsSync(cacheFile)) {
        return {
            version: 1,
            files: {},
        };
    }
    return JSON.parse(readFileSync(cacheFile, "utf8"));
}
export function saveFileCache(cacheFile, cache) {
    mkdirSync(dirname(cacheFile), {
        recursive: true,
    });
    writeFileSync(cacheFile, JSON.stringify(cache, null, 2) + "\n", "utf8");
}

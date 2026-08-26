import { readFile, } from "node:fs/promises";
import { resolve, relative, isAbsolute, } from "node:path";
export const readFileTool = {
    name: "read_file",
    description: "Read a text file from the repository.",
};
export async function executeReadFile(repositoryRoot, call) {
    const requestedPath = call.arguments.path;
    if (typeof requestedPath !== "string" ||
        !requestedPath.trim()) {
        return {
            success: false,
            output: "read_file requires a non-empty 'path' argument.",
        };
    }
    if (isAbsolute(requestedPath)) {
        return {
            success: false,
            output: "Absolute paths are not allowed.",
        };
    }
    const absolutePath = resolve(repositoryRoot, requestedPath);
    const relativePath = relative(repositoryRoot, absolutePath);
    if (relativePath.startsWith("..") ||
        isAbsolute(relativePath)) {
        return {
            success: false,
            output: "Path must remain inside the repository.",
        };
    }
    try {
        const content = await readFile(absolutePath, "utf8");
        return {
            success: true,
            output: content,
        };
    }
    catch (error) {
        return {
            success: false,
            output: error instanceof Error
                ? error.message
                : "Failed to read file.",
        };
    }
}

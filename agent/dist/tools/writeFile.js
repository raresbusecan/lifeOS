import { mkdir, writeFile, } from "node:fs/promises";
import { resolve, relative, isAbsolute, dirname, } from "node:path";
export const writeFileTool = {
    name: "write_file",
    description: "Create or overwrite a text file inside the repository. The path must be repository-relative.",
};
export async function executeWriteFile(repositoryRoot, call) {
    const requestedPath = call.arguments.path;
    const content = call.arguments.content;
    if (typeof requestedPath !== "string" ||
        !requestedPath.trim()) {
        return {
            success: false,
            output: "write_file requires a non-empty 'path' argument.",
        };
    }
    if (typeof content !== "string") {
        return {
            success: false,
            output: "write_file requires a string 'content' argument.",
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
        await mkdir(dirname(absolutePath), {
            recursive: true,
        });
        await writeFile(absolutePath, content, "utf8");
        return {
            success: true,
            output: `File written successfully: ${relativePath}`,
        };
    }
    catch (error) {
        return {
            success: false,
            output: error instanceof Error
                ? error.message
                : "Failed to write file.",
        };
    }
}

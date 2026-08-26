import { readFileTool, executeReadFile, } from "./readFile.js";
import { listFilesTool, executeListFiles, } from "./listFiles.js";
const tools = [
    {
        definition: readFileTool,
        execute: executeReadFile,
    },
    {
        definition: listFilesTool,
        execute: executeListFiles,
    },
];
export function listTools() {
    return tools.map((tool) => tool.definition);
}
export function getTool(name) {
    return tools.find((tool) => tool.definition.name === name);
}
export async function executeTool(repositoryRoot, call) {
    const tool = getTool(call.name);
    if (!tool) {
        return {
            success: false,
            output: `Unknown tool: ${call.name}`,
        };
    }
    return tool.execute(repositoryRoot, call);
}

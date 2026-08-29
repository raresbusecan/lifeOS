import type {
  ToolCall,
  ToolDefinition,
  ToolResult,
} from "./types.js";

import {
  readFileTool,
  executeReadFile,
} from "./readFile.js";

import {
  listFilesTool,
  executeListFiles,
} from "./listFiles.js";

import {
  writeFileTool,
  executeWriteFile,
} from "./writeFile.js";

export interface RegisteredTool {
  definition: ToolDefinition;
  execute: (
    repositoryRoot: string,
    call: ToolCall,
  ) => Promise<ToolResult>;
}

const tools: RegisteredTool[] = [
  {
    definition: readFileTool,
    execute: executeReadFile,
  },
  {
    definition: listFilesTool,
    execute: executeListFiles,
  },
  {
    definition: writeFileTool,
    execute: executeWriteFile,
  },
];

export function listTools(): ToolDefinition[] {
  return tools.map(
    (tool) => tool.definition,
  );
}

export function getTool(
  name: string,
): RegisteredTool | undefined {
  return tools.find(
    (tool) =>
      tool.definition.name === name,
  );
}

export async function executeTool(
  repositoryRoot: string,
  call: ToolCall,
): Promise<ToolResult> {
  const tool = getTool(call.name);

  if (!tool) {
    return {
      success: false,
      output:
        `Unknown tool: ${call.name}`,
    };
  }

  return tool.execute(
    repositoryRoot,
    call,
  );
}

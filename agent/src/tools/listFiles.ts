import {
  readdir,
} from "node:fs/promises";

import {
  resolve,
  relative,
} from "node:path";

import type {
  ToolDefinition,
  ToolCall,
  ToolResult,
} from "./types.js";

export const listFilesTool: ToolDefinition = {
  name: "list_files",
  description:
    "List files and directories inside the repository.",
};

export async function executeListFiles(
  repositoryRoot: string,
  call: ToolCall,
): Promise<ToolResult> {
  const requestedPath =
    call.arguments.path;

  const directory =
    typeof requestedPath === "string" &&
    requestedPath.trim()
      ? requestedPath
      : ".";

  const absolutePath =
    resolve(
      repositoryRoot,
      directory,
    );

  const relativePath =
    relative(
      repositoryRoot,
      absolutePath,
    );

  if (
    relativePath.startsWith("..")
  ) {
    return {
      success: false,
      output:
        "Path must remain inside the repository.",
    };
  }

  try {
    const entries =
      await readdir(
        absolutePath,
        {
          withFileTypes: true,
        },
      );

    const visibleEntries =
      entries
        .filter(
          (entry) =>
            entry.name !== ".git" &&
            entry.name !== ".agent",
        )
        .map(
          (entry) =>
            entry.isDirectory()
              ? `${entry.name}/`
              : entry.name,
        )
        .sort();

    return {
      success: true,
      output:
        visibleEntries.join("\n"),
    };
  } catch (error) {
    return {
      success: false,
      output:
        error instanceof Error
          ? error.message
          : "Failed to list directory.",
    };
  }
}

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  SemanticSearchResult,
} from "./semanticSearch.js";

export interface ContextSource {
  chunkId: string;
  path: string;
  startLine: number;
  endLine: number;
  score: number;
  content: string;
}

export interface SearchContext {
  query: string;
  sources: ContextSource[];
  text: string;
}

export async function buildSearchContext(
  repositoryRoot: string,
  query: string,
  results: SemanticSearchResult[],
): Promise<SearchContext> {
  const sources: ContextSource[] = [];

  for (const result of results) {
    const absolutePath = resolve(
      repositoryRoot,
      result.path,
    );

    const content = await readFile(
      absolutePath,
      "utf8",
    );

    const lines = content.split(/\r?\n/);

    const start =
      Math.max(result.startLine - 1, 0);

    const end =
      Math.min(result.endLine, lines.length);

    const chunkContent =
      lines.slice(start, end).join("\n");

    sources.push({
      chunkId: result.chunkId,
      path: result.path,
      startLine: result.startLine,
      endLine: result.endLine,
      score: result.score,
      content: chunkContent,
    });
  }

  const sections = sources.map(
    (source, index) =>
      [
        `### Source ${index + 1}`,
        `File: ${source.path}`,
        `Lines: ${source.startLine}-${source.endLine}`,
        `Score: ${source.score.toFixed(4)}`,
        "",
        "```",
        source.content,
        "```",
      ].join("\n"),
  );

  const text = [
    `User query: ${query}`,
    "",
    "Relevant repository context:",
    "",
    sections.join("\n\n"),
  ].join("\n");

  return {
    query,
    sources,
    text,
  };
}

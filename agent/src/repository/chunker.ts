import { createHash } from "node:crypto";

export interface ContentChunk {
  chunkId: string;
  path: string;
  startLine: number;
  endLine: number;
  content: string;
  contentHash: string;
}

export interface ChunkOptions {
  maxLines?: number;
  overlapLines?: number;
}

function hashContent(content: string): string {
  return createHash("sha256")
    .update(content)
    .digest("hex");
}

export function chunkContent(
  path: string,
  content: string,
  options: ChunkOptions = {},
): ContentChunk[] {
  const maxLines = options.maxLines ?? 80;
  const overlapLines = options.overlapLines ?? 10;

  const lines = content.split(/\r?\n/);

  if (lines.length === 0) {
    return [];
  }

  const chunks: ContentChunk[] = [];

  let start = 0;

  while (start < lines.length) {
    const end = Math.min(
      start + maxLines,
      lines.length,
    );

    const chunkLines = lines.slice(start, end);
    const chunkContent = chunkLines.join("\n");

    const contentHash = hashContent(chunkContent);

    chunks.push({
      chunkId: `${path}:${start + 1}-${end}:${contentHash.slice(0, 12)}`,
      path,
      startLine: start + 1,
      endLine: end,
      content: chunkContent,
      contentHash,
    });

    if (end >= lines.length) {
      break;
    }

    start = Math.max(
      end - overlapLines,
      start + 1,
    );
  }

  return chunks;
}

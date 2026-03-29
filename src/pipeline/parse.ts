import matter from "gray-matter";

import { GstackFrontmatter } from "../schemas/gstack.js";
import type { GstackFrontmatter as GstackFrontmatterType } from "../schemas/gstack.js";

export class ConversionError extends Error {
  constructor(
    message: string,
    public filepath?: string,
    public line?: number,
  ) {
    super(message);
    this.name = "ConversionError";
  }
}

export interface ParsedSkill {
  data: GstackFrontmatterType;
  content: string;
  filepath: string;
}

function extractYamlErrorLine(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "mark" in error &&
    typeof (error as { mark?: { line?: number } }).mark?.line === "number"
  ) {
    return ((error as { mark: { line: number } }).mark.line ?? 0) + 1;
  }

  return undefined;
}

export function parseSkill(source: string, filepath: string): ParsedSkill {
  if (!source.trimStart().startsWith("---")) {
    throw new ConversionError(
      `Missing YAML frontmatter in ${filepath}`,
      filepath,
      1,
    );
  }

  let parsed;
  try {
    parsed = matter(source);
  } catch (error) {
    const line = extractYamlErrorLine(error);
    const detail = error instanceof Error ? error.message : "Unknown YAML error";
    throw new ConversionError(
      `Malformed YAML frontmatter in ${filepath}: ${detail}`,
      filepath,
      line,
    );
  }

  const result = GstackFrontmatter.safeParse(parsed.data);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join(".") : "frontmatter";
        return `  - ${path}: ${issue.message}`;
      })
      .join("\n");

    throw new ConversionError(
      `Invalid gstack frontmatter in ${filepath}:\n${errors}`,
      filepath,
    );
  }

  return {
    data: result.data,
    content: parsed.content,
    filepath,
  };
}

import { stringify } from "yaml";

import type { CopilotFrontmatter } from "../schemas/copilot.js";

export interface OutputOptions {
  trimTrailingWhitespace?: boolean;
}

export function generateOutput(
  frontmatter: CopilotFrontmatter,
  content: string,
  options: OutputOptions = {},
): string {
  const orderedFrontmatter: CopilotFrontmatter = {
    name: frontmatter.name,
    description: frontmatter.description,
    "argument-hint": frontmatter["argument-hint"],
    "allowed-tools": frontmatter["allowed-tools"],
  };

  const yamlStr = stringify(orderedFrontmatter, {
    lineWidth: 0,
  });

  const normalizedContent = content.replace(/^\s*\n/, "");
  const finalContent = options.trimTrailingWhitespace
    ? normalizedContent.trimEnd()
    : normalizedContent;

  return `---\n${yamlStr}---\n\n${finalContent}`;
}

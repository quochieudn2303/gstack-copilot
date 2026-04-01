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
  const orderedFrontmatter: Record<string, unknown> = {
    name: frontmatter.name,
    description: frontmatter.description,
  };

  if (typeof frontmatter["user-invocable"] === "boolean") {
    orderedFrontmatter["user-invocable"] = frontmatter["user-invocable"];
  }

  if (typeof frontmatter["disable-model-invocation"] === "boolean") {
    orderedFrontmatter["disable-model-invocation"] =
      frontmatter["disable-model-invocation"];
  }

  if (frontmatter["argument-hint"]) {
    orderedFrontmatter["argument-hint"] = frontmatter["argument-hint"];
  }

  if (frontmatter["allowed-tools"]) {
    orderedFrontmatter["allowed-tools"] = frontmatter["allowed-tools"];
  }

  const yamlStr = stringify(orderedFrontmatter, {
    lineWidth: 0,
  });

  const normalizedContent = content.replace(/^\s*\n/, "");
  const finalContent = options.trimTrailingWhitespace
    ? normalizedContent.trimEnd()
    : normalizedContent;

  return `---\n${yamlStr}---\n\n${finalContent}`;
}

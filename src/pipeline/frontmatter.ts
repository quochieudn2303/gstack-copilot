import { mapTools } from "../mappings/tools.js";
import { CopilotFrontmatter as CopilotSchema } from "../schemas/copilot.js";
import type { CopilotFrontmatter } from "../schemas/copilot.js";
import type { GstackFrontmatter } from "../schemas/gstack.js";

function normalizeDescription(description: string): string {
  const flattened = description.replace(/\s+/g, " ").trim();

  if (flattened.length <= 200) {
    return flattened;
  }

  return `${flattened.slice(0, 197)}...`;
}

export function transformFrontmatter(
  source: GstackFrontmatter,
): CopilotFrontmatter {
  const output = {
    name: `gstack-${source.name}`,
    description: normalizeDescription(source.description),
    "argument-hint": "[options]",
    "allowed-tools": mapTools(source["allowed-tools"]).join(", "),
  };

  return CopilotSchema.parse(output);
}

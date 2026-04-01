import { mapTools } from "../mappings/tools.js";
import { CopilotFrontmatter as CopilotSchema } from "../schemas/copilot.js";
import type { CopilotFrontmatter } from "../schemas/copilot.js";
import type { GstackFrontmatter } from "../schemas/gstack.js";

export interface TransformFrontmatterOptions {
  includeArgumentHint?: boolean;
  argumentHint?: string;
  userInvocable?: boolean;
  disableModelInvocation?: boolean;
}

function normalizeDescription(description: string): string {
  const flattened = description.replace(/\s+/g, " ").trim();

  if (flattened.length <= 200) {
    return flattened;
  }

  return `${flattened.slice(0, 197)}...`;
}

export function transformFrontmatter(
  source: GstackFrontmatter,
  options: TransformFrontmatterOptions = {},
): CopilotFrontmatter {
  const output: CopilotFrontmatter = {
    name: `gstack-${source.name}`,
    description: normalizeDescription(source.description),
    "allowed-tools": mapTools(source["allowed-tools"]).join(", "),
  };

  if (options.includeArgumentHint ?? true) {
    output["argument-hint"] = options.argumentHint ?? "[options]";
  }

  if (typeof options.userInvocable === "boolean") {
    output["user-invocable"] = options.userInvocable;
  }

  if (typeof options.disableModelInvocation === "boolean") {
    output["disable-model-invocation"] = options.disableModelInvocation;
  }

  return CopilotSchema.parse(output);
}

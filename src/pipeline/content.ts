import { transformPath } from "../mappings/paths.js";
import { transformEnvVarsStage } from "./transforms/envvars.js";
import { ConversionError } from "./parse.js";

const COPILOT_PREAMBLE = `## Initialization

\`\`\`powershell
# gstack-copilot initialization
$GSTACK_COPILOT_ROOT = "$env:USERPROFILE\\.gstack-copilot"
$GSTACK_COPILOT_BIN = "$GSTACK_COPILOT_ROOT\\bin"
\`\`\``;

const PREAMBLE_PATTERN = /## Preamble \(run first\)\s*\r?\n\r?\n```bash[\s\S]*?```/;

const UNSUPPORTED_CONSTRUCTS = [
  {
    pattern: /\bsource\s+<\(/,
    message:
      "Unsupported Bash process substitution. Translate this construct before conversion.",
  },
];

function findLineNumber(content: string, index: number): number {
  return content.slice(0, index).split(/\r?\n/).length;
}

function assertSupportedContent(content: string, filepath?: string): void {
  for (const construct of UNSUPPORTED_CONSTRUCTS) {
    const match = construct.pattern.exec(content);
    if (!match || typeof match.index !== "number") {
      continue;
    }

    throw new ConversionError(
      construct.message,
      filepath,
      findLineNumber(content, match.index),
    );
  }
}

export function transformContent(content: string, filepath?: string): string {
  assertSupportedContent(content, filepath);

  // Transform pipeline:
  // 1. Replace gstack preamble with Copilot initialization
  let result = content.replace(PREAMBLE_PATTERN, COPILOT_PREAMBLE);

  // 2. Transform paths (gstack -> gstack-copilot paths)
  result = transformPath(result);

  // 3. Transform environment variables (Bash -> PowerShell syntax)
  result = transformEnvVarsStage(result);

  return result;
}

import { transformPath } from "../mappings/paths.js";
import { transformEnvVarsStage } from "./transforms/envvars.js";
import { transformCommandsStage } from "./transforms/commands.js";
import { transformProcessSubstitutionStage } from "./transforms/process-substitution.js";
import { transformShellIdiomsStage, transformBashBlockIdioms } from "./transforms/shell-idioms.js";

const COPILOT_PREAMBLE = `## Initialization

\`\`\`powershell
# gstack-copilot initialization
$GSTACK_COPILOT_ROOT = "$env:USERPROFILE\\.gstack-copilot"
$GSTACK_COPILOT_BIN = "$GSTACK_COPILOT_ROOT\\bin"
\`\`\``;

const PREAMBLE_PATTERN = /## Preamble \(run first\)\s*\r?\n\r?\n```bash[\s\S]*?```/;

/**
 * Transform content pipeline
 *
 * The transform order is critical to avoid conflicts between stages:
 *
 * 1. **Preamble replacement** - Remove gstack preamble entirely (it contains
 *    process substitution patterns we replace with a cleaner initialization)
 *
 * 2. **Process substitution** - Transform `source <(cmd)` patterns to explicit
 *    two-step PowerShell. Must happen before other transforms to handle the
 *    complex nested structures.
 *
 * 3. **Shell idioms** - Transform default values (${VAR:-default}), redirections
 *    (2>/dev/null), and other shell-specific syntax.
 *
 * 4. **Environment variables** - Transform $VAR and ${VAR} to $env:VAR.
 *    Must happen after shell idioms so default value syntax is already transformed.
 *
 * 5. **Commands** - Transform bash/sh code blocks and UNIX utilities to PowerShell.
 *    Runs last because it needs the other transforms applied first.
 *
 * 6. **Paths** - Transform gstack paths to gstack-copilot paths.
 *    Can run at any point but kept here for consistency with Phase 1.
 *
 * @param content - Source content (gstack SKILL.md)
 * @param filepath - Optional filepath for error messages
 * @returns Transformed content (Copilot SKILL.md)
 */
export function transformContent(content: string, filepath?: string): string {
  // Transform pipeline (order matters!)

  // 1. Replace gstack preamble with Copilot initialization
  // This removes the process substitution patterns in the preamble
  let result = content.replace(PREAMBLE_PATTERN, COPILOT_PREAMBLE);

  // 2. Transform any remaining process substitution patterns
  // (in case they exist outside the preamble)
  result = transformProcessSubstitutionStage(result);

  // 3. Transform shell idioms (default values, redirections)
  result = transformShellIdiomsStage(result);

  // 4. Transform paths (gstack -> gstack-copilot paths)
  result = transformPath(result);

  // 5. Transform environment variables (Bash -> PowerShell syntax)
  result = transformEnvVarsStage(result);

  // 6. Transform commands in bash blocks to PowerShell
  // This also applies bash block idioms (&&, ||) within blocks
  result = transformCommandsWithIdioms(result);

  return result;
}

/**
 * Transform commands and bash-block-specific idioms
 *
 * This wraps the command transform to also apply shell idiom transforms
 * (like && and || chaining) within bash code blocks.
 *
 * @param content - Content potentially containing bash code blocks
 * @returns Content with bash blocks transformed to PowerShell
 */
function transformCommandsWithIdioms(content: string): string {
  // First apply bash block idiom transforms (&&, ||) within bash blocks
  const bashBlockPattern = /```(?:bash|sh)\s*\n([\s\S]*?)```/g;

  let result = content.replace(bashBlockPattern, (match, blockContent) => {
    // Transform idioms within the block
    const idiomTransformed = transformBashBlockIdioms(blockContent);
    // Keep as bash block for now, commands stage will convert to powershell
    return "```bash\n" + idiomTransformed + "```";
  });

  // Then apply the command transforms (which converts bash to powershell)
  result = transformCommandsStage(result);

  return result;
}

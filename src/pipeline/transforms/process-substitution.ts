/**
 * Process substitution transform stage
 *
 * Handles the critical `source <(cmd)` pattern which has no direct PowerShell equivalent.
 * This pattern appears in every gstack preamble for sourcing helper scripts.
 *
 * The transform converts:
 *   source <($GSTACK_BIN/gstack-repo-mode 2>/dev/null) || true
 *
 * To explicit two-step PowerShell:
 *   $_repoModeOutput = & "$env:GSTACK_COPILOT_BIN\gstack-repo-mode.ps1" 2>$null
 *   if ($_repoModeOutput) {
 *       $_repoModeOutput -split "`n" | ForEach-Object {
 *           if ($_ -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
 *               Set-Variable -Name $Matches[1] -Value $Matches[2] -Scope Script
 *           }
 *       }
 *   }
 */

/**
 * Result of detecting a process substitution pattern
 */
export interface ProcessSubstitutionMatch {
  /** The full matched pattern */
  fullMatch: string;
  /** The command inside <(...) */
  innerCommand: string;
  /** Any suffix like `|| true` */
  fallbackSuffix?: string;
  /** Redirection patterns like `2>/dev/null` within the inner command */
  redirections?: string;
  /** The cleaned inner command without redirections */
  cleanCommand: string;
}

/**
 * Detect and parse `source <(cmd)` patterns
 *
 * @param line - A line of bash content
 * @returns Match result or undefined if not a process substitution pattern
 */
export function detectProcessSubstitution(line: string): ProcessSubstitutionMatch | undefined {
  // Pattern: source <(command) possibly with || true suffix
  // The command may contain redirections like 2>/dev/null
  const pattern = /^(\s*)source\s+<\((.+?)\)(\s*\|\|\s*true)?(.*)$/;
  const match = pattern.exec(line);

  if (!match) {
    return undefined;
  }

  const innerCommand = match[2].trim();
  const fallbackSuffix = match[3]?.trim();
  const trailing = match[4]?.trim();

  // Extract redirections from the inner command
  const redirectionPattern = /\s*(\d*>\s*\/dev\/null|\d*>&\d+|\d*>>\s*\S+|\d*>\s*\S+)/g;
  const redirections: string[] = [];
  let cleanCommand = innerCommand;

  let redirectMatch: RegExpExecArray | null;
  while ((redirectMatch = redirectionPattern.exec(innerCommand)) !== null) {
    redirections.push(redirectMatch[1].trim());
  }

  // Remove redirections from command
  cleanCommand = innerCommand.replace(redirectionPattern, "").trim();

  return {
    fullMatch: match[0],
    innerCommand,
    fallbackSuffix,
    redirections: redirections.length > 0 ? redirections.join(" ") : undefined,
    cleanCommand,
  };
}

/**
 * Generate a variable name for capturing output based on the command
 *
 * @param command - The command being executed
 * @returns A suitable variable name
 */
function generateOutputVarName(command: string): string {
  // Extract script name from command
  // e.g., "$GSTACK_BIN/gstack-repo-mode" -> "_repoModeOutput"
  const scriptMatch = /\/?(gstack-)?([a-zA-Z0-9-]+)(?:\.ps1)?$/.exec(command);
  if (scriptMatch) {
    const name = scriptMatch[2];
    // Convert kebab-case to camelCase
    const camelCase = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    return `_${camelCase}Output`;
  }
  return "_sourceOutput";
}

/**
 * Convert bash-style redirections to PowerShell
 *
 * @param redirection - Bash redirection like "2>/dev/null"
 * @returns PowerShell equivalent like "2>$null"
 */
function convertRedirection(redirection: string): string {
  if (!redirection) return "";

  // 2>/dev/null -> 2>$null
  let result = redirection.replace(/\/dev\/null/g, "$null");

  // Handle common patterns
  result = result.replace(/>&1/g, ">&1");
  result = result.replace(/>&2/g, ">&2");

  return result;
}

/**
 * Transform a bash command path to PowerShell
 *
 * @param command - Bash command with potential env vars
 * @returns Command suitable for PowerShell invocation
 */
function transformCommandPath(command: string): string {
  // Transform $GSTACK_BIN to $env:GSTACK_COPILOT_BIN
  let result = command.replace(/\$GSTACK_BIN/g, "$env:GSTACK_COPILOT_BIN");
  result = result.replace(/\$\{GSTACK_BIN\}/g, "$env:GSTACK_COPILOT_BIN");

  // Transform $GSTACK_ROOT to $env:GSTACK_COPILOT_ROOT
  result = result.replace(/\$GSTACK_ROOT/g, "$env:GSTACK_COPILOT_ROOT");
  result = result.replace(/\$\{GSTACK_ROOT\}/g, "$env:GSTACK_COPILOT_ROOT");

  // Transform $HOME to $env:USERPROFILE
  result = result.replace(/\$HOME/g, "$env:USERPROFILE");
  result = result.replace(/\$\{HOME\}/g, "$env:USERPROFILE");

  // Add .ps1 extension if it looks like a gstack script
  if (result.includes("gstack-") && !result.endsWith(".ps1")) {
    // Only add .ps1 if there's no extension and it looks like a script path
    const pathParts = result.split(/[\/\\]/);
    const lastPart = pathParts[pathParts.length - 1];
    if (!lastPart.includes(".") && lastPart.startsWith("gstack-")) {
      result = result + ".ps1";
    }
  }

  // Convert forward slashes to backslashes for Windows paths
  // But only in the path portion, not in $env: variables
  result = result.replace(/\$env:([A-Z_]+)\//g, "$env:$1\\");

  return result;
}

function formatPowerShellInvocation(command: string): string {
  const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g);
  if (!parts || parts.length === 0) {
    return '& ""';
  }

  const [executable, ...args] = parts;
  const formattedExecutable = executable.replace(/^"(.*)"$/, "$1");
  return `& "${formattedExecutable}"${args.length > 0 ? ` ${args.join(" ")}` : ""}`;
}

/**
 * Generate PowerShell code for process substitution pattern
 *
 * This is the core transformation - turning `source <(cmd)` into explicit
 * two-step PowerShell that:
 * 1. Captures the command output
 * 2. Parses KEY=VALUE lines from output
 * 3. Sets script-scoped variables
 *
 * @param match - Parsed process substitution match
 * @returns PowerShell equivalent code
 */
export function generateProcessSubstitutionCode(match: ProcessSubstitutionMatch): string {
  const varName = generateOutputVarName(match.cleanCommand);
  const psCommand = transformCommandPath(match.cleanCommand);
  const psRedirection = match.redirections ? " " + convertRedirection(match.redirections) : "";
  const invocation = formatPowerShellInvocation(psCommand);

  const lines: string[] = [];

  // Step 1: Capture output
  lines.push(`$${varName} = ${invocation}${psRedirection}`);

  // Step 2: Parse KEY=VALUE output if we got any
  lines.push(`if ($${varName}) {`);
  lines.push(`    $${varName} -split "\`n" | ForEach-Object {`);
  lines.push(`        if ($_ -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {`);
  lines.push(`            Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2]`);
  lines.push(`        }`);
  lines.push(`    }`);
  lines.push(`}`);

  return lines.join("\n");
}

/**
 * Transform a line containing process substitution
 *
 * @param line - Line of bash content
 * @returns Transformed PowerShell code, or original line if not a process substitution
 */
export function transformProcessSubstitutionLine(line: string): string {
  const match = detectProcessSubstitution(line);
  if (!match) {
    return line;
  }

  // Extract leading whitespace for indentation preservation
  const leadingWhitespace = line.match(/^(\s*)/)?.[1] || "";

  const code = generateProcessSubstitutionCode(match);

  // Apply indentation to each line
  const indentedCode = code
    .split("\n")
    .map((l) => leadingWhitespace + l)
    .join("\n");

  return indentedCode;
}

/**
 * Check if content contains process substitution patterns
 *
 * @param content - Content to check
 * @returns true if content has `source <(...)` patterns
 */
export function containsProcessSubstitution(content: string): boolean {
  return /source\s+<\(/.test(content);
}

/**
 * Transform all process substitution patterns in content
 *
 * @param content - Full content potentially containing process substitution
 * @returns Content with all process substitutions transformed
 */
export function transformProcessSubstitutionStage(content: string): string {
  if (!containsProcessSubstitution(content)) {
    return content;
  }

  const lines = content.split("\n");
  const transformedLines: string[] = [];

  for (const line of lines) {
    if (containsProcessSubstitution(line)) {
      transformedLines.push(transformProcessSubstitutionLine(line));
    } else {
      transformedLines.push(line);
    }
  }

  return transformedLines.join("\n");
}

// Re-export key functions for pipeline use
export {
  generateOutputVarName as _generateOutputVarName,
  convertRedirection as _convertRedirection,
  transformCommandPath as _transformCommandPath,
  formatPowerShellInvocation as _formatPowerShellInvocation,
};

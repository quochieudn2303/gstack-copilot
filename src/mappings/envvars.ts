/**
 * Environment variable mappings from Bash to PowerShell
 *
 * Based on inventory from gstack core skills analysis.
 * See: .planning/phases/02-command-translation-layer/INVENTORY.md
 */

export interface EnvVarMapping {
  /** Bash variable pattern (e.g., "$HOME", "${HOME}") */
  bash: string;
  /** PowerShell equivalent (e.g., "$env:USERPROFILE") */
  powershell: string;
  /** Description of the variable's purpose */
  description: string;
}

/**
 * Known environment variable mappings
 *
 * Order matters: more specific patterns should come before generic ones.
 * For example, $GSTACK_ROOT should be mapped before generic $env: prefix.
 */
export const ENV_VAR_MAPPINGS: EnvVarMapping[] = [
  // gstack-specific variables (highest priority)
  {
    bash: "$GSTACK_ROOT",
    powershell: "$env:GSTACK_COPILOT_ROOT",
    description: "gstack-copilot installation root",
  },
  {
    bash: "$GSTACK_BIN",
    powershell: "$env:GSTACK_COPILOT_BIN",
    description: "gstack-copilot binary directory",
  },

  // Standard Unix environment variables
  {
    bash: "$HOME",
    powershell: "$env:USERPROFILE",
    description: "User home directory",
  },
  {
    bash: "$PWD",
    powershell: "$PWD",
    description: "Current working directory (same in PowerShell)",
  },
  {
    bash: "$USER",
    powershell: "$env:USERNAME",
    description: "Current username",
  },
  {
    bash: "$TMPDIR",
    powershell: "$env:TEMP",
    description: "Temporary directory",
  },
  {
    bash: "$TMP",
    powershell: "$env:TEMP",
    description: "Temporary directory (alternate)",
  },
  {
    bash: "$PATH",
    powershell: "$env:PATH",
    description: "Executable search path",
  },
  {
    bash: "$SHELL",
    powershell: "$env:ComSpec",
    description: "Default shell/command processor",
  },
];

/**
 * Build regex pattern for a bash variable
 * Handles both $VAR and ${VAR} syntax
 */
function buildVarPattern(bashVar: string): RegExp {
  // Extract variable name without $ prefix
  const varName = bashVar.replace(/^\$/, "");

  // Match both $VAR and ${VAR} forms
  // Use negative lookbehind to avoid matching escaped \$VAR
  // Use word boundary for $VAR form to avoid matching $VAR_EXTENDED
  return new RegExp(
    `(?<!\\\\)\\$(?:\\{${varName}\\}|${varName}(?![A-Za-z0-9_]))`,
    "g"
  );
}

/**
 * Transform known environment variables from Bash to PowerShell syntax
 *
 * @param content - Source content containing Bash env vars
 * @returns Content with env vars transformed to PowerShell syntax
 */
export function transformKnownEnvVars(content: string): string {
  let result = content;

  for (const mapping of ENV_VAR_MAPPINGS) {
    const pattern = buildVarPattern(mapping.bash);
    result = result.replace(pattern, mapping.powershell);
  }

  return result;
}

/**
 * Transform remaining unknown $VAR patterns to $env:VAR syntax
 *
 * This handles variables not in the known mapping list.
 * Should be called AFTER transformKnownEnvVars.
 *
 * @param content - Content potentially containing unknown Bash env vars
 * @returns Content with unknown vars converted to $env:VAR format
 */
export function transformUnknownEnvVars(content: string): string {
  let result = content;

  // Pattern for ${VAR} brace syntax - not escaped
  const bracePattern = /(?<!\\)\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

  // Transform brace syntax first: ${VAR} -> $env:VAR
  result = result.replace(bracePattern, (_match, varName) => {
    // Skip if it's PWD (same in PowerShell)
    if (varName === "PWD") return `$${varName}`;
    // Skip if already looks like PowerShell (env:*)
    if (varName.startsWith("env:")) return `$${varName}`;
    return `$env:${varName}`;
  });

  // Pattern for $VAR simple syntax
  // Use negative lookbehind for:
  // - \ (escaped)
  // - : (already part of $env:VAR - the VAR part)
  // Use negative lookahead for:
  // - : (already PowerShell $env: syntax)
  // - More word characters (word boundary)
  const simplePattern = /(?<!\\)(?<!:)\$([A-Za-z_][A-Za-z0-9_]*)(?![A-Za-z0-9_:])/g;

  // Transform simple syntax: $VAR -> $env:VAR
  result = result.replace(simplePattern, (_match, varName) => {
    // Skip if it's PWD (same in PowerShell)
    if (varName === "PWD") return `$${varName}`;
    // Skip special positional/numeric vars
    if (/^\d+$/.test(varName)) return `$${varName}`;
    // Skip if already PowerShell syntax (env:*)
    if (varName.startsWith("env:")) return `$${varName}`;
    // Skip the PowerShell "env" prefix itself (it's followed by :)
    if (varName === "env") return `$${varName}`;
    return `$env:${varName}`;
  });

  return result;
}

/**
 * Combined environment variable transformation
 *
 * Applies both known mappings and generic $env: conversion.
 *
 * @param content - Source content containing Bash env vars
 * @returns Content with all env vars transformed to PowerShell syntax
 */
export function transformEnvVars(content: string): string {
  // First apply known mappings (specific patterns)
  let result = transformKnownEnvVars(content);

  // Then convert any remaining unknown vars
  result = transformUnknownEnvVars(result);

  return result;
}

/**
 * Get all known variable names for testing/documentation
 */
export function getKnownVarNames(): string[] {
  return ENV_VAR_MAPPINGS.map((m) => m.bash.replace(/^\$/, ""));
}

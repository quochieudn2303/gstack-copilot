/**
 * Environment variable transform stage
 *
 * Transforms Bash environment variable syntax to PowerShell equivalents.
 * Part of the content transformation pipeline.
 */

import {
  transformEnvVars,
  transformKnownEnvVars,
  transformUnknownEnvVars,
} from "../../mappings/envvars.js";

/**
 * Options for the environment variable transform
 */
export interface EnvVarTransformOptions {
  /**
   * Only transform known variables (don't add $env: to unknowns)
   * @default false
   */
  knownOnly?: boolean;
}

/**
 * Transform environment variables in content from Bash to PowerShell syntax
 *
 * This is the main transform function to be used in the pipeline.
 *
 * Features:
 * - Translates known variables: $HOME -> $env:USERPROFILE
 * - Handles brace syntax: ${VAR} -> $env:VAR
 * - Respects word boundaries: $VAR_NAME stays intact
 * - Skips escaped variables: \$VAR stays as \$VAR
 * - Converts unknown $VAR to $env:VAR format
 *
 * @param content - Source content containing Bash environment variables
 * @param options - Transform options
 * @returns Content with environment variables transformed to PowerShell syntax
 *
 * @example
 * ```ts
 * // Basic usage
 * transformEnvVarsStage("echo $HOME");
 * // Returns: "echo $env:USERPROFILE"
 *
 * // Known mappings
 * transformEnvVarsStage("cd $GSTACK_ROOT/bin");
 * // Returns: "cd $env:GSTACK_COPILOT_ROOT/bin"
 *
 * // Unknown variables
 * transformEnvVarsStage("echo $CUSTOM_VAR");
 * // Returns: "echo $env:CUSTOM_VAR"
 *
 * // Brace syntax
 * transformEnvVarsStage("path=${HOME}/.config");
 * // Returns: "path=$env:USERPROFILE/.config"
 * ```
 */
export function transformEnvVarsStage(
  content: string,
  options: EnvVarTransformOptions = {}
): string {
  if (options.knownOnly) {
    return transformKnownEnvVars(content);
  }
  return transformEnvVars(content);
}

/**
 * Check if content contains any Bash-style environment variables
 *
 * Useful for determining if the transform is needed.
 *
 * @param content - Content to check
 * @returns true if content contains $VAR or ${VAR} patterns that need transformation
 */
export function containsBashEnvVars(content: string): boolean {
  // Match $VAR or ${VAR} patterns that are NOT:
  // - Escaped (\$VAR)
  // - Already PowerShell $env: syntax
  // - Part of $env: prefix

  // Match ${VAR} brace syntax (not escaped)
  const bracePattern = /(?<!\\)\$\{[A-Za-z_][A-Za-z0-9_]*\}/;
  if (bracePattern.test(content)) return true;

  // Match $VAR simple syntax
  // - Not escaped
  // - Not after : (like $env:VAR)
  // - Not followed by : (like $env:)
  const simplePattern = /(?<!\\)(?<!:)\$([A-Za-z_][A-Za-z0-9_]*)(?![A-Za-z0-9_:])/g;
  let match;
  while ((match = simplePattern.exec(content)) !== null) {
    const varName = match[1];
    // Skip PWD (same in PowerShell) and env (PowerShell prefix)
    if (varName !== "PWD" && varName !== "env") {
      return true;
    }
  }

  return false;
}

/**
 * Extract all Bash-style environment variable names from content
 *
 * Useful for analysis and reporting.
 *
 * @param content - Content to analyze
 * @returns Array of unique variable names found (without $ prefix)
 */
export function extractBashEnvVarNames(content: string): string[] {
  const names = new Set<string>();

  // Match ${VAR} brace syntax
  const bracePattern = /(?<!\\)\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;
  let match;
  while ((match = bracePattern.exec(content)) !== null) {
    names.add(match[1]);
  }

  // Match $VAR simple syntax (not $env:)
  const simplePattern = /(?<!\\)(?<!\$env:)\$([A-Za-z_][A-Za-z0-9_]*)(?![A-Za-z0-9_])/g;
  while ((match = simplePattern.exec(content)) !== null) {
    // Skip if looks like PowerShell
    if (!match[1].startsWith("env:")) {
      names.add(match[1]);
    }
  }

  return Array.from(names).sort();
}

// Re-export for convenience
export { transformEnvVars, transformKnownEnvVars, transformUnknownEnvVars };

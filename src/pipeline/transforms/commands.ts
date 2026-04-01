/**
 * Command transform stage
 *
 * Transforms Bash command invocations to PowerShell equivalents.
 * Part of the content transformation pipeline.
 */

import {
  findCommandMapping,
  findTestExpressionMapping,
  isKnownCommand,
  CommandMatchResult,
} from "../../mappings/commands.js";

/**
 * Options for command transformation
 */
export interface CommandTransformOptions {
  /**
   * Whether to add TODO comments for unknown commands
   * @default true
   */
  markUnknown?: boolean;
}

/**
 * Result of transforming a command line
 */
export interface TransformResult {
  /** The transformed line */
  line: string;
  /** Whether the line was transformed */
  transformed: boolean;
  /** Whether the command was unknown (if markUnknown is true) */
  unknown?: boolean;
}

/**
 * Transform a single bash command to PowerShell
 *
 * @param command - A bash command (without code block markers)
 * @param options - Transform options
 * @returns Transformed PowerShell command or original with TODO marker
 */
export function transformCommand(
  command: string,
  options: CommandTransformOptions = {}
): TransformResult {
  const { markUnknown = true } = options;
  const trimmed = command.trim();

  // Skip empty lines and comments
  if (!trimmed || trimmed.startsWith("#")) {
    return { line: command, transformed: false };
  }

  // Try to match as a test expression first
  const testMatch = tryTransformTestExpression(trimmed);
  if (testMatch) {
    return { line: testMatch, transformed: true };
  }

  // Try to match as a command
  const cmdMatch = findCommandMapping(trimmed);
  if (cmdMatch) {
    return { line: cmdMatch.powershell, transformed: true };
  }

  // Handle piped commands
  if (trimmed.includes("|")) {
    const pipedResult = transformPipedCommand(trimmed, options);
    if (pipedResult.transformed) {
      return pipedResult;
    }
  }

  // Check if it starts with a known command (partial match)
  const firstWord = trimmed.split(/\s+/)[0];
  if (isKnownCommand(firstWord)) {
    // Known command but unknown variant - try simple mapping
    const simpleResult = trySimpleCommandMapping(trimmed);
    if (simpleResult) {
      return { line: simpleResult, transformed: true };
    }
  }

  // Unknown command - add TODO marker if requested
  if (markUnknown) {
    return {
      line: `${command}  # TODO: translate to PowerShell`,
      transformed: false,
      unknown: true,
    };
  }

  return { line: command, transformed: false };
}

/**
 * Try to transform a shell test expression
 *
 * Matches patterns like: [ -f file ], [[ -d dir ]], [ "$var" -gt 0 ]
 *
 * @param expression - Potential test expression
 * @returns Transformed PowerShell expression or undefined
 */
function tryTransformTestExpression(expression: string): string | undefined {
  // Match [ ... ] or [[ ... ]] patterns
  const singleBracket = /^\[\s+(.+?)\s+\]$/.exec(expression);
  const doubleBracket = /^\[\[\s+(.+?)\s+\]\]$/.exec(expression);

  if (!singleBracket && !doubleBracket) {
    return undefined;
  }

  // Try to find a mapping for the full expression
  const testMatch = findTestExpressionMapping(expression);
  if (testMatch) {
    return testMatch.powershell;
  }

  return undefined;
}

/**
 * Transform a piped command (cmd1 | cmd2 | cmd3)
 *
 * @param command - Command with pipes
 * @param options - Transform options
 * @returns Transform result
 */
function transformPipedCommand(
  command: string,
  options: CommandTransformOptions
): TransformResult {
  const parts = command.split(/\s*\|\s*/);
  const transformedParts: string[] = [];
  let anyTransformed = false;
  let anyUnknown = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    // Try to find a mapping for this part
    const mapping = findCommandMapping(part);
    if (mapping) {
      transformedParts.push(mapping.powershell);
      anyTransformed = true;
    } else {
      // Check for pipe-specific patterns (like wc -l, sort, etc.)
      const pipeMapping = tryPipeStageMapping(part);
      if (pipeMapping) {
        transformedParts.push(pipeMapping);
        anyTransformed = true;
      } else {
        // Keep original with TODO if unknown
        if (options.markUnknown) {
          transformedParts.push(`${part}  # TODO: translate`);
          anyUnknown = true;
        } else {
          transformedParts.push(part);
        }
      }
    }
  }

  return {
    line: transformedParts.join(" | "),
    transformed: anyTransformed,
    unknown: anyUnknown,
  };
}

/**
 * Try to map a pipe stage command (commands that typically receive piped input)
 *
 * @param command - Command in a pipe
 * @returns PowerShell equivalent or undefined
 */
function tryPipeStageMapping(command: string): string | undefined {
  // These are commands that work in pipes and have direct PowerShell equivalents
  const pipeMappings: Record<string, string> = {
    "wc -l": "(Measure-Object -Line).Lines",
    "wc -w": "(Measure-Object -Word).Words",
    "wc -c": "(Measure-Object -Character).Characters",
    "sort": "Sort-Object",
    "sort -u": "Sort-Object -Unique",
    "sort -r": "Sort-Object -Descending",
    "sort -n": "Sort-Object { [int]$_ }",
    "uniq": "Get-Unique",
    "head -1": "Select-Object -First 1",
    "head -n 1": "Select-Object -First 1",
    "tail -1": "Select-Object -Last 1",
    "tail -n 1": "Select-Object -Last 1",
    "tac": "[array]::Reverse($_)",
    "rev": "$_.ToCharArray() -join ''",
  };

  // Check exact match
  if (pipeMappings[command]) {
    return pipeMappings[command];
  }

  // Handle head -n N and tail -n N with variable N
  const headMatch = /^head\s+(?:-n\s+)?(\d+)$/.exec(command);
  if (headMatch) {
    return `Select-Object -First ${headMatch[1]}`;
  }

  const tailMatch = /^tail\s+(?:-n\s+)?(\d+)$/.exec(command);
  if (tailMatch) {
    return `Select-Object -Last ${tailMatch[1]}`;
  }

  // Handle tr -d 'chars'
  const trDeleteMatch = /^tr\s+-d\s+['"]?(.+?)['"]?$/.exec(command);
  if (trDeleteMatch) {
    const chars = trDeleteMatch[1];
    // Escape special regex characters in the chars to delete
    const escaped = chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return `-replace '[${escaped}]', ''`;
  }

  // Handle tr 'from' 'to' (simple character translation)
  const trReplaceMatch = /^tr\s+['"](.+?)['"]?\s+['"]?(.+?)['"]?$/.exec(command);
  if (trReplaceMatch) {
    return `-replace '[${trReplaceMatch[1]}]', '${trReplaceMatch[2]}'`;
  }

  // Handle grep pattern (in pipe context)
  const grepMatch = /^grep\s+(?:-[a-zA-Z]*\s+)?['"]?(.+?)['"]?$/.exec(command);
  if (grepMatch) {
    return `Where-Object { $_ -match '${grepMatch[1]}' }`;
  }

  return undefined;
}

/**
 * Try simple command mapping for known commands with unknown arguments
 *
 * Falls back to basic cmdlet mapping without full pattern match
 *
 * @param command - Bash command
 * @returns PowerShell command or undefined
 */
function trySimpleCommandMapping(command: string): string | undefined {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1).join(" ");

  // Simple command -> cmdlet mappings for fallback
  const simpleMappings: Record<string, string> = {
    cat: "Get-Content",
    ls: "Get-ChildItem",
    pwd: "Get-Location",
    cd: "Set-Location",
    cp: "Copy-Item",
    mv: "Move-Item",
    rm: "Remove-Item",
    mkdir: "New-Item -ItemType Directory -Path",
    touch: "New-Item -ItemType File -Path",
    echo: "Write-Output",
  };

  if (simpleMappings[cmd]) {
    if (args) {
      return `${simpleMappings[cmd]} ${args}`;
    }
    return simpleMappings[cmd];
  }

  return undefined;
}

/**
 * Transform bash content within a code block
 *
 * @param content - Content from a bash code block
 * @param options - Transform options
 * @returns Transformed content
 */
export function transformBashBlock(
  content: string,
  options: CommandTransformOptions = {}
): string {
  const lines = content.split("\n");
  const transformedLines: string[] = [];

  for (const line of lines) {
    // Preserve indentation
    const leadingWhitespace = line.match(/^(\s*)/)?.[1] || "";
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      transformedLines.push(line);
      continue;
    }

    const result = transformCommand(trimmedLine, options);
    transformedLines.push(leadingWhitespace + result.line);
  }

  return transformedLines.join("\n");
}

/**
 * Transform commands stage for the content pipeline
 *
 * Identifies bash code blocks and transforms commands within them.
 *
 * @param content - Full content potentially containing bash code blocks
 * @param options - Transform options
 * @returns Content with bash commands transformed to PowerShell
 */
export function transformCommandsStage(
  content: string,
  options: CommandTransformOptions = {}
): string {
  // Pattern to match bash code blocks
  // Matches: ```bash ... ``` or ```sh ... ```
  const bashBlockPattern = /```(?:bash|sh)\s*\n([\s\S]*?)```/g;

  return content.replace(bashBlockPattern, (match, blockContent) => {
    const transformed = transformBashBlock(blockContent, options);
    // Return as PowerShell block
    return "```powershell\n" + transformed + "```";
  });
}

/**
 * Check if content contains bash code blocks
 *
 * @param content - Content to check
 * @returns true if content has ```bash or ```sh blocks
 */
export function containsBashBlocks(content: string): boolean {
  return /```(?:bash|sh)\s*\n/.test(content);
}

// Re-export types and functions from mappings for convenience
export {
  findCommandMapping,
  findTestExpressionMapping,
  isKnownCommand,
  CommandMatchResult,
};

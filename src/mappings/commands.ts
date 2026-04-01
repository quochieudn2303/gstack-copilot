/**
 * Command mappings from Bash to PowerShell
 *
 * Provides pattern-based translation of UNIX utilities to PowerShell cmdlets.
 * See: .planning/phases/02-command-translation-layer/INVENTORY.md
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load commands.json from the source directory (works in both dev and dist)
function loadCommandsJson(): CommandsRegistry {
  // Try multiple paths to handle different execution contexts
  const possiblePaths = [
    join(__dirname, "commands.json"), // When running from dist/
    join(__dirname, "..", "..", "src", "mappings", "commands.json"), // When running from dist/ and JSON is in src/
  ];

  for (const path of possiblePaths) {
    try {
      const content = readFileSync(path, "utf-8");
      return JSON.parse(content) as CommandsRegistry;
    } catch {
      continue;
    }
  }

  throw new Error(
    `Could not find commands.json in any of: ${possiblePaths.join(", ")}`
  );
}

const commandsJson = loadCommandsJson();

export interface CommandMapping {
  /** Bash command pattern with placeholders like {dir}, {file}, etc. */
  bash: string;
  /** PowerShell equivalent with same placeholders */
  powershell: string;
  /** Description/notes about the mapping */
  notes?: string;
}

export interface CommandsRegistry {
  commands: CommandMapping[];
  testExpressions: CommandMapping[];
}

/**
 * Parsed pattern info for matching
 */
interface ParsedPattern {
  original: CommandMapping;
  regex: RegExp;
  placeholders: string[];
}

/**
 * Match result with extracted placeholder values
 */
export interface CommandMatchResult {
  mapping: CommandMapping;
  placeholders: Record<string, string>;
  powershell: string;
}

// Cached parsed patterns
let parsedCommands: ParsedPattern[] | null = null;
let parsedTestExpressions: ParsedPattern[] | null = null;

/**
 * Load command mappings from JSON registry
 */
export function loadCommandMappings(): CommandMapping[] {
  return commandsJson.commands;
}

/**
 * Load test expression mappings from JSON registry
 */
export function loadTestExpressionMappings(): CommandMapping[] {
  return commandsJson.testExpressions;
}

/**
 * Convert a bash pattern template to a regex for matching
 *
 * Pattern: "find {dir} -name {pattern}"
 * Becomes: /^find\s+(.+?)\s+-name\s+(.+?)$/
 *
 * @param pattern - Bash pattern with {placeholder} markers
 * @returns Object with regex and placeholder names
 */
function parsePattern(pattern: string): { regex: RegExp; placeholders: string[] } {
  const placeholders: string[] = [];

  // Escape regex special characters except for our placeholders
  let regexStr = pattern.replace(/[.*+?^${}()|[\]\\]/g, (char) => {
    // Don't escape our placeholder braces
    if (char === "{" || char === "}") return char;
    return "\\" + char;
  });

  // Replace placeholders with capturing groups
  // {name} -> (.+?) for greedy minimal match
  regexStr = regexStr.replace(/\{([^}]+)\}/g, (_match, name) => {
    placeholders.push(name);
    // Use non-greedy match to capture the value
    return "(.+?)";
  });

  // Replace whitespace with flexible whitespace matching
  regexStr = regexStr.replace(/\s+/g, "\\s+");

  return {
    regex: new RegExp("^" + regexStr + "$"),
    placeholders,
  };
}

/**
 * Get parsed command patterns (cached)
 */
function getParsedCommands(): ParsedPattern[] {
  if (!parsedCommands) {
    parsedCommands = commandsJson.commands.map((cmd) => {
      const { regex, placeholders } = parsePattern(cmd.bash);
      return { original: cmd, regex, placeholders };
    });

    // Sort by specificity (more parts = more specific = higher priority)
    parsedCommands.sort((a, b) => {
      const partsA = a.original.bash.split(/\s+/).length;
      const partsB = b.original.bash.split(/\s+/).length;
      return partsB - partsA; // More specific first
    });
  }
  return parsedCommands;
}

/**
 * Get parsed test expression patterns (cached)
 */
function getParsedTestExpressions(): ParsedPattern[] {
  if (!parsedTestExpressions) {
    parsedTestExpressions = commandsJson.testExpressions.map((expr) => {
      const { regex, placeholders } = parsePattern(expr.bash);
      return { original: expr, regex, placeholders };
    });

    // Sort by specificity
    parsedTestExpressions.sort((a, b) => {
      const partsA = a.original.bash.split(/\s+/).length;
      const partsB = b.original.bash.split(/\s+/).length;
      return partsB - partsA;
    });
  }
  return parsedTestExpressions;
}

/**
 * Fill in PowerShell template with extracted values
 *
 * @param template - PowerShell template with {placeholder} markers
 * @param values - Map of placeholder names to extracted values
 * @returns Filled-in PowerShell command
 */
function fillTemplate(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

/**
 * Find a command mapping that matches the given bash command
 *
 * @param bashCommand - The bash command to match
 * @returns Match result with mapping and filled PowerShell, or undefined if no match
 */
export function findCommandMapping(bashCommand: string): CommandMatchResult | undefined {
  const trimmed = bashCommand.trim();
  const patterns = getParsedCommands();

  for (const pattern of patterns) {
    const match = pattern.regex.exec(trimmed);
    if (match) {
      const placeholders: Record<string, string> = {};
      for (let i = 0; i < pattern.placeholders.length; i++) {
        placeholders[pattern.placeholders[i]] = match[i + 1];
      }

      return {
        mapping: pattern.original,
        placeholders,
        powershell: fillTemplate(pattern.original.powershell, placeholders),
      };
    }
  }

  return undefined;
}

/**
 * Find a test expression mapping that matches the given bash test
 *
 * @param bashTest - The bash test expression to match (e.g., "[ -f file ]")
 * @returns Match result with mapping and filled PowerShell, or undefined if no match
 */
export function findTestExpressionMapping(bashTest: string): CommandMatchResult | undefined {
  const trimmed = bashTest.trim();
  const patterns = getParsedTestExpressions();

  for (const pattern of patterns) {
    const match = pattern.regex.exec(trimmed);
    if (match) {
      const placeholders: Record<string, string> = {};
      for (let i = 0; i < pattern.placeholders.length; i++) {
        placeholders[pattern.placeholders[i]] = match[i + 1];
      }

      return {
        mapping: pattern.original,
        placeholders,
        powershell: fillTemplate(pattern.original.powershell, placeholders),
      };
    }
  }

  return undefined;
}

/**
 * Check if a command is a known bash utility
 *
 * @param command - Command name (e.g., "find", "grep")
 * @returns true if the command has mappings in the registry
 */
export function isKnownCommand(command: string): boolean {
  const patterns = getParsedCommands();
  const cmdLower = command.toLowerCase();

  return patterns.some((p) => {
    const firstWord = p.original.bash.split(/\s+/)[0];
    return firstWord === cmdLower || firstWord === command;
  });
}

/**
 * Get all known command names from the registry
 *
 * @returns Array of command names (e.g., ["find", "grep", "date", ...])
 */
export function getKnownCommandNames(): string[] {
  const names = new Set<string>();
  for (const cmd of commandsJson.commands) {
    const firstWord = cmd.bash.split(/\s+/)[0];
    names.add(firstWord);
  }
  return Array.from(names).sort();
}

/**
 * Clear cached patterns (useful for testing)
 */
export function clearPatternCache(): void {
  parsedCommands = null;
  parsedTestExpressions = null;
}

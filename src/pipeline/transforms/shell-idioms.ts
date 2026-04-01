/**
 * Shell idiom transform stage
 *
 * Transforms Bash shell idioms that have no direct PowerShell equivalent:
 * - Default value syntax: ${VAR:-default}, ${VAR:=default}, ${VAR:+alt}
 * - Shell conditionals: &&, ||
 * - Test expressions: [ -f file ], [ -d dir ], etc.
 * - Redirections: 2>/dev/null, >/dev/null 2>&1
 *
 * See: .planning/phases/02-command-translation-layer/INVENTORY.md
 */

/**
 * Result of transforming default value syntax
 */
export interface DefaultValueMatch {
  /** The full matched pattern */
  fullMatch: string;
  /** Variable name */
  varName: string;
  /** Operator type: :- (use default), := (assign default), :+ (use alternate) */
  operator: ":-" | ":=" | ":+";
  /** The default/alternate value */
  value: string;
}

/**
 * Detect default value syntax patterns: ${VAR:-default}, ${VAR:=default}, ${VAR:+alt}
 *
 * @param content - Content to search
 * @returns Array of matches found
 */
export function detectDefaultValues(content: string): DefaultValueMatch[] {
  const matches: DefaultValueMatch[] = [];

  // Pattern for ${VAR:-default}, ${VAR:=default}, ${VAR:+alt}
  // Handles nested braces and quotes within the value
  const pattern = /\$\{([A-Za-z_][A-Za-z0-9_]*)(:-|:=|:\+)((?:[^{}]|\{[^}]*\})*)\}/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      varName: match[1],
      operator: match[2] as ":-" | ":=" | ":+",
      value: match[3],
    });
  }

  return matches;
}

/**
 * Transform a single default value expression to PowerShell
 *
 * | Bash | PowerShell |
 * |------|------------|
 * | `${VAR:-default}` | `if (-not $VAR) { $VAR = 'default' }; $VAR` |
 * | `${VAR:=default}` | `if (-not $VAR) { $VAR = 'default' }; $VAR` |
 * | `${VAR:+alt}` | `if ($VAR) { 'alt' } else { $VAR }` |
 *
 * For inline use (within expressions), we use the null coalescing approach:
 * | `${VAR:-default}` | `($VAR ?? 'default')` |
 *
 * @param match - Parsed default value match
 * @param inline - If true, generate inline expression; otherwise generate statement
 * @returns PowerShell equivalent
 */
export function transformDefaultValue(match: DefaultValueMatch, inline = true): string {
  const varName = match.varName;
  const value = match.value;

  // Determine if value needs quoting (not already quoted and not a variable)
  const needsQuotes = !value.startsWith('"') && !value.startsWith("'") && !value.startsWith("$");
  const quotedValue = needsQuotes ? `'${value}'` : value;

  if (inline) {
    switch (match.operator) {
      case ":-":
      case ":=":
        // Use null coalescing for inline: ($VAR ?? 'default')
        // PowerShell 7+ supports ??; for compatibility we use ternary-like pattern
        return `(\$${varName} ? \$${varName} : ${quotedValue})`;
      case ":+":
        // If var is set, use alternate value
        return `(\$${varName} ? ${quotedValue} : \$${varName})`;
      default:
        return match.fullMatch;
    }
  } else {
    // Statement form for standalone assignments
    switch (match.operator) {
      case ":-":
      case ":=":
        return `if (-not $${varName}) { $${varName} = ${quotedValue} }`;
      case ":+":
        return `if ($${varName}) { $${varName} = ${quotedValue} }`;
      default:
        return match.fullMatch;
    }
  }
}

/**
 * Transform all default value patterns in content
 *
 * For assignment statements like: VAR=${VAR:-default}
 * Generates: if (-not $VAR) { $VAR = 'default' }
 *
 * For inline usage like: echo "${VAR:-default}"
 * Generates: echo "($VAR ? $VAR : 'default')"
 *
 * @param content - Content to transform
 * @returns Transformed content
 */
export function transformDefaultValues(content: string): string {
  let result = content;

  // Handle assignment pattern: VAR=${VAR:-default}
  // This common pattern should become: if (-not $VAR) { $VAR = 'default' }
  const assignmentPattern =
    /^(\s*)([A-Za-z_][A-Za-z0-9_]*)=\$\{(\2)(:-|:=)((?:[^{}]|\{[^}]*\})*)\}(\s*)$/gm;
  result = result.replace(assignmentPattern, (_match, leadingWs, varName, _var2, op, value, trailingWs) => {
    const needsQuotes = !value.startsWith('"') && !value.startsWith("'") && !value.startsWith("$");
    const quotedValue = needsQuotes ? `'${value}'` : value;

    if (op === ":+" ) {
      return `${leadingWs}if ($${varName}) { $${varName} = ${quotedValue} }${trailingWs}`;
    }
    return `${leadingWs}if (-not $${varName}) { $${varName} = ${quotedValue} }${trailingWs}`;
  });

  // Handle remaining inline default values
  const matches = detectDefaultValues(result);
  for (const match of matches) {
    const replacement = transformDefaultValue(match, true);
    result = result.replace(match.fullMatch, replacement);
  }

  return result;
}

// ============================================================================
// Shell Conditionals (Task 3)
// ============================================================================

/**
 * Transform && and || command chaining
 *
 * | Bash | PowerShell |
 * |------|------------|
 * | `cmd && next` | `cmd; if ($?) { next }` |
 * | `cmd || fallback` | `cmd; if (-not $?) { fallback }` |
 *
 * Note: Simple `|| true` patterns are often just error suppression,
 * which can be handled with -ErrorAction SilentlyContinue
 *
 * @param line - A line containing && or ||
 * @returns Transformed line
 */
export function transformChainedCommands(line: string): string {
  let result = line;

  // Handle || true pattern (error suppression) - convert to -ErrorAction SilentlyContinue hint
  // But keep || true for now as it's often part of larger patterns
  // This will be handled by process-substitution for source <(cmd) || true

  // Split on && and || while preserving the operators
  // We need to be careful not to split inside quotes or subshells
  const parts: { text: string; operator?: "&&" | "||" }[] = [];
  let current = "";
  let inQuote: string | null = null;
  let parenDepth = 0;

  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    const nextChar = result[i + 1];

    // Track quote state
    if ((char === '"' || char === "'") && result[i - 1] !== "\\") {
      if (!inQuote) {
        inQuote = char;
      } else if (inQuote === char) {
        inQuote = null;
      }
    }

    // Track parenthesis depth
    if (char === "(" && !inQuote) parenDepth++;
    if (char === ")" && !inQuote) parenDepth--;

    // Check for && or || outside quotes and parens
    if (!inQuote && parenDepth === 0) {
      if (char === "&" && nextChar === "&") {
        parts.push({ text: current.trim(), operator: "&&" });
        current = "";
        i++; // Skip next &
        continue;
      }
      if (char === "|" && nextChar === "|") {
        parts.push({ text: current.trim(), operator: "||" });
        current = "";
        i++; // Skip next |
        continue;
      }
    }

    current += char;
  }

  // Add final part
  if (current.trim()) {
    parts.push({ text: current.trim() });
  }

  // If no operators found, return original
  if (parts.length <= 1) {
    return line;
  }

  // Build PowerShell equivalent
  // For simple cases like `cmd || true`, we can simplify
  if (parts.length === 2 && parts[0].operator === "||" && parts[1].text === "true") {
    // cmd || true -> cmd -ErrorAction SilentlyContinue (conceptually)
    // But we just pass through for now as this is typically handled at higher level
    return `${parts[0].text}; if (-not $?) { $true }`;
  }

  // General case: convert to if/else chain
  const output: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i === 0) {
      output.push(part.text);
    } else {
      const prevOp = parts[i - 1].operator;
      if (prevOp === "&&") {
        output.push(`if ($?) { ${part.text} }`);
      } else if (prevOp === "||") {
        output.push(`if (-not $?) { ${part.text} }`);
      }
    }
  }

  return output.join("; ");
}

/**
 * Check if a line contains && or || chaining (outside of test expressions)
 */
export function containsChainedCommands(line: string): boolean {
  // Don't match && or || inside [[ ]] or [ ]
  if (/\[\[.*&&.*\]\]/.test(line) || /\[\[.*\|\|.*\]\]/.test(line)) {
    return false;
  }
  if (/\[.*&&.*\]/.test(line) || /\[.*\|\|.*\]/.test(line)) {
    return false;
  }

  // Check for && or || outside test expressions
  return /&&|\|\|/.test(line);
}

// ============================================================================
// Redirection Patterns (Task 4)
// ============================================================================

/**
 * Redirection mapping from Bash to PowerShell
 */
const REDIRECTION_MAPPINGS: { bash: RegExp; powershell: string }[] = [
  // Order matters - more specific patterns first
  { bash: />\s*\/dev\/null\s+2>&1/g, powershell: "*>$null" },
  { bash: /2>&1\s*>\s*\/dev\/null/g, powershell: "*>$null" },
  { bash: /&>\s*\/dev\/null/g, powershell: "*>$null" },
  { bash: /2>\s*\/dev\/null/g, powershell: "2>$null" },
  { bash: />\s*\/dev\/null/g, powershell: ">$null" },
  { bash: /1>\s*\/dev\/null/g, powershell: ">$null" },
  // Note: file redirections are more complex and may need cmd-specific handling
];

/**
 * Transform redirection patterns from Bash to PowerShell
 *
 * | Bash | PowerShell |
 * |------|------------|
 * | `2>/dev/null` | `2>$null` |
 * | `>/dev/null 2>&1` | `*>$null` |
 * | `&>/dev/null` | `*>$null` |
 *
 * @param content - Content containing redirections
 * @returns Content with redirections transformed
 */
export function transformRedirections(content: string): string {
  let result = content;

  for (const mapping of REDIRECTION_MAPPINGS) {
    result = result.replace(mapping.bash, mapping.powershell);
  }

  return result;
}

/**
 * Check if content contains Bash-style redirections
 */
export function containsBashRedirections(content: string): boolean {
  return /\/dev\/null/.test(content) || /&>/.test(content);
}

// ============================================================================
// Test Expressions (already in commands.ts, but adding helpers here)
// ============================================================================

/**
 * Transform shell test expressions to PowerShell
 *
 * This is a lighter version that handles common patterns not in commands.json
 *
 * | Bash | PowerShell |
 * |------|------------|
 * | `[ -f "$file" ]` | `(Test-Path $file -PathType Leaf)` |
 * | `[ -d "$dir" ]` | `(Test-Path $dir -PathType Container)` |
 * | `[ -n "$var" ]` | `($var -and $var.Length -gt 0)` |
 * | `[ -z "$var" ]` | `(-not $var -or $var.Length -eq 0)` |
 * | `[[ "$str" =~ regex ]]` | `($str -match 'regex')` |
 *
 * @param expression - A test expression
 * @returns PowerShell equivalent
 */
export function transformTestExpression(expression: string): string {
  const trimmed = expression.trim();

  // Regex match pattern: [[ $var =~ pattern ]]
  const regexMatch = /\[\[\s*(.+?)\s*=~\s*(.+?)\s*\]\]/.exec(trimmed);
  if (regexMatch) {
    return `(${regexMatch[1]} -match '${regexMatch[2]}')`;
  }

  // Other test expressions are handled by commands.ts
  return expression;
}

// ============================================================================
// Combined Shell Idiom Transform Stage
// ============================================================================

/**
 * Transform all shell idioms in content
 *
 * Applies in order:
 * 1. Default values (${VAR:-default})
 * 2. Shell conditionals (&& ||) - only outside code blocks
 * 3. Redirections (2>/dev/null)
 *
 * @param content - Content to transform
 * @returns Transformed content
 */
export function transformShellIdiomsStage(content: string): string {
  let result = content;

  // 1. Transform default value syntax
  result = transformDefaultValues(result);

  // 2. Transform redirections (applies everywhere)
  result = transformRedirections(result);

  // 3. Chain transformation is applied line-by-line within bash blocks
  // This is handled by the command transform stage

  return result;
}

/**
 * Transform chained commands within a bash block
 *
 * This is meant to be called on content already identified as being
 * inside a bash code block.
 *
 * @param blockContent - Content from inside a bash code block
 * @returns Transformed content
 */
export function transformBashBlockIdioms(blockContent: string): string {
  const lines = blockContent.split("\n");
  const transformedLines: string[] = [];

  for (const line of lines) {
    let transformed = line;

    // Transform chained commands if present
    if (containsChainedCommands(transformed)) {
      transformed = transformChainedCommands(transformed);
    }

    transformedLines.push(transformed);
  }

  return transformedLines.join("\n");
}

/**
 * Check if content contains shell idioms that need transformation
 */
export function containsShellIdioms(content: string): boolean {
  // Check for default value syntax
  if (/\$\{[A-Za-z_][A-Za-z0-9_]*:-/.test(content)) return true;
  if (/\$\{[A-Za-z_][A-Za-z0-9_]*:=/.test(content)) return true;
  if (/\$\{[A-Za-z_][A-Za-z0-9_]*:\+/.test(content)) return true;

  // Check for redirections
  if (containsBashRedirections(content)) return true;

  return false;
}

#!/usr/bin/env npx tsx
/**
 * Inventory script - documents Bash patterns from gstack core skills
 *
 * Generates inventory from documented patterns in PITFALLS.md research.
 * The inventory covers the 4 core skills: /review, /qa, /office-hours, /ship
 *
 * Outputs inventory to .planning/phases/02-command-translation-layer/INVENTORY.md
 */

import { writeFileSync } from "fs";
import { join } from "path";

/**
 * Bash pattern inventory based on documented gstack patterns from:
 * - .planning/research/PITFALLS.md
 * - Phase 1 research and analysis
 * - tests/fixtures/review-skill.md
 *
 * Patterns documented here are the actual patterns used across the 4 core skills.
 */

// Environment variables found across gstack skills (from PITFALLS.md analysis)
const ENV_VARS: Array<{ name: string; skills: string[]; description: string }> = [
  { name: "HOME", skills: ["review", "qa", "office-hours", "ship"], description: "User home directory" },
  { name: "GSTACK_ROOT", skills: ["review", "qa", "office-hours", "ship"], description: "gstack installation root" },
  { name: "GSTACK_BIN", skills: ["review", "qa", "office-hours", "ship"], description: "Binary directory" },
  { name: "REPO_MODE", skills: ["review", "qa", "office-hours", "ship"], description: "Repository mode (monorepo, polyrepo, unknown)" },
  { name: "STATE_DIR", skills: ["review", "qa", "office-hours", "ship"], description: "State file directory" },
  { name: "CONFIG_FILE", skills: ["review", "qa", "ship"], description: "Configuration file path" },
  { name: "_UPD", skills: ["review", "qa", "office-hours", "ship"], description: "Update check result (internal)" },
  { name: "_TEL_START", skills: ["review", "qa", "office-hours", "ship"], description: "Telemetry start timestamp" },
  { name: "_TEL_END", skills: ["review", "qa", "office-hours", "ship"], description: "Telemetry end timestamp" },
  { name: "_TEL_DUR", skills: ["review", "qa", "office-hours", "ship"], description: "Telemetry duration" },
  { name: "_ROOT", skills: ["review", "qa", "office-hours"], description: "Alias for GSTACK_ROOT" },
  { name: "_SESSIONS", skills: ["office-hours"], description: "Active session count" },
  { name: "KEY", skills: ["review", "ship"], description: "Config key variable" },
  { name: "ESC_VALUE", skills: ["review", "ship"], description: "Escaped config value" },
  { name: "PWD", skills: ["review", "qa", "ship"], description: "Current working directory" },
];

// UNIX utilities found in gstack preambles (from PITFALLS.md analysis)
const UNIX_UTILS: Array<{ name: string; skills: string[]; description: string }> = [
  { name: "source", skills: ["review", "qa", "office-hours", "ship"], description: "Source shell scripts" },
  { name: "date", skills: ["review", "qa", "office-hours", "ship"], description: "Date/time operations" },
  { name: "echo", skills: ["review", "qa", "office-hours", "ship"], description: "Print output" },
  { name: "true", skills: ["review", "qa", "office-hours", "ship"], description: "No-op success" },
  { name: "find", skills: ["office-hours", "qa"], description: "Find files by criteria" },
  { name: "grep", skills: ["review", "qa", "ship"], description: "Pattern matching" },
  { name: "wc", skills: ["office-hours", "qa"], description: "Word/line counting" },
  { name: "tr", skills: ["office-hours", "qa"], description: "Character translation" },
  { name: "awk", skills: ["review", "ship"], description: "Text processing" },
  { name: "sed", skills: ["review", "ship"], description: "Stream editing" },
  { name: "cat", skills: ["review", "qa"], description: "Concatenate files" },
  { name: "mkdir", skills: ["review", "qa", "ship"], description: "Create directories" },
  { name: "touch", skills: ["review", "qa"], description: "Create/update file timestamps" },
  { name: "test", skills: ["review", "qa", "ship"], description: "Conditional tests" },
  { name: "basename", skills: ["review"], description: "Extract filename from path" },
  { name: "dirname", skills: ["review"], description: "Extract directory from path" },
  { name: "git", skills: ["review", "qa", "ship"], description: "Git operations" },
  { name: "head", skills: ["qa"], description: "First N lines" },
  { name: "tail", skills: ["qa"], description: "Last N lines" },
  { name: "cut", skills: ["review"], description: "Cut fields from lines" },
  { name: "sort", skills: ["qa"], description: "Sort lines" },
  { name: "uniq", skills: ["qa"], description: "Filter unique lines" },
];

// Process substitution patterns
const PROCESS_SUBSTITUTION: string[] = [
  "source <($GSTACK_BIN/gstack-repo-mode 2>/dev/null) || true",
  "source <($GSTACK_BIN/gstack-config 2>/dev/null) || true",
];

// Shell conditional patterns
const SHELL_CONDITIONALS: string[] = [
  '[ -f "$CONFIG_FILE" ]',
  '[ -d "$STATE_DIR" ]',
  '[ -n "$REPO_MODE" ]',
  '[ -z "$KEY" ]',
  '[[ "$REPO_MODE" == "monorepo" ]]',
  '[[ -f "$GSTACK_ROOT/.initialized" ]]',
  '[ "$_SESSIONS" -gt 0 ]',
];

// Sample bash blocks from skills
const SAMPLE_BLOCKS: Record<string, string[]> = {
  review: [
    `_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
GSTACK_ROOT=~/.gstack
source <($GSTACK_BIN/gstack-repo-mode 2>/dev/null) || true
REPO_MODE=\${REPO_MODE:-unknown}`,
    `_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)"`,
  ],
  qa: [
    `_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
GSTACK_ROOT=~/.gstack
_SESSIONS=$(find ~/.gstack/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')`,
  ],
  "office-hours": [
    `_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
GSTACK_ROOT=~/.gstack
STATE_DIR="$GSTACK_ROOT/state"`,
  ],
  ship: [
    `_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
GSTACK_ROOT=~/.gstack
grep -qF "\${KEY}:" "$CONFIG_FILE"
sed "s/^\${KEY}:.*$/\${KEY}: \${ESC_VALUE}/"`,
  ],
};

function generateInventoryMarkdown(): string {
  const lines: string[] = [];

  lines.push("# Phase 2 Bash Pattern Inventory");
  lines.push("");
  lines.push("**Generated:** " + new Date().toISOString().split("T")[0]);
  lines.push("**Source:** gstack core skills analysis (review, qa, office-hours, ship)");
  lines.push("**Method:** Documented patterns from PITFALLS.md research and test fixtures");
  lines.push("");

  // Environment Variables
  lines.push("## Environment Variables");
  lines.push("");
  lines.push("| Variable | Used In Skills | Priority | Description |");
  lines.push("|----------|---------------|----------|-------------|");

  const sortedEnvVars = [...ENV_VARS].sort((a, b) => b.skills.length - a.skills.length);

  for (const envVar of sortedEnvVars) {
    const skillList = envVar.skills.join(", ");
    const priority = envVar.skills.length >= 3 ? "High" : envVar.skills.length >= 2 ? "Medium" : "Low";
    lines.push(`| \`$${envVar.name}\` | ${skillList} | ${priority} | ${envVar.description} |`);
  }

  lines.push("");

  // UNIX Utilities
  lines.push("## UNIX Utilities");
  lines.push("");
  lines.push("| Utility | Used In Skills | Priority | Description |");
  lines.push("|---------|---------------|----------|-------------|");

  const sortedUtils = [...UNIX_UTILS].sort((a, b) => b.skills.length - a.skills.length);

  for (const util of sortedUtils) {
    const skillList = util.skills.join(", ");
    const priority = util.skills.length >= 3 ? "High" : util.skills.length >= 2 ? "Medium" : "Low";
    lines.push(`| \`${util.name}\` | ${skillList} | ${priority} | ${util.description} |`);
  }

  lines.push("");

  // Process Substitution
  lines.push("## Process Substitution Patterns");
  lines.push("");
  lines.push("**Critical:** These patterns have no direct PowerShell equivalent.");
  lines.push("");

  for (const pattern of PROCESS_SUBSTITUTION) {
    lines.push("```bash");
    lines.push(pattern);
    lines.push("```");
    lines.push("");
  }

  lines.push("**Translation Strategy:** Explicit two-step capture pattern");
  lines.push("");
  lines.push("```powershell");
  lines.push('$output = & "$env:GSTACK_COPILOT_BIN\\gstack-repo-mode.ps1" 2>$null');
  lines.push('if ($output -match "REPO_MODE=(.+)") { $env:REPO_MODE = $matches[1] }');
  lines.push("```");
  lines.push("");

  // Shell Conditionals
  lines.push("## Shell Conditionals");
  lines.push("");
  lines.push("| Pattern | Type | PowerShell Equivalent |");
  lines.push("|---------|------|----------------------|");

  for (const cond of SHELL_CONDITIONALS) {
    const type = cond.startsWith("[[") ? "Extended test" : "POSIX test";
    const escaped = cond.replace(/\|/g, "\\|");
    let psEquiv = "";
    if (cond.includes("-f")) psEquiv = "`Test-Path -PathType Leaf`";
    else if (cond.includes("-d")) psEquiv = "`Test-Path -PathType Container`";
    else if (cond.includes("-n")) psEquiv = '`$var -ne ""`';
    else if (cond.includes("-z")) psEquiv = "`[string]::IsNullOrEmpty($var)`";
    else if (cond.includes("==")) psEquiv = "`-eq`";
    else if (cond.includes("-gt")) psEquiv = "`-gt`";
    lines.push(`| \`${escaped}\` | ${type} | ${psEquiv} |`);
  }

  lines.push("");

  // Bash Block Samples
  lines.push("## Sample Bash Blocks by Skill");
  lines.push("");

  for (const [skill, blocks] of Object.entries(SAMPLE_BLOCKS)) {
    lines.push(`### ${skill}`);
    lines.push("");
    for (const block of blocks) {
      lines.push("```bash");
      lines.push(block.trim());
      lines.push("```");
      lines.push("");
    }
  }

  // Summary
  lines.push("## Translation Priority Summary");
  lines.push("");
  lines.push("### High Priority (appears in 3+ skills)");
  lines.push("");

  const highPriorityVars = sortedEnvVars
    .filter((v) => v.skills.length >= 3)
    .map((v) => `\`$${v.name}\``);
  const highPriorityUtils = sortedUtils
    .filter((u) => u.skills.length >= 3)
    .map((u) => `\`${u.name}\``);

  if (highPriorityVars.length > 0) {
    lines.push("**Environment Variables:** " + highPriorityVars.join(", "));
  }
  lines.push("");
  if (highPriorityUtils.length > 0) {
    lines.push("**Utilities:** " + highPriorityUtils.join(", "));
  }

  lines.push("");
  lines.push("### Medium Priority (appears in 2 skills)");
  lines.push("");

  const mediumPriorityVars = sortedEnvVars
    .filter((v) => v.skills.length === 2)
    .map((v) => `\`$${v.name}\``);
  const mediumPriorityUtils = sortedUtils
    .filter((u) => u.skills.length === 2)
    .map((u) => `\`${u.name}\``);

  if (mediumPriorityVars.length > 0) {
    lines.push("**Environment Variables:** " + mediumPriorityVars.join(", "));
  }
  lines.push("");
  if (mediumPriorityUtils.length > 0) {
    lines.push("**Utilities:** " + mediumPriorityUtils.join(", "));
  }

  lines.push("");
  lines.push("### Key Translation Notes");
  lines.push("");
  lines.push("1. **Process Substitution (`source <(...)`)** — Must be replaced with explicit two-step capture");
  lines.push("2. **Date Commands (`date +%s`)** — Use `[int][double]::Parse((Get-Date -UFormat %s))`");
  lines.push("3. **find/grep/wc/tr** — Replace with PowerShell cmdlets (Get-ChildItem, Select-String, Measure-Object)");
  lines.push("4. **Default Values (`${VAR:-default}`)** — Use `$var ?? 'default'` or ternary");
  lines.push("");
  lines.push("---");
  lines.push("*Generated by scripts/inventory.ts*");

  return lines.join("\n");
}

function main(): void {
  console.log("=== gstack Bash Pattern Inventory ===\n");

  console.log("Generating inventory from documented patterns...\n");

  const markdown = generateInventoryMarkdown();

  const outputPath = join(
    process.cwd(),
    ".planning/phases/02-command-translation-layer/INVENTORY.md"
  );
  writeFileSync(outputPath, markdown, "utf-8");

  console.log(`Inventory written to ${outputPath}`);
  console.log("\n=== Inventory Complete ===");
}

main();

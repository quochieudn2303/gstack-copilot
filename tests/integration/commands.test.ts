/**
 * Integration tests for command translation
 *
 * Tests command transformation against realistic gstack skill content
 */

import { describe, it, expect } from "vitest";
import { transformCommandsStage, transformCommand, transformBashBlock } from "../../src/pipeline/transforms/commands.js";

describe("command transform integration", () => {
  describe("realistic skill content", () => {
    it("transforms a gstack-style preamble with multiple UNIX commands", () => {
      const bashContent = `\`\`\`bash
# Set up the repository
mkdir -p "$REPO_ROOT/.cache"
touch "$REPO_ROOT/.cache/last-run"

# Find files to process
find "$REPO_ROOT" -name "*.ts" -type f

# Count lines
cat README.md | wc -l

# Check if config exists
[ -f "$REPO_ROOT/config.json" ]
\`\`\``;

      const result = transformCommandsStage(bashContent);

      // Should be converted to powershell block
      expect(result).toContain("```powershell");

      // mkdir -p should become New-Item
      expect(result).toContain("New-Item -ItemType Directory");

      // touch should become New-Item File
      expect(result).toContain("New-Item -ItemType File");

      // find should become Get-ChildItem
      expect(result).toContain("Get-ChildItem");

      // cat | wc -l should translate
      expect(result).toContain("Get-Content");
      expect(result).toContain("Measure-Object -Line");

      // [ -f ] should become Test-Path
      expect(result).toContain("Test-Path");
    });

    it("handles date format commands from skills", () => {
      // gstack skills use date for timestamps
      const result = transformCommand("date +%s");
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("Get-Date");
    });

    it("handles basename/dirname from path operations", () => {
      const basenameResult = transformCommand("basename /path/to/file.txt");
      expect(basenameResult.transformed).toBe(true);
      expect(basenameResult.line).toContain("Split-Path");
      expect(basenameResult.line).toContain("-Leaf");

      const dirnameResult = transformCommand("dirname /path/to/file.txt");
      expect(dirnameResult.transformed).toBe(true);
      expect(dirnameResult.line).toContain("Split-Path");
      expect(dirnameResult.line).toContain("-Parent");
    });

    it("handles rm commands for cleanup operations", () => {
      // rm -f for single files
      const rmfResult = transformCommand("rm -f temp.txt");
      expect(rmfResult.transformed).toBe(true);
      expect(rmfResult.line).toContain("Remove-Item");
      expect(rmfResult.line).toContain("-Force");

      // rm -rf for directories
      const rmrfResult = transformCommand("rm -rf build/");
      expect(rmrfResult.transformed).toBe(true);
      expect(rmrfResult.line).toContain("Remove-Item");
      expect(rmrfResult.line).toContain("-Recurse");
    });

    it("handles echo for output", () => {
      const result = transformCommand('echo "Build complete"');
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("Write-Output");
    });
  });

  describe("pipe chains from skills", () => {
    it("transforms grep | wc -l counting pattern", () => {
      const result = transformCommand("grep TODO src/*.ts | wc -l");
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("Measure-Object -Line");
    });

    it("transforms cat | grep filtering pattern", () => {
      const result = transformCommand("cat log.txt | grep ERROR");
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("Get-Content");
      expect(result.line).toContain("-match");
    });

    it("transforms find | head limiting pattern", () => {
      const result = transformCommand("find . -name '*.ts' | head -10");
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("Select-Object -First 10");
    });

    it("transforms sort | uniq deduplication pattern", () => {
      const result = transformCommand("sort | uniq");
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("Sort-Object");
      expect(result.line).toContain("Get-Unique");
    });
  });

  describe("test expressions from skills", () => {
    it("transforms file existence check", () => {
      const result = transformCommand('[ -f "$CONFIG_FILE" ]');
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("Test-Path");
      expect(result.line).toContain("-PathType Leaf");
    });

    it("transforms directory existence check", () => {
      const result = transformCommand('[ -d "$OUTPUT_DIR" ]');
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("Test-Path");
      expect(result.line).toContain("-PathType Container");
    });

    it("transforms string non-empty check", () => {
      const result = transformCommand('[ -n "$VAR" ]');
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("-ne ''");
    });

    it("transforms string empty check", () => {
      const result = transformCommand('[ -z "$VAR" ]');
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("IsNullOrEmpty");
    });
  });

  describe("code block transformation", () => {
    it("preserves comments and empty lines", () => {
      const content = `# This is a comment

mkdir -p dir

# Another comment
cat file.txt`;

      const result = transformBashBlock(content);

      expect(result).toContain("# This is a comment");
      expect(result).toContain("# Another comment");
      expect(result).toContain("New-Item -ItemType Directory");
      expect(result).toContain("Get-Content");
    });

    it("preserves indentation", () => {
      const content = `if true; then
    mkdir -p dir
    echo "done"
fi`;

      const result = transformBashBlock(content);

      // Check that indented lines maintain their indentation
      const lines = result.split("\n");
      const mkdirLine = lines.find((l) => l.includes("New-Item"));
      const echoLine = lines.find((l) => l.includes("Write-Output"));

      expect(mkdirLine).toMatch(/^\s{4}/); // 4 spaces of indentation
      expect(echoLine).toMatch(/^\s{4}/);
    });

    it("marks unknown commands with TODO", () => {
      const content = `customtool --special-arg value`;

      const result = transformBashBlock(content);

      expect(result).toContain("# TODO: translate");
    });
  });

  describe("multiple code blocks", () => {
    it("transforms all bash blocks in content", () => {
      const content = `# Installation

\`\`\`bash
mkdir -p ~/.config
\`\`\`

# Usage

\`\`\`bash
cat config.json | grep name
\`\`\`
`;

      const result = transformCommandsStage(content);

      // Both blocks should be converted
      expect(result.match(/```powershell/g)?.length).toBe(2);

      // Both commands should be transformed
      expect(result).toContain("New-Item -ItemType Directory");
      expect(result).toContain("Get-Content");
    });

    it("leaves non-bash code blocks unchanged", () => {
      const content = `\`\`\`javascript
console.log("hello");
\`\`\`

\`\`\`bash
echo "hello"
\`\`\`
`;

      const result = transformCommandsStage(content);

      // JavaScript block should be unchanged
      expect(result).toContain("```javascript");
      expect(result).toContain('console.log("hello")');

      // Bash block should be transformed
      expect(result).toContain("```powershell");
      expect(result).toContain("Write-Output");
    });
  });
});

import { describe, expect, it, beforeEach } from "vitest";

import {
  transformCommand,
  transformBashBlock,
  transformCommandsStage,
  containsBashBlocks,
  TransformResult,
} from "../../src/pipeline/transforms/commands.js";
import {
  findCommandMapping,
  findTestExpressionMapping,
  isKnownCommand,
  getKnownCommandNames,
  clearPatternCache,
} from "../../src/mappings/commands.js";

describe("command mapping registry", () => {
  beforeEach(() => {
    clearPatternCache();
  });

  describe("findCommandMapping", () => {
    it("finds mapping for find with name pattern", () => {
      const result = findCommandMapping("find /path -name *.txt");
      expect(result).toBeDefined();
      expect(result?.powershell).toBe(
        "Get-ChildItem -Path /path -Filter *.txt -Recurse"
      );
    });

    it("finds mapping for grep with pattern and file", () => {
      const result = findCommandMapping("grep error log.txt");
      expect(result).toBeDefined();
      expect(result?.powershell).toBe(
        "Select-String -Pattern error -Path log.txt"
      );
    });

    it("finds mapping for date +%s (unix timestamp)", () => {
      const result = findCommandMapping("date +%s");
      expect(result).toBeDefined();
      expect(result?.powershell).toBe(
        "[int][double]::Parse((Get-Date -UFormat %s))"
      );
    });

    it("finds mapping for wc -l (line count)", () => {
      const result = findCommandMapping("wc -l");
      expect(result).toBeDefined();
      expect(result?.powershell).toBe("(Measure-Object -Line).Lines");
    });

    it("finds mapping for mkdir -p", () => {
      const result = findCommandMapping("mkdir -p /some/path");
      expect(result).toBeDefined();
      expect(result?.powershell).toBe(
        "New-Item -ItemType Directory -Path /some/path -Force | Out-Null"
      );
    });

    it("returns undefined for unknown commands", () => {
      const result = findCommandMapping("unknowncmd --arg");
      expect(result).toBeUndefined();
    });

    it("extracts placeholders correctly", () => {
      const result = findCommandMapping("cat myfile.txt");
      expect(result).toBeDefined();
      expect(result?.placeholders).toEqual({ file: "myfile.txt" });
      expect(result?.powershell).toBe("Get-Content myfile.txt");
    });

    it("handles multiple placeholders", () => {
      const result = findCommandMapping("cp source.txt dest.txt");
      expect(result).toBeDefined();
      expect(result?.placeholders).toEqual({
        src: "source.txt",
        dest: "dest.txt",
      });
      expect(result?.powershell).toBe(
        "Copy-Item -Path source.txt -Destination dest.txt"
      );
    });
  });

  describe("findTestExpressionMapping", () => {
    it("maps [ -f file ] to Test-Path", () => {
      const result = findTestExpressionMapping('[ -f "$CONFIG_FILE" ]');
      expect(result).toBeDefined();
      expect(result?.powershell).toBe(
        '(Test-Path "$CONFIG_FILE" -PathType Leaf)'
      );
    });

    it("maps [ -d dir ] to Test-Path -PathType Container", () => {
      const result = findTestExpressionMapping('[ -d "$STATE_DIR" ]');
      expect(result).toBeDefined();
      expect(result?.powershell).toBe(
        '(Test-Path "$STATE_DIR" -PathType Container)'
      );
    });

    it("maps [ -n var ] to non-empty check", () => {
      const result = findTestExpressionMapping('[ -n "$REPO_MODE" ]');
      expect(result).toBeDefined();
      expect(result?.powershell).toBe('("$REPO_MODE" -ne \'\')');
    });

    it("maps [ -z var ] to empty check", () => {
      const result = findTestExpressionMapping('[ -z "$KEY" ]');
      expect(result).toBeDefined();
      expect(result?.powershell).toBe('([string]::IsNullOrEmpty("$KEY"))');
    });

    it("maps numeric comparisons", () => {
      const result = findTestExpressionMapping('[ "$_SESSIONS" -gt 0 ]');
      expect(result).toBeDefined();
      expect(result?.powershell).toBe('("$_SESSIONS" -gt 0)');
    });

    it("maps [[ extended test ]]", () => {
      const result = findTestExpressionMapping('[[ "$REPO_MODE" == "monorepo" ]]');
      expect(result).toBeDefined();
      expect(result?.powershell).toBe('("$REPO_MODE" -eq "monorepo")');
    });

    it("returns undefined for non-test expressions", () => {
      const result = findTestExpressionMapping("echo hello");
      expect(result).toBeUndefined();
    });
  });

  describe("isKnownCommand", () => {
    it("returns true for known commands", () => {
      expect(isKnownCommand("find")).toBe(true);
      expect(isKnownCommand("grep")).toBe(true);
      expect(isKnownCommand("date")).toBe(true);
      expect(isKnownCommand("cat")).toBe(true);
    });

    it("returns false for unknown commands", () => {
      expect(isKnownCommand("unknowncmd")).toBe(false);
      expect(isKnownCommand("customtool")).toBe(false);
    });
  });

  describe("getKnownCommandNames", () => {
    it("returns array of command names", () => {
      const names = getKnownCommandNames();
      expect(names).toContain("find");
      expect(names).toContain("grep");
      expect(names).toContain("date");
      expect(names).toContain("cat");
      expect(names).toContain("mkdir");
    });

    it("returns sorted array", () => {
      const names = getKnownCommandNames();
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });
  });
});

describe("command transform", () => {
  describe("transformCommand", () => {
    it("translates find to Get-ChildItem", () => {
      const result = transformCommand("find /path -name *.log");
      expect(result.transformed).toBe(true);
      expect(result.line).toBe(
        "Get-ChildItem -Path /path -Filter *.log -Recurse"
      );
    });

    it("translates grep to Select-String", () => {
      const result = transformCommand("grep error app.log");
      expect(result.transformed).toBe(true);
      expect(result.line).toBe("Select-String -Pattern error -Path app.log");
    });

    it("translates date +%s to Unix timestamp", () => {
      const result = transformCommand("date +%s");
      expect(result.transformed).toBe(true);
      expect(result.line).toBe(
        "[int][double]::Parse((Get-Date -UFormat %s))"
      );
    });

    it("translates wc -l to Measure-Object", () => {
      const result = transformCommand("wc -l");
      expect(result.transformed).toBe(true);
      expect(result.line).toBe("(Measure-Object -Line).Lines");
    });

    it("handles test expressions [ -f ]", () => {
      const result = transformCommand('[ -f "$CONFIG_FILE" ]');
      expect(result.transformed).toBe(true);
      expect(result.line).toBe('(Test-Path "$CONFIG_FILE" -PathType Leaf)');
    });

    it("handles test expressions [ -d ]", () => {
      const result = transformCommand('[ -d "$STATE_DIR" ]');
      expect(result.transformed).toBe(true);
      expect(result.line).toBe('(Test-Path "$STATE_DIR" -PathType Container)');
    });

    it("marks unknown commands with TODO", () => {
      const result = transformCommand("customtool --arg value");
      expect(result.transformed).toBe(false);
      expect(result.unknown).toBe(true);
      expect(result.line).toContain("# TODO: translate to PowerShell");
    });

    it("preserves empty lines", () => {
      const result = transformCommand("");
      expect(result.transformed).toBe(false);
      expect(result.line).toBe("");
    });

    it("preserves comments", () => {
      const result = transformCommand("# This is a comment");
      expect(result.transformed).toBe(false);
      expect(result.line).toBe("# This is a comment");
    });

    it("respects markUnknown=false option", () => {
      const result = transformCommand("customtool --arg", { markUnknown: false });
      expect(result.unknown).toBeUndefined();
      expect(result.line).toBe("customtool --arg");
    });
  });

  describe("piped commands", () => {
    it("translates simple piped commands", () => {
      const result = transformCommand("cat file.txt | wc -l");
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("Get-Content file.txt");
      expect(result.line).toContain("|");
      expect(result.line).toContain("Measure-Object");
    });

    it("translates grep in pipe context", () => {
      const result = transformCommand("cat file.txt | grep error");
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("Get-Content file.txt");
      expect(result.line).toContain("Where-Object");
    });

    it("translates sort in pipe", () => {
      const result = transformCommand("cat file.txt | sort");
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("Sort-Object");
    });

    it("translates head/tail in pipe", () => {
      const result = transformCommand("cat file.txt | head -5");
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("Select-Object -First 5");
    });

    it("translates tr -d in pipe", () => {
      const result = transformCommand("echo hello | tr -d ' '");
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("-replace");
    });

    it("marks unknown pipe stages with TODO", () => {
      const result = transformCommand("cat file.txt | unknowncmd");
      expect(result.unknown).toBe(true);
      expect(result.line).toContain("# TODO: translate");
    });
  });

  describe("transformBashBlock", () => {
    it("transforms multiple lines", () => {
      const input = `mkdir -p /tmp/test
cat file.txt
echo "done"`;

      const result = transformBashBlock(input);

      expect(result).toContain("New-Item -ItemType Directory");
      expect(result).toContain("Get-Content file.txt");
      expect(result).toContain('Write-Output "done"');
    });

    it("preserves indentation", () => {
      const input = `  mkdir -p /tmp/test
    cat file.txt`;

      const result = transformBashBlock(input);

      expect(result).toMatch(/^  New-Item/m);
      expect(result).toMatch(/^    Get-Content/m);
    });

    it("preserves comments and empty lines", () => {
      const input = `# Comment
mkdir -p /tmp

echo done`;

      const result = transformBashBlock(input);

      expect(result).toContain("# Comment");
      expect(result).toContain("\n\n");
    });
  });

  describe("transformCommandsStage", () => {
    it("transforms bash code blocks to powershell", () => {
      const input = `Some text

\`\`\`bash
mkdir -p /tmp/test
\`\`\`

More text`;

      const result = transformCommandsStage(input);

      expect(result).toContain("```powershell");
      expect(result).toContain("New-Item -ItemType Directory");
      expect(result).not.toContain("```bash");
    });

    it("transforms sh code blocks", () => {
      const input = `\`\`\`sh
cat file.txt
\`\`\``;

      const result = transformCommandsStage(input);

      expect(result).toContain("```powershell");
      expect(result).toContain("Get-Content file.txt");
    });

    it("preserves non-bash code blocks", () => {
      const input = `\`\`\`javascript
console.log("hello");
\`\`\``;

      const result = transformCommandsStage(input);

      expect(result).toContain("```javascript");
      expect(result).toContain('console.log("hello")');
    });

    it("handles multiple bash blocks", () => {
      const input = `\`\`\`bash
mkdir -p /tmp
\`\`\`

Some text

\`\`\`bash
cat file.txt
\`\`\``;

      const result = transformCommandsStage(input);

      expect(result.match(/```powershell/g)?.length).toBe(2);
    });
  });

  describe("containsBashBlocks", () => {
    it("returns true for content with bash blocks", () => {
      expect(containsBashBlocks("```bash\necho hi\n```")).toBe(true);
    });

    it("returns true for content with sh blocks", () => {
      expect(containsBashBlocks("```sh\necho hi\n```")).toBe(true);
    });

    it("returns false for content without bash blocks", () => {
      expect(containsBashBlocks("```javascript\nconsole.log()\n```")).toBe(false);
    });

    it("returns false for plain text", () => {
      expect(containsBashBlocks("Hello world")).toBe(false);
    });
  });
});

describe("real gstack patterns from inventory", () => {
  describe("session counting pattern", () => {
    it("translates find | wc -l pattern", () => {
      // From qa skill: _SESSIONS=$(find ~/.gstack/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
      const findPart = transformCommand("find ~/.gstack/sessions -mmin -120 -type f");

      // The mmin pattern should match
      expect(findPart.transformed).toBe(true);
      expect(findPart.line).toContain("Get-ChildItem");
      expect(findPart.line).toContain("Where-Object");
      expect(findPart.line).toContain("AddMinutes");
    });
  });

  describe("timestamp patterns", () => {
    it("translates date +%s for telemetry start", () => {
      const result = transformCommand("date +%s");
      expect(result.transformed).toBe(true);
      expect(result.line).toBe("[int][double]::Parse((Get-Date -UFormat %s))");
    });

    it("translates ISO 8601 date format", () => {
      const result = transformCommand("date -u +%Y-%m-%dT%H:%M:%SZ");
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("ToUniversalTime");
      expect(result.line).toContain("ToString");
    });
  });

  describe("file test patterns", () => {
    it("handles [ -f $CONFIG_FILE ]", () => {
      const result = transformCommand('[ -f "$CONFIG_FILE" ]');
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("Test-Path");
      expect(result.line).toContain("-PathType Leaf");
    });

    it("handles [ -d $STATE_DIR ]", () => {
      const result = transformCommand('[ -d "$STATE_DIR" ]');
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("Test-Path");
      expect(result.line).toContain("-PathType Container");
    });
  });

  describe("grep patterns from ship skill", () => {
    it("translates grep -qF pattern", () => {
      const result = transformCommand('grep -qF "${KEY}:" "$CONFIG_FILE"');
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("Select-String");
      expect(result.line).toContain("-SimpleMatch");
      expect(result.line).toContain("-Quiet");
    });
  });

  describe("directory operations", () => {
    it("translates mkdir -p for state directory", () => {
      const result = transformCommand('mkdir -p "$STATE_DIR"');
      expect(result.transformed).toBe(true);
      expect(result.line).toContain("New-Item -ItemType Directory");
      expect(result.line).toContain("-Force");
    });
  });

  describe("true command", () => {
    it("translates true to $true", () => {
      const result = transformCommand("true");
      expect(result.transformed).toBe(true);
      expect(result.line).toBe("$true");
    });
  });
});

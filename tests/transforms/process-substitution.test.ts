import { describe, expect, it } from "vitest";

import {
  detectProcessSubstitution,
  generateProcessSubstitutionCode,
  transformProcessSubstitutionLine,
  transformProcessSubstitutionStage,
  containsProcessSubstitution,
  _generateOutputVarName,
  _convertRedirection,
  _transformCommandPath,
  _formatPowerShellInvocation,
} from "../../src/pipeline/transforms/process-substitution.js";

describe("process substitution detection", () => {
  describe("detectProcessSubstitution", () => {
    it("detects basic source <(cmd) pattern", () => {
      const result = detectProcessSubstitution("source <(echo hello)");
      expect(result).toBeDefined();
      expect(result?.cleanCommand).toBe("echo hello");
    });

    it("detects pattern with path and 2>/dev/null", () => {
      const result = detectProcessSubstitution(
        "source <($GSTACK_BIN/gstack-repo-mode 2>/dev/null)"
      );
      expect(result).toBeDefined();
      expect(result?.cleanCommand).toBe("$GSTACK_BIN/gstack-repo-mode");
      expect(result?.redirections).toBe("2>/dev/null");
    });

    it("detects pattern with || true suffix", () => {
      const result = detectProcessSubstitution(
        "source <($GSTACK_BIN/gstack-config 2>/dev/null) || true"
      );
      expect(result).toBeDefined();
      expect(result?.cleanCommand).toBe("$GSTACK_BIN/gstack-config");
      expect(result?.fallbackSuffix).toBe("|| true");
    });

    it("returns undefined for non-process-substitution", () => {
      expect(detectProcessSubstitution("echo hello")).toBeUndefined();
      expect(detectProcessSubstitution("source ~/.bashrc")).toBeUndefined();
      expect(detectProcessSubstitution("cat <(ls)")).toBeUndefined();
    });

    it("handles leading whitespace", () => {
      const result = detectProcessSubstitution("  source <(cmd)");
      expect(result).toBeDefined();
      expect(result?.cleanCommand).toBe("cmd");
    });
  });

  describe("containsProcessSubstitution", () => {
    it("returns true for content with source <(...)", () => {
      expect(containsProcessSubstitution("source <(cmd)")).toBe(true);
      expect(containsProcessSubstitution("  source <(cmd)")).toBe(true);
      expect(
        containsProcessSubstitution("line1\nsource <(cmd)\nline3")
      ).toBe(true);
    });

    it("returns false for content without pattern", () => {
      expect(containsProcessSubstitution("echo hello")).toBe(false);
      expect(containsProcessSubstitution("source ~/.bashrc")).toBe(false);
    });
  });
});

describe("process substitution helpers", () => {
  describe("_generateOutputVarName", () => {
    it("generates camelCase variable name from gstack script", () => {
      expect(_generateOutputVarName("gstack-repo-mode")).toBe("_repoModeOutput");
      expect(_generateOutputVarName("gstack-config")).toBe("_configOutput");
      expect(_generateOutputVarName("/path/to/gstack-update-check")).toBe(
        "_updateCheckOutput"
      );
    });

    it("handles paths with variables", () => {
      expect(
        _generateOutputVarName("$GSTACK_BIN/gstack-repo-mode")
      ).toBe("_repoModeOutput");
    });

    it("extracts name from kebab-case scripts", () => {
      expect(_generateOutputVarName("some-other-script")).toBe("_someOtherScriptOutput");
    });

    it("returns default name for unrecognizable input", () => {
      expect(_generateOutputVarName("")).toBe("_sourceOutput");
    });
  });

  describe("_convertRedirection", () => {
    it("converts 2>/dev/null to 2>$null", () => {
      expect(_convertRedirection("2>/dev/null")).toBe("2>$null");
    });

    it("converts /dev/null to $null", () => {
      expect(_convertRedirection(">/dev/null")).toBe(">$null");
    });

    it("handles empty input", () => {
      expect(_convertRedirection("")).toBe("");
    });
  });

  describe("_transformCommandPath", () => {
    it("transforms $GSTACK_BIN to $env:GSTACK_COPILOT_BIN", () => {
      const result = _transformCommandPath("$GSTACK_BIN/gstack-repo-mode");
      expect(result).toContain("$env:GSTACK_COPILOT_BIN");
    });

    it("transforms $GSTACK_ROOT to $env:GSTACK_COPILOT_ROOT", () => {
      const result = _transformCommandPath("$GSTACK_ROOT/bin/script");
      expect(result).toContain("$env:GSTACK_COPILOT_ROOT");
    });

    it("transforms $HOME to $env:USERPROFILE", () => {
      const result = _transformCommandPath("$HOME/.config/script");
      expect(result).toContain("$env:USERPROFILE");
    });

    it("adds .ps1 extension to gstack scripts", () => {
      const result = _transformCommandPath("$GSTACK_BIN/gstack-repo-mode");
      expect(result).toContain(".ps1");
    });

    it("converts forward slashes after env vars to backslashes", () => {
      const result = _transformCommandPath("$GSTACK_BIN/gstack-repo-mode");
      expect(result).toContain("$env:GSTACK_COPILOT_BIN\\");
    });
  });

  describe("_formatPowerShellInvocation", () => {
    it("formats script invocation without arguments", () => {
      expect(
        _formatPowerShellInvocation("$env:GSTACK_COPILOT_BIN\\gstack-repo-mode.ps1")
      ).toBe('& "$env:GSTACK_COPILOT_BIN\\gstack-repo-mode.ps1"');
    });

    it("formats generic command invocations with arguments", () => {
      expect(_formatPowerShellInvocation('echo "hello"')).toBe('& "echo" "hello"');
    });
  });
});

describe("process substitution transformation", () => {
  describe("generateProcessSubstitutionCode", () => {
    it("generates two-step capture for gstack-repo-mode", () => {
      const match = detectProcessSubstitution(
        "source <($GSTACK_BIN/gstack-repo-mode 2>/dev/null)"
      )!;
      const code = generateProcessSubstitutionCode(match);

      // Should contain variable assignment
      expect(code).toContain("$_repoModeOutput = &");
      // Should contain PS path
      expect(code).toContain("$env:GSTACK_COPILOT_BIN");
      // Should contain .ps1 extension
      expect(code).toContain(".ps1");
      // Should contain redirection
      expect(code).toContain("2>$null");
      // Should parse KEY=VALUE
      expect(code).toContain("-match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$'");
      // Should set environment variables
      expect(code).toContain('Set-Item -Path "Env:$($Matches[1])"');
    });

    it("generates multi-line output", () => {
      const match = detectProcessSubstitution("source <(cmd)")!;
      const code = generateProcessSubstitutionCode(match);
      const lines = code.split("\n");

      expect(lines.length).toBeGreaterThan(1);
    });
  });

  describe("transformProcessSubstitutionLine", () => {
    it("transforms a source <(cmd) line", () => {
      const result = transformProcessSubstitutionLine(
        "source <($GSTACK_BIN/gstack-repo-mode 2>/dev/null) || true"
      );

      expect(result).toContain("$_repoModeOutput = &");
      expect(result).toContain("Set-Item");
    });

    it("preserves indentation", () => {
      const result = transformProcessSubstitutionLine(
        "    source <(cmd)"
      );

      expect(result).toMatch(/^    \$\w*_\w+Output = &|^    \$\w+Output = &/);
    });

    it("returns original line for non-matches", () => {
      const result = transformProcessSubstitutionLine("echo hello");
      expect(result).toBe("echo hello");
    });
  });

  describe("transformProcessSubstitutionStage", () => {
    it("transforms all source <(cmd) patterns in content", () => {
      const input = `line 1
source <($GSTACK_BIN/gstack-repo-mode 2>/dev/null) || true
line 3
source <($GSTACK_BIN/gstack-config 2>/dev/null) || true
line 5`;

      const result = transformProcessSubstitutionStage(input);

      expect(result).toContain("_repoModeOutput");
      expect(result).toContain("_configOutput");
      expect(result).not.toContain("source <(");
    });

    it("preserves lines without process substitution", () => {
      const input = `line 1
echo hello
line 3`;

      const result = transformProcessSubstitutionStage(input);
      expect(result).toBe(input);
    });
  });
});

  describe("real gstack patterns", () => {
  it("transforms the exact gstack-repo-mode pattern from inventory", () => {
    const input = "source <($GSTACK_BIN/gstack-repo-mode 2>/dev/null) || true";
    const result = transformProcessSubstitutionStage(input);

    // Should be valid PowerShell (no bash-isms)
    expect(result).not.toContain("source <(");
    expect(result).not.toContain("/dev/null");

    // Should have proper PowerShell constructs
    expect(result).toContain("$env:GSTACK_COPILOT_BIN");
    expect(result).toContain("$null");
    expect(result).toContain("Set-Item");
  });

  it("transforms gstack-config pattern", () => {
    const input = "source <($GSTACK_BIN/gstack-config 2>/dev/null) || true";
    const result = transformProcessSubstitutionStage(input);

    expect(result).toContain("_configOutput");
    expect(result).not.toContain("source <(");
  });
});

import { describe, expect, it } from "vitest";

import {
  detectDefaultValues,
  transformDefaultValue,
  transformDefaultValues,
  transformChainedCommands,
  containsChainedCommands,
  transformRedirections,
  containsBashRedirections,
  transformShellIdiomsStage,
  transformBashBlockIdioms,
  containsShellIdioms,
  transformTestExpression,
} from "../../src/pipeline/transforms/shell-idioms.js";

describe("default value syntax", () => {
  describe("detectDefaultValues", () => {
    it("detects ${VAR:-default} pattern", () => {
      const matches = detectDefaultValues('echo "${VAR:-default}"');
      expect(matches).toHaveLength(1);
      expect(matches[0].varName).toBe("VAR");
      expect(matches[0].operator).toBe(":-");
      expect(matches[0].value).toBe("default");
    });

    it("detects ${VAR:=default} pattern", () => {
      const matches = detectDefaultValues("${VAR:=value}");
      expect(matches).toHaveLength(1);
      expect(matches[0].operator).toBe(":=");
    });

    it("detects ${VAR:+alternate} pattern", () => {
      const matches = detectDefaultValues("${VAR:+alternate}");
      expect(matches).toHaveLength(1);
      expect(matches[0].operator).toBe(":+");
    });

    it("detects multiple patterns in one string", () => {
      const matches = detectDefaultValues(
        '${VAR1:-a} and ${VAR2:=b} and ${VAR3:+c}'
      );
      expect(matches).toHaveLength(3);
    });

    it("returns empty array for no matches", () => {
      const matches = detectDefaultValues("echo $VAR");
      expect(matches).toHaveLength(0);
    });

    it("handles variable names with underscores and numbers", () => {
      const matches = detectDefaultValues("${MY_VAR_123:-default}");
      expect(matches).toHaveLength(1);
      expect(matches[0].varName).toBe("MY_VAR_123");
    });
  });

  describe("transformDefaultValue", () => {
    it("transforms :- to ternary for inline use", () => {
      const match = {
        fullMatch: "${VAR:-default}",
        varName: "VAR",
        operator: ":-" as const,
        value: "default",
      };
      const result = transformDefaultValue(match, true);
      expect(result).toBe("($VAR ? $VAR : 'default')");
    });

    it("transforms := to if statement for non-inline", () => {
      const match = {
        fullMatch: "${VAR:=default}",
        varName: "VAR",
        operator: ":=" as const,
        value: "default",
      };
      const result = transformDefaultValue(match, false);
      expect(result).toBe("if (-not $VAR) { $VAR = 'default' }");
    });

    it("transforms :+ to ternary with alternate value", () => {
      const match = {
        fullMatch: "${VAR:+alternate}",
        varName: "VAR",
        operator: ":+" as const,
        value: "alternate",
      };
      const result = transformDefaultValue(match, true);
      expect(result).toBe("($VAR ? 'alternate' : $VAR)");
    });

    it("does not double-quote already quoted values", () => {
      const match = {
        fullMatch: '${VAR:-"quoted"}',
        varName: "VAR",
        operator: ":-" as const,
        value: '"quoted"',
      };
      const result = transformDefaultValue(match, true);
      expect(result).toBe('($VAR ? $VAR : "quoted")');
    });

    it("handles variable references in value", () => {
      const match = {
        fullMatch: "${VAR:-$OTHER}",
        varName: "VAR",
        operator: ":-" as const,
        value: "$OTHER",
      };
      const result = transformDefaultValue(match, true);
      expect(result).toBe("($VAR ? $VAR : $OTHER)");
    });
  });

  describe("transformDefaultValues", () => {
    it("transforms assignment pattern VAR=${VAR:-default}", () => {
      const input = "REPO_MODE=${REPO_MODE:-unknown}";
      const result = transformDefaultValues(input);
      expect(result).toBe("if (-not $REPO_MODE) { $REPO_MODE = 'unknown' }");
    });

    it("transforms inline usage", () => {
      const input = 'echo "${NAME:-Guest}"';
      const result = transformDefaultValues(input);
      expect(result).toContain("($NAME ? $NAME : 'Guest')");
    });

    it("handles multiple default values", () => {
      const input = "A=${A:-1}\nB=${B:-2}";
      const result = transformDefaultValues(input);
      expect(result).toContain("if (-not $A)");
      expect(result).toContain("if (-not $B)");
    });

    it("preserves content without default values", () => {
      const input = "echo $VAR";
      const result = transformDefaultValues(input);
      expect(result).toBe("echo $VAR");
    });
  });
});

describe("shell conditionals (&&, ||)", () => {
  describe("containsChainedCommands", () => {
    it("returns true for && chaining", () => {
      expect(containsChainedCommands("cmd1 && cmd2")).toBe(true);
    });

    it("returns true for || chaining", () => {
      expect(containsChainedCommands("cmd1 || cmd2")).toBe(true);
    });

    it("returns false for && inside [[ ]]", () => {
      expect(containsChainedCommands("[[ $a && $b ]]")).toBe(false);
    });

    it("returns false for || inside [ ]", () => {
      expect(containsChainedCommands("[ $a || $b ]")).toBe(false);
    });

    it("returns false for no chaining", () => {
      expect(containsChainedCommands("echo hello")).toBe(false);
    });
  });

  describe("transformChainedCommands", () => {
    it("transforms && to if ($?) check", () => {
      const result = transformChainedCommands("cmd1 && cmd2");
      expect(result).toBe("cmd1; if ($?) { cmd2 }");
    });

    it("transforms || to if (-not $?) check", () => {
      const result = transformChainedCommands("cmd1 || cmd2");
      expect(result).toBe("cmd1; if (-not $?) { cmd2 }");
    });

    it("handles || true pattern", () => {
      const result = transformChainedCommands("cmd || true");
      expect(result).toContain("cmd");
      expect(result).toContain("$true");
    });

    it("handles multiple chained commands", () => {
      const result = transformChainedCommands("a && b && c");
      expect(result).toContain("a;");
      expect(result).toContain("if ($?) { b }");
      expect(result).toContain("if ($?) { c }");
    });

    it("preserves lines without chaining", () => {
      const result = transformChainedCommands("echo hello");
      expect(result).toBe("echo hello");
    });

    it("handles quoted strings containing operators", () => {
      const result = transformChainedCommands('echo "a && b"');
      expect(result).toBe('echo "a && b"');
    });
  });
});

describe("redirection patterns", () => {
  describe("containsBashRedirections", () => {
    it("detects /dev/null", () => {
      expect(containsBashRedirections("cmd 2>/dev/null")).toBe(true);
    });

    it("detects &>", () => {
      expect(containsBashRedirections("cmd &>/dev/null")).toBe(true);
    });

    it("returns false for PowerShell redirections", () => {
      expect(containsBashRedirections("cmd 2>$null")).toBe(false);
    });
  });

  describe("transformRedirections", () => {
    it("transforms 2>/dev/null to 2>$null", () => {
      const result = transformRedirections("cmd 2>/dev/null");
      expect(result).toBe("cmd 2>$null");
    });

    it("transforms >/dev/null 2>&1 to *>$null", () => {
      const result = transformRedirections("cmd >/dev/null 2>&1");
      expect(result).toBe("cmd *>$null");
    });

    it("transforms &>/dev/null to *>$null", () => {
      const result = transformRedirections("cmd &>/dev/null");
      expect(result).toBe("cmd *>$null");
    });

    it("transforms >/dev/null to >$null", () => {
      const result = transformRedirections("cmd >/dev/null");
      expect(result).toBe("cmd >$null");
    });

    it("preserves content without redirections", () => {
      const result = transformRedirections("echo hello");
      expect(result).toBe("echo hello");
    });

    it("handles multiple redirections in content", () => {
      const input = "cmd1 2>/dev/null\ncmd2 >/dev/null";
      const result = transformRedirections(input);
      expect(result).toBe("cmd1 2>$null\ncmd2 >$null");
    });
  });
});

describe("test expressions", () => {
  describe("transformTestExpression", () => {
    it("transforms regex match [[ =~ ]]", () => {
      const result = transformTestExpression('[[ "$REPO_MODE" =~ monorepo ]]');
      expect(result).toBe('("$REPO_MODE" -match \'monorepo\')');
    });

    it("preserves non-regex test expressions", () => {
      const result = transformTestExpression('[ -f "$file" ]');
      expect(result).toBe('[ -f "$file" ]'); // Handled by commands.ts
    });
  });
});

describe("combined shell idiom stage", () => {
  describe("transformShellIdiomsStage", () => {
    it("transforms default values and redirections together", () => {
      const input = "cmd 2>/dev/null\nVAR=${VAR:-default}";
      const result = transformShellIdiomsStage(input);

      expect(result).toContain("2>$null");
      expect(result).toContain("if (-not $VAR)");
    });

    it("preserves line structure", () => {
      const input = "line1\nline2\nline3";
      const result = transformShellIdiomsStage(input);
      expect(result.split("\n")).toHaveLength(3);
    });
  });

  describe("transformBashBlockIdioms", () => {
    it("transforms chained commands within block", () => {
      const input = "cmd1 && cmd2\ncmd3 || cmd4";
      const result = transformBashBlockIdioms(input);

      expect(result).toContain("if ($?)");
      expect(result).toContain("if (-not $?)");
    });

    it("preserves regular commands", () => {
      const input = "echo hello\necho world";
      const result = transformBashBlockIdioms(input);
      expect(result).toBe(input);
    });
  });

  describe("containsShellIdioms", () => {
    it("returns true for default value syntax", () => {
      expect(containsShellIdioms("${VAR:-default}")).toBe(true);
    });

    it("returns true for redirections", () => {
      expect(containsShellIdioms("cmd 2>/dev/null")).toBe(true);
    });

    it("returns false for plain content", () => {
      expect(containsShellIdioms("echo hello")).toBe(false);
    });
  });
});

describe("real gstack patterns from inventory", () => {
  it("transforms REPO_MODE default value pattern", () => {
    const input = "REPO_MODE=${REPO_MODE:-unknown}";
    const result = transformDefaultValues(input);
    expect(result).toBe("if (-not $REPO_MODE) { $REPO_MODE = 'unknown' }");
  });

  it("transforms update check pattern with redirections", () => {
    const input =
      '_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)';
    const result = transformRedirections(input);
    expect(result).toContain("2>$null");
    expect(result).not.toContain("/dev/null");
  });

  it("transforms session counting pattern", () => {
    // From qa skill: find ... 2>/dev/null | wc -l | tr -d ' '
    const input = "find ~/.gstack/sessions -mmin -120 -type f 2>/dev/null | wc -l";
    const result = transformRedirections(input);
    expect(result).toContain("2>$null");
  });

  it("transforms telemetry duration calculation pattern", () => {
    // This is arithmetic, which we handle as-is since PS supports it
    const input = "_TEL_DUR=$(( _TEL_END - _TEL_START ))";
    // The arithmetic syntax is similar enough in PS
    expect(containsShellIdioms(input)).toBe(false);
  });
});

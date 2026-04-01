import { describe, expect, it } from "vitest";

import {
  transformEnvVarsStage,
  containsBashEnvVars,
  extractBashEnvVarNames,
} from "../../src/pipeline/transforms/envvars.js";
import {
  transformEnvVars,
  transformKnownEnvVars,
  transformUnknownEnvVars,
} from "../../src/mappings/envvars.js";

describe("envvar transform", () => {
  describe("known variable mappings", () => {
    it("translates $HOME to $env:USERPROFILE", () => {
      const input = "cd $HOME/.config";
      const result = transformEnvVarsStage(input);
      expect(result).toBe("cd $env:USERPROFILE/.config");
    });

    it("translates $GSTACK_ROOT to $env:GSTACK_COPILOT_ROOT", () => {
      const input = "ls $GSTACK_ROOT/bin";
      const result = transformEnvVarsStage(input);
      expect(result).toBe("ls $env:GSTACK_COPILOT_ROOT/bin");
    });

    it("translates $GSTACK_BIN to $env:GSTACK_COPILOT_BIN", () => {
      const input = '$GSTACK_BIN/gstack-update-check';
      const result = transformEnvVarsStage(input);
      expect(result).toBe('$env:GSTACK_COPILOT_BIN/gstack-update-check');
    });

    it("translates $USER to $env:USERNAME", () => {
      const input = "echo Hello $USER";
      const result = transformEnvVarsStage(input);
      expect(result).toBe("echo Hello $env:USERNAME");
    });

    it("keeps $PWD as $PWD (same in PowerShell)", () => {
      const input = "cd $PWD/subdir";
      const result = transformEnvVarsStage(input);
      expect(result).toBe("cd $PWD/subdir");
    });

    it("translates multiple known variables in one line", () => {
      const input = "cp $HOME/.bashrc $GSTACK_ROOT/backup/";
      const result = transformEnvVarsStage(input);
      expect(result).toBe("cp $env:USERPROFILE/.bashrc $env:GSTACK_COPILOT_ROOT/backup/");
    });
  });

  describe("brace syntax", () => {
    it("handles ${VAR} brace syntax for known vars", () => {
      const input = 'path="${HOME}/.config"';
      const result = transformEnvVarsStage(input);
      expect(result).toBe('path="$env:USERPROFILE/.config"');
    });

    it("handles ${VAR} brace syntax for unknown vars", () => {
      const input = 'echo "${CUSTOM_VAR}"';
      const result = transformEnvVarsStage(input);
      expect(result).toBe('echo "$env:CUSTOM_VAR"');
    });

    it("handles mixed brace and non-brace syntax", () => {
      const input = '${HOME}/$USER/${CUSTOM}/file';
      const result = transformEnvVarsStage(input);
      expect(result).toBe('$env:USERPROFILE/$env:USERNAME/$env:CUSTOM/file');
    });
  });

  describe("word boundaries", () => {
    it("respects word boundaries for $VAR", () => {
      const input = "$VAR_EXTENDED_NAME";
      const result = transformEnvVarsStage(input);
      // Should NOT become $env:VAR_EXTENDED_NAME split into $env:VAR + _EXTENDED_NAME
      expect(result).toBe("$env:VAR_EXTENDED_NAME");
    });

    it("transforms $VAR followed by non-word character", () => {
      const input = "$HOME/path";
      const result = transformEnvVarsStage(input);
      expect(result).toBe("$env:USERPROFILE/path");
    });

    it("handles variable at end of string", () => {
      const input = "echo $HOME";
      const result = transformEnvVarsStage(input);
      expect(result).toBe("echo $env:USERPROFILE");
    });
  });

  describe("escaped variables", () => {
    it("does not transform escaped \\$VAR", () => {
      const input = "echo \\$HOME";
      const result = transformEnvVarsStage(input);
      expect(result).toBe("echo \\$HOME");
    });

    it("does not transform escaped \\${VAR}", () => {
      const input = 'echo "\\${HOME}"';
      const result = transformEnvVarsStage(input);
      expect(result).toBe('echo "\\${HOME}"');
    });
  });

  describe("unknown variables", () => {
    it("converts unknown $VAR to $env:VAR", () => {
      const input = "echo $CUSTOM_VARIABLE";
      const result = transformEnvVarsStage(input);
      expect(result).toBe("echo $env:CUSTOM_VARIABLE");
    });

    it("converts unknown ${VAR} to $env:VAR", () => {
      const input = "echo ${MY_SETTING}";
      const result = transformEnvVarsStage(input);
      expect(result).toBe("echo $env:MY_SETTING");
    });

    it("handles multiple unknown variables", () => {
      const input = "$FOO and $BAR and ${BAZ}";
      const result = transformEnvVarsStage(input);
      expect(result).toBe("$env:FOO and $env:BAR and $env:BAZ");
    });
  });

  describe("knownOnly option", () => {
    it("only transforms known vars when knownOnly is true", () => {
      const input = "$HOME and $CUSTOM_VAR";
      const result = transformEnvVarsStage(input, { knownOnly: true });
      expect(result).toBe("$env:USERPROFILE and $CUSTOM_VAR");
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      expect(transformEnvVarsStage("")).toBe("");
    });

    it("handles string with no variables", () => {
      const input = "Hello World!";
      expect(transformEnvVarsStage(input)).toBe("Hello World!");
    });

    it("does not transform already PowerShell $env: syntax", () => {
      const input = "$env:USERPROFILE/path";
      const result = transformEnvVarsStage(input);
      expect(result).toBe("$env:USERPROFILE/path");
    });

    it("handles adjacent variables", () => {
      const input = "$HOME$USER";
      const result = transformEnvVarsStage(input);
      // $HOME should transform, then the rest becomes $env:USER
      expect(result).toBe("$env:USERPROFILE$env:USERNAME");
    });
  });
});

describe("containsBashEnvVars", () => {
  it("returns true for content with $VAR", () => {
    expect(containsBashEnvVars("echo $HOME")).toBe(true);
  });

  it("returns true for content with ${VAR}", () => {
    expect(containsBashEnvVars("echo ${HOME}")).toBe(true);
  });

  it("returns false for content without variables", () => {
    expect(containsBashEnvVars("Hello World")).toBe(false);
  });

  it("returns false for already PowerShell $env:", () => {
    expect(containsBashEnvVars("echo $env:USERPROFILE")).toBe(false);
  });

  it("returns false for escaped variables", () => {
    expect(containsBashEnvVars("echo \\$HOME")).toBe(false);
  });
});

describe("extractBashEnvVarNames", () => {
  it("extracts variable names from content", () => {
    const content = "echo $HOME $USER ${CUSTOM}";
    const names = extractBashEnvVarNames(content);
    expect(names).toContain("HOME");
    expect(names).toContain("USER");
    expect(names).toContain("CUSTOM");
  });

  it("returns unique names only", () => {
    const content = "$HOME $HOME $HOME";
    const names = extractBashEnvVarNames(content);
    expect(names).toEqual(["HOME"]);
  });

  it("returns sorted names", () => {
    const content = "$ZEBRA $ALPHA $MIDDLE";
    const names = extractBashEnvVarNames(content);
    expect(names).toEqual(["ALPHA", "MIDDLE", "ZEBRA"]);
  });

  it("returns empty array for no variables", () => {
    expect(extractBashEnvVarNames("Hello World")).toEqual([]);
  });
});

describe("mapping registry functions", () => {
  describe("transformKnownEnvVars", () => {
    it("only transforms known mappings", () => {
      const input = "$HOME $UNKNOWN";
      const result = transformKnownEnvVars(input);
      expect(result).toBe("$env:USERPROFILE $UNKNOWN");
    });
  });

  describe("transformUnknownEnvVars", () => {
    it("converts unknown vars to $env: format", () => {
      const input = "$CUSTOM_VAR";
      const result = transformUnknownEnvVars(input);
      expect(result).toBe("$env:CUSTOM_VAR");
    });

    it("keeps $PWD as-is", () => {
      const input = "$PWD/path";
      const result = transformUnknownEnvVars(input);
      expect(result).toBe("$PWD/path");
    });
  });

  describe("transformEnvVars (combined)", () => {
    it("transforms both known and unknown vars", () => {
      const input = "$HOME $CUSTOM";
      const result = transformEnvVars(input);
      expect(result).toBe("$env:USERPROFILE $env:CUSTOM");
    });
  });
});

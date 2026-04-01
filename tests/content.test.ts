import { describe, expect, it } from "vitest";

import { transformContent } from "../src/pipeline/content.js";

describe("transformContent", () => {
  it("rewrites gstack paths to Copilot paths", () => {
    const content = `Read ~/.claude/skills/gstack/review/SKILL.md
$GSTACK_ROOT/config
$GSTACK_BIN/run
~/.gstack/cache/`;

    const result = transformContent(content);

    expect(result).toContain("~/.copilot/skills/gstack-review/SKILL.md");
    expect(result).toContain("$env:GSTACK_COPILOT_ROOT/config");
    expect(result).toContain("$env:GSTACK_COPILOT_BIN/run");
    expect(result).toContain("$env:USERPROFILE\\.gstack-copilot\\cache/");
  });

  it("replaces the gstack preamble with Copilot initialization", () => {
    const content = `## Preamble (run first)

\`\`\`bash
GSTACK_ROOT=~/.gstack
\`\`\`

## Process

Continue here.`;

    const result = transformContent(content);

    expect(result).toContain("## Initialization");
    // The env var transform converts $GSTACK_COPILOT_ROOT to $env:GSTACK_COPILOT_ROOT
    expect(result).toContain("$env:GSTACK_COPILOT_ROOT");
    expect(result).not.toContain("## Preamble (run first)");
  });

  it("preserves non-preamble code blocks", () => {
    const content = `## Process

\`\`\`bash
echo "~/.claude/skills/gstack/review/"
\`\`\``;

    const result = transformContent(content);

    expect(result).toContain("```bash");
    expect(result).toContain('echo "~/.copilot/skills/gstack-review/"');
  });

  it("does not transform unrelated URLs", () => {
    const content = "See https://example.com/docs for more information.";

    expect(transformContent(content)).toContain("https://example.com/docs");
  });

  it("throws on unsupported Bash constructs with line numbers", () => {
    const content = `## Process

source <(echo "hello")`;

    expect(() => transformContent(content, "skill.md")).toThrow(
      /unsupported bash process substitution/i,
    );
  });
});

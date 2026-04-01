import { describe, expect, it } from "vitest";

import { transformContent } from "../../src/pipeline/content.js";

describe("full translation pipeline", () => {
  it("translates a realistic bash block with process substitution and shell idioms", () => {
    const content = `## Process

\`\`\`bash
source <($GSTACK_BIN/gstack-repo-mode 2>/dev/null) || true
REPO_MODE=\${REPO_MODE:-unknown}
[ -f "$CONFIG_FILE" ] && grep -qF "\${KEY}:" "$CONFIG_FILE"
\`\`\``;

    const result = transformContent(content);

    expect(result).toContain("```powershell");
    expect(result).toContain('$_repoModeOutput = & "$env:GSTACK_COPILOT_BIN\\gstack-repo-mode.ps1" 2>$null');
    expect(result).toContain('Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2]');
    expect(result).toContain("if (-not $env:REPO_MODE) { $env:REPO_MODE = 'unknown' }");
    expect(result).toContain('(Test-Path "$env:CONFIG_FILE" -PathType Leaf)');
    expect(result).toContain('if ($?) { (Select-String -Pattern "$env:KEY:" -Path "$env:CONFIG_FILE" -SimpleMatch -Quiet) }');
    expect(result).not.toContain("# TODO: translate");
  });
});

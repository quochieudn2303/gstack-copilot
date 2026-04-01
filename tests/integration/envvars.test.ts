import { describe, expect, it } from "vitest";

import { transformContent } from "../../src/pipeline/content.js";
import { transformEnvVarsStage } from "../../src/pipeline/transforms/envvars.js";

/**
 * Integration tests for environment variable translation
 *
 * These tests use realistic gstack skill content excerpts to verify
 * the full pipeline works correctly with real-world patterns.
 */

describe("environment variable integration", () => {
  describe("real skill preamble content", () => {
    it("transforms review skill preamble environment variables", () => {
      // Realistic excerpt from gstack /review skill (excluding process substitution)
      const reviewPreamble = `## Setup

\`\`\`bash
_UPD=$($HOME/.gstack/bin/gstack-update-check 2>/dev/null || true)
GSTACK_ROOT=$HOME/.gstack
CONFIG_FILE="$GSTACK_ROOT/config.yaml"
STATE_DIR="$GSTACK_ROOT/state"
mkdir -p "$STATE_DIR"
\`\`\``;

      const result = transformEnvVarsStage(reviewPreamble);

      // HOME -> USERPROFILE
      expect(result).toContain("$env:USERPROFILE/.gstack/bin/gstack-update-check");
      expect(result).toContain("GSTACK_ROOT=$env:USERPROFILE/.gstack");

      // GSTACK_ROOT -> GSTACK_COPILOT_ROOT
      expect(result).toContain('CONFIG_FILE="$env:GSTACK_COPILOT_ROOT/config.yaml"');
      expect(result).toContain('STATE_DIR="$env:GSTACK_COPILOT_ROOT/state"');

      // Unknown vars get $env: prefix
      expect(result).toContain("_UPD=$(");
      expect(result).toContain('mkdir -p "$env:STATE_DIR"');
    });

    it("transforms qa skill session counting pattern", () => {
      // Excerpt from gstack /qa skill
      const qaContent = `
\`\`\`bash
_SESSIONS=$(find $HOME/.gstack/sessions -mmin -120 -type f 2>/dev/null | wc -l)
if [ "$_SESSIONS" -gt 0 ]; then
  echo "Active sessions: $_SESSIONS"
fi
\`\`\``;

      const result = transformEnvVarsStage(qaContent);

      expect(result).toContain("$env:USERPROFILE/.gstack/sessions");
      expect(result).toContain('if [ "$env:_SESSIONS" -gt 0 ]');
      expect(result).toContain("echo \"Active sessions: $env:_SESSIONS\"");
    });

    it("transforms office-hours skill state management", () => {
      // Excerpt from gstack /office-hours skill
      const officeHoursContent = `
STATE_DIR="$GSTACK_ROOT/state"
CACHE_FILE="$STATE_DIR/session-cache"
[ -d "$STATE_DIR" ] || mkdir -p "$STATE_DIR"
touch "$CACHE_FILE"
`;

      const result = transformEnvVarsStage(officeHoursContent);

      expect(result).toContain('STATE_DIR="$env:GSTACK_COPILOT_ROOT/state"');
      expect(result).toContain('CACHE_FILE="$env:STATE_DIR/session-cache"');
      expect(result).toContain('[ -d "$env:STATE_DIR" ]');
      expect(result).toContain('mkdir -p "$env:STATE_DIR"');
      expect(result).toContain('touch "$env:CACHE_FILE"');
    });

    it("transforms ship skill config patterns", () => {
      // Excerpt from gstack /ship skill
      // Note: \${KEY} is escaped to prevent JavaScript template interpretation
      const shipContent = `
CONFIG_FILE="$GSTACK_ROOT/config.yaml"
KEY="last_ship_date"
if [ -f "$CONFIG_FILE" ]; then
  grep -q "^\${KEY}:" "$CONFIG_FILE"
fi
`;

      const result = transformEnvVarsStage(shipContent);

      expect(result).toContain('CONFIG_FILE="$env:GSTACK_COPILOT_ROOT/config.yaml"');
      expect(result).toContain('KEY="last_ship_date"');
      expect(result).toContain('if [ -f "$env:CONFIG_FILE" ]');
      // Brace syntax should also work
      expect(result).toContain('"^$env:KEY:"');
    });
  });

  describe("telemetry timestamp patterns", () => {
    it("transforms timestamp variable patterns correctly", () => {
      const telemetryContent = `
_TEL_START=$(date +%s)
# ... skill work happens here ...
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
echo "Duration: $_TEL_DUR seconds"
`;

      const result = transformEnvVarsStage(telemetryContent);

      // Variables inside $(()) arithmetic don't have $ prefix in original
      // so we only transform the ones that do have $
      expect(result).toContain("_TEL_START=$(date +%s)");
      expect(result).toContain("_TEL_END=$(date +%s)");
      expect(result).toContain('echo "Duration: $env:_TEL_DUR seconds"');
    });
  });

  describe("mixed content scenarios", () => {
    it("handles content with both known and unknown variables", () => {
      const mixedContent = `
HOME_DIR=$HOME
CUSTOM_PATH="$HOME/custom/$MY_SETTING"
GSTACK_TOOL="$GSTACK_BIN/tool"
`;

      const result = transformEnvVarsStage(mixedContent);

      expect(result).toContain("HOME_DIR=$env:USERPROFILE");
      expect(result).toContain('"$env:USERPROFILE/custom/$env:MY_SETTING"');
      expect(result).toContain('"$env:GSTACK_COPILOT_BIN/tool"');
    });

    it("preserves non-variable dollar signs", () => {
      const content = `
echo "Price: $100"
regex='\\$[A-Z]+'
`;

      const result = transformEnvVarsStage(content);

      // $100 should not be transformed (starts with digit)
      expect(result).toContain('echo "Price: $100"');
      // Escaped $ should be preserved
      expect(result).toContain("regex='\\$[A-Z]+'");
    });

    it("transforms variables even inside single quotes (text-level transform)", () => {
      // Note: Unlike shell execution, our transform operates at text level
      // and doesn't have shell-level quote awareness
      const content = "echo 'Path: $HOME'";
      const result = transformEnvVarsStage(content);
      // The transform will replace $HOME even in single quotes
      // This is expected behavior for text-level transformation
      expect(result).toContain("$env:USERPROFILE");
    });
  });

  describe("full pipeline integration", () => {
    it("transforms env vars through full content pipeline", () => {
      // Test that transformContent includes env var transformation
      const skillContent = `Read $HOME/.config/settings
Check $GSTACK_ROOT/state
Use $CUSTOM_VAR for processing`;

      const result = transformContent(skillContent);

      expect(result).toContain("$env:USERPROFILE/.config/settings");
      expect(result).toContain("$env:GSTACK_COPILOT_ROOT/state");
      expect(result).toContain("$env:CUSTOM_VAR");
    });

    it("applies transforms in correct order (paths then env vars)", () => {
      // Path transform runs before env var transform
      const content = `~/.gstack/cache
$GSTACK_ROOT/config`;

      const result = transformContent(content);

      // Path should be transformed to Windows style with $env:
      expect(result).toContain("$env:USERPROFILE\\.gstack-copilot\\cache");
      // GSTACK_ROOT should map to GSTACK_COPILOT_ROOT with $env:
      expect(result).toContain("$env:GSTACK_COPILOT_ROOT/config");
    });
  });

  describe("edge cases from real skills", () => {
    it("handles git variables correctly", () => {
      // Git commands often use variables
      const gitContent = `
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "On branch: $BRANCH"
git diff $BASE_REF...HEAD
`;

      const result = transformEnvVarsStage(gitContent);

      expect(result).toContain('echo "On branch: $env:BRANCH"');
      expect(result).toContain("git diff $env:BASE_REF...HEAD");
    });

    it("handles variable assignment without spaces", () => {
      const content = "VAR=$OTHER_VAR";
      const result = transformEnvVarsStage(content);
      expect(result).toBe("VAR=$env:OTHER_VAR");
    });

    it("handles variables in command substitution", () => {
      const content = "RESULT=$($HOME/bin/tool --config $CONFIG_FILE)";
      const result = transformEnvVarsStage(content);
      expect(result).toContain("$env:USERPROFILE/bin/tool");
      expect(result).toContain("$env:CONFIG_FILE");
    });
  });
});

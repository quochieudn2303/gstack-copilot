import { readFile } from "node:fs/promises";

import { transformFrontmatter } from "../../pipeline/frontmatter.js";
import { generateOutput } from "../../pipeline/output.js";
import { parseSkill } from "../../pipeline/parse.js";
import { transformContent } from "../../pipeline/content.js";

export const QA_SKILL_SELF_REFERENCE = ".github/skills/qa/SKILL.md";

function buildQaBehaviorSections(): string {
  return [
    "## Guided Flow",
    "",
    "1. Default to a guided flow through the target app, not a broad crawl.",
    "2. Prefer explicit page or flow targets when the user provides them.",
    "3. Support `single-page` or `crawl` scope only when the user explicitly asks for those modes.",
    "",
    "## Coverage Modes",
    "",
    "1. `quick` mode covers critical and high-severity issues only.",
    "2. `standard` mode is the default path and includes medium-severity issues.",
    "3. `exhaustive` mode extends coverage to low and cosmetic issues.",
    "",
    "## Findings First",
    "",
    "1. Gather findings before making any edits.",
    "2. Report issues using `critical`, `high`, `medium`, and `low` severity tiers.",
    "3. Include screenshots, repro steps, and console or network findings when they are relevant.",
    "",
    "## Fix Mode",
    "",
    "1. After presenting findings, ask whether fixes should be applied in the same session.",
    "2. Only enter fix mode after explicit user confirmation.",
    "3. If the user does not confirm, stop after the report and do not modify files.",
    "",
    "## Reference",
    "",
    `Read ${QA_SKILL_SELF_REFERENCE} for the checked-in project-local skill definition when you need the canonical QA behavior.`,
  ].join("\n");
}

function rewriteQaReferences(content: string): string {
  return content
    .replace(/~\/\.claude\/skills\/gstack\/qa\/SKILL\.md/g, QA_SKILL_SELF_REFERENCE)
    .replace(/~\/\.copilot\/skills\/gstack-qa\/SKILL\.md/g, QA_SKILL_SELF_REFERENCE)
    .replace(/\/qa-only/g, "`/qa-only`");
}

export function buildQaSkillArtifact(
  source: string,
  filepath: string = "tests/fixtures/qa-skill.md",
): string {
  const parsed = parseSkill(source, filepath);
  const baseFrontmatter = transformFrontmatter(parsed.data, {
    includeArgumentHint: false,
    userInvocable: true,
  });

  const frontmatter = {
    ...baseFrontmatter,
    name: "qa",
    description:
      "Guided-flow browser QA with findings-first reporting, evidence capture, and optional confirmed fixes.",
  };

  const transformedContent = rewriteQaReferences(
    transformContent(parsed.content, filepath),
  );
  const finalContent = [
    buildQaBehaviorSections(),
    "",
    "## Converted Source Guidance",
    "",
    transformedContent.trim(),
  ].join("\n");

  return `${generateOutput(frontmatter, finalContent)}\n`;
}

export function buildQaReadme(): string {
  return `${[
    "# /qa Skill",
    "",
    "Project-local Copilot CLI skill artifact for Phase 5.",
    "",
    "Use `/qa` for guided-flow browser testing inside GitHub Copilot CLI.",
    "The default path is findings-first with explicit confirmation before same-session fixes.",
    "Optional non-default paths: `quick`, `standard`, `exhaustive`, plus explicit `single-page` or `crawl` scopes.",
    "",
    "Verification focus for Phase 5:",
    "- guided flow is the default path",
    "- quick, standard, and exhaustive modes remain available",
    "- single-page and crawl scopes remain explicit opt-ins",
    "- findings are reported before edits",
    "- fix mode requires explicit confirmation",
    "- screenshots, repro steps, and console/network evidence are part of the contract",
    "- the checked-in artifact should match the builder output exactly",
  ].join("\n")}\n`;
}

export async function buildQaSkillArtifactFromFile(
  filepath: string = "tests/fixtures/qa-skill.md",
): Promise<string> {
  const source = await readFile(filepath, "utf8");
  return buildQaSkillArtifact(source, filepath);
}

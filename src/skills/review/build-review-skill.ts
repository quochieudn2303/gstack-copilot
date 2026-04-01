import { readFile } from "node:fs/promises";

import { transformFrontmatter } from "../../pipeline/frontmatter.js";
import { generateOutput } from "../../pipeline/output.js";
import { parseSkill } from "../../pipeline/parse.js";
import { transformContent } from "../../pipeline/content.js";

export const REVIEW_SKILL_SELF_REFERENCE = ".github/skills/review/SKILL.md";

/**
 * Maintained source of truth for the checked-in `/review` skill artifact.
 *
 * Phase 3 keeps `.github/skills/review/SKILL.md` checked into the repository,
 * but the artifact should stay byte-for-byte aligned with this builder output.
 * Tests enforce that relationship so later updates change the generator and the
 * checked-in artifact together.
 */

function buildReviewBehaviorSections(): string {
  return [
    "## Review Target",
    "",
    "1. Review the current branch diff against a base branch by default.",
    "2. Resolve the base branch in this exact order: `origin/main`, then `origin/master`, then the repository default branch.",
    "3. Do not include uncommitted working-tree changes unless the user explicitly asks for that mode.",
    "",
    "## Findings First",
    "",
    "1. Report findings before making any edits.",
    "2. Prioritize correctness, regressions, missing tests, and PR hygiene over style-only commentary.",
    "3. Present findings with actionable file references and clear next steps.",
    "",
    "## Fix Mode",
    "",
    "1. After showing findings, ask whether the user wants fixes applied in the same session.",
    "2. Only enter fix mode after explicit user confirmation.",
    "3. If the user does not confirm, stop after the report and do not modify files.",
    "",
    "## Reference",
    "",
    `Read ${REVIEW_SKILL_SELF_REFERENCE} for the checked-in project-local skill definition when you need the canonical review behavior.`,
  ].join("\n");
}

function rewriteSelfReference(content: string): string {
  return content.replace(
    /~\/\.copilot\/skills\/gstack-review\/SKILL\.md/g,
    REVIEW_SKILL_SELF_REFERENCE,
  );
}

export function buildReviewSkillArtifact(
  source: string,
  filepath: string = "tests/fixtures/review-skill.md",
): string {
  const parsed = parseSkill(source, filepath);
  const baseFrontmatter = transformFrontmatter(parsed.data, {
    includeArgumentHint: false,
    userInvocable: true,
  });

  const frontmatter = {
    ...baseFrontmatter,
    name: "review",
    description:
      "Pre-landing review of the current branch against a base branch, with findings-first output and optional confirmed fixes.",
  };

  const transformedContent = rewriteSelfReference(
    transformContent(parsed.content, filepath),
  );
  const finalContent = [
    buildReviewBehaviorSections(),
    "",
    "## Converted Source Guidance",
    "",
    transformedContent.trim(),
  ].join("\n");

  return `${generateOutput(frontmatter, finalContent)}\n`;
}

export function buildReviewReadme(): string {
  return `${[
    "# /review Skill",
    "",
    "Project-local Copilot CLI skill artifact for Phase 3.",
    "",
    "Use `/review [base-branch]` inside GitHub Copilot CLI.",
    "If the base branch is omitted, the skill should use `origin/main`, then `origin/master`, then the repo default branch.",
    "",
    "Verification focus for Phase 3:",
    "- findings are shown before any fix step",
    "- fix mode requires explicit confirmation",
    "- uncommitted working-tree changes are opt-in",
    "- the checked-in artifact should match the builder output exactly",
  ].join("\n")}\n`;
}

export async function buildReviewSkillArtifactFromFile(
  filepath: string = "tests/fixtures/review-skill.md",
): Promise<string> {
  const source = await readFile(filepath, "utf8");
  return buildReviewSkillArtifact(source, filepath);
}

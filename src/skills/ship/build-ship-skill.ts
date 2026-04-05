import { readFile } from "node:fs/promises";

import { transformFrontmatter } from "../../pipeline/frontmatter.js";
import { generateOutput } from "../../pipeline/output.js";
import { parseSkill } from "../../pipeline/parse.js";
import { transformContent } from "../../pipeline/content.js";

export const SHIP_SKILL_SELF_REFERENCE = ".github/skills/ship/SKILL.md";

function buildShipBehaviorSections(): string {
  return [
    "## Shipping Default",
    "",
    "1. Prepare and open a PR by default.",
    "2. Do not merge automatically.",
    "3. Use prior sprint-loop signals from `/review` and `/qa` when they are available.",
    "",
    "## Strict Preflight",
    "",
    "1. Stop if the repo has a dirty tree.",
    "2. Stop if the repository has no remote.",
    "3. Stop if GitHub auth is unavailable.",
    "4. Stop if the current branch is `main` or `master`.",
    "",
    "## PR Artifacts",
    "",
    "1. Prepare PR-facing summary content from the repository's planning and verification artifacts.",
    "2. Keep the default path focused on preparing work for review, not merging it.",
    "",
    "## Reference",
    "",
    `Read ${SHIP_SKILL_SELF_REFERENCE} for the checked-in project-local skill definition when you need the canonical ship behavior.`,
  ].join("\n");
}

function rewriteShipReferences(content: string): string {
  return content
    .replace(
      /~\/\.claude\/skills\/gstack\/ship\/SKILL\.md/g,
      SHIP_SKILL_SELF_REFERENCE,
    )
    .replace(
      /~\/\.copilot\/skills\/gstack-ship\/SKILL\.md/g,
      SHIP_SKILL_SELF_REFERENCE,
    );
}

export function buildShipSkillArtifact(
  source: string,
  filepath: string = "tests/fixtures/ship-skill.md",
): string {
  const parsed = parseSkill(source, filepath);
  const baseFrontmatter = transformFrontmatter(parsed.data, {
    includeArgumentHint: false,
    userInvocable: true,
  });

  const frontmatter = {
    ...baseFrontmatter,
    name: "ship",
    description:
      "Strict-preflight shipping workflow that prepares and opens a PR without auto-merging.",
  };

  const transformedContent = rewriteShipReferences(
    transformContent(parsed.content, filepath),
  );
  const finalContent = [
    buildShipBehaviorSections(),
    "",
    "## Converted Source Guidance",
    "",
    transformedContent.trim(),
  ].join("\n");

  return `${generateOutput(frontmatter, finalContent)}\n`;
}

export function buildShipReadme(): string {
  return `${[
    "# /ship Skill",
    "",
    "Project-local Copilot CLI skill artifact for Phase 6.",
    "",
    "Use `/ship` to run strict preflight, prepare PR-facing artifacts, and open a PR by default.",
    "The default path stops before merge and requires a clean repo state, a configured remote, and GitHub auth.",
    "",
    "Verification focus for Phase 6:",
    "- strict preflight is enforced",
    "- prepare-and-open-PR is the default path",
    "- the checked-in artifact should match the builder output exactly",
    "- the skill references prior sprint-loop signals instead of re-running the entire flow blindly",
  ].join("\n")}\n`;
}

export async function buildShipSkillArtifactFromFile(
  filepath: string = "tests/fixtures/ship-skill.md",
): Promise<string> {
  const source = await readFile(filepath, "utf8");
  return buildShipSkillArtifact(source, filepath);
}

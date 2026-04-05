import { readFile } from "node:fs/promises";

import { transformFrontmatter } from "../../pipeline/frontmatter.js";
import { generateOutput } from "../../pipeline/output.js";
import { parseSkill } from "../../pipeline/parse.js";
import { transformContent } from "../../pipeline/content.js";

export const OFFICE_HOURS_SKILL_SELF_REFERENCE =
  ".github/skills/office-hours/SKILL.md";

function buildOfficeHoursBehaviorSections(): string {
  return [
    "## Mode Selection",
    "",
    "1. Preserve the startup and builder mode distinction from the source skill.",
    "2. Choose startup mode for demand, customer, and company questions.",
    "3. Choose builder mode for side projects, learning, hackathons, and open source exploration.",
    "",
    "## Browser Grounding",
    "",
    "1. Ground feedback in what the browser session actually observed on the product page or flow.",
    "2. Start with product or design critique before abstract advice.",
    "3. Keep feedback tied to concrete page details, not generic startup commentary.",
    "",
    "## Memo Output",
    "",
    "1. Return conversational feedback in chat.",
    "2. Produce a durable memo artifact alongside the conversational feedback.",
    "3. The memo must be critique-first and end with a concise recommended direction.",
    "4. Do not start implementation or scaffolding work.",
    "",
    "## Reference",
    "",
    `Read ${OFFICE_HOURS_SKILL_SELF_REFERENCE} for the checked-in project-local skill definition when you need the canonical office-hours behavior.`,
  ].join("\n");
}

function rewriteOfficeHoursReferences(content: string): string {
  return content.replace(
    /~\/\.claude\/skills\/gstack\/office-hours\/SKILL\.md/g,
    OFFICE_HOURS_SKILL_SELF_REFERENCE,
  ).replace(
    /~\/\.copilot\/skills\/gstack-office-hours\/SKILL\.md/g,
    OFFICE_HOURS_SKILL_SELF_REFERENCE,
  );
}

export function buildOfficeHoursSkillArtifact(
  source: string,
  filepath: string = "tests/fixtures/office-hours-skill.md",
): string {
  const parsed = parseSkill(source, filepath);
  const baseFrontmatter = transformFrontmatter(parsed.data, {
    includeArgumentHint: false,
    userInvocable: true,
  });

  const frontmatter = {
    ...baseFrontmatter,
    name: "office-hours",
    description:
      "Browser-grounded product feedback with startup or builder mode reasoning and a durable memo artifact.",
  };

  const transformedContent = rewriteOfficeHoursReferences(
    transformContent(parsed.content, filepath),
  );
  const finalContent = [
    buildOfficeHoursBehaviorSections(),
    "",
    "## Converted Source Guidance",
    "",
    transformedContent.trim(),
  ].join("\n");

  return `${generateOutput(frontmatter, finalContent)}\n`;
}

export function buildOfficeHoursReadme(): string {
  return `${[
    "# /office-hours Skill",
    "",
    "Project-local Copilot CLI skill artifact for Phase 5.",
    "",
    "Use `/office-hours` for browser-grounded product feedback inside GitHub Copilot CLI.",
    "The skill returns conversational feedback plus a durable memo, and does not start implementation work.",
    "",
    "Verification focus for Phase 5:",
    "- startup and builder modes remain encoded",
    "- feedback is grounded in browser observations",
    "- the memo is critique-first and ends with a recommended direction",
    "- the checked-in artifact should match the builder output exactly",
  ].join("\n")}\n`;
}

export async function buildOfficeHoursSkillArtifactFromFile(
  filepath: string = "tests/fixtures/office-hours-skill.md",
): Promise<string> {
  const source = await readFile(filepath, "utf8");
  return buildOfficeHoursSkillArtifact(source, filepath);
}

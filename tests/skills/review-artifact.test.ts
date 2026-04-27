import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import {
  buildReviewReadme,
  buildReviewSkillArtifact,
} from "../../src/skills/review/build-review-skill.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

describe("checked-in review skill artifact", () => {
  it("matches the builder output", () => {
    const fixture = readFileSync(
      resolve(repoRoot, "tests", "fixtures", "review-skill.md"),
      "utf8",
    );
    const artifact = readFileSync(
      resolve(repoRoot, ".github", "skills", "review", "SKILL.md"),
      "utf8",
    );

    expect(normalizeLineEndings(artifact)).toBe(
      normalizeLineEndings(buildReviewSkillArtifact(fixture)),
    );
  });

  it("contains the required frontmatter and behavior sections", () => {
    const artifact = readFileSync(
      resolve(repoRoot, ".github", "skills", "review", "SKILL.md"),
      "utf8",
    );
    const parsed = matter(artifact);

    expect(parsed.data.name).toBe("review");
    expect(parsed.data["user-invocable"]).toBe(true);
    expect(parsed.data["allowed-tools"]).toContain("Task");
    expect(parsed.data["allowed-tools"]).not.toContain("Agent");
    expect(parsed.content).toContain("## Findings First");
    expect(parsed.content).toContain("## Fix Mode");
    expect(parsed.content).toContain("Do not include uncommitted working-tree changes unless the user explicitly asks for that mode.");
  });

  it("keeps the README in sync with the builder guidance", () => {
    const readme = readFileSync(
      resolve(repoRoot, ".github", "skills", "review", "README.md"),
      "utf8",
    );

    expect(normalizeLineEndings(readme)).toBe(buildReviewReadme());
    expect(readme).toContain("Use `/review [base-branch]` inside GitHub Copilot CLI.");
    expect(readme).toContain("Verification focus for Phase 3:");
  });
});

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import { buildReviewSkillArtifact } from "../../src/skills/review/build-review-skill.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(
  resolve(__dirname, "..", "fixtures", "review-skill.md"),
  "utf8",
);

describe("review skill builder", () => {
  it("builds a parseable project-local review skill", () => {
    const output = buildReviewSkillArtifact(fixture);
    const parsed = matter(output);

    expect(parsed.data.name).toBe("review");
    expect(parsed.data["user-invocable"]).toBe(true);
    expect(parsed.data["allowed-tools"]).toContain("Task");
    expect(parsed.content).toContain("origin/main");
    expect(parsed.content).toContain("origin/master");
  });

  it("encodes findings-first and confirm-to-fix behavior", () => {
    const output = buildReviewSkillArtifact(fixture);

    expect(output).toContain("## Findings First");
    expect(output).toContain("Report findings before making any edits.");
    expect(output).toContain("Only enter fix mode after explicit user confirmation.");
  });
});

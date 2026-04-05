import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import { buildQaSkillArtifact } from "../../src/skills/qa/build-qa-skill.js";

describe("qa skill builder integration", () => {
  it("builds a parseable project-local qa skill", () => {
    const fixture = readFileSync(
      resolve("tests", "fixtures", "qa-skill.md"),
      "utf8",
    );
    const output = buildQaSkillArtifact(fixture);
    const parsed = matter(output);

    expect(parsed.data.name).toBe("qa");
    expect(parsed.data["user-invocable"]).toBe(true);
    expect(parsed.data["allowed-tools"]).toContain("Task");
    expect(parsed.content).toContain("## Guided Flow");
    expect(parsed.content).toContain("## Coverage Modes");
    expect(parsed.content).toContain("screenshots, repro steps");
  });
});

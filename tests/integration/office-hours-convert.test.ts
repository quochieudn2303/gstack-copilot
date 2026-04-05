import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import { buildOfficeHoursSkillArtifact } from "../../src/skills/office-hours/build-office-hours-skill.js";

describe("office-hours skill builder integration", () => {
  it("builds a parseable project-local office-hours skill", () => {
    const fixture = readFileSync(
      resolve("tests", "fixtures", "office-hours-skill.md"),
      "utf8",
    );
    const output = buildOfficeHoursSkillArtifact(fixture);
    const parsed = matter(output);

    expect(parsed.data.name).toBe("office-hours");
    expect(parsed.data["user-invocable"]).toBe(true);
    expect(parsed.content).toContain("## Memo Output");
    expect(parsed.content).toContain("Do not start implementation");
    expect(parsed.content).toContain("recommended direction");
  });
});

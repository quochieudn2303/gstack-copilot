import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import { buildShipSkillArtifact } from "../../src/skills/ship/build-ship-skill.js";

describe("ship skill builder integration", () => {
  it("builds a parseable project-local ship skill", () => {
    const fixture = readFileSync(
      resolve("tests", "fixtures", "ship-skill.md"),
      "utf8",
    );
    const output = buildShipSkillArtifact(fixture);
    const parsed = matter(output);

    expect(parsed.data.name).toBe("ship");
    expect(parsed.data["user-invocable"]).toBe(true);
    expect(parsed.content).toContain("Prepare and open a PR by default.");
    expect(parsed.content).toContain("Strict Preflight");
    expect(parsed.content).toContain("/review");
    expect(parsed.content).toContain("/qa");
  });
});

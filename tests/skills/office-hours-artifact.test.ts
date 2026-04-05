import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import {
  buildOfficeHoursReadme,
  buildOfficeHoursSkillArtifact,
} from "../../src/skills/office-hours/build-office-hours-skill.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

describe("checked-in office-hours skill artifact", () => {
  it("matches the builder output", () => {
    const fixture = readFileSync(
      resolve(repoRoot, "tests", "fixtures", "office-hours-skill.md"),
      "utf8",
    );
    const artifact = readFileSync(
      resolve(repoRoot, ".github", "skills", "office-hours", "SKILL.md"),
      "utf8",
    );

    expect(artifact).toBe(buildOfficeHoursSkillArtifact(fixture));
  });

  it("contains mode selection and memo output guidance", () => {
    const artifact = readFileSync(
      resolve(repoRoot, ".github", "skills", "office-hours", "SKILL.md"),
      "utf8",
    );
    const parsed = matter(artifact);

    expect(parsed.data.name).toBe("office-hours");
    expect(parsed.data["user-invocable"]).toBe(true);
    expect(parsed.data["allowed-tools"]).toContain("Task");
    expect(parsed.content).toContain("## Mode Selection");
    expect(parsed.content).toContain("startup and builder mode");
    expect(parsed.content).toContain("memo must be critique-first");
    expect(parsed.content).toContain("Do not start implementation");
  });

  it("keeps the README in sync with the builder guidance", () => {
    const readme = readFileSync(
      resolve(repoRoot, ".github", "skills", "office-hours", "README.md"),
      "utf8",
    );

    expect(readme).toBe(buildOfficeHoursReadme());
    expect(readme).toContain("Use `/office-hours` for browser-grounded product feedback");
  });
});

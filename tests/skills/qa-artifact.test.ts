import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import {
  buildQaReadme,
  buildQaSkillArtifact,
} from "../../src/skills/qa/build-qa-skill.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

describe("checked-in qa skill artifact", () => {
  it("matches the builder output", () => {
    const fixture = readFileSync(
      resolve(repoRoot, "tests", "fixtures", "qa-skill.md"),
      "utf8",
    );
    const artifact = readFileSync(
      resolve(repoRoot, ".github", "skills", "qa", "SKILL.md"),
      "utf8",
    );

    expect(artifact).toBe(buildQaSkillArtifact(fixture));
  });

  it("contains the guided-flow and explicit-confirmation contract", () => {
    const artifact = readFileSync(
      resolve(repoRoot, ".github", "skills", "qa", "SKILL.md"),
      "utf8",
    );
    const parsed = matter(artifact);

    expect(parsed.data.name).toBe("qa");
    expect(parsed.data["user-invocable"]).toBe(true);
    expect(parsed.data["allowed-tools"]).toContain("Task");
    expect(parsed.content).toContain("## Guided Flow");
    expect(parsed.content).toContain("## Coverage Modes");
    expect(parsed.content).toContain("`quick` mode");
    expect(parsed.content).toContain("`standard` mode");
    expect(parsed.content).toContain("`exhaustive` mode");
    expect(parsed.content).toContain("`single-page` or `crawl` scope");
    expect(parsed.content).toContain(
      "Only enter fix mode after explicit user confirmation.",
    );
    expect(parsed.content).toContain("console or network findings");
    expect(parsed.content).not.toContain("$B ");
  });

  it("keeps the README in sync with the builder guidance", () => {
    const readme = readFileSync(
      resolve(repoRoot, ".github", "skills", "qa", "README.md"),
      "utf8",
    );

    expect(readme).toBe(buildQaReadme());
    expect(readme).toContain("Use `/qa` for guided-flow browser testing");
    expect(readme).toContain("quick, standard, and exhaustive");
  });
});

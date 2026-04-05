import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import {
  buildShipReadme,
  buildShipSkillArtifact,
} from "../../src/skills/ship/build-ship-skill.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

function normalizeLineEndings(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n");
}

describe("checked-in ship skill artifact", () => {
  it("matches the builder output", () => {
    const fixture = readFileSync(
      resolve(repoRoot, "tests", "fixtures", "ship-skill.md"),
      "utf8",
    );
    const artifact = readFileSync(
      resolve(repoRoot, ".github", "skills", "ship", "SKILL.md"),
      "utf8",
    );

    expect(normalizeLineEndings(artifact)).toBe(
      normalizeLineEndings(buildShipSkillArtifact(fixture)),
    );
  });

  it("contains the prepare-and-open-PR contract and strict preflight guidance", () => {
    const artifact = readFileSync(
      resolve(repoRoot, ".github", "skills", "ship", "SKILL.md"),
      "utf8",
    );
    const parsed = matter(artifact);

    expect(parsed.data.name).toBe("ship");
    expect(parsed.data["user-invocable"]).toBe(true);
    expect(parsed.content).toContain("## Shipping Default");
    expect(parsed.content).toContain("Do not merge automatically.");
    expect(parsed.content).toContain("## Strict Preflight");
    expect(parsed.content).toContain("dirty tree");
    expect(parsed.content).toContain("/review");
    expect(parsed.content).toContain("/qa");
  });

  it("keeps the README in sync with the builder guidance", () => {
    const readme = readFileSync(
      resolve(repoRoot, ".github", "skills", "ship", "README.md"),
      "utf8",
    );

    expect(normalizeLineEndings(readme)).toBe(
      normalizeLineEndings(buildShipReadme()),
    );
    expect(readme).toContain("Use `/ship`");
  });
});

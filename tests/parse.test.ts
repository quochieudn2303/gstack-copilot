import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { ConversionError, parseSkill } from "../src/pipeline/parse.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) =>
  readFileSync(resolve(__dirname, "fixtures", name), "utf8");

describe("parseSkill", () => {
  it("parses review fixture successfully", () => {
    const parsed = parseSkill(
      fixture("review-skill.md"),
      "tests/fixtures/review-skill.md",
    );

    expect(parsed.data.name).toBe("review");
    expect(parsed.content).toContain("## Process");
    expect(parsed.content).not.toContain("allowed-tools:");
  });

  it("parses simple fixture successfully", () => {
    const parsed = parseSkill(
      fixture("simple-skill.md"),
      "tests/fixtures/simple-skill.md",
    );

    expect(parsed.data.name).toBe("simple");
    expect(parsed.content.trim()).toContain("This is a simple skill for testing.");
  });

  it("throws on invalid frontmatter", () => {
    expect(() =>
      parseSkill(fixture("invalid-skill.md"), "tests/fixtures/invalid-skill.md"),
    ).toThrowError(ConversionError);
  });

  it("throws on missing frontmatter", () => {
    expect(() =>
      parseSkill("# No frontmatter\n\nJust markdown.", "memory.md"),
    ).toThrow(/missing yaml frontmatter/i);
  });

  it("throws on malformed yaml", () => {
    const malformed = `---
name: review
allowed-tools:
  - Read
  - : broken
---

Content`;

    expect(() => parseSkill(malformed, "broken.md")).toThrow(/malformed yaml/i);
  });
});

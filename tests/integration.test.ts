import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import { CopilotFrontmatter } from "../src/schemas/copilot.js";
import {
  ConversionError,
  ConversionPipeline,
  convertSkill,
} from "../src/pipeline/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) =>
  readFileSync(resolve(__dirname, "fixtures", name), "utf8");

describe("conversion pipeline", () => {
  it("transforms the review fixture end-to-end", () => {
    const source = fixture("review-skill.md");
    const result = convertSkill(source, "tests/fixtures/review-skill.md");

    expect(result.frontmatter.name).toBe("gstack-review");
    expect(result.frontmatter["allowed-tools"]).toContain("Task");
    expect(result.content).toContain("## Initialization");
    expect(result.content).toContain("~/.copilot/skills/gstack-review/SKILL.md");
    expect(result.output).toContain("name: gstack-review");
  });

  it("produces output with valid Copilot frontmatter", () => {
    const source = fixture("review-skill.md");
    const result = convertSkill(source, "tests/fixtures/review-skill.md");
    const parsed = matter(result.output);

    expect(() => CopilotFrontmatter.parse(parsed.data)).not.toThrow();
  });

  it("includes filepath details in conversion errors", () => {
    expect(() =>
      convertSkill(fixture("invalid-skill.md"), "tests/fixtures/invalid-skill.md"),
    ).toThrowError(ConversionError);

    try {
      convertSkill(fixture("invalid-skill.md"), "tests/fixtures/invalid-skill.md");
    } catch (error) {
      expect(error).toBeInstanceOf(ConversionError);
      expect((error as ConversionError).message).toContain(
        "tests/fixtures/invalid-skill.md",
      );
    }
  });

  it("supports the class-based pipeline API", async () => {
    const pipeline = new ConversionPipeline();
    const result = await pipeline.convertFile(
      resolve(__dirname, "fixtures", "simple-skill.md"),
    );

    expect(result.frontmatter.name).toBe("gstack-simple");
    expect(result.output).toContain("This is a simple skill for testing.");
  });
});

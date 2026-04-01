import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { CopilotFrontmatter } from "../src/schemas/copilot.js";
import { GstackFrontmatter } from "../src/schemas/gstack.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) =>
  readFileSync(resolve(__dirname, "fixtures", name), "utf8");

describe("GstackFrontmatter", () => {
  it("parses valid gstack frontmatter", async () => {
    const matter = await import("gray-matter");
    const parsed = matter.default(fixture("review-skill.md"));

    const result = GstackFrontmatter.parse(parsed.data);

    expect(result.name).toBe("review");
    expect(result["preamble-tier"]).toBe(4);
    expect(result["allowed-tools"]).toContain("Agent");
  });

  it("throws when a required field is missing", async () => {
    const matter = await import("gray-matter");
    const parsed = matter.default(fixture("invalid-skill.md"));

    expect(() => GstackFrontmatter.parse(parsed.data)).toThrow(/name/i);
  });

  it("throws on unknown fields in strict mode", () => {
    expect(() =>
      GstackFrontmatter.parse({
        name: "review",
        "preamble-tier": 4,
        description: "desc",
        "allowed-tools": ["Read"],
        extra: true,
      }),
    ).toThrow(/unrecognized/i);
  });

  it("rejects preamble tiers outside 1-4", () => {
    expect(() =>
      GstackFrontmatter.parse({
        name: "review",
        "preamble-tier": 5,
        description: "desc",
        "allowed-tools": ["Read"],
      }),
    ).toThrow(/<=4|too big/i);
  });
});

describe("CopilotFrontmatter", () => {
  it("parses valid copilot frontmatter", () => {
    const result = CopilotFrontmatter.parse({
      name: "gstack-review",
      description: "Review code changes",
      "argument-hint": "[options]",
      "allowed-tools": "Read, Edit, Task",
    });

    expect(result.name).toBe("gstack-review");
    expect(result["allowed-tools"]).toContain("Task");
  });

  it("parses docs-aligned optional fields without argument-hint", () => {
    const result = CopilotFrontmatter.parse({
      name: "review",
      description: "Review branch changes",
      "allowed-tools": "Read, Edit, Task",
      "user-invocable": true,
      "disable-model-invocation": false,
    });

    expect(result["user-invocable"]).toBe(true);
    expect(result["disable-model-invocation"]).toBe(false);
    expect(result["argument-hint"]).toBeUndefined();
  });

  it("rejects non-string allowed-tools", () => {
    expect(() =>
      CopilotFrontmatter.parse({
        name: "gstack-review",
        description: "Review code changes",
        "allowed-tools": ["Read", "Task"],
      }),
    ).toThrow(/expected string/i);
  });
});

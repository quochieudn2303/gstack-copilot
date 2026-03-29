import { describe, expect, it } from "vitest";

import { transformFrontmatter } from "../src/pipeline/frontmatter.js";

describe("transformFrontmatter", () => {
  it("prefixes skill names with gstack-", () => {
    const result = transformFrontmatter({
      name: "review",
      "preamble-tier": 4,
      version: "1.0.0",
      description: "Review changes",
      "allowed-tools": ["Read", "Agent"],
    });

    expect(result.name).toBe("gstack-review");
  });

  it("flattens multiline descriptions", () => {
    const result = transformFrontmatter({
      name: "review",
      "preamble-tier": 4,
      description: "Line one.\n\nLine two.",
      "allowed-tools": ["Read"],
    });

    expect(result.description).toBe("Line one. Line two.");
  });

  it("truncates descriptions longer than 200 characters", () => {
    const result = transformFrontmatter({
      name: "review",
      "preamble-tier": 4,
      description: "a".repeat(250),
      "allowed-tools": ["Read"],
    });

    expect(result.description).toHaveLength(200);
    expect(result.description.endsWith("...")).toBe(true);
  });

  it("maps Agent to Task", () => {
    const result = transformFrontmatter({
      name: "review",
      "preamble-tier": 4,
      description: "Review changes",
      "allowed-tools": ["Read", "Agent"],
    });

    expect(result["allowed-tools"]).toBe("Read, Task");
  });

  it("sets a default argument hint", () => {
    const result = transformFrontmatter({
      name: "review",
      "preamble-tier": 4,
      description: "Review changes",
      "allowed-tools": ["Read"],
    });

    expect(result["argument-hint"]).toBe("[options]");
  });

  it("drops gstack-only fields from the output", () => {
    const result = transformFrontmatter({
      name: "review",
      "preamble-tier": 4,
      version: "1.0.0",
      description: "Review changes",
      "allowed-tools": ["Read"],
    });

    expect(result).not.toHaveProperty("version");
    expect(result).not.toHaveProperty("preamble-tier");
  });
});

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import { generateOutput } from "../src/pipeline/output.js";

describe("generateOutput", () => {
  it("produces output with valid frontmatter delimiters", () => {
    const output = generateOutput(
      {
        name: "gstack-review",
        description: "Review code safely",
        "argument-hint": "[options]",
        "allowed-tools": "Read, Task",
      },
      "## Process\n\nRun the review.",
    );

    expect(output.startsWith("---\n")).toBe(true);
    expect(output).toContain("---\n\n## Process");
  });

  it("preserves field order", () => {
    const output = generateOutput(
      {
        name: "gstack-review",
        description: "Review code safely",
        "argument-hint": "[options]",
        "allowed-tools": "Read, Task",
      },
      "",
    );

    const nameIndex = output.indexOf("name:");
    const descriptionIndex = output.indexOf("description:");
    const argumentIndex = output.indexOf("argument-hint:");
    const toolsIndex = output.indexOf("allowed-tools:");

    expect(nameIndex).toBeLessThan(descriptionIndex);
    expect(descriptionIndex).toBeLessThan(argumentIndex);
    expect(argumentIndex).toBeLessThan(toolsIndex);
  });

  it("can be reparsed by gray-matter", () => {
    const output = generateOutput(
      {
        name: "gstack-review",
        description: "Review: code safely",
        "argument-hint": "[options]",
        "allowed-tools": "Read, Task",
      },
      "## Process\n\nRun the review.",
    );

    const parsed = matter(output);
    expect(parsed.data.name).toBe("gstack-review");
    expect(parsed.content).toContain("Run the review.");
  });

  it("handles empty content gracefully", () => {
    const output = generateOutput(
      {
        name: "gstack-review",
        description: "Review code safely",
        "argument-hint": "[options]",
        "allowed-tools": "Read, Task",
      },
      "",
    );

    expect(output.endsWith("\n\n")).toBe(true);
  });
});

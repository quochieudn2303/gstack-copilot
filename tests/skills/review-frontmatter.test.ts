import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import { transformFrontmatter } from "../../src/pipeline/frontmatter.js";
import { GstackFrontmatter } from "../../src/schemas/gstack.js";

describe("review frontmatter contract", () => {
  it("builds a docs-aligned review frontmatter shape", () => {
    const source = GstackFrontmatter.parse(
      matter(
        `---
name: review
preamble-tier: 4
description: Review branch changes
allowed-tools:
  - Read
  - Edit
  - Agent
---`,
      ).data,
    );

    const result = transformFrontmatter(source, {
      includeArgumentHint: false,
      userInvocable: true,
      disableModelInvocation: false,
    });

    expect(result.name).toBe("gstack-review");
    expect(result["allowed-tools"]).toBe("Read, Edit, Task");
    expect(result["user-invocable"]).toBe(true);
    expect(result["disable-model-invocation"]).toBe(false);
    expect(result["argument-hint"]).toBeUndefined();
  });
});

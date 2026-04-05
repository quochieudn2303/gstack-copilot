import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("sprint-loop documentation", () => {
  it("documents the full skill sequence", () => {
    const readme = readFileSync(resolve("README.md"), "utf8");

    expect(readme).toContain("/office-hours");
    expect(readme).toContain("/review");
    expect(readme).toContain("/qa");
    expect(readme).toContain("/ship");
    expect(readme).toContain("office-hours -> review -> qa -> ship");
  });
});

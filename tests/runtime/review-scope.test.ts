import { describe, expect, it } from "vitest";

import { resolveReviewScope } from "../../src/runtime/review/review-scope.js";

describe("review scope resolution", () => {
  it("defaults to branch diff mode", () => {
    const scope = resolveReviewScope({ detectedBaseBranch: "origin/main" });

    expect(scope.mode).toBe("branch-diff");
    expect(scope.includeWorkingTree).toBe(false);
    expect(scope.diffRange).toBe("origin/main...HEAD");
  });

  it("allows explicit base branch override", () => {
    const scope = resolveReviewScope({
      explicitBaseBranch: "origin/release",
      detectedBaseBranch: "origin/main",
    });

    expect(scope.baseBranch).toBe("origin/release");
  });

  it("makes working tree review explicit opt-in", () => {
    const scope = resolveReviewScope({
      detectedBaseBranch: "origin/main",
      includeWorkingTree: true,
    });

    expect(scope.mode).toBe("branch-diff+working-tree");
    expect(scope.includeWorkingTree).toBe(true);
  });

  it("throws without any base branch", () => {
    expect(() => resolveReviewScope({})).toThrow(/base branch/i);
  });
});

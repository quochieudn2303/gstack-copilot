import { describe, expect, it } from "vitest";

import {
  chooseBaseBranch,
  detectBaseBranch,
  normalizeRemoteBranch,
} from "../../src/runtime/review/base-branch.js";
import { resolveReviewScope } from "../../src/runtime/review/review-scope.js";

describe("review base branch selection", () => {
  it("normalizes remote branch names", () => {
    expect(normalizeRemoteBranch(" remotes/origin/main ")).toBe("origin/main");
    expect(normalizeRemoteBranch("* origin/master")).toBe("origin/master");
  });

  it("prefers origin/main before other branches", () => {
    const result = chooseBaseBranch(
      ["origin/feature", "origin/main", "origin/master"],
      "origin/trunk",
    );

    expect(result).toBe("origin/main");
  });

  it("falls back to origin/master when origin/main is absent", () => {
    const result = chooseBaseBranch(
      ["origin/release", "origin/master"],
      "origin/trunk",
    );

    expect(result).toBe("origin/master");
  });

  it("uses the repo default branch when main and master are absent", () => {
    const result = chooseBaseBranch(["origin/release"], "origin/trunk");
    expect(result).toBe("origin/trunk");
  });

  it("returns undefined when no branch candidates exist", () => {
    expect(chooseBaseBranch([], undefined)).toBeUndefined();
  });

  it("supports the async probe wrapper", async () => {
    const result = await detectBaseBranch({
      async getRemoteBranches() {
        return ["origin/feature", "origin/master"];
      },
      async getDefaultBranch() {
        return "origin/trunk";
      },
    });

    expect(result).toBe("origin/master");
  });
});

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

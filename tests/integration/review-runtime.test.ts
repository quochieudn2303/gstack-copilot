import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import { chooseBaseBranch } from "../../src/runtime/review/base-branch.js";
import { resolveReviewScope } from "../../src/runtime/review/review-scope.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

describe("review runtime behavior", () => {
  it("prefers the documented base branch precedence", () => {
    const baseBranch = chooseBaseBranch(
      ["origin/release", "origin/master", "origin/main"],
      "origin/trunk",
    );

    expect(baseBranch).toBe("origin/main");
  });

  it("defaults to branch-diff review mode", () => {
    const scope = resolveReviewScope({ detectedBaseBranch: "origin/main" });

    expect(scope.mode).toBe("branch-diff");
    expect(scope.includeWorkingTree).toBe(false);
    expect(scope.diffRange).toBe("origin/main...HEAD");
  });

  it("supports explicit inclusion of uncommitted changes", () => {
    const scope = resolveReviewScope({
      explicitBaseBranch: "origin/main",
      includeWorkingTree: true,
    });

    expect(scope.mode).toBe("branch-diff+working-tree");
    expect(scope.includeWorkingTree).toBe(true);
  });

  it("encodes findings-first and confirm-to-fix behavior in the checked-in artifact", () => {
    const artifact = readFileSync(
      resolve(repoRoot, ".github", "skills", "review", "SKILL.md"),
      "utf8",
    );
    const parsed = matter(artifact);

    expect(parsed.content).toContain("## Findings First");
    expect(parsed.content).toContain("Report findings before making any edits.");
    expect(parsed.content).toContain("## Fix Mode");
    expect(parsed.content).toContain(
      "Only enter fix mode after explicit user confirmation.",
    );
  });
});

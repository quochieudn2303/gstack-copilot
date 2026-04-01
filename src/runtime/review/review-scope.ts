export interface ReviewScopeOptions {
  explicitBaseBranch?: string;
  detectedBaseBranch?: string;
  includeWorkingTree?: boolean;
}

export interface ReviewScope {
  baseBranch: string;
  includeWorkingTree: boolean;
  mode: "branch-diff" | "branch-diff+working-tree";
  diffRange: string;
}

export function resolveReviewScope(
  options: ReviewScopeOptions,
): ReviewScope {
  const baseBranch = options.explicitBaseBranch ?? options.detectedBaseBranch;

  if (!baseBranch) {
    throw new Error("A base branch is required to resolve review scope.");
  }

  const includeWorkingTree = options.includeWorkingTree ?? false;

  return {
    baseBranch,
    includeWorkingTree,
    mode: includeWorkingTree ? "branch-diff+working-tree" : "branch-diff",
    diffRange: `${baseBranch}...HEAD`,
  };
}

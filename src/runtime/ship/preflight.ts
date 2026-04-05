export type ShipPreflightStatus =
  | "ready"
  | "dirty-tree"
  | "missing-remote"
  | "missing-auth"
  | "wrong-branch";

export interface ShipPreflightOptions {
  currentBranch: string;
  dirtyPaths?: string[];
  hasRemote: boolean;
  hasGitHubAuth: boolean;
}

export interface ShipPreflightResult {
  status: ShipPreflightStatus;
  ready: boolean;
  message: string;
  remediation?: string;
  details?: string[];
}

function normalizeDirtyPaths(
  dirtyPaths: string[] | undefined,
): string[] {
  return dirtyPaths?.filter(Boolean) ?? [];
}

export function evaluateShipPreflight(
  options: ShipPreflightOptions,
): ShipPreflightResult {
  const dirtyPaths = normalizeDirtyPaths(options.dirtyPaths);

  if (dirtyPaths.length > 0) {
    return {
      status: "dirty-tree",
      ready: false,
      message: "Working tree must be clean before shipping.",
      remediation: "Commit or stash local changes before running /ship.",
      details: dirtyPaths,
    };
  }

  if (!options.hasRemote) {
    return {
      status: "missing-remote",
      ready: false,
      message: "A git remote is required before /ship can open a PR.",
      remediation: "Add an origin remote before running /ship.",
    };
  }

  if (!options.hasGitHubAuth) {
    return {
      status: "missing-auth",
      ready: false,
      message: "GitHub authentication is required before /ship can open a PR.",
      remediation: "Authenticate with GitHub CLI before running /ship.",
    };
  }

  if (options.currentBranch === "main" || options.currentBranch === "master") {
    return {
      status: "wrong-branch",
      ready: false,
      message: "/ship should run from a feature branch, not the base branch.",
      remediation: "Create or switch to a feature branch before running /ship.",
      details: [options.currentBranch],
    };
  }

  return {
    status: "ready",
    ready: true,
    message: "Repository is ready for strict /ship preflight.",
  };
}

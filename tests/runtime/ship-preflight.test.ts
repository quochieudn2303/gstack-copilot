import { describe, expect, it } from "vitest";

import { evaluateShipPreflight } from "../../src/runtime/ship/preflight.js";

describe("ship preflight", () => {
  it("passes when the repo is ready", () => {
    expect(
      evaluateShipPreflight({
        currentBranch: "feature/ship",
        hasRemote: true,
        hasGitHubAuth: true,
      }),
    ).toEqual({
      status: "ready",
      ready: true,
      message: "Repository is ready for strict /ship preflight.",
    });
  });

  it("blocks a dirty working tree first", () => {
    const result = evaluateShipPreflight({
      currentBranch: "feature/ship",
      dirtyPaths: ["README.md"],
      hasRemote: true,
      hasGitHubAuth: true,
    });

    expect(result.status).toBe("dirty-tree");
    expect(result.ready).toBe(false);
    expect(result.details).toEqual(["README.md"]);
  });

  it("blocks missing remote, auth, and wrong branch states", () => {
    expect(
      evaluateShipPreflight({
        currentBranch: "feature/ship",
        hasRemote: false,
        hasGitHubAuth: true,
      }).status,
    ).toBe("missing-remote");

    expect(
      evaluateShipPreflight({
        currentBranch: "feature/ship",
        hasRemote: true,
        hasGitHubAuth: false,
      }).status,
    ).toBe("missing-auth");

    expect(
      evaluateShipPreflight({
        currentBranch: "master",
        hasRemote: true,
        hasGitHubAuth: true,
      }).status,
    ).toBe("wrong-branch");
  });
});

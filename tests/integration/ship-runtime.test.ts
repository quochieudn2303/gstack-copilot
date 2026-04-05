import { describe, expect, it } from "vitest";

import { createShipPullRequestBody } from "../../src/runtime/ship/pr-body.js";
import { evaluateShipPreflight } from "../../src/runtime/ship/preflight.js";

describe("ship runtime integration", () => {
  it("combines strict preflight and PR body generation", () => {
    const preflight = evaluateShipPreflight({
      currentBranch: "codex/phase-06-sprint-completion",
      hasRemote: true,
      hasGitHubAuth: true,
    });
    const body = createShipPullRequestBody({
      phase: "Phase 6",
      title: "Sprint Completion - /ship",
      goal: "Complete the sprint loop",
      summary: "Adds shipping and setup support.",
      verification: ["Tests passed"],
      requirements: ["SKILL-04", "SETUP-01", "SETUP-02"],
    });

    expect(preflight.ready).toBe(true);
    expect(body).toContain("## Summary");
    expect(body).toContain("SETUP-01");
  });
});

import { describe, expect, it } from "vitest";

import { createShipPullRequestBody } from "../../src/runtime/ship/pr-body.js";

describe("ship pull request body", () => {
  it("includes summary, requirements, verification, and decisions", () => {
    const body = createShipPullRequestBody({
      phase: "Phase 6",
      title: "Sprint Completion - /ship",
      goal: "Complete the sprint loop for Copilot CLI users.",
      summary: "Adds `/ship`, setup entrypoints, and final documentation.",
      requirements: [
        "SKILL-04: Port `/ship` skill",
        "SETUP-01: One-command setup script",
      ],
      verification: ["Automated tests passed", "Setup smoke test completed"],
      keyDecisions: ["Strict preflight blocks missing remote and dirty tree"],
    });

    expect(body).toContain("## Summary");
    expect(body).toContain("## Requirements Addressed");
    expect(body).toContain("## Verification");
    expect(body).toContain("## Key Decisions");
    expect(body).toContain("SKILL-04");
  });
});

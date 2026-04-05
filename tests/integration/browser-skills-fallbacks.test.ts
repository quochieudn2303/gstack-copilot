import { describe, expect, it } from "vitest";

import { resolveUnsupportedBrowserAction } from "../../src/runtime/browser/fallbacks.js";
import { createOfficeHoursMemo } from "../../src/runtime/office-hours/memo.js";
import { createQaReport } from "../../src/runtime/qa/report.js";

describe("browser skill graceful degradation", () => {
  it("records non-essential fallback guidance for qa and office-hours", () => {
    const qaFallback = resolveUnsupportedBrowserAction({
      action: "console",
      reason: "Console diagnostics are unavailable from the current backend session.",
      guidance:
        "Continue with screenshots and repro steps, and mention that console evidence could not be collected.",
    });
    const officeFallback = resolveUnsupportedBrowserAction({
      action: "evaluate",
      reason: "Deep DOM inspection is unavailable from the current backend session.",
      guidance:
        "Continue with visible-page critique and note that deeper browser evaluation was unavailable.",
    });

    const report = createQaReport({
      scope: "guided-flow",
      tier: "standard",
      findings: [],
      screenshots: [],
      fallbacks: [qaFallback],
      healthSummary: {
        shipReadiness: "needs-attention",
      },
    });

    const memo = createOfficeHoursMemo({
      mode: "builder",
      problemStatement: "The page needs a clearer point of view.",
      critique: [],
      approachesConsidered: [],
      recommendedDirection: "Sharpen the narrative around one user and one problem.",
      openQuestions: [],
      nextStep: "Rewrite the hero copy.",
      fallbacks: [officeFallback],
    });

    expect(report.fallbacks?.[0]?.guidance).toContain("screenshots");
    expect(memo.fallbacks?.[0]?.guidance).toContain("visible-page critique");
  });

  it("fails when an essential browser action cannot be completed", () => {
    expect(() =>
      resolveUnsupportedBrowserAction({
        action: "navigate",
        reason: "Navigation is unavailable, so the target page cannot be loaded.",
        guidance: "Stop and ask the user to restore browser access before continuing.",
        essentiality: "essential",
      }),
    ).toThrow(/unsupported browser action/i);
  });
});

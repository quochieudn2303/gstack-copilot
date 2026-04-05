import { describe, expect, it } from "vitest";

import { resolveQaMode, shouldEnterQaFixMode } from "../../src/runtime/qa/flow.js";
import { createQaReport } from "../../src/runtime/qa/report.js";

describe("qa runtime integration", () => {
  it("keeps guided-flow as the default execution path", () => {
    const mode = resolveQaMode();

    expect(mode.scope).toBe("guided-flow");
    expect(mode.findingsFirst).toBe(true);
    expect(mode.fixMode).toBe("available-after-confirmation");
  });

  it("does not enter fix mode without explicit confirmation", () => {
    expect(
      shouldEnterQaFixMode({
        requestedFixes: true,
        explicitConfirmation: false,
      }),
    ).toBe(false);
    expect(
      shouldEnterQaFixMode({
        requestedFixes: true,
        explicitConfirmation: true,
      }),
    ).toBe(true);
  });

  it("supports severity-bearing report output", () => {
    const report = createQaReport({
      scope: "guided-flow",
      tier: "standard",
      findings: [
        {
          id: "ISSUE-002",
          title: "Toast overlaps CTA",
          severity: "medium",
          summary: "The toast covers the primary button on submit.",
          reproSteps: ["Submit the form"],
          screenshots: [{ path: "issue-002.png" }],
        },
      ],
      screenshots: [],
      healthSummary: {
        shipReadiness: "needs-attention",
      },
    });

    expect(report.findings[0]?.severity).toBe("medium");
    expect(report.healthSummary.shipReadiness).toBe("needs-attention");
  });
});

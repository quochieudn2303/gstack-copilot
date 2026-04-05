import { describe, expect, it } from "vitest";

import { createQaReport } from "../../src/runtime/qa/report.js";

describe("qa report contract", () => {
  it("captures finding evidence and health summary", () => {
    const report = createQaReport({
      scope: "guided-flow",
      tier: "standard",
      findings: [
        {
          id: "ISSUE-001",
          title: "Submit button stalls",
          severity: "high",
          summary: "Submitting the form leaves the user on a loading state.",
          reproSteps: ["Open the form", "Click submit"],
          screenshots: [
            {
              path: ".gstack/qa-reports/screenshots/issue-001.png",
              caption: "Loading state stalls after submit",
            },
          ],
          consoleEvidence: {
            messages: ["Uncaught TypeError: Cannot read properties of undefined"],
          },
        },
      ],
      screenshots: [
        {
          path: ".gstack/qa-reports/screenshots/landing.png",
        },
      ],
      networkEvidence: {
        requests: ["POST /api/submit 500"],
      },
      healthSummary: {
        baselineScore: 72,
        finalScore: 55,
        shipReadiness: "blocked",
      },
    });

    expect(report.findings[0]?.severity).toBe("high");
    expect(report.findings[0]?.reproSteps).toEqual([
      "Open the form",
      "Click submit",
    ]);
    expect(report.findings[0]?.screenshots[0]?.path).toContain("issue-001");
    expect(report.networkEvidence?.requests).toEqual([
      "POST /api/submit 500",
    ]);
    expect(report.healthSummary.shipReadiness).toBe("blocked");
  });
});

import { describe, expect, it } from "vitest";

import { ChromeDevToolsBackend } from "../../src/runtime/browser/chrome-devtools-backend.js";
import { resolveQaMode, shouldEnterQaFixMode } from "../../src/runtime/qa/flow.js";
import { createQaReport } from "../../src/runtime/qa/report.js";

function createQaExecutor() {
  const state = {
    status: "Idle",
    email: "",
    result: "Pending",
    consoleMessages: ["fixture-ready", "form-opened", "form-submitted"],
    requests: [
      "GET /page.html [200]",
      "GET /page.html?submitted=1 [200]",
    ],
  };

  return async (invocation: {
    tool: string;
    payload: Record<string, unknown>;
  }) => {
    switch (invocation.tool) {
      case "navigate_page":
        return { page: "Browser Flow Fixture" };
      case "click":
        if (invocation.payload.uid === "submit-feedback") {
          state.status = "Submitted";
        }
        return { status: state.status };
      case "fill_form":
        state.email = String(
          (invocation.payload.elements as Array<{ value: string }>)[0]?.value ?? "",
        );
        state.result = `Submitted: ${state.email}`;
        return { email: state.email };
      case "take_snapshot":
        return {
          text: `Status: ${state.status}\nResult: ${state.result}`,
          console: [...state.consoleMessages],
          requests: [...state.requests],
        };
      case "take_screenshot":
        return {
          filePath: invocation.payload.filePath ?? "qa-flow.png",
        };
      default:
        throw new Error(`Unexpected tool ${invocation.tool}`);
    }
  };
}

describe("qa browser skill integration", () => {
  it("builds a guided-flow report with browser evidence", async () => {
    const backend = new ChromeDevToolsBackend(createQaExecutor());
    const mode = resolveQaMode();

    await backend.navigate({ url: "http://127.0.0.1:4173/page.html" });
    await backend.click({ target: { ref: "open-form" } });
    await backend.fill({
      fields: [
        {
          target: { ref: "email" },
          value: "browser@example.test",
        },
      ],
    });
    await backend.click({ target: { ref: "submit-feedback" } });
    const snapshot = await backend.snapshot({ verbose: true });
    const screenshot = await backend.screenshot({
      filePath: ".gstack/qa-reports/screenshots/issue-001.png",
    });

    const report = createQaReport({
      scope: mode.scope,
      tier: mode.tier,
      findings: [
        {
          id: "ISSUE-001",
          title: "Submission confirmation lacks emphasis",
          severity: "medium",
          summary: "The flow completes, but the confirmation state relies on plain text only.",
          reproSteps: [
            "Open the feedback form",
            "Enter an email address",
            "Submit the form",
          ],
          screenshots: [
            {
              path: String(screenshot.data.filePath),
              caption: "Post-submit state",
              kind: "issue",
            },
          ],
          consoleEvidence: {
            messages: snapshot.data.console,
          },
          networkEvidence: {
            requests: snapshot.data.requests,
          },
        },
      ],
      screenshots: [
        {
          path: String(screenshot.data.filePath),
          kind: "state",
        },
      ],
      consoleEvidence: {
        messages: snapshot.data.console,
      },
      networkEvidence: {
        requests: snapshot.data.requests,
      },
      healthSummary: {
        baselineScore: 88,
        finalScore: 88,
        shipReadiness: "needs-attention",
      },
    });

    expect(mode.scope).toBe("guided-flow");
    expect(report.findings[0]?.reproSteps).toHaveLength(3);
    expect(report.findings[0]?.severity).toBe("medium");
    expect(report.findings[0]?.screenshots[0]?.path).toContain("issue-001");
    expect(report.consoleEvidence?.messages).toContain("form-submitted");
    expect(report.networkEvidence?.requests).toContain("GET /page.html?submitted=1 [200]");
    expect(
      shouldEnterQaFixMode({
        requestedFixes: true,
        explicitConfirmation: false,
      }),
    ).toBe(false);
  });
});

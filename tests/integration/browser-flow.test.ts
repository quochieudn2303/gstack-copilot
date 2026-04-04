import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { ChromeDevToolsBackend } from "../../src/runtime/browser/chrome-devtools-backend.js";

interface FixtureState {
  status: string;
  email: string;
  result: string;
  consoleMessages: string[];
  networkRequests: string[];
}

function createFixtureExecutor() {
  const state: FixtureState = {
    status: "Idle",
    email: "",
    result: "Pending",
    consoleMessages: ["fixture-ready"],
    networkRequests: [],
  };
  const invocations: string[] = [];

  const executor = async (invocation: {
    tool: string;
    payload: Record<string, unknown>;
  }) => {
    invocations.push(invocation.tool);

    switch (invocation.tool) {
      case "navigate_page":
        state.networkRequests.push(String(invocation.payload.url));
        return { page: "Browser Flow Fixture" };

      case "hover":
        return { hovered: invocation.payload.uid ?? null };

      case "click":
        if (invocation.payload.uid === "open-form") {
          state.status = "Form opened";
          state.consoleMessages.push("form-opened");
        }

        if (invocation.payload.uid === "submit-feedback") {
          state.status = "Submitted";
          state.result = `Submitted: ${state.email || "missing"}`;
          state.consoleMessages.push("form-submitted");
          state.networkRequests.push("./page.html?submitted=1");
        }

        return { status: state.status };

      case "fill_form": {
        const elements = invocation.payload.elements as Array<{
          uid?: string;
          value: string;
        }>;

        for (const element of elements) {
          if (element.uid === "email") {
            state.email = element.value;
          }
        }

        return { values: { email: state.email } };
      }

      case "take_snapshot":
        return {
          text: `Status: ${state.status}\nResult: ${state.result}`,
          console: [...state.consoleMessages],
          requests: [...state.networkRequests],
        };

      case "take_screenshot":
        return {
          filePath: invocation.payload.filePath ?? "browser-flow.png",
          status: state.status,
        };

      default:
        throw new Error(`Unexpected tool ${invocation.tool}`);
    }
  };

  return { executor, invocations };
}

describe("browser flow integration", () => {
  it("uses a deterministic fixture and supports a multi-step flow", async () => {
    const fixture = readFileSync(
      resolve("tests", "fixtures", "browser-flow", "page.html"),
      "utf8",
    );

    expect(fixture).toContain("Browser Flow Fixture");
    expect(fixture).toContain('id="open-form"');
    expect(fixture).toContain('id="email"');
    expect(fixture).toContain('id="submit-feedback"');

    const { executor, invocations } = createFixtureExecutor();
    const backend = new ChromeDevToolsBackend(executor);

    await backend.navigate({
      url: "file:///tests/fixtures/browser-flow/page.html",
    });
    await backend.hover({ target: { ref: "open-form" } });
    await backend.click({ target: { ref: "open-form" } });
    await backend.fill({
      fields: [
        {
          target: { ref: "email", description: "Email" },
          value: "browser@example.test",
        },
      ],
    });
    await backend.click({ target: { ref: "submit-feedback" } });
    const snapshot = await backend.snapshot();
    const screenshot = await backend.screenshot({
      filePath: "browser-flow.png",
    });

    expect(snapshot.artifact).toBe("snapshot");
    expect(snapshot.data).toEqual({
      text: "Status: Submitted\nResult: Submitted: browser@example.test",
      console: ["fixture-ready", "form-opened", "form-submitted"],
      requests: [
        "file:///tests/fixtures/browser-flow/page.html",
        "./page.html?submitted=1",
      ],
    });
    expect(screenshot.artifact).toBe("screenshot");
    expect(screenshot.data).toEqual({
      filePath: "browser-flow.png",
      status: "Submitted",
    });
    expect(invocations).toEqual([
      "navigate_page",
      "hover",
      "click",
      "fill_form",
      "click",
      "take_snapshot",
      "take_screenshot",
    ]);
  });
});

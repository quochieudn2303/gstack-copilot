import { describe, expect, expectTypeOf, it } from "vitest";

import { ChromeDevToolsBackend } from "../../src/runtime/browser/chrome-devtools-backend.js";
import {
  CHROME_DEVTOOLS_METHOD_MAP,
  type BrowserMethodName,
} from "../../src/runtime/browser/chrome-devtools-mapping.js";

function createBackend() {
  const invocations: Array<{ tool: string; payload: unknown }> = [];
  const backend = new ChromeDevToolsBackend(async (invocation) => {
    invocations.push(invocation);
    return {
      ok: true,
      tool: invocation.tool,
    };
  });

  return { backend, invocations };
}

describe("chrome devtools browser backend", () => {
  it("covers the full core and capability method surface in the mapping registry", () => {
    expectTypeOf<BrowserMethodName>().toEqualTypeOf<
      | "navigate"
      | "click"
      | "fill"
      | "screenshot"
      | "snapshot"
      | "waitFor"
      | "evaluate"
      | "hover"
      | "console"
      | "network"
    >();

    expect(CHROME_DEVTOOLS_METHOD_MAP).toEqual({
      navigate: "navigate_page",
      click: "click",
      fill: "fill_form",
      screenshot: "take_screenshot",
      snapshot: "take_snapshot",
      waitFor: "wait_for",
      evaluate: "evaluate_script",
      hover: "hover",
      console: "list_console_messages",
      network: "list_network_requests",
    });
  });

  it("advertises the chosen broad QA capabilities", () => {
    const { backend } = createBackend();

    expect(backend.capabilities).toEqual({
      waitFor: true,
      evaluate: true,
      hover: true,
      console: true,
      network: true,
    });
  });

  it("maps adapter calls through the registry", async () => {
    const { backend, invocations } = createBackend();

    await backend.navigate({ url: "https://example.test" });
    await backend.fill({
      fields: [
        {
          target: { ref: "email-field", description: "Email" },
          value: "hello@example.test",
        },
      ],
    });
    await backend.console({
      includePreservedMessages: true,
      types: ["error"],
    });
    await backend.snapshot({ verbose: true });

    expect(invocations).toEqual([
      {
        tool: "navigate_page",
        payload: {
          type: "url",
          url: "https://example.test",
        },
      },
      {
        tool: "fill_form",
        payload: {
          elements: [
            {
              uid: "email-field",
              value: "hello@example.test",
            },
          ],
        },
      },
      {
        tool: "list_console_messages",
        payload: {
          includePreservedMessages: true,
          types: ["error"],
        },
      },
      {
        tool: "take_snapshot",
        payload: {
          verbose: true,
        },
      },
    ]);
  });

  it("rejects selector-only targets because Chrome DevTools requires uids", async () => {
    const { backend } = createBackend();

    expect(() =>
      backend.click({ target: { selector: "#submit" } }),
    ).toThrow(/requires a DevTools uid/i);
  });

  it("returns documented fallback guidance for deferred actions", () => {
    const { backend } = createBackend();

    expect(
      backend.describeUnsupportedAction({
        action: "responsiveEmulation",
      }),
    ).toEqual({
      supported: false,
      action: "responsiveEmulation",
      reason:
        "Responsive and device emulation are intentionally deferred from the Phase 4 browser abstraction.",
      essentiality: "non-essential",
      guidance:
        "Continue with desktop coverage only, or switch to a backend that explicitly supports device emulation.",
    });
  });
});

import { describe, expect, it } from "vitest";

import { ChromeDevToolsBackend } from "../../src/runtime/browser/chrome-devtools-backend.js";

describe("browser command mapping integration", () => {
  it("routes core and capability methods through the expected tool names", async () => {
    const calls: Array<{ tool: string; payload: unknown }> = [];
    const backend = new ChromeDevToolsBackend(async (invocation) => {
      calls.push(invocation);
      return { tool: invocation.tool };
    });

    await backend.navigate({ url: "https://example.test" });
    await backend.click({ target: { ref: "cta-button" } });
    await backend.waitFor({ text: ["Ready"], timeoutMs: 2500 });
    await backend.network({
      includePreservedRequests: true,
      resourceTypes: ["document"],
    });

    expect(calls).toEqual([
      {
        tool: "navigate_page",
        payload: {
          type: "url",
          url: "https://example.test",
        },
      },
      {
        tool: "click",
        payload: {
          uid: "cta-button",
          dblClick: false,
        },
      },
      {
        tool: "wait_for",
        payload: {
          text: ["Ready"],
          timeout: 2500,
        },
      },
      {
        tool: "list_network_requests",
        payload: {
          includePreservedRequests: true,
          resourceTypes: ["document"],
        },
      },
    ]);
  });

  it("returns explicit fallback guidance instead of silent success for deferred actions", () => {
    const backend = new ChromeDevToolsBackend(async () => ({}));

    const fallback = backend.describeUnsupportedAction({
      action: "debugSnapshot",
    });

    expect(fallback.supported).toBe(false);
    expect(fallback.guidance).toMatch(/snapshot/i);
  });

  it("fails fast when a deferred action is marked essential", () => {
    const backend = new ChromeDevToolsBackend(async () => ({}));

    expect(() =>
      backend.describeUnsupportedAction({
        action: "fileUpload",
        essentiality: "essential",
      }),
    ).toThrow(/unsupported browser action/i);
  });
});

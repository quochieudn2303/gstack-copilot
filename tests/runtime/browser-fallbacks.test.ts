import { describe, expect, it } from "vitest";

import {
  UnsupportedBrowserActionError,
  createBrowserFallback,
  resolveUnsupportedBrowserAction,
} from "../../src/runtime/browser/fallbacks.js";

describe("browser fallback policy", () => {
  it("creates structured fallback guidance for non-essential actions", () => {
    expect(
      createBrowserFallback({
        action: "responsiveEmulation",
        reason: "Chrome DevTools MCP device emulation is deferred in Phase 4.",
        guidance:
          "Continue with desktop coverage only and defer responsive checks to a later backend.",
      }),
    ).toEqual({
      supported: false,
      action: "responsiveEmulation",
      reason: "Chrome DevTools MCP device emulation is deferred in Phase 4.",
      essentiality: "non-essential",
      guidance:
        "Continue with desktop coverage only and defer responsive checks to a later backend.",
    });
  });

  it("returns fallback guidance when the unsupported action is non-essential", () => {
    const result = resolveUnsupportedBrowserAction({
      action: "sessionImport",
      reason: "Session import is out of scope for Phase 4.",
      guidance:
        "Ask the user to authenticate manually before continuing the browser flow.",
    });

    expect(result.supported).toBe(false);
    expect(result.essentiality).toBe("non-essential");
  });

  it("fails fast when an essential unsupported action has no safe fallback", () => {
    expect(() =>
      resolveUnsupportedBrowserAction({
        action: "fileUpload",
        reason: "File upload is intentionally deferred from the Phase 4 API.",
        guidance: "Stop the flow and ask for a backend with upload support.",
        essentiality: "essential",
      }),
    ).toThrow(UnsupportedBrowserActionError);
  });
});

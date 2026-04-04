import { describe, expect, it } from "vitest";

import { ChromeDevToolsBackend } from "../../src/runtime/browser/chrome-devtools-backend.js";
import { UnsupportedBrowserActionError } from "../../src/runtime/browser/fallbacks.js";

describe("browser fallback integration", () => {
  it("returns structured fallback guidance for non-essential deferred actions", () => {
    const backend = new ChromeDevToolsBackend(async () => ({}));

    const fallback = backend.describeUnsupportedAction({
      action: "responsiveEmulation",
    });

    expect(fallback).toEqual({
      supported: false,
      action: "responsiveEmulation",
      reason:
        "Responsive and device emulation are intentionally deferred from the Phase 4 browser abstraction.",
      essentiality: "non-essential",
      guidance:
        "Continue with desktop coverage only, or switch to a backend that explicitly supports device emulation.",
    });
  });

  it("fails fast when an essential deferred action has no safe fallback", () => {
    const backend = new ChromeDevToolsBackend(async () => ({}));

    expect(() =>
      backend.describeUnsupportedAction({
        action: "sessionImport",
        essentiality: "essential",
      }),
    ).toThrow(UnsupportedBrowserActionError);
  });
});

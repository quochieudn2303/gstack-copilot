import { describe, expect, expectTypeOf, it } from "vitest";

import {
  BROWSER_CAPABILITY_NAMES,
  createBrowserCapabilities,
  type BrowserCapabilities,
} from "../../src/runtime/browser/capabilities.js";

describe("browser capability model", () => {
  it("matches the locked Phase 4 broad QA surface", () => {
    expectTypeOf<keyof BrowserCapabilities>().toEqualTypeOf<
      "waitFor" | "evaluate" | "hover" | "console" | "network"
    >();

    expect(BROWSER_CAPABILITY_NAMES).toEqual([
      "waitFor",
      "evaluate",
      "hover",
      "console",
      "network",
    ]);
  });

  it("defaults all capabilities to disabled until a backend enables them", () => {
    expect(createBrowserCapabilities()).toEqual({
      waitFor: false,
      evaluate: false,
      hover: false,
      console: false,
      network: false,
    });
  });

  it("does not leak deferred capabilities into the model", () => {
    const capabilityKeys = Object.keys(createBrowserCapabilities());

    expect(capabilityKeys).not.toContain("fileUpload");
    expect(capabilityKeys).not.toContain("sessionImport");
    expect(capabilityKeys).not.toContain("responsiveEmulation");
  });
});

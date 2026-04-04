import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, expectTypeOf, it } from "vitest";

import type { BrowserAdapter } from "../../src/runtime/browser/adapter.js";

describe("browser adapter contract", () => {
  it("exposes only the required core methods", () => {
    expectTypeOf<keyof BrowserAdapter>().toEqualTypeOf<
      "navigate" | "click" | "fill" | "screenshot" | "snapshot"
    >();
  });

  it("stays backend agnostic in the source definition", () => {
    const source = readFileSync(
      resolve("src", "runtime", "browser", "adapter.ts"),
      "utf8",
    );

    expect(source).not.toContain("navigate_page");
    expect(source).not.toContain("take_snapshot");
    expect(source).not.toContain("chrome-devtools");
  });
});

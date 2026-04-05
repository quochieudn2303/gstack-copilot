import { describe, expect, it } from "vitest";

import {
  resolveQaMode,
  shouldEnterQaFixMode,
} from "../../src/runtime/qa/flow.js";

describe("qa flow contract", () => {
  it("defaults to guided-flow and findings-first behavior", () => {
    expect(resolveQaMode()).toEqual({
      scope: "guided-flow",
      tier: "standard",
      findingsFirst: true,
      fixMode: "available-after-confirmation",
      severities: ["critical", "high", "medium", "low"],
    });
  });

  it("allows tier overrides without changing the guided contract", () => {
    expect(resolveQaMode({ tier: "quick" }).tier).toBe("quick");
    expect(resolveQaMode({ scope: "single-page" }).scope).toBe("single-page");
  });

  it("requires explicit confirmation before entering fix mode", () => {
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
});

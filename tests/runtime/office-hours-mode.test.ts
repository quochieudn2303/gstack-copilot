import { describe, expect, it } from "vitest";

import { determineOfficeHoursMode } from "../../src/runtime/office-hours/mode.js";

describe("office-hours mode resolution", () => {
  it("honors explicit mode choice", () => {
    expect(
      determineOfficeHoursMode({ explicitMode: "startup" }),
    ).toEqual({
      mode: "startup",
      rationale: "Explicit mode preference from the user.",
    });
  });

  it("detects startup signals from the goal text", () => {
    expect(
      determineOfficeHoursMode({
        goal: "We need to validate the market and customers before fundraising.",
      }).mode,
    ).toBe("startup");
  });

  it("defaults to builder mode when the goal is exploratory", () => {
    expect(
      determineOfficeHoursMode({
        goal: "Prototype a fun open source side project.",
      }).mode,
    ).toBe("builder");
  });

  it("does not let weak startup cues override explicit builder intent", () => {
    expect(
      determineOfficeHoursMode({
        goal: "Prototype a fun business card generator for a hackathon.",
      }).mode,
    ).toBe("builder");
  });

  it("still picks startup when demand signals outweigh builder language", () => {
    expect(
      determineOfficeHoursMode({
        goal: "Prototype a startup tool for paying customers before fundraising.",
      }).mode,
    ).toBe("startup");
  });
});

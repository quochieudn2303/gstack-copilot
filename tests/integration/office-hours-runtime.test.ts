import { describe, expect, it } from "vitest";

import { determineOfficeHoursMode } from "../../src/runtime/office-hours/mode.js";
import { createOfficeHoursMemo } from "../../src/runtime/office-hours/memo.js";

describe("office-hours runtime integration", () => {
  it("keeps startup and builder mode behavior encoded", () => {
    expect(
      determineOfficeHoursMode({
        goal: "We need customer demand proof before we build a company around this.",
      }).mode,
    ).toBe("startup");
    expect(
      determineOfficeHoursMode({
        goal: "This is a side project for a hackathon.",
      }).mode,
    ).toBe("builder");
  });

  it("creates critique-first memo output with recommended direction", () => {
    const memo = createOfficeHoursMemo({
      mode: "builder",
      problemStatement: "Visitors do not understand what makes the product distinctive.",
      critique: [
        {
          title: "Hero clarity",
          detail: "The landing page introduces features before explaining the core promise.",
        },
      ],
      approachesConsidered: [
        {
          name: "Sharper narrative",
          summary: "Lead with problem, then proof, then features.",
        },
      ],
      recommendedDirection:
        "Lead with the problem and move supporting proof directly under the hero.",
      openQuestions: ["What single proof point is most credible for new visitors?"],
      nextStep: "Rewrite the hero and test two alternative proof sections.",
    });

    expect(memo.critique[0]?.title).toBe("Hero clarity");
    expect(memo.recommendedDirection).toContain("problem");
    expect(memo.nextStep).toContain("Rewrite");
  });
});

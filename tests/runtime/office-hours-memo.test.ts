import { describe, expect, it } from "vitest";

import {
  createOfficeHoursMemo,
  createOfficeHoursOutput,
} from "../../src/runtime/office-hours/memo.js";

describe("office-hours memo contract", () => {
  it("creates a critique-first memo with recommended direction", () => {
    const memo = createOfficeHoursMemo({
      mode: "startup",
      problemStatement: "The landing page hides who the product is for.",
      critique: [
        {
          title: "Positioning",
          detail: "The hero copy speaks in product features instead of the user problem.",
        },
      ],
      approachesConsidered: [
        {
          name: "Sharper hero",
          summary: "Lead with the user problem and supporting proof.",
        },
      ],
      recommendedDirection:
        "Reframe the hero around the target user and move proof higher on the page.",
      openQuestions: ["What proof point matters most to new visitors?"],
      nextStep: "Rewrite the hero and test two proof modules.",
    });

    const output = createOfficeHoursOutput(
      "The product page needs a sharper point of view.",
      memo,
    );

    expect(output.conversationalFeedback).toContain("sharper");
    expect(output.memo.critique[0]?.title).toBe("Positioning");
    expect(output.memo.recommendedDirection).toContain("hero");
    expect(output.memo.nextStep).toContain("Rewrite");
  });
});

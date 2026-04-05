import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { ChromeDevToolsBackend } from "../../src/runtime/browser/chrome-devtools-backend.js";
import { determineOfficeHoursMode } from "../../src/runtime/office-hours/mode.js";
import {
  createOfficeHoursMemo,
  createOfficeHoursOutput,
} from "../../src/runtime/office-hours/memo.js";

function createOfficeHoursExecutor() {
  const pageText = [
    "SignalForge",
    "Everything your team needs to move faster",
    "SignalForge helps modern teams align work, share updates, and unlock more velocity across every function.",
    "Why teams choose SignalForge",
    "Plans start at $24 per seat, billed monthly.",
  ].join("\n");

  return async (invocation: {
    tool: string;
    payload: Record<string, unknown>;
  }) => {
    switch (invocation.tool) {
      case "navigate_page":
        return { page: "SignalForge" };
      case "take_snapshot":
        return {
          text: pageText,
          console: ["office-hours-page-ready"],
        };
      default:
        throw new Error(`Unexpected tool ${invocation.tool}`);
    }
  };
}

describe("office-hours browser skill integration", () => {
  it("turns browser observations into critique-first memo output", async () => {
    const fixture = readFileSync(
      resolve("tests", "fixtures", "office-hours-page.html"),
      "utf8",
    );
    expect(fixture).toContain("Everything your team needs to move faster");

    const backend = new ChromeDevToolsBackend(createOfficeHoursExecutor());
    await backend.navigate({ url: "http://127.0.0.1:4173/office-hours-page.html" });
    const snapshot = await backend.snapshot({ verbose: true });

    const mode = determineOfficeHoursMode({
      goal: "We need sharper customer-facing positioning before we scale this startup.",
    });
    const memo = createOfficeHoursMemo({
      mode: mode.mode,
      problemStatement:
        "The page does not make the target user or core value proposition specific enough.",
      critique: [
        {
          title: "Positioning is too broad",
          detail:
            "The hero says 'Everything your team needs to move faster', which is generic and does not tell a specific buyer why this product exists.",
        },
      ],
      approachesConsidered: [
        {
          name: "Sharper ICP framing",
          summary:
            "Lead with the exact team and problem instead of a generic all-in-one promise.",
        },
        {
          name: "Proof-first framing",
          summary:
            "Move stronger proof closer to the hero before describing the category.",
        },
      ],
      recommendedDirection:
        "Rewrite the hero around one target team and one painful workflow, then move concrete proof above pricing.",
      openQuestions: [
        "Which team owns this pain most intensely today?",
      ],
      nextStep:
        "Write two tighter hero variants and test which proof point best supports them.",
    });
    const output = createOfficeHoursOutput(
      `Observed page issue: ${snapshot.data.text.split("\n")[1]}`,
      memo,
    );

    expect(mode.mode).toBe("startup");
    expect(output.conversationalFeedback).toContain("Everything your team needs to move faster");
    expect(output.memo.critique[0]?.title).toBe("Positioning is too broad");
    expect(output.memo.recommendedDirection).toContain("Rewrite the hero");
    expect(output.memo.openQuestions).toContain(
      "Which team owns this pain most intensely today?",
    );
  });
});

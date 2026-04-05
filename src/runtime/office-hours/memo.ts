import type { BrowserFallback } from "../browser/fallbacks.js";
import type { OfficeHoursMode } from "./mode.js";

export interface OfficeHoursObservation {
  title: string;
  detail: string;
}

export interface OfficeHoursApproach {
  name: string;
  summary: string;
}

export interface OfficeHoursMemo {
  mode: OfficeHoursMode;
  problemStatement: string;
  critique: OfficeHoursObservation[];
  approachesConsidered: OfficeHoursApproach[];
  recommendedDirection: string;
  openQuestions: string[];
  nextStep: string;
  fallbacks?: BrowserFallback[];
}

export interface OfficeHoursOutput {
  conversationalFeedback: string;
  memo: OfficeHoursMemo;
}

export function createOfficeHoursMemo(
  memo: OfficeHoursMemo,
): OfficeHoursMemo {
  return memo;
}

export function createOfficeHoursOutput(
  conversationalFeedback: string,
  memo: OfficeHoursMemo,
): OfficeHoursOutput {
  return {
    conversationalFeedback,
    memo,
  };
}

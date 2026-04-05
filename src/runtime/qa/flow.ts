import type { QaSeverity } from "./report.js";

export const QA_SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
] as const satisfies readonly QaSeverity[];

export type QaTier = "quick" | "standard" | "exhaustive";
export type QaScope = "guided-flow" | "single-page" | "crawl";

export interface ResolveQaModeOptions {
  scope?: QaScope;
  tier?: QaTier;
  requestedFixes?: boolean;
}

export interface QaMode {
  scope: QaScope;
  tier: QaTier;
  findingsFirst: true;
  fixMode: "available-after-confirmation";
  severities: readonly QaSeverity[];
}

export interface QaFixModeOptions {
  requestedFixes?: boolean;
  explicitConfirmation?: boolean;
}

export function resolveQaMode(
  options: ResolveQaModeOptions = {},
): QaMode {
  return {
    scope: options.scope ?? "guided-flow",
    tier: options.tier ?? "standard",
    findingsFirst: true,
    fixMode: "available-after-confirmation",
    severities: QA_SEVERITIES,
  };
}

export function shouldEnterQaFixMode(
  options: QaFixModeOptions,
): boolean {
  return Boolean(
    options.requestedFixes && options.explicitConfirmation,
  );
}

import type { BrowserFallback } from "../browser/fallbacks.js";
import type { QaScope, QaTier } from "./flow.js";

export type QaSeverity = "critical" | "high" | "medium" | "low";
export type QaShipReadiness = "ready" | "needs-attention" | "blocked";

export interface QaScreenshotEvidence {
  path: string;
  caption?: string;
  kind?: "issue" | "state" | "before" | "after";
}

export interface QaConsoleEvidence {
  summary?: string;
  messages: string[];
}

export interface QaNetworkEvidence {
  summary?: string;
  requests: string[];
}

export interface QaFinding {
  id: string;
  title: string;
  severity: QaSeverity;
  summary: string;
  reproSteps: string[];
  screenshots: QaScreenshotEvidence[];
  consoleEvidence?: QaConsoleEvidence;
  networkEvidence?: QaNetworkEvidence;
}

export interface QaHealthSummary {
  baselineScore?: number;
  finalScore?: number;
  shipReadiness: QaShipReadiness;
}

export interface QaReport {
  scope: QaScope;
  tier: QaTier;
  findings: QaFinding[];
  screenshots: QaScreenshotEvidence[];
  consoleEvidence?: QaConsoleEvidence;
  networkEvidence?: QaNetworkEvidence;
  fallbacks?: BrowserFallback[];
  healthSummary: QaHealthSummary;
}

export function createQaReport(
  report: QaReport,
): QaReport {
  return report;
}

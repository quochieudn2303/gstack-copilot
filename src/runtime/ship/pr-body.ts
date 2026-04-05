export interface ShipPullRequestBodyOptions {
  phase: string;
  title: string;
  goal: string;
  summary: string;
  verification: string[];
  requirements: string[];
  keyDecisions?: string[];
}

export function createShipPullRequestBody(
  options: ShipPullRequestBodyOptions,
): string {
  const sections = [
    "## Summary",
    "",
    `**${options.phase}: ${options.title}**`,
    `**Goal:** ${options.goal}`,
    "",
    options.summary.trim(),
    "",
    "## Requirements Addressed",
    "",
    ...options.requirements.map((requirement) => `- ${requirement}`),
    "",
    "## Verification",
    "",
    ...options.verification.map((item) => `- ${item}`),
  ];

  if (options.keyDecisions && options.keyDecisions.length > 0) {
    sections.push(
      "",
      "## Key Decisions",
      "",
      ...options.keyDecisions.map((decision) => `- ${decision}`),
    );
  }

  return `${sections.join("\n").trim()}\n`;
}

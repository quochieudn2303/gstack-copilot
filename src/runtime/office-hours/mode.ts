export type OfficeHoursMode = "startup" | "builder";

export interface DetermineOfficeHoursModeOptions {
  explicitMode?: OfficeHoursMode;
  goal?: string;
}

export interface OfficeHoursModeResolution {
  mode: OfficeHoursMode;
  rationale: string;
}

const STARTUP_SIGNAL_PATTERNS = [
  /\bstartup\b/,
  /\bcustomers?\b/,
  /\brevenue\b/,
  /\bfundraising\b/,
  /\bmarket\b/,
  /\bcompany\b/,
  /\bbusiness model\b/,
] as const;

const BUILDER_SIGNAL_PATTERNS = [
  /\bbuilder\b/,
  /\bhackathon\b/,
  /\bopen source\b/,
  /\blearning\b/,
  /\bprototype\b/,
  /\bside project\b/,
  /\bfun\b/,
] as const;

function countMatches(
  goal: string,
  patterns: readonly RegExp[],
): number {
  return patterns.reduce(
    (count, pattern) => count + (pattern.test(goal) ? 1 : 0),
    0,
  );
}

export function determineOfficeHoursMode(
  options: DetermineOfficeHoursModeOptions = {},
): OfficeHoursModeResolution {
  if (options.explicitMode) {
    return {
      mode: options.explicitMode,
      rationale: "Explicit mode preference from the user.",
    };
  }

  const goal = options.goal?.toLowerCase() ?? "";
  const startupScore = countMatches(goal, STARTUP_SIGNAL_PATTERNS);
  const builderScore = countMatches(goal, BUILDER_SIGNAL_PATTERNS);

  if (builderScore > startupScore) {
    return {
      mode: "builder",
      rationale:
        "Goal text includes more builder or project-exploration signals than startup signals.",
    };
  }

  if (startupScore > 0) {
    return {
      mode: "startup",
      rationale: "Goal text includes stronger startup or demand signals.",
    };
  }

  return {
    mode: "builder",
    rationale: "Default to builder mode when the goal does not clearly signal startup intent.",
  };
}

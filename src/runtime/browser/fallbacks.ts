export type BrowserActionEssentiality =
  | "essential"
  | "non-essential";

export interface BrowserFallback {
  supported: false;
  action: string;
  reason: string;
  essentiality: BrowserActionEssentiality;
  guidance: string;
}

export interface BrowserFallbackOptions {
  action: string;
  reason: string;
  guidance: string;
  essentiality?: BrowserActionEssentiality;
}

export type BrowserOutcome<T> = T | BrowserFallback;

export class UnsupportedBrowserActionError extends Error {
  readonly fallback: BrowserFallback;

  constructor(fallback: BrowserFallback) {
    super(
      `Unsupported browser action "${fallback.action}": ${fallback.reason}`,
    );
    this.name = "UnsupportedBrowserActionError";
    this.fallback = fallback;
  }
}

export function createBrowserFallback(
  options: BrowserFallbackOptions,
): BrowserFallback {
  return {
    supported: false,
    action: options.action,
    reason: options.reason,
    essentiality: options.essentiality ?? "non-essential",
    guidance: options.guidance,
  };
}

export function resolveUnsupportedBrowserAction(
  options: BrowserFallbackOptions,
): BrowserFallback {
  const fallback = createBrowserFallback(options);

  if (fallback.essentiality === "essential") {
    throw new UnsupportedBrowserActionError(fallback);
  }

  return fallback;
}

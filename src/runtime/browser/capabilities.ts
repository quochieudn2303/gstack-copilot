import type {
  BrowserCommandResult,
  BrowserTarget,
} from "./adapter.js";

export const BROWSER_CAPABILITY_NAMES = [
  "waitFor",
  "evaluate",
  "hover",
  "console",
  "network",
] as const;

export type BrowserCapabilityName =
  (typeof BROWSER_CAPABILITY_NAMES)[number];

export interface BrowserCapabilities {
  waitFor: boolean;
  evaluate: boolean;
  hover: boolean;
  console: boolean;
  network: boolean;
}

export const DEFAULT_BROWSER_CAPABILITIES: BrowserCapabilities = {
  waitFor: false,
  evaluate: false,
  hover: false,
  console: false,
  network: false,
};

export function createBrowserCapabilities(
  overrides: Partial<BrowserCapabilities> = {},
): BrowserCapabilities {
  return {
    ...DEFAULT_BROWSER_CAPABILITIES,
    ...overrides,
  };
}

export interface BrowserWaitForRequest {
  text: string[];
  timeoutMs?: number;
}

export interface BrowserEvaluateRequest {
  functionDeclaration: string;
  args?: string[];
  target?: BrowserTarget;
}

export interface BrowserHoverRequest {
  target: BrowserTarget;
}

export type BrowserConsoleLevel = "info" | "warning" | "error";

export interface BrowserConsoleRequest {
  includePreservedMessages?: boolean;
  pageIdx?: number;
  pageSize?: number;
  types?: string[];
}

export interface BrowserNetworkRequest {
  includePreservedRequests?: boolean;
  pageIdx?: number;
  pageSize?: number;
  resourceTypes?: string[];
}

export interface BrowserWaitForCapability {
  waitFor(
    request: BrowserWaitForRequest,
  ): Promise<BrowserCommandResult>;
}

export interface BrowserEvaluateCapability {
  evaluate(
    request: BrowserEvaluateRequest,
  ): Promise<BrowserCommandResult>;
}

export interface BrowserHoverCapability {
  hover(
    request: BrowserHoverRequest,
  ): Promise<BrowserCommandResult>;
}

export interface BrowserConsoleCapability {
  console(
    request?: BrowserConsoleRequest,
  ): Promise<BrowserCommandResult>;
}

export interface BrowserNetworkCapability {
  network(
    request?: BrowserNetworkRequest,
  ): Promise<BrowserCommandResult>;
}

export type BrowserCapabilityExtensions =
  Partial<
    BrowserWaitForCapability &
      BrowserEvaluateCapability &
      BrowserHoverCapability &
      BrowserConsoleCapability &
      BrowserNetworkCapability
  >;

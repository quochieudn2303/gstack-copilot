import type { BrowserAdapter } from "./adapter.js";
import type { BrowserCapabilityName } from "./capabilities.js";

export type BrowserMethodName =
  | keyof BrowserAdapter
  | BrowserCapabilityName;

export const CHROME_DEVTOOLS_METHOD_MAP = {
  navigate: "navigate_page",
  click: "click",
  fill: "fill_form",
  screenshot: "take_screenshot",
  snapshot: "take_snapshot",
  waitFor: "wait_for",
  evaluate: "evaluate_script",
  hover: "hover",
  console: "list_console_messages",
  network: "list_network_requests",
} as const satisfies Record<BrowserMethodName, string>;

export type ChromeDevToolsToolName =
  (typeof CHROME_DEVTOOLS_METHOD_MAP)[BrowserMethodName];

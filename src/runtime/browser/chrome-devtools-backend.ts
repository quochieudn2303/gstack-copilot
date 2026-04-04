import type {
  BrowserAdapter,
  BrowserClickRequest,
  BrowserCommandResult,
  BrowserFillRequest,
  BrowserNavigateRequest,
  BrowserScreenshotRequest,
  BrowserScreenshotResult,
  BrowserSnapshotRequest,
  BrowserSnapshotResult,
} from "./adapter.js";
import {
  createBrowserCapabilities,
  type BrowserCapabilities,
  type BrowserCapabilityExtensions,
  type BrowserConsoleRequest,
  type BrowserEvaluateRequest,
  type BrowserHoverRequest,
  type BrowserNetworkRequest,
  type BrowserWaitForRequest,
} from "./capabilities.js";
import {
  resolveUnsupportedBrowserAction,
  type BrowserActionEssentiality,
  type BrowserFallback,
} from "./fallbacks.js";
import {
  CHROME_DEVTOOLS_METHOD_MAP,
  type BrowserMethodName,
  type ChromeDevToolsToolName,
} from "./chrome-devtools-mapping.js";

export interface ChromeDevToolsInvocation<TPayload = unknown> {
  tool: ChromeDevToolsToolName;
  payload: TPayload;
}

export type ChromeDevToolsCommandExecutor = <
  TPayload = unknown,
  TResponse = unknown,
>(
  invocation: ChromeDevToolsInvocation<TPayload>,
) => Promise<TResponse>;

export type ChromeDevToolsDeferredAction =
  | "debugSnapshot"
  | "responsiveEmulation"
  | "sessionImport"
  | "fileUpload";

export interface ChromeDevToolsUnsupportedActionRequest {
  action: ChromeDevToolsDeferredAction | string;
  essentiality?: BrowserActionEssentiality;
  reason?: string;
  guidance?: string;
}

const SUPPORTED_CAPABILITIES: BrowserCapabilities =
  createBrowserCapabilities({
    waitFor: true,
    evaluate: true,
    hover: true,
    console: true,
    network: true,
  });

const DEFERRED_ACTION_GUIDANCE: Record<
  ChromeDevToolsDeferredAction,
  { reason: string; guidance: string }
> = {
  debugSnapshot: {
    reason:
      "`$B snapshot -D` does not have a direct Phase 4 equivalent in the Chrome DevTools backend.",
    guidance:
      "Use `snapshot` plus explicit console or network diagnostics instead of a debug snapshot mode.",
  },
  responsiveEmulation: {
    reason:
      "Responsive and device emulation are intentionally deferred from the Phase 4 browser abstraction.",
    guidance:
      "Continue with desktop coverage only, or switch to a backend that explicitly supports device emulation.",
  },
  sessionImport: {
    reason:
      "Auth or cookie import is intentionally out of scope for the Phase 4 browser abstraction.",
    guidance:
      "Ask the user to authenticate manually before continuing the browser flow.",
  },
  fileUpload: {
    reason:
      "File upload is available in Chrome DevTools MCP but excluded from the approved Phase 4 adapter surface.",
    guidance:
      "Stop the current flow and move to a backend or later phase that explicitly supports uploads.",
  },
};

export class ChromeDevToolsBackend
  implements BrowserAdapter, BrowserCapabilityExtensions
{
  readonly name = "chrome-devtools";
  readonly capabilities = SUPPORTED_CAPABILITIES;

  constructor(
    private readonly executor: ChromeDevToolsCommandExecutor,
    private readonly mapping: typeof CHROME_DEVTOOLS_METHOD_MAP =
      CHROME_DEVTOOLS_METHOD_MAP,
  ) {}

  getToolName(method: BrowserMethodName): ChromeDevToolsToolName {
    return this.mapping[method];
  }

  navigate(
    request: BrowserNavigateRequest,
  ): Promise<BrowserCommandResult> {
    return this.invoke("navigate", {
      type: "url",
      url: request.url,
      timeout: request.timeoutMs,
    });
  }

  click(
    request: BrowserClickRequest,
  ): Promise<BrowserCommandResult> {
    return this.invoke("click", {
      uid: this.requireUid("click", request.target),
      dblClick: request.doubleClick ?? false,
    });
  }

  fill(
    request: BrowserFillRequest,
  ): Promise<BrowserCommandResult> {
    return this.invoke("fill", {
      elements: request.fields.map((field) => ({
        uid: this.requireUid("fill", field.target),
        value: field.value,
      })),
    });
  }

  async screenshot(
    request: BrowserScreenshotRequest = {},
  ): Promise<BrowserScreenshotResult> {
    const result = await this.invoke("screenshot", {
      ...(request.target
        ? { uid: this.requireUid("screenshot", request.target) }
        : {}),
      ...(request.fullPage !== undefined
        ? { fullPage: request.fullPage }
        : {}),
      ...(request.format ? { format: request.format } : {}),
      ...(request.filePath ? { filePath: request.filePath } : {}),
    });

    return {
      ...result,
      artifact: "screenshot",
    };
  }

  async snapshot(
    request: BrowserSnapshotRequest = {},
  ): Promise<BrowserSnapshotResult> {
    const result = await this.invoke("snapshot", {
      ...(request.verbose !== undefined
        ? { verbose: request.verbose }
        : {}),
      ...(request.filePath ? { filePath: request.filePath } : {}),
    });

    return {
      ...result,
      artifact: "snapshot",
    };
  }

  waitFor(
    request: BrowserWaitForRequest,
  ): Promise<BrowserCommandResult> {
    return this.invoke("waitFor", {
      text: request.text,
      ...(request.timeoutMs !== undefined
        ? { timeout: request.timeoutMs }
        : {}),
    });
  }

  evaluate(
    request: BrowserEvaluateRequest,
  ): Promise<BrowserCommandResult> {
    const args = request.target?.ref
      ? [request.target.ref, ...(request.args ?? [])]
      : request.args;

    return this.invoke("evaluate", {
      function: request.functionDeclaration,
      ...(args ? { args } : {}),
    });
  }

  hover(
    request: BrowserHoverRequest,
  ): Promise<BrowserCommandResult> {
    return this.invoke("hover", {
      uid: this.requireUid("hover", request.target),
    });
  }

  console(
    request: BrowserConsoleRequest = {},
  ): Promise<BrowserCommandResult> {
    return this.invoke("console", {
      includePreservedMessages:
        request.includePreservedMessages ?? false,
      ...(request.pageIdx !== undefined
        ? { pageIdx: request.pageIdx }
        : {}),
      ...(request.pageSize !== undefined
        ? { pageSize: request.pageSize }
        : {}),
      ...(request.types ? { types: request.types } : {}),
    });
  }

  network(
    request: BrowserNetworkRequest = {},
  ): Promise<BrowserCommandResult> {
    return this.invoke("network", {
      includePreservedRequests:
        request.includePreservedRequests ?? false,
      ...(request.pageIdx !== undefined
        ? { pageIdx: request.pageIdx }
        : {}),
      ...(request.pageSize !== undefined
        ? { pageSize: request.pageSize }
        : {}),
      ...(request.resourceTypes
        ? { resourceTypes: request.resourceTypes }
        : {}),
    });
  }

  describeUnsupportedAction(
    request: ChromeDevToolsUnsupportedActionRequest,
  ): BrowserFallback {
    const documented = DEFERRED_ACTION_GUIDANCE[
      request.action as ChromeDevToolsDeferredAction
    ];

    return resolveUnsupportedBrowserAction({
      action: request.action,
      reason:
        request.reason ??
        documented?.reason ??
        "This browser action is not implemented by the Chrome DevTools backend.",
      guidance:
        request.guidance ??
        documented?.guidance ??
        "Switch to a backend that explicitly supports this action.",
      essentiality: request.essentiality,
    });
  }

  private async invoke<TPayload, TResponse = unknown>(
    method: BrowserMethodName,
    payload: TPayload,
  ): Promise<BrowserCommandResult<TResponse>> {
    const data = await this.executor<TPayload, TResponse>({
      tool: this.getToolName(method),
      payload,
    });

    return {
      backend: this.name,
      data,
    };
  }

  private requireUid(
    action: string,
    target: { ref?: string },
  ): string {
    if (!target.ref) {
      throw new Error(
        `ChromeDevToolsBackend requires a DevTools uid for ${action}.`,
      );
    }

    return target.ref;
  }
}

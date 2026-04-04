export interface BrowserTarget {
  ref?: string;
  selector?: string;
  description?: string;
}

export interface BrowserNavigateRequest {
  url: string;
  timeoutMs?: number;
}

export interface BrowserClickRequest {
  target: BrowserTarget;
  doubleClick?: boolean;
}

export interface BrowserFillField {
  target: BrowserTarget;
  value: string;
}

export interface BrowserFillRequest {
  fields: BrowserFillField[];
}

export type BrowserScreenshotFormat = "png" | "jpeg" | "webp";

export interface BrowserScreenshotRequest {
  target?: BrowserTarget;
  fullPage?: boolean;
  format?: BrowserScreenshotFormat;
  filePath?: string;
}

export interface BrowserSnapshotRequest {
  verbose?: boolean;
  filePath?: string;
}

export interface BrowserCommandResult<TData = unknown> {
  backend: string;
  data: TData;
}

export interface BrowserScreenshotResult<TData = unknown>
  extends BrowserCommandResult<TData> {
  artifact: "screenshot";
}

export interface BrowserSnapshotResult<TData = unknown>
  extends BrowserCommandResult<TData> {
  artifact: "snapshot";
}

export interface BrowserAdapter {
  navigate(
    request: BrowserNavigateRequest,
  ): Promise<BrowserCommandResult>;
  click(
    request: BrowserClickRequest,
  ): Promise<BrowserCommandResult>;
  fill(
    request: BrowserFillRequest,
  ): Promise<BrowserCommandResult>;
  screenshot(
    request?: BrowserScreenshotRequest,
  ): Promise<BrowserScreenshotResult>;
  snapshot(
    request?: BrowserSnapshotRequest,
  ): Promise<BrowserSnapshotResult>;
}

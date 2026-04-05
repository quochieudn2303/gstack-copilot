import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("setup and release documentation", () => {
  it("documents both setup entrypoints", () => {
    const readme = readFileSync(resolve("README.md"), "utf8");

    expect(readme).toContain(".\\setup.ps1");
    expect(readme).toContain("npx gstack-copilot setup");
  });

  it("ships changelog and version scaffolding", () => {
    const changelog = readFileSync(resolve("CHANGELOG.md"), "utf8");
    const version = readFileSync(resolve("VERSION"), "utf8").trim();

    expect(changelog).toContain("## [0.1.0.0] - 2026-04-05");
    expect(version).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
  });
});

import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const tsxCliPath = require.resolve("tsx/cli");

const tempDirs: string[] = [];

function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

function runCli(args: string[]) {
  return spawnSync(process.execPath, [tsxCliPath, "src/cli/index.ts", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function makeTempDir(): string {
  const dir = mkdtempSync(resolve(tmpdir(), "gstack-copilot-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("gstack-copilot CLI", () => {
  it("prints converted output on dry-run without corrupting stdout", () => {
    const result = runCli([
      "convert",
      "tests/fixtures/review-skill.md",
      "--dry-run",
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("name: gstack-review");
    expect(result.stdout).toContain("## Initialization");

    const stderr = stripAnsi(result.stderr);
    expect(stderr).toContain("Dry run: tests/fixtures/review-skill.md");
    expect(stderr).not.toContain("name: gstack-review");
  });

  it("writes output to an explicit file path", () => {
    const tempDir = makeTempDir();
    const outputPath = resolve(tempDir, "converted", "review.md");

    const result = runCli([
      "convert",
      "tests/fixtures/review-skill.md",
      "--output",
      outputPath,
    ]);

    expect(result.status).toBe(0);
    expect(readFileSync(outputPath, "utf8")).toContain("name: gstack-review");
    expect(stripAnsi(result.stderr)).toContain(`Written: ${outputPath}`);
  });

  it("writes output into the requested directory using the input basename", () => {
    const outputDir = makeTempDir();

    const result = runCli([
      "convert",
      "tests/fixtures/review-skill.md",
      "--output-dir",
      outputDir,
    ]);

    expect(result.status).toBe(0);

    const outputPath = resolve(outputDir, basename("tests/fixtures/review-skill.md"));
    expect(readFileSync(outputPath, "utf8")).toContain("allowed-tools: Bash, Read");
    expect(stripAnsi(result.stderr)).toContain(`Written: ${outputPath}`);
  });

  it("reports validation failures with a non-zero exit code", () => {
    const result = runCli(["convert", "tests/fixtures/invalid-skill.md"]);

    expect(result.status).toBe(1);
    expect(stripAnsi(result.stderr)).toContain("Conversion failed");
    expect(stripAnsi(result.stderr)).toContain("tests/fixtures/invalid-skill.md");
  });

  it("translates process substitution constructs through the CLI", () => {
    const result = runCli([
      "convert",
      "tests/fixtures/unsupported-skill.md",
      "--dry-run",
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('$_sourceOutput = & "echo" "hello"');
    expect(result.stdout).toContain('Set-Item -Path "Env:$($Matches[1])"');
  });
});

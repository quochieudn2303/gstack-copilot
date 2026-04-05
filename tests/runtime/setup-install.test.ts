import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runSetupInstall } from "../../src/setup/install.js";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "gstack-copilot-setup-"));
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

describe("setup install", () => {
  it("enumerates checked-in skills in the current repo", async () => {
    const result = await runSetupInstall({
      sourceRoot: resolve("."),
      targetRoot: resolve("."),
    });

    expect(result.skills).toEqual([
      "office-hours",
      "qa",
      "review",
      "ship",
    ]);
    expect(result.targetSkillsDir).toContain(".github");
  });

  it("copies skills into a target repo", async () => {
    const target = makeTempDir();
    mkdirSync(join(target, ".github"), { recursive: true });

    const result = await runSetupInstall({
      sourceRoot: resolve("."),
      targetRoot: target,
    });

    expect(result.skills).toContain("ship");
    const installedReadme = readFileSync(
      join(target, ".github", "skills", "ship", "README.md"),
      "utf8",
    );
    expect(installedReadme).toContain("/ship Skill");
  });

  it("fails if a checked-in skill is missing during verify mode", async () => {
    const source = makeTempDir();
    mkdirSync(join(source, ".github", "skills", "review"), {
      recursive: true,
    });
    mkdirSync(join(source, ".github", "skills", "qa"), {
      recursive: true,
    });
    mkdirSync(join(source, ".github", "skills", "office-hours"), {
      recursive: true,
    });
    writeFileSync(
      join(source, ".github", "skills", "review", "SKILL.md"),
      "placeholder",
      "utf8",
    );
    writeFileSync(
      join(source, ".github", "skills", "qa", "SKILL.md"),
      "placeholder",
      "utf8",
    );
    writeFileSync(
      join(source, ".github", "skills", "office-hours", "SKILL.md"),
      "placeholder",
      "utf8",
    );

    await expect(
      runSetupInstall({
        sourceRoot: source,
        targetRoot: source,
      }),
    ).rejects.toThrow(/Expected checked-in skill directory missing/i);
  });
});

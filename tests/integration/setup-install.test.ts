import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runSetupInstall } from "../../src/setup/install.js";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "gstack-copilot-setup-int-"));
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

describe("setup install integration", () => {
  it("installs all checked-in skills into the target repo layout", async () => {
    const target = makeTempDir();

    const result = await runSetupInstall({
      targetRoot: target,
    });

    expect(result.skills).toEqual([
      "office-hours",
      "qa",
      "review",
      "ship",
    ]);
    const shipExists = readFileSync(
      join(target, ".github", "skills", "ship", "SKILL.md"),
      "utf8",
    );
    expect(shipExists).toContain("name: ship");
  });
});

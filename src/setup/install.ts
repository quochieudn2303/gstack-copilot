import { copy, pathExists } from "fs-extra";
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

export interface SetupInstallOptions {
  sourceRoot?: string;
  targetRoot?: string;
}

export interface SetupInstallResult {
  sourceRoot: string;
  targetRoot: string;
  skills: string[];
  targetSkillsDir: string;
}

export const REQUIRED_SKILLS = [
  "office-hours",
  "qa",
  "review",
  "ship",
] as const;

export async function runSetupInstall(
  options: SetupInstallOptions = {},
): Promise<SetupInstallResult> {
  const sourceRoot = resolve(options.sourceRoot ?? process.cwd());
  const targetRoot = resolve(options.targetRoot ?? process.cwd());
  const sourceSkillsDir = join(sourceRoot, ".github", "skills");
  const targetSkillsDir = join(targetRoot, ".github", "skills");

  const entries = await readdir(sourceSkillsDir, {
    withFileTypes: true,
  });
  const discoveredSkills = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const skill of REQUIRED_SKILLS) {
    if (!discoveredSkills.includes(skill)) {
      throw new Error(
        `Expected checked-in skill directory missing: ${join(sourceSkillsDir, skill)}`,
      );
    }
  }

  const skills = [...REQUIRED_SKILLS];

  for (const skill of skills) {
    const sourcePath = join(sourceSkillsDir, skill);
    const targetPath = join(targetSkillsDir, skill);

    if (sourceRoot === targetRoot) {
      if (!(await pathExists(targetPath))) {
        throw new Error(
          `Expected checked-in skill directory missing: ${targetPath}`,
        );
      }

      continue;
    }

    await copy(sourcePath, targetPath, {
      overwrite: true,
    });
  }

  return {
    sourceRoot,
    targetRoot,
    skills,
    targetSkillsDir,
  };
}

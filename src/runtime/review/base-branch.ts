import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface GitBranchProbe {
  getRemoteBranches(): Promise<string[]>;
  getDefaultBranch(): Promise<string | undefined>;
}

export function normalizeRemoteBranch(branch: string): string {
  return branch
    .trim()
    .replace(/^\*\s+/, "")
    .replace(/^remotes\//, "");
}

export function chooseBaseBranch(
  remoteBranches: string[],
  defaultBranch?: string | null,
): string | undefined {
  const normalizedBranches = new Set(
    remoteBranches.map((branch) => normalizeRemoteBranch(branch)),
  );

  if (normalizedBranches.has("origin/main")) {
    return "origin/main";
  }

  if (normalizedBranches.has("origin/master")) {
    return "origin/master";
  }

  if (defaultBranch) {
    const normalizedDefault = normalizeRemoteBranch(defaultBranch);
    return normalizedDefault || undefined;
  }

  return undefined;
}

export async function detectBaseBranch(
  probe: GitBranchProbe,
): Promise<string | undefined> {
  const [remoteBranches, defaultBranch] = await Promise.all([
    probe.getRemoteBranches(),
    probe.getDefaultBranch(),
  ]);

  return chooseBaseBranch(remoteBranches, defaultBranch);
}

export function createGitBranchProbe(
  cwd: string = process.cwd(),
): GitBranchProbe {
  return {
    async getRemoteBranches() {
      const { stdout } = await execFileAsync(
        "git",
        ["branch", "-r", "--format=%(refname:short)"],
        { cwd },
      );

      return stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    },
    async getDefaultBranch() {
      try {
        const { stdout } = await execFileAsync(
          "git",
          ["symbolic-ref", "refs/remotes/origin/HEAD", "--short"],
          { cwd },
        );

        return stdout.trim() || undefined;
      } catch {
        return undefined;
      }
    },
  };
}

export async function detectBaseBranchWithGit(
  cwd: string = process.cwd(),
): Promise<string | undefined> {
  return detectBaseBranch(createGitBranchProbe(cwd));
}

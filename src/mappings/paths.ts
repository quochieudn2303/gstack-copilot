export interface PathMapping {
  pattern: RegExp;
  replacement: string;
  description: string;
}

export const PATH_MAPPINGS: PathMapping[] = [
  {
    pattern: /~\/\.claude\/skills\/gstack\/([a-z-]+)\//g,
    replacement: "~/.copilot/skills/gstack-$1/",
    description: "Cross-skill references",
  },
  {
    pattern: /~\/\.claude\/skills\/gstack\//g,
    replacement: "~/.copilot/skills/gstack-copilot/",
    description: "gstack skill root",
  },
  {
    pattern: /~\/\.gstack\//g,
    replacement: "$env:USERPROFILE\\.gstack-copilot\\",
    description: "gstack config directory",
  },
  {
    pattern: /\$GSTACK_BIN/g,
    replacement: "$env:GSTACK_COPILOT_BIN",
    description: "gstack bin variable",
  },
  {
    pattern: /\$GSTACK_ROOT/g,
    replacement: "$env:GSTACK_COPILOT_ROOT",
    description: "gstack root variable",
  },
];

export function transformPath(content: string): string {
  return PATH_MAPPINGS.reduce(
    (result, mapping) => result.replace(mapping.pattern, mapping.replacement),
    content,
  );
}

export const transformPaths = transformPath;

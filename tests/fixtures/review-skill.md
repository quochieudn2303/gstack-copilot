---
name: review
preamble-tier: 4
version: 1.0.0
description: |
  Pre-landing PR review. Analyzes diff against the base branch,
  checks for code quality issues, and suggests improvements.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
  - Agent
---

## Preamble (run first)

```bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
GSTACK_ROOT=~/.gstack
```

## Process

1. Read ~/.claude/skills/gstack/review/SKILL.md for context
2. Run `git diff origin/main...HEAD` to see changes
3. Analyze each changed file for:
   - Code style issues
   - Potential bugs
   - Missing tests

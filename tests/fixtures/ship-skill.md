---
name: ship
preamble-tier: 4
version: 1.0.0
description: |
  Shipping skill that prepares a branch for review and opens a PR.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Agent
---

## Preamble (run first)

```bash
GSTACK_ROOT=~/.gstack
```

## Process

1. Read ~/.claude/skills/gstack/ship/SKILL.md for context
2. Verify the repository is ready to ship
3. Prepare a PR summary
4. Open a PR instead of merging automatically
5. Use prior review and QA signals when available

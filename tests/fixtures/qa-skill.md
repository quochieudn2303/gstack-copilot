---
name: qa
preamble-tier: 4
version: 1.0.0
description: |
  Browser QA skill that tests a product flow, reports findings, and can fix confirmed issues.
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
GSTACK_ROOT=~/.gstack
```

## Process

1. Read ~/.claude/skills/gstack/qa/SKILL.md for context
2. Walk a guided user flow through the target app
3. Capture screenshots, repro steps, and console or network findings when relevant
4. Report findings before making edits
5. Only apply fixes after explicit confirmation

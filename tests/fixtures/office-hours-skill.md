---
name: office-hours
preamble-tier: 3
version: 1.0.0
description: |
  Browser-grounded office hours skill that gives product feedback and writes a durable memo.
allowed-tools:
  - Bash
  - Read
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

1. Read ~/.claude/skills/gstack/office-hours/SKILL.md for context
2. Determine whether the session is startup mode or builder mode
3. Analyze the product page or flow in the browser
4. Return conversational feedback grounded in what was observed
5. Write a durable memo with critique, approaches considered, recommended direction, open questions, and next steps
6. Do not start implementation work

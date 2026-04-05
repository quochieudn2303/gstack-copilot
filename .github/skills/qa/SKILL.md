---
name: qa
description: Guided-flow browser QA with findings-first reporting, evidence capture, and optional confirmed fixes.
user-invocable: true
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, Task
---

## Guided Flow

1. Default to a guided flow through the target app, not a broad crawl.
2. Prefer explicit page or flow targets when the user provides them.
3. Support `single-page` or `crawl` scope only when the user explicitly asks for those modes.

## Coverage Modes

1. `quick` mode covers critical and high-severity issues only.
2. `standard` mode is the default path and includes medium-severity issues.
3. `exhaustive` mode extends coverage to low and cosmetic issues.

## Findings First

1. Gather findings before making any edits.
2. Report issues using `critical`, `high`, `medium`, and `low` severity tiers.
3. Include screenshots, repro steps, and console or network findings when they are relevant.

## Fix Mode

1. After presenting findings, ask whether fixes should be applied in the same session.
2. Only enter fix mode after explicit user confirmation.
3. If the user does not confirm, stop after the report and do not modify files.

## Reference

Read .github/skills/qa/SKILL.md for the checked-in project-local skill definition when you need the canonical QA behavior.

## Converted Source Guidance

## Initialization

```powershell
# gstack-copilot initialization
$env:GSTACK_COPILOT_ROOT = "$env:USERPROFILE\.gstack-copilot"
$env:GSTACK_COPILOT_BIN = "$env:GSTACK_COPILOT_ROOT\bin"
```

## Process

1. Read .github/skills/qa/SKILL.md for context
2. Walk a guided user flow through the target app
3. Capture screenshots, repro steps, and console or network findings when relevant
4. Report findings before making edits
5. Only apply fixes after explicit confirmation

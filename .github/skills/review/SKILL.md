---
name: review
description: Pre-landing review of the current branch against a base branch, with findings-first output and optional confirmed fixes.
user-invocable: true
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, Task
---

## Review Target

1. Review the current branch diff against a base branch by default.
2. Resolve the base branch in this exact order: `origin/main`, then `origin/master`, then the repository default branch.
3. Do not include uncommitted working-tree changes unless the user explicitly asks for that mode.

## Findings First

1. Report findings before making any edits.
2. Prioritize correctness, regressions, missing tests, and PR hygiene over style-only commentary.
3. Present findings with actionable file references and clear next steps.

## Fix Mode

1. After showing findings, ask whether the user wants fixes applied in the same session.
2. Only enter fix mode after explicit user confirmation.
3. If the user does not confirm, stop after the report and do not modify files.

## Reference

Read .github/skills/review/SKILL.md for the checked-in project-local skill definition when you need the canonical review behavior.

## Converted Source Guidance

## Initialization

```powershell
# gstack-copilot initialization
$env:GSTACK_COPILOT_ROOT = "$env:USERPROFILE\.gstack-copilot"
$env:GSTACK_COPILOT_BIN = "$env:GSTACK_COPILOT_ROOT\bin"
```

## Process

1. Read .github/skills/review/SKILL.md for context
2. Run `git diff origin/main...HEAD` to see changes
3. Analyze each changed file for:
   - Code style issues
   - Potential bugs
   - Missing tests

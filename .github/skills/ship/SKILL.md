---
name: ship
description: Strict-preflight shipping workflow that prepares and opens a PR without auto-merging.
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, Task
---

## Shipping Default

1. Prepare and open a PR by default.
2. Do not merge automatically.
3. Use prior sprint-loop signals from `/review` and `/qa` when they are available.

## Strict Preflight

1. Stop if the repo has a dirty tree.
2. Stop if the repository has no remote.
3. Stop if GitHub auth is unavailable.
4. Stop if the current branch is `main` or `master`.

## PR Artifacts

1. Prepare PR-facing summary content from the repository's planning and verification artifacts.
2. Keep the default path focused on preparing work for review, not merging it.

## Reference

Read .github/skills/ship/SKILL.md for the checked-in project-local skill definition when you need the canonical ship behavior.

## Converted Source Guidance

## Initialization

```powershell
# gstack-copilot initialization
$env:GSTACK_COPILOT_ROOT = "$env:USERPROFILE\.gstack-copilot"
$env:GSTACK_COPILOT_BIN = "$env:GSTACK_COPILOT_ROOT\bin"
```

## Process

1. Read .github/skills/ship/SKILL.md for context
2. Verify the repository is ready to ship
3. Prepare a PR summary
4. Open a PR instead of merging automatically
5. Use prior review and QA signals when available

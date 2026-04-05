---
status: complete
phase: 06-sprint-completion-ship
source:
  - 06-01-SUMMARY.md
  - 06-02-SUMMARY.md
  - 06-03-SUMMARY.md
started: 2026-04-05T13:46:00+07:00
updated: 2026-04-05T13:53:50+07:00
---

## Current Test

[testing complete]

## Tests

### 1. Copilot discovers `/ship`
expected: `gh copilot -p "What skills are available in this repository?"` lists `ship` alongside the previously shipped skills.
result: pass

### 2. `/ship` strict preflight blocks a dirty working tree
expected: Evaluating `/ship` preflight against the current dirty Phase 6 worktree returns a blocking `dirty-tree` result with remediation.
result: pass

### 3. CLI setup smoke test
expected: `npx tsx src/cli/index.ts setup --target <temp>` installs all checked-in skills into `<temp>\\.github\\skills`.
result: pass

### 4. PowerShell setup smoke test
expected: `powershell -ExecutionPolicy Bypass -File .\\setup.ps1 -Target <temp>` installs all checked-in skills into `<temp>\\.github\\skills`.
result: pass

### 5. README sanity check
expected: README documents the full `office-hours -> review -> qa -> ship` loop and both setup entrypoints.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

None.

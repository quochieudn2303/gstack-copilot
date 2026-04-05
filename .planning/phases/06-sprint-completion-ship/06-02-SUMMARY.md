---
phase: 06-sprint-completion-ship
plan: 02
subsystem: setup-surface
tags: [setup, install, cli, powershell]
requires:
  - phase: 06-sprint-completion-ship
    provides: "Checked-in skill artifacts from prior phases and `/ship` contract from 06-01"
provides:
  - Shared setup/install implementation
  - CLI setup command
  - PowerShell setup entrypoint
affects: [README, release-scaffolding, phase-06-closeout]
tech-stack:
  added: [setup runtime helper, setup CLI command]
  patterns:
    - One shared setup implementation behind multiple entrypoints
    - Setup verifies/copies checked-in skill artifacts instead of regenerating them
key-files:
  created:
    - src/setup/install.ts
    - src/cli/setup.ts
    - setup.ps1
    - tests/runtime/setup-install.test.ts
    - tests/cli/setup-command.test.ts
    - tests/integration/setup-install.test.ts
  modified:
    - src/cli/index.ts
  key_decisions:
    - "Use one shared setup implementation so `setup.ps1` and `npx gstack-copilot setup` cannot drift."
    - "Treat the shipped skill set as an explicit required list during setup verification."
patterns-established:
  - "Setup installs or verifies the checked-in `.github/skills/` directories instead of rebuilding skills from scratch."
  - "Repository checkouts should prefer the source CLI over a stale local `dist` build when running setup."
requirements-completed: [SETUP-01]
duration: 1 focused pass
completed: 2026-04-05
---

# Phase 06 Plan 02 Summary

**Shared setup implementation and dual setup entrypoints**

## Performance

- **Duration:** 1 focused pass
- **Started:** 2026-04-05T13:38:00+07:00
- **Completed:** 2026-04-05T13:53:50+07:00
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added a shared setup/install implementation that discovers and copies the checked-in skills.
- Added `npx gstack-copilot setup` and `setup.ps1`.
- Added setup tests covering runtime behavior, CLI registration, and install integration.

## Task Commits

Inline execution in the current working tree. No intermediate task commits were created during this session.

## Files Created/Modified

- `src/setup/install.ts` - Shared setup/install behavior.
- `src/cli/setup.ts` - CLI setup command.
- `src/cli/index.ts` - Registers the setup command.
- `setup.ps1` - Windows-first setup entrypoint.
- `tests/runtime/setup-install.test.ts` - Shared setup behavior coverage.
- `tests/cli/setup-command.test.ts` - CLI command registration coverage.
- `tests/integration/setup-install.test.ts` - Setup install integration coverage.

## Decisions Made

- Required skill directories are validated explicitly during setup to prevent silent partial installs.

## Deviations from Plan

### Auto-fixed Issues

**1. `setup.ps1` initially preferred a stale local `dist` build**
- **Found during:** Live setup smoke test
- **Issue:** The script called the existing `dist/cli/index.js`, which did not yet include the new `setup` command.
- **Fix:** Changed `setup.ps1` to prefer the source CLI in a repository checkout, and only fall back to `dist` when source is unavailable.
- **Verification:** `powershell -ExecutionPolicy Bypass -File .\setup.ps1 -Target <temp>` now installs all skill directories successfully.

---

**Total deviations:** 1 auto-fixed
**Impact on plan:** Improved the real setup path without changing the shared install behavior contract.

## Issues Encountered

- The local shell execution policy required the smoke test to use `-ExecutionPolicy Bypass`, which is now documented in the README.

## User Setup Required

None.

## Next Phase Readiness

- The docs pass can now document both real setup entrypoints with tested behavior.

---
*Phase: 06-sprint-completion-ship*
*Completed: 2026-04-05*

# gstack-copilot

Copilot CLI port of gstack.

This repository turns a gstack-style sprint loop into checked-in GitHub Copilot CLI skills:
- `/office-hours`
- `/review`
- `/qa`
- `/ship`

The project is Windows-first, PowerShell-friendly, and uses checked-in `.github/skills/` artifacts backed by TypeScript builders and tests.

## Sprint Loop

The intended flow is:

1. `/office-hours`
   Use browser-grounded product feedback to sharpen the direction and produce a durable memo.
2. `/review`
   Review code or a branch diff with findings-first output before applying changes.
3. `/qa`
   Run guided-flow browser QA, collect screenshots and repro steps, then optionally fix with explicit confirmation.
4. `/ship`
   Run strict preflight, prepare PR-facing artifacts, and open a PR by default.

That is the full `office-hours -> review -> qa -> ship` loop.

## Setup

You can use either supported setup entrypoint:

### PowerShell

```powershell
.\setup.ps1
```

Install into another target directory:

```powershell
.\setup.ps1 -Target C:\path\to\target-repo
```

If your PowerShell execution policy blocks scripts, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1 -Target C:\path\to\target-repo
```

### CLI

```powershell
npx gstack-copilot setup
```

Install into another target directory:

```powershell
npx gstack-copilot setup --target C:\path\to\target-repo
```

Both entrypoints use the same shared install behavior.

## What Setup Installs

Setup installs or verifies the checked-in project-local Copilot skills under `.github/skills/`:
- `review`
- `qa`
- `office-hours`
- `ship`

## Skill Usage

### `/office-hours`

Use `/office-hours` for browser-grounded product feedback.
It returns conversational feedback plus a durable memo artifact, and does not start implementation work.

### `/review`

Use `/review [base-branch]` for findings-first code review.
It defaults to branch-diff mode and requires explicit confirmation before fixes.

### `/qa`

Use `/qa` for guided-flow browser testing.
It defaults to findings-first output, supports `quick`, `standard`, and `exhaustive` coverage modes, and requires explicit confirmation before same-session fixes.

### `/ship`

Use `/ship` to run strict preflight, prepare PR-facing artifacts, and open a PR by default.
It does not merge automatically.

Strict preflight stops `/ship` when:
- the working tree is dirty
- the repo has no remote
- GitHub auth is unavailable
- the current branch is `main` or `master`

## Repository Layout

Key directories:
- `.github/skills/` — checked-in Copilot skills
- `src/skills/` — builder sources for checked-in artifacts
- `src/runtime/` — testable runtime contracts for review, browser, QA, office-hours, and shipping behavior
- `tests/` — runtime, artifact, integration, and fixture coverage

## Development

Run the test suite:

```powershell
npm test
```

Run a typecheck:

```powershell
npx tsc --noEmit
```

Run the CLI locally:

```powershell
npx tsx src/cli/index.ts --help
```

## Shipping Notes

This repo now has a configured `origin`, but `/ship` is still designed to treat missing remote or missing GitHub auth as blocking preflight states in any target repository.

## Status

Phase 6 is the final v1 phase and focuses on:
- `/ship`
- setup/install surface
- final docs and release scaffolding

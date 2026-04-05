# Phase 6: Sprint Completion - /ship - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 06-sprint-completion-ship
**Areas discussed:** `/ship` default operating contract, git/remote preflight behavior, setup/install surface

---

## `/ship` Default Operating Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Prepare-and-open PR by default | `/ship` gets work ready and opens the PR, but does not merge. | ✓ |
| Prepare, open, and auto-merge when checks pass | Faster, but riskier for a default contract. | |
| Local ship prep only | Updates artifacts locally but leaves PR creation to a separate step. | |

**User's choice:** Prepare-and-open PR by default.
**Notes:** `/ship` should stop short of merging unless the user explicitly asks for that later.

---

## Git and Remote Preflight Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Strict preflight | Dirty tree, missing remote, missing auth, or wrong branch all stop `/ship` with explicit remediation. | ✓ |
| Assisted preflight | Fix common local issues automatically, but still stop on remote/auth blockers. | |
| Lenient preflight | Warn on problems but keep going where possible. | |

**User's choice:** Strict preflight.
**Notes:** The repo already hit a real no-remote case, so this behavior is not theoretical.

---

## Setup and Installation Surface

| Option | Description | Selected |
|--------|-------------|----------|
| Both `setup.ps1` and `npx gstack-copilot setup` | Support script and CLI entrypoints while keeping behavior aligned. | ✓ |
| `setup.ps1` only | Windows-first script path only. | |
| `npx gstack-copilot setup` only | CLI entrypoint only. | |

**User's choice:** Both `setup.ps1` and `npx gstack-copilot setup`.
**Notes:** The two entrypoints should not diverge into separate setup systems.

---

## the agent's Discretion

- Exact split between setup script work and CLI setup work
- Exact PR-facing artifact set for `/ship`
- Exact README/doc file layout

## Deferred Ideas

None.

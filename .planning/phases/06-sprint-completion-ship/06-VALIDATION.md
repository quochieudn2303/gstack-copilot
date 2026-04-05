---
phase: 06
slug: sprint-completion-ship
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-05
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | package.json (`vitest run`) |
| **Quick run command** | `npx vitest run tests/runtime/ship-*.test.ts tests/skills/ship-artifact.test.ts tests/integration/ship-*.test.ts tests/cli/setup*.test.ts tests/integration/setup*.test.ts tests/integration/docs*.test.ts` |
| **Full suite command** | `npm test && npx tsc --noEmit` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run the smallest relevant `vitest` target for the files touched
- **After every plan wave:** Run `npm test && npx tsc --noEmit`
- **Before final completion:** Full suite plus typecheck must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | SKILL-04 | unit | `npx vitest run tests/runtime/ship-preflight.test.ts tests/runtime/ship-pr-body.test.ts` | ✅ | ✅ green |
| 06-01-02 | 01 | 1 | SKILL-04 | artifact | `npx vitest run tests/skills/ship-artifact.test.ts tests/integration/ship-convert.test.ts` | ✅ | ✅ green |
| 06-01-03 | 01 | 1 | SKILL-04 | integration | `npx vitest run tests/integration/ship-runtime.test.ts` | ✅ | ✅ green |
| 06-02-01 | 02 | 1 | SETUP-01 | unit | `npx vitest run tests/runtime/setup-install.test.ts` | ✅ | ✅ green |
| 06-02-02 | 02 | 1 | SETUP-01 | cli | `npx vitest run tests/cli/setup-command.test.ts tests/integration/setup-install.test.ts` | ✅ | ✅ green |
| 06-03-01 | 03 | 2 | SETUP-02 | docs | `npx vitest run tests/integration/docs-sprint-loop.test.ts tests/integration/docs-setup.test.ts` | ✅ | ✅ green |
| 06-03-02 | 03 | 2 | SKILL-04, SETUP-01, SETUP-02 | manual-UAT prep | `npm test && npx tsc --noEmit` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/runtime/ship-preflight.test.ts` — strict preflight coverage
- [x] `tests/runtime/ship-pr-body.test.ts` — PR body generation coverage
- [x] `tests/skills/ship-artifact.test.ts` — checked-in `/ship` artifact coverage
- [x] `tests/integration/ship-runtime.test.ts` — `/ship` runtime integration coverage
- [x] `tests/runtime/setup-install.test.ts` — shared setup logic coverage
- [x] `tests/cli/setup-command.test.ts` — CLI setup command coverage
- [x] `tests/integration/setup-install.test.ts` — setup surface integration coverage
- [x] `tests/integration/docs-sprint-loop.test.ts` — sprint-loop docs coverage
- [x] `tests/integration/docs-setup.test.ts` — setup docs coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Local `/ship` preflight pass | SKILL-04 | Real git state and branch/remote checks still need one live run | Completed through live `/ship` discovery plus runtime preflight against the current dirty Phase 6 worktree |
| Setup smoke test | SETUP-01 | The final install path should be checked end-to-end | Completed through both `npx tsx src/cli/index.ts setup` and `powershell -ExecutionPolicy Bypass -File .\setup.ps1` into temp targets |
| Sprint-loop docs sanity check | SETUP-02 | README quality is partly experiential | Completed through README inspection plus docs integration tests |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers the new shipping/setup/docs references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** complete

---
phase: 03
slug: first-skill-review
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-02
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/runtime/review-*.test.ts tests/skills/review-*.test.ts tests/integration/review-*.test.ts` |
| **Full suite command** | `npm test && npx tsc --noEmit` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/runtime/review-*.test.ts tests/skills/review-*.test.ts tests/integration/review-*.test.ts`
- **After every plan wave:** Run `npm test && npx tsc --noEmit`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 8 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SKILL-01 | unit | `npx vitest run tests/runtime/review-base-branch.test.ts tests/skills/review-frontmatter.test.ts` | ✅ | ✅ green |
| 03-01-02 | 01 | 1 | SKILL-01 | integration | `npx vitest run tests/integration/review-convert.test.ts` | ✅ | ✅ green |
| 03-02-01 | 02 | 2 | SKILL-01 | artifact | `npx vitest run tests/skills/review-artifact.test.ts` | ✅ | ✅ green |
| 03-02-02 | 02 | 2 | SKILL-01 | integration | `npx vitest run tests/integration/review-convert.test.ts` | ✅ | ✅ green |
| 03-03-01 | 03 | 3 | SKILL-01 | integration | `npx vitest run tests/integration/review-runtime.test.ts tests/cli.test.ts` | ✅ | ✅ green |
| 03-03-02 | 03 | 3 | SKILL-01 | manual-UAT prep | `npm test && npx tsc --noEmit` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Invoke `/review` in a real Copilot CLI session | SKILL-01 | Live slash-command behavior must be observed directly | Completed during Phase 3 using `gh copilot` with the repository-local skill artifact |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 8s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-02

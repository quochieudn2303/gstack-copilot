---
phase: 05
slug: browser-skills-qa-office-hours
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-05
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | package.json (`vitest run`) |
| **Quick run command** | `npx vitest run tests/runtime/qa-*.test.ts tests/runtime/office-hours-*.test.ts tests/skills/qa-artifact.test.ts tests/skills/office-hours-artifact.test.ts tests/integration/qa-*.test.ts tests/integration/office-hours-*.test.ts tests/integration/browser-skills-*.test.ts` |
| **Full suite command** | `npm test && npx tsc --noEmit` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run the smallest relevant `vitest` target for the files touched
- **After every plan wave:** Run `npm test && npx tsc --noEmit`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | SKILL-02 | unit | `npx vitest run tests/runtime/qa-flow.test.ts tests/runtime/qa-report.test.ts` | ✅ | ✅ green |
| 05-01-02 | 01 | 1 | SKILL-02 | artifact | `npx vitest run tests/skills/qa-artifact.test.ts tests/integration/qa-convert.test.ts` | ✅ | ✅ green |
| 05-01-03 | 01 | 1 | SKILL-02 | integration | `npx vitest run tests/integration/qa-runtime.test.ts` | ✅ | ✅ green |
| 05-02-01 | 02 | 1 | SKILL-03 | unit | `npx vitest run tests/runtime/office-hours-mode.test.ts tests/runtime/office-hours-memo.test.ts` | ✅ | ✅ green |
| 05-02-02 | 02 | 1 | SKILL-03 | artifact | `npx vitest run tests/skills/office-hours-artifact.test.ts tests/integration/office-hours-convert.test.ts` | ✅ | ✅ green |
| 05-02-03 | 02 | 1 | SKILL-03 | integration | `npx vitest run tests/integration/office-hours-runtime.test.ts` | ✅ | ✅ green |
| 05-03-01 | 03 | 2 | SKILL-02, SKILL-03 | integration | `npx vitest run tests/integration/qa-browser-skill.test.ts tests/integration/office-hours-browser-skill.test.ts tests/integration/browser-skills-fallbacks.test.ts` | ✅ | ✅ green |
| 05-03-02 | 03 | 2 | SKILL-02, SKILL-03 | manual-UAT prep | `npm test && npx tsc --noEmit` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/runtime/qa-flow.test.ts` — `/qa` guided-flow and confirm-before-fix coverage
- [x] `tests/runtime/qa-report.test.ts` — `/qa` evidence and severity schema coverage
- [x] `tests/skills/qa-artifact.test.ts` — checked-in `/qa` artifact coverage
- [x] `tests/integration/qa-runtime.test.ts` — `/qa` runtime integration coverage
- [x] `tests/runtime/office-hours-mode.test.ts` — `/office-hours` startup/builder mode coverage
- [x] `tests/runtime/office-hours-memo.test.ts` — `/office-hours` memo schema coverage
- [x] `tests/skills/office-hours-artifact.test.ts` — checked-in `/office-hours` artifact coverage
- [x] `tests/integration/office-hours-runtime.test.ts` — `/office-hours` runtime integration coverage
- [x] `tests/integration/qa-browser-skill.test.ts` — guided-flow `/qa` browser-skill verification
- [x] `tests/integration/office-hours-browser-skill.test.ts` — product-page `/office-hours` verification
- [x] `tests/integration/browser-skills-fallbacks.test.ts` — graceful degradation coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live `/qa` run through a guided browser flow | SKILL-02 | Real browser execution and evidence gathering still need one end-to-end run | Completed against `http://127.0.0.1:4173/browser-flow/page.html` with successful submit flow, screenshot evidence, console logs, and network requests |
| Live `/office-hours` run on a product-page-style target | SKILL-03 | Memo quality and critique grounding still need one real run | Completed against `http://127.0.0.1:4173/office-hours-page.html` with live product-page inspection and critique-grounding evidence |
| Capability degradation sanity check | SKILL-02, SKILL-03 | Graceful fallback messaging is partly a user experience contract | Completed through `tests/integration/browser-skills-fallbacks.test.ts` plus skill-level fallback fields in report and memo contracts |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers the new skill/runtime/test references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** complete

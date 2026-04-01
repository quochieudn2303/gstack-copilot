---
phase: 03
slug: first-skill-review
status: draft
nyquist_compliant: false
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
| 03-01-01 | 01 | 1 | SKILL-01 | unit | `npx vitest run tests/runtime/review-base-branch.test.ts tests/skills/review-frontmatter.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | SKILL-01 | integration | `npx vitest run tests/integration/review-contract.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | SKILL-01 | artifact | `npx vitest run tests/skills/review-artifact.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | SKILL-01 | integration | `npx vitest run tests/integration/review-convert.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | SKILL-01 | integration | `npx vitest run tests/integration/review-runtime.test.ts tests/cli.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 3 | SKILL-01 | manual-UAT prep | `npm test && npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/runtime/review-base-branch.test.ts` — base-branch autodetection coverage
- [ ] `tests/skills/review-frontmatter.test.ts` — skill contract/frontmatter coverage
- [ ] `tests/skills/review-artifact.test.ts` — checked-in `SKILL.md` artifact validation
- [ ] `tests/integration/review-convert.test.ts` — end-to-end `/review` artifact generation coverage
- [ ] `tests/integration/review-runtime.test.ts` — report-first and confirm-to-fix runtime behavior coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Invoke `/review` in a real Copilot CLI session | SKILL-01 | Slash-command invocation cannot be fully simulated in Vitest | Start Copilot CLI in this repo, invoke `/review`, confirm it selects the branch diff target and produces findings |
| Confirm fix step requires explicit approval | SKILL-01 | Approval flow depends on live Copilot skill interaction | After findings are shown, verify the skill asks for explicit confirmation before applying any fixes |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 8s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

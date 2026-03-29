---
phase: 01
slug: core-conversion-pipeline
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-30
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/parse.test.ts tests/frontmatter.test.ts tests/content.test.ts tests/output.test.ts tests/integration.test.ts tests/cli.test.ts` |
| **Full suite command** | `npm test && npx tsc --noEmit` |
| **Estimated runtime** | ~6 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/parse.test.ts tests/frontmatter.test.ts tests/content.test.ts tests/output.test.ts tests/integration.test.ts tests/cli.test.ts`
- **After every plan wave:** Run `npm test && npx tsc --noEmit`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 6 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | CONV-03 | infrastructure | `npm test && npx tsc --noEmit` | ✅ | ✅ green |
| 01-01-02 | 01 | 1 | CONV-01, CONV-02 | unit | `npx vitest run tests/schemas.test.ts` | ✅ | ✅ green |
| 01-01-03 | 01 | 1 | CONV-01 | fixture/integration | `npx vitest run tests/parse.test.ts tests/integration.test.ts` | ✅ | ✅ green |
| 01-02-01 | 02 | 2 | CONV-01 | unit | `npx vitest run tests/parse.test.ts` | ✅ | ✅ green |
| 01-02-02 | 02 | 2 | CONV-02 | unit | `npx vitest run tests/frontmatter.test.ts` | ✅ | ✅ green |
| 01-02-03 | 02 | 2 | CONV-04 | unit | `npx vitest run tests/content.test.ts` | ✅ | ✅ green |
| 01-03-01 | 03 | 3 | CONV-03 | unit | `npx vitest run tests/output.test.ts` | ✅ | ✅ green |
| 01-03-02 | 03 | 3 | CONV-03, CONV-04 | integration | `npx vitest run tests/integration.test.ts` | ✅ | ✅ green |
| 01-03-03 | 03 | 3 | CONV-03, CONV-04 | cli | `npx vitest run tests/cli.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Audit 2026-03-30

| Metric | Count |
|--------|-------|
| Gaps found | 1 |
| Resolved | 1 |
| Escalated | 0 |

**Resolved gap:** CLI behavior was previously validated only through manual shell commands. `tests/cli.test.ts` now verifies dry-run output, file writing, output-directory behavior, validation failures, and unsupported-construct error locations.

---

## Validation Sign-Off

- [x] All tasks have automated verify or existing infrastructure
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 6s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-30

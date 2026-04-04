---
phase: 04
slug: browser-abstraction
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-02
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/runtime/browser-*.test.ts tests/integration/browser-*.test.ts` |
| **Full suite command** | `npm test && npx tsc --noEmit` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/runtime/browser-*.test.ts tests/integration/browser-*.test.ts`
- **After every plan wave:** Run `npm test && npx tsc --noEmit`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 8 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | BROWSE-01 | unit | `npx vitest run tests/runtime/browser-adapter.test.ts tests/runtime/browser-capabilities.test.ts` | ✅ | ✅ green |
| 04-01-02 | 01 | 1 | BROWSE-03 | unit | `npx vitest run tests/runtime/browser-fallbacks.test.ts` | ✅ | ✅ green |
| 04-02-01 | 02 | 2 | BROWSE-02 | unit | `npx vitest run tests/runtime/browser-chrome-devtools.test.ts` | ✅ | ✅ green |
| 04-02-02 | 02 | 2 | BROWSE-02 | integration | `npx vitest run tests/integration/browser-command-mapping.test.ts` | ✅ | ✅ green |
| 04-03-01 | 03 | 3 | BROWSE-01, BROWSE-02, BROWSE-03 | integration | `npx vitest run tests/integration/browser-flow.test.ts tests/integration/browser-fallbacks.test.ts` | ✅ | ✅ green |
| 04-03-02 | 03 | 3 | BROWSE-02 | manual-UAT prep | `npm test && npx tsc --noEmit` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/runtime/browser-adapter.test.ts` — core adapter contract coverage
- [x] `tests/runtime/browser-capabilities.test.ts` — capability extension coverage
- [x] `tests/runtime/browser-fallbacks.test.ts` — unsupported-action result/fallback coverage
- [x] `tests/runtime/browser-chrome-devtools.test.ts` — backend mapping coverage
- [x] `tests/integration/browser-command-mapping.test.ts` — end-to-end tool mapping coverage
- [x] `tests/integration/browser-flow.test.ts` — deterministic multi-step browser scenario coverage
- [x] `tests/integration/browser-fallbacks.test.ts` — fallback behavior integration coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live browser flow through the Chrome DevTools MCP backend | BROWSE-02 | Actual browser automation and diagnostics still need one real run | Completed against `http://127.0.0.1:4173/page.html` with successful submit flow, console logs, and network evidence |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 8s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** complete

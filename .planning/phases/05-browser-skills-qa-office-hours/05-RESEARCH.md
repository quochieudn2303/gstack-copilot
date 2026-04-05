# Phase 5: Browser Skills - /qa, /office-hours - Research

**Researched:** 2026-04-05  
**Domain:** Porting the first browser-heavy gstack skills onto the Phase 4 Chrome DevTools browser runtime  
**Confidence:** High

## Summary

Phase 5 should be planned as two skill ports plus one shared verification pass.

`/qa` is the more operational browser skill. The source gstack skill is large and includes diff-aware routing, tiered severity handling, evidence-heavy reporting, same-session fixes, regression tests, and health-score summaries. The Phase 5 context narrows the default path, but it does not conflict with those core ideas. The safest Phase 5 plan is to preserve the findings-first and evidence-heavy posture while making the new default guided-flow browser contract explicit.

`/office-hours` is different. The source skill is not just "browse a page and comment on it." It has two modes, startup and builder, and its terminal artifact is a design document. For Phase 5, the roadmap narrows the observable success criterion to product-page analysis and YC-style design feedback. The planning implication is that the port should preserve the source skill's two-mode posture and durable memo output, but ground the first Copilot version in actual browser observations rather than the full original ceremony.

## Primary Sources

- `C:/Users/Thinkpad/.codex/skills/gstack-qa/SKILL.md`
- `C:/Users/Thinkpad/.codex/skills/gstack-office-hours/SKILL.md`
- `.planning/phases/05-browser-skills-qa-office-hours/05-CONTEXT.md`
- `.planning/phases/04-browser-abstraction/04-VERIFICATION.md`
- `.planning/research/FEATURES.md`
- `.planning/research/PITFALLS.md`

## Key Findings

### 1. `/qa` should keep the source skill's evidence discipline, even though the default flow is narrower

The source `/qa` skill is not a simple smoke test. It is built around:
- explicit evidence capture
- reproducible issue documentation
- severity-based triage
- same-session fix loops
- before/after verification
- health-score style summary output

The Phase 5 context already locked:
- guided flow by default
- findings first
- explicit confirmation before fixes
- screenshots, repro steps, and console/network evidence
- `critical/high/medium/low`

Implication:
- The port should preserve report structure and fix gating from the source skill, but narrow the default traversal logic from broad/diff-aware exploration to a deterministic guided-flow contract.
- A dedicated `/qa` runtime layer is worth planning because these rules are too important to leave as prose in the checked-in skill artifact only.

### 2. `/office-hours` is a memo-producing reasoning skill first, a browser skill second

The source `/office-hours` skill:
- explicitly forbids implementation
- distinguishes startup mode from builder mode
- ends by saving a design doc
- includes durable sections like approaches considered, recommended approach, open questions, and assignment/next steps

The roadmap's Phase 5 success criterion narrows the observable browser outcome to:
- analyze a product page
- generate YC-style design feedback

Implication:
- The Copilot port should preserve the durable memo artifact and the startup/builder split as the core behavioral contract.
- The browser layer should be used to gather concrete observations that ground the feedback, not to replace the reasoning structure.
- A memo schema/helper is worth planning so tests can verify the output contract programmatically instead of relying on unchecked markdown prose.

### 3. Phase 4's fixture and backend are enough to support deterministic verification of both skills

Phase 4 already shipped:
- `src/runtime/browser/adapter.ts`
- `src/runtime/browser/chrome-devtools-backend.ts`
- `tests/fixtures/browser-flow/page.html`
- deterministic integration tests
- live browser UAT

Implication:
- `/qa` can reuse the existing fixture directly for guided-flow evidence verification.
- `/office-hours` likely needs one additional product-page-style fixture, because the current Phase 4 fixture proves interaction flow but not critique/memo output.
- A shared Phase 5 verification plan should test capability degradation explicitly so both skills satisfy the roadmap's graceful-degradation criterion.

### 4. The checked-in skill builder pattern from Phase 3 is the right packaging model for both new skills

`/review` already established:
- repo-local checked-in artifact under `.github/skills/review/`
- builder file under `src/skills/review/`
- artifact tests plus builder tests

Implication:
- Phase 5 should follow the same pattern for both `/qa` and `/office-hours`.
- This keeps the browser-heavy skills testable without needing live Copilot on every unit/integration check.
- The plan should include source fixtures for both skills in `tests/fixtures/` so builder tests remain hermetic and do not depend on user-home paths.

### 5. The biggest Phase 5 planning risk is not browser automation, it is source-skill size and contract drift

The source `/qa` and especially `/office-hours` skills are large. The existing project notes already flagged the `office-hours` size risk.

Implication:
- Phase 5 should plan verification that checks the resulting artifacts are parseable and operationally coherent, not just that they compile.
- The verification pass should explicitly test the checked-in artifacts, the runtime helpers, and one live UAT path for each skill.
- If the first port needs to trim some original-source ceremony, the plan must preserve the high-signal contract rather than trying to port every paragraph verbatim.

## Recommended Plan Shape

### Plan 05-01
Port `/qa` as a checked-in browser skill with:
- guided-flow runtime contract
- report/evidence schema
- explicit confirm-before-fix contract
- builder, artifact, and tests

### Plan 05-02
Port `/office-hours` as a checked-in browser-grounded reasoning skill with:
- startup/builder mode helper
- memo schema/template
- builder, artifact, and tests

### Plan 05-03
Finish Phase 5 with:
- deterministic fixtures and integration tests
- graceful-degradation coverage
- live UAT checklist for both skills
- final verification artifact

## Validation Architecture

### Automated checks
- Runtime tests for `/qa` flow/report contracts
- Runtime tests for `/office-hours` mode/memo contracts
- Artifact tests for both checked-in skills
- Integration tests proving both skills consume the browser abstraction and degrade gracefully
- Full project suite and typecheck

### Manual checks
- One live `/qa` run over a deterministic or local app flow
- One live `/office-hours` run against a product-page-style target
- One explicit capability-gap/fallback sanity check during UAT

## Risks

### Risk 1: `/qa` drifts into a full crawler instead of a deterministic guided-flow tool

Mitigation:
- Lock guided-flow default in runtime helpers and checked-in artifact tests.

### Risk 2: `/office-hours` becomes generic startup advice disconnected from browser evidence

Mitigation:
- Require critique-first memo sections and product-page observation hooks in tests and artifact text.

### Risk 3: Graceful degradation is promised in docs but not proven

Mitigation:
- Add explicit integration tests for capability-missing scenarios in the verification plan.

### Risk 4: Artifact size or complexity makes the first port hard to validate

Mitigation:
- Use builder fixtures, parseability tests, and live UAT rather than relying on raw generated markdown only.

## Sources

- `C:/Users/Thinkpad/.codex/skills/gstack-qa/SKILL.md`
- `C:/Users/Thinkpad/.codex/skills/gstack-office-hours/SKILL.md`
- `.planning/phases/05-browser-skills-qa-office-hours/05-CONTEXT.md`
- `.planning/phases/04-browser-abstraction/04-VERIFICATION.md`
- `.planning/research/FEATURES.md`
- `.planning/research/PITFALLS.md`

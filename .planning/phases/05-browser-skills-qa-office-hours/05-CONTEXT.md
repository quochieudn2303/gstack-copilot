# Phase 5: Browser Skills - /qa, /office-hours - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 ports the first browser-heavy skills on top of the Phase 4 browser abstraction:
- `/qa` for browser-driven bug finding and optional same-session fixing
- `/office-hours` for browser-grounded product feedback and structured strategy output

This phase is about defining the behavior, evidence model, and artifact shape of those two skills now that the browser backend exists.

This phase does not expand the browser abstraction itself, does not add Playwright support, and does not cover `/ship` or setup/docs work from Phase 6.

</domain>

<decisions>
## Implementation Decisions

### `/qa` Operating Contract
- **D-01:** `/qa` should default to a guided flow, not a broad crawl and not a single-page-only check.
- **D-02:** `/qa` must be findings-first before any edits are attempted.
- **D-03:** `/qa` may continue into a fix step in the same session, but only after explicit user confirmation.

### `/qa` Evidence and Triage
- **D-04:** `/qa` output should include screenshots, repro steps, and console/network findings when they are relevant to the issue.
- **D-05:** `/qa` should classify findings using `critical/high/medium/low` severity tiers.
- **D-06:** The default Phase 5 `/qa` path should optimize for deterministic guided-flow evidence rather than exploratory crawl coverage.

### `/office-hours` Output Contract
- **D-07:** `/office-hours` should return both conversational product feedback and a structured memo artifact.
- **D-08:** The structured memo should be grounded first in product/design critique of what the skill actually observed.
- **D-09:** The memo should end with a concise recommended direction so the output is actionable rather than purely diagnostic.

### the agent's Discretion
- Exact memo filename and repository location for `/office-hours`, as long as the artifact is durable and easy to reference later.
- Exact invocation syntax or flags for `/qa` and `/office-hours`, as long as the locked defaults above remain the default path.
- Whether `/qa` or `/office-hours` lands first inside the phase plan, provided both are completed within Phase 5 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Definition
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, and dependency position.
- `.planning/REQUIREMENTS.md` — `SKILL-02` and `SKILL-03`.
- `.planning/PROJECT.md` — validated prior phases and current project state after Phase 4.
- `.planning/STATE.md` — current position and active next-step routing.

### Browser Foundation
- `.planning/phases/04-browser-abstraction/04-CONTEXT.md` — locked browser abstraction decisions carried into Phase 5.
- `.planning/phases/04-browser-abstraction/04-VERIFICATION.md` — what Phase 4 proved and what later skills can rely on.
- `.planning/phases/04-browser-abstraction/04-UAT.md` — live-browser evidence pattern Phase 5 skills should inherit.
- `src/runtime/browser/adapter.ts` — core browser contract every Phase 5 skill must consume.
- `src/runtime/browser/capabilities.ts` — capability model for deciding what browser features a skill can rely on.
- `src/runtime/browser/chrome-devtools-backend.ts` — concrete backend behavior currently available.
- `src/runtime/browser/fallbacks.ts` — structured fallback and essential-failure behavior for unsupported browser actions.
- `tests/fixtures/browser-flow/page.html` — deterministic browser fixture Phase 5 can reuse.

### Existing Skill Pattern
- `.github/skills/review/SKILL.md` — checked-in artifact pattern for a shipped project-local skill.
- `src/skills/review/build-review-skill.ts` — builder pattern for maintaining checked-in skill artifacts from source fixtures.

### Product and Domain Research
- `.planning/research/FEATURES.md` — original MVP recommendation and role of `/qa` and `/office-hours` in the sprint loop.
- `.planning/research/PITFALLS.md` — browser automation impedance mismatch and large-skill risk notes that still apply to Phase 5.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/runtime/browser/adapter.ts` — stable browser contract for skill-facing orchestration.
- `src/runtime/browser/chrome-devtools-backend.ts` — working backend that already maps core and capability-gated browser methods.
- `tests/fixtures/browser-flow/page.html` — deterministic fixture available for Phase 5 verification and smoke testing.
- `src/skills/review/build-review-skill.ts` — proven builder pattern for creating checked-in skill artifacts and keeping them aligned with tests.
- `.github/skills/review/SKILL.md` — current example of a repository-local Copilot skill that has already passed live invocation.

### Established Patterns
- Checked-in skills are generated and validated through a builder-plus-artifact test relationship.
- Findings-first behavior with explicit confirmation before edits is already validated in `/review` and should inform `/qa`.
- Browser work should consume `src/runtime/browser/` rather than inventing raw tool calls in each skill.
- Phase verification now expects both deterministic automated evidence and one real browser/UAT path when browser behavior is central.

### Integration Points
- Phase 5 skills should package into `.github/skills/qa/` and `.github/skills/office-hours/` or an equivalent project-local skill layout.
- `/qa` should sit directly on top of the browser runtime and likely share some report-shaping patterns with `/review`.
- `/office-hours` should use the browser backend for evidence gathering, then transform what it observed into a conversational response plus memo artifact.
- The deterministic browser fixture from Phase 4 can serve as the first stable verification harness before real-site or product-page UAT is added.

</code_context>

<specifics>
## Specific Ideas

- `/qa` should feel like browser-grounded testing, not a generic crawler or linter. The guided flow default is the core product decision.
- `/office-hours` should stay grounded in what it actually saw in the browser session rather than drifting into generic startup advice.
- The strongest Phase 5 artifact shape is likely one skill artifact plus one builder/test path per skill, following the `/review` pattern.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 05-browser-skills-qa-office-hours*
*Context gathered: 2026-04-05*

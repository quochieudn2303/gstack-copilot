# Phase 4: Browser Abstraction - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 introduces the reusable browser layer that later browser-dependent skills will call, starting with a `chrome-devtools` backend because that is the native browser capability already available in Copilot CLI. This phase is about defining the adapter boundary, implementing the first backend, and codifying how unsupported browser actions should surface fallback guidance.

This phase does not port `/qa` or `/office-hours` themselves. It only creates the abstraction and backend they will depend on.

</domain>

<decisions>
## Implementation Decisions

### Adapter Shape
- **D-01:** Use a core browser interface plus capability extensions, not a minimal interface and not a fully separate second abstraction layer.
- **D-02:** The core interface should be small and stable so every backend can implement it.
- **D-03:** Capability-gated methods should allow later Playwright support without forcing a rewrite of callers.

### Command Surface
- **D-04:** Required core methods for Phase 4 are `navigate`, `click`, `fill`, `screenshot`, and `snapshot`.
- **D-05:** Capability-gated methods for the broad QA/discovery surface should include `waitFor`, `evaluate`, `hover`, `console`, and `network`.
- **D-06:** Leave file upload, auth/session import, and responsive/device emulation out of scope for Phase 4.

### Unsupported Behavior
- **D-07:** Prefer structured fallback guidance first when a browser action is unsupported by the `chrome-devtools` backend.
- **D-08:** Fail fast only when the unsupported action is essential to the requested browser flow and no safe fallback exists.
- **D-09:** Do not silently continue with partial browser results that hide unsupported behavior.

### the agent's Discretion
- Exact TypeScript interface names and file/module boundaries for the adapter and capabilities.
- Whether unsupported-action results are represented as typed result objects, typed exceptions, or capability-check returns, as long as the structured fallback policy is preserved.
- The exact test scenario used to prove the backend works, provided it stays small and deterministic.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Definition
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, and dependency position.
- `.planning/REQUIREMENTS.md` — `BROWSE-01`, `BROWSE-02`, and `BROWSE-03`.
- `.planning/PROJECT.md` — validated prior phases and project-level browser direction.

### Prior Infrastructure
- `.planning/phases/02-command-translation-layer/02-VERIFICATION.md` — confirms the converter and Bash-to-PowerShell layer are ready for browser-aware skills.
- `.planning/phases/03-first-skill-review/03-VERIFICATION.md` — confirms the non-browser skill path is complete and browser work is the next dependency.
- `.planning/research/PITFALLS.md` — especially the browser automation API impedance mismatch analysis.

### Existing Skill and Runtime Shape
- `.github/skills/review/SKILL.md` — current artifact style and repository-local skill packaging pattern.
- `src/pipeline/index.ts` — current converter entry point.
- `src/pipeline/content.ts` — current content transformation orchestration.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pipeline/index.ts` — stable artifact-generation entry point that future browser skills will likely still use.
- `src/skills/review/build-review-skill.ts` — example of a checked-in skill artifact builder pattern.
- `.github/skills/review/SKILL.md` — established project-local skill packaging location for later browser skills.

### Established Patterns
- Checked-in skill artifacts can be generated and validated through builder + golden-file tests.
- Phase work prefers strict, explicit handling over silent fallback.
- Project-local skills under `.github/skills/` are now a validated path for real Copilot usage.

### Integration Points
- Browser abstraction likely belongs under a new `src/runtime/browser/` or similar namespace parallel to `src/runtime/review/`.
- Later skills `/qa` and `/office-hours` will need a clean way to discover which browser capabilities are actually supported by the backend.
- Phase 4 should establish the capability-reporting pattern that later browser skills and tests will consume.

</code_context>

<specifics>
## Specific Ideas

- The `chrome-devtools` backend should be the first concrete implementation because it matches the roadmap and current tool availability.
- Capability extensions should be explicit enough that future callers can branch cleanly when `console`/`network`/`evaluate` support exists or not.
- The backend should prove at least one deterministic flow end-to-end so Phase 5 can reuse that test fixture instead of inventing one from scratch.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 04-browser-abstraction*
*Context gathered: 2026-04-02*

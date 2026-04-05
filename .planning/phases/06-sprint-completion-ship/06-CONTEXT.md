# Phase 6: Sprint Completion - /ship - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 completes the v1 sprint loop by shipping:
- the `/ship` skill
- setup/install entrypoints
- the final README and usage documentation needed for Copilot CLI users to run the end-to-end workflow

This phase is about final shipping behavior, install/setup experience, and the final sprint-loop documentation layer.

This phase does not add new browser features, new core skills, or Playwright support. It closes the loop on top of Phases 1-5.

</domain>

<decisions>
## Implementation Decisions

### `/ship` Operating Contract
- **D-01:** `/ship` should prepare and open a PR by default, but not merge it automatically.
- **D-02:** `/ship` should verify the tree is in a shippable state before opening the PR.
- **D-03:** `/ship` should generate or update PR-facing artifacts as part of the default path when shipping succeeds.

### Git and Remote Preflight
- **D-04:** `/ship` should use strict preflight behavior.
- **D-05:** Dirty tree, missing remote, missing auth, or wrong branch should stop `/ship` with explicit remediation instead of attempting to improvise.
- **D-06:** The no-remote case already occurred in this repo, so Phase 6 must treat remote setup as a first-class preflight path rather than an edge case.

### Setup and Installation Surface
- **D-07:** Phase 6 should ship both `setup.ps1` and `npx gstack-copilot setup`.
- **D-08:** Those two entrypoints should align to the same install behavior rather than diverging into separate setup systems.

### the agent's Discretion
- Exact division of responsibilities between the PowerShell setup script and the CLI command, as long as both entrypoints remain supported.
- Exact PR artifact set for `/ship` beyond the locked preflight-and-open-PR behavior.
- Exact README/doc file structure, as long as setup and sprint-loop usage are clearly documented.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Definition
- `.planning/ROADMAP.md` — Phase 6 goal, success criteria, and dependency position.
- `.planning/REQUIREMENTS.md` — `SKILL-04`, `SETUP-01`, and `SETUP-02`.
- `.planning/PROJECT.md` — validated prior phases and current project state after Phase 5.
- `.planning/STATE.md` — current position and active next-step routing.

### Existing Shipping and Skill Baseline
- `.github/skills/review/SKILL.md` — existing non-browser checked-in skill pattern.
- `.github/skills/qa/SKILL.md` — browser-heavy checked-in skill pattern with findings-first behavior.
- `.github/skills/office-hours/SKILL.md` — browser-heavy checked-in skill pattern with memo output.
- `src/skills/review/build-review-skill.ts` — established builder pattern for checked-in artifacts.
- `src/skills/qa/build-qa-skill.ts` — Phase 5 builder pattern for `/qa`.
- `src/skills/office-hours/build-office-hours-skill.ts` — Phase 5 builder pattern for `/office-hours`.

### Browser and Verification Baseline
- `.planning/phases/04-browser-abstraction/04-VERIFICATION.md` — browser foundation already validated.
- `.planning/phases/05-browser-skills-qa-office-hours/05-UAT.md` — live browser acceptance baseline for Phase 6 sequencing.
- `.planning/phases/05-browser-skills-qa-office-hours/05-VERIFICATION.md` — proof that `/qa` and `/office-hours` are complete inputs to the sprint loop.

### Research and Constraints
- `.planning/research/FEATURES.md` — original sprint-loop MVP framing.
- `.planning/research/PITFALLS.md` — shell, browser, and tooling risks that still apply to setup and shipping.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/cli/index.ts` — current CLI entrypoint where a `setup` command can be added.
- `src/cli/convert.ts` — existing CLI command pattern and output conventions.
- `src/pipeline/` — stable conversion/generation path Phase 6 setup should likely invoke.
- `.github/skills/review/`, `.github/skills/qa/`, `.github/skills/office-hours/` — already-shipped skill artifact layout that setup can install or verify.

### Established Patterns
- Checked-in skills are builder-backed and tested against exact artifact output.
- Findings-first plus explicit confirmation is an established safety pattern for code-changing skills.
- Browser-heavy skills now rely on `src/runtime/browser/` and are already verified, so `/ship` should orchestrate them rather than duplicate their logic.

### Integration Points
- `/ship` should likely consume the completed artifacts and verification outputs from earlier phases rather than infer everything from scratch.
- `setup.ps1` and `npx gstack-copilot setup` should both align with the existing CLI and checked-in artifact layout.
- The final docs pass needs to describe how `/office-hours`, `/review`, `/qa`, and `/ship` fit together as a single sprint loop.

</code_context>

<specifics>
## Specific Ideas

- The strongest default `/ship` behavior is "strict preflight, then open PR" because that matches the actual repo constraints already surfaced during shipping attempts.
- Setup should feel Windows-native first, but the CLI and script should not drift apart.
- README and setup docs should explain the actual sequence users follow, not just list commands in isolation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 06-sprint-completion-ship*
*Context gathered: 2026-04-05*

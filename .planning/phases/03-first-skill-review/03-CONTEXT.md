# Phase 3: First Skill - /review - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 ports the `/review` skill end-to-end in Copilot CLI using the completed conversion and translation layer from Phases 1 and 2. This phase is about making `/review` usable as the first real shipped skill: invocation, diff target selection, report behavior, and optional follow-up fixing flow.

This phase does not introduce browser automation, `/qa`, `/office-hours`, or `/ship`. It validates the core skill infrastructure with a non-browser review workflow.

</domain>

<decisions>
## Implementation Decisions

### Review Scope
- **D-01:** `/review` should review the branch diff against a base branch by default.
- **D-02:** Uncommitted working-tree changes are opt-in, not part of the default review scope.

### Fix Workflow
- **D-03:** `/review` is report-first. It should show findings before making any edits.
- **D-04:** Fixing can happen in the same `/review` session, but only after an explicit confirmation step from the user.
- **D-05:** Default behavior is not “auto-fix safe issues by default.” The user must approve the fix step explicitly.

### Invocation Contract
- **D-06:** Invocation should support an optional base branch argument: `/review [base-branch]`.
- **D-07:** If the base branch is omitted, auto-detect in this order: `origin/main`, then `origin/master`, then the repo default branch.
- **D-08:** Any future “include uncommitted changes” behavior should be a separate opt-in flag or explicit mode, not implicit default behavior.

### the agent's Discretion
- Exact command-line syntax and `argument-hint` wording for the converted skill.
- How the confirmation step is expressed inside the skill flow, as long as it is explicit and happens after findings are shown.
- How detailed the findings report is by default, provided it stays findings-first and supports the later fix step cleanly.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Definition
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, and placement in the roadmap.
- `.planning/REQUIREMENTS.md` — `SKILL-01` scope and project-level requirement traceability.
- `.planning/PROJECT.md` — current product framing, constraints, and validated infrastructure phases.

### Prior Infrastructure
- `.planning/phases/01-core-conversion-pipeline/01-VERIFICATION.md` — verifies the conversion pipeline and CLI behavior already work.
- `.planning/phases/02-command-translation-layer/02-VERIFICATION.md` — verifies the Bash-to-PowerShell translation layer is complete and ready for skill-porting.
- `.planning/phases/02-command-translation-layer/02-UAT.md` — confirms Phase 2 passed user-facing command verification.

### Source Shape and Existing Behavior
- `tests/fixtures/review-skill.md` — current gstack-style `/review` fixture and content shape the port should preserve semantically.
- `src/cli/convert.ts` — current CLI surface and output behavior for converted skills.
- `src/pipeline/index.ts` — current end-to-end conversion pipeline entry point.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pipeline/index.ts` — stable conversion orchestration entry point already used by CLI and tests.
- `src/pipeline/content.ts` plus `src/pipeline/transforms/*` — completed Bash-to-PowerShell transformation stack ready to be applied to `/review`.
- `tests/fixtures/review-skill.md` — realistic seed content for the `/review` port and regression tests.
- `tests/cli.test.ts` and integration tests — existing pattern for validating user-visible behavior through CLI runs.

### Established Patterns
- Strict fail-fast conversion remains the rule for unsupported constructs.
- Generated PowerShell should survive downstream transform stages without retranslation.
- User-facing command output should remain findings-first and stdout-safe where applicable.

### Integration Points
- Phase 3 will likely need a real converted `/review` artifact target, probably under a Copilot skill directory path rather than only test fixtures.
- Git diff/base-branch behavior will need to connect the converted skill content to real repository state detection.
- Any fix-confirmation flow must compose cleanly with the existing review/report skill flow and later Phase 6 `/ship` expectations.

</code_context>

<specifics>
## Specific Ideas

- `/review` should validate the adapter stack with the lowest possible surface area: no browser dependency, but strong git/diff/report behavior.
- The default path should feel safe in a real repository: review first, fix only with explicit approval.
- Base branch autodetection needs to be predictable enough that users can rely on `/review` with no argument in normal repos, but still override it easily.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 03-first-skill-review*
*Context gathered: 2026-04-02*

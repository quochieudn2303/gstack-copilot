# Phase 3: First Skill - /review - Research

**Researched:** 2026-04-02  
**Domain:** Porting the first real gstack skill (`/review`) to GitHub Copilot CLI  
**Confidence:** High

## Summary

Phase 3 can build directly on the now-complete Phase 1 and Phase 2 infrastructure. The remaining work is not generic conversion anymore; it is productizing that converter into a real Copilot skill for `/review` with correct packaging, base-branch targeting, findings-first behavior, and an explicit post-review fix confirmation flow.

The most important research finding is a contract mismatch between our earlier assumptions and the current GitHub Copilot CLI docs. The current GitHub docs describe skill directories under `.github/skills`, `.claude/skills`, or `.agents/skills`, with `SKILL.md` as the required file name and `name`/`description` as the required frontmatter. The CLI reference also documents `allowed-tools`, `user-invocable`, and `disable-model-invocation`, but it does **not** document `argument-hint` as a current frontmatter field. That means Phase 3 should treat frontmatter compatibility as part of the `/review` port, not as a settled Phase 1 fact.

## Phase Requirements

| ID | Description | Planning implication |
|----|-------------|----------------------|
| SKILL-01 | Port `/review` skill | Must ship a real Copilot skill artifact, not just transformed markdown fragments |

## What Already Exists

### Infrastructure ready from prior phases
- `src/pipeline/index.ts` already performs end-to-end conversion from gstack-style input to Copilot-style output.
- `src/pipeline/content.ts` and `src/pipeline/transforms/*` already cover paths, environment variables, commands, process substitution, and shell idioms.
- `tests/fixtures/review-skill.md` provides a realistic seed source for the `/review` skill port.
- Phase 2 UAT and verification confirm the translation layer is stable enough to support a real skill.

### What is still missing for `/review`
- A real skill artifact in a valid Copilot skill directory.
- A reviewed and reconciled frontmatter contract against current GitHub docs.
- A runtime helper for base-branch autodetection and review-target selection.
- A defined report-first then confirm-to-fix flow inside the skill behavior.
- Verification that the skill package is manually invokable in Copilot CLI, beyond converter-level tests.

## Official Copilot Skill Contract Findings

Primary sources:
- GitHub Copilot CLI command reference: [docs.github.com/.../cli-command-reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)
- Creating agent skills for GitHub Copilot CLI: [docs.github.com/.../create-skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-skills)

Current documented constraints:
- Skill files live in per-skill directories under `.github/skills`, `.claude/skills`, or `.agents/skills`.
- Each skill directory requires `SKILL.md`.
- Required frontmatter: `name`, `description`.
- Documented optional frontmatter in the CLI reference: `allowed-tools`, `user-invocable`, `disable-model-invocation`.

Implication:
- Phase 3 should either remove `argument-hint` from generated `/review` output or gate it behind a compatibility decision with explicit tests. The plan should not assume undocumented frontmatter is safe.

## Review Skill Port Strategy

### Recommended target artifact
Use a project-local skill directory:

```text
.github/skills/review/SKILL.md
```

Why:
- Matches current GitHub docs for project-specific skills.
- Gives a concrete, user-invokable artifact for Phase 3 without waiting for the Phase 6 setup flow.
- Enables manual UAT directly in this repository.

### Recommended behavior split
1. **Target detection layer**
   - Determine base branch using the user’s Phase 3 decision order: `origin/main`, then `origin/master`, then repo default branch.
   - Keep uncommitted working-tree review out of the default flow.

2. **Review report layer**
   - Findings-first output.
   - Emphasize production regressions, completeness gaps, missing tests, and PR hygiene.
   - No automatic fixes before review results are shown.

3. **Fix confirmation layer**
   - Same `/review` session can continue into a fix step.
   - The fix step must be explicitly confirmed by the user.
   - “Safe fixes by default” is explicitly out.

## Architecture Recommendation

Use a small review runtime helper layer plus a checked-in skill artifact.

### Proposed modules
- `src/runtime/review/base-branch.ts`
  Purpose: base-branch autodetection and diff target resolution
- `src/runtime/review/review-scope.ts`
  Purpose: encode default branch-diff scope vs optional worktree inclusion
- `src/skills/review/*`
  Purpose: generate or validate the final `SKILL.md` artifact and related examples/resources

### Why helper modules matter
- Git-aware behavior is hard to test if it only exists as prose in `SKILL.md`.
- The skill artifact can reference deterministic helper outputs or prescribed command patterns.
- Tests can validate base-branch resolution and artifact content separately.

## Risks

### Risk 1: Frontmatter drift against current Copilot docs
The current converter was originally designed around `argument-hint`, but the current GitHub docs don’t document it. If Phase 3 ignores this, `/review` may appear “ported” while still being invalid or fragile in real Copilot CLI sessions.

Mitigation:
- Add schema/fixture tests for the Phase 3 skill artifact using documented fields only.
- Treat frontmatter reconciliation as the first plan.

### Risk 2: `/review` becomes a generic prompt instead of a usable skill
If the port only converts wording without addressing base-branch detection and explicit fix confirmation, the skill won’t meet the user-facing Phase 3 goal.

Mitigation:
- Separate skill packaging, review-target detection, and report/fix flow into explicit plans.

### Risk 3: True end-to-end invocation is only partially automatable
We can test artifact structure, helper logic, and converter output automatically, but actual Copilot CLI slash-command invocation still needs at least one manual UAT pass.

Mitigation:
- Put manual invocation into Phase 3 validation strategy explicitly.

## Validation Architecture

### Automated verification
- Unit tests for base-branch autodetection and review-target resolution.
- Artifact tests that assert `.github/skills/review/SKILL.md` exists and contains the expected documented frontmatter and behavioral instructions.
- Integration tests that convert the review fixture into the final artifact and validate the emitted `SKILL.md`.

### Manual-only verification
- Invoke `/review` in a real Copilot CLI session inside this repository.
- Confirm default review target is the branch diff against the autodetected base branch.
- Confirm findings are shown before any fix step.
- Confirm the skill only enters fix mode after explicit confirmation.

### Recommended validation split
- Wave 1: automated artifact + helper tests
- Wave 2: full artifact generation and behavior assertions
- End of phase: manual UAT in Copilot CLI

## Recommended Plan Shape

### Plan 03-01
Reconcile Copilot skill contract and implement review target/base-branch helpers.

### Plan 03-02
Create the project-local `/review` skill artifact and encode the report-first/confirm-to-fix behavior.

### Plan 03-03
Add verification harnesses and manual UAT support for actual Copilot CLI invocation.

## Sources

- GitHub Copilot CLI command reference: [https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)
- Creating agent skills for GitHub Copilot CLI: [https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-skills)
- `tests/fixtures/review-skill.md`
- `.planning/phases/02-command-translation-layer/02-VERIFICATION.md`
- `.planning/phases/02-command-translation-layer/02-UAT.md`

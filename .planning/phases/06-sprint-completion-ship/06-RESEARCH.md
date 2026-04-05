# Phase 6: Sprint Completion - /ship - Research

**Researched:** 2026-04-05  
**Domain:** Final shipping skill, setup surface, and sprint-loop documentation for the Copilot CLI port  
**Confidence:** High

## Summary

Phase 6 should be planned as three slices:
- `/ship` runtime plus checked-in artifact
- shared setup implementation exposed through both `setup.ps1` and `npx gstack-copilot setup`
- final docs, version/changelog scaffolding, and end-to-end verification

The strongest planning constraint is that the source gstack `/ship` skill does much more than the current repo can support directly today. It assumes things like VERSION files, CHANGELOGs, TODO management, remote PR creation, and follow-on doc sync. The first Copilot port should preserve the strict preflight and PR-prep contract, but it needs a narrower, testable runtime surface that fits this repository's current state.

## Primary Sources

- `C:/Users/Thinkpad/.codex/skills/gstack-ship/SKILL.md`
- `.planning/phases/06-sprint-completion-ship/06-CONTEXT.md`
- `.planning/phases/05-browser-skills-qa-office-hours/05-VERIFICATION.md`
- `.planning/phases/05-browser-skills-qa-office-hours/05-UAT.md`
- `src/cli/index.ts`
- `src/cli/convert.ts`
- `.planning/research/PITFALLS.md`

## Key Findings

### 1. The source `/ship` skill is much broader than the minimum Phase 6 contract

The source gstack `/ship` skill covers:
- base branch detection and merging
- strict verification gates
- pre-landing review
- version bumping
- changelog generation
- TODO updates
- push and PR creation
- post-PR documentation sync

The roadmap and Phase 6 context already narrowed the default port contract:
- prepare and open a PR by default
- do not merge automatically
- strict preflight

Implication:
- The Copilot port should preserve strict preflight and PR-opening behavior as the core runtime contract.
- Versioning, changelog, TODO, and docs sync are still relevant, but they should be treated as explicit runtime helpers and docs artifacts, not one giant monolithic markdown skill translation.
- A `/ship` runtime module is worth planning so preflight and PR-body generation can be tested directly.

### 2. Setup must be a single behavior with two entrypoints, not two implementations

The repo currently has:
- no `setup.ps1`
- no `setup` CLI command
- an existing CLI entrypoint in `src/cli/index.ts`
- stable conversion/building infrastructure in `src/pipeline/`

Implication:
- Phase 6 should introduce one shared setup implementation behind two entrypoints:
  - `setup.ps1`
  - `npx gstack-copilot setup`
- The PowerShell script should be thin and Windows-native, while the CLI command should drive the same install logic rather than maintaining a parallel codepath.
- A setup runtime/helper layer is worth planning because install logic, path choices, and artifact verification need tests.

### 3. The repo is missing the release/documentation scaffolding the source `/ship` skill expects

Current repo gaps:
- no `README.md`
- no `CHANGELOG.md`
- no `VERSION`
- no `setup.ps1`

Implication:
- Phase 6 must create or formalize those files as part of the execution plan.
- The docs plan should not be an afterthought. It is a first-class phase deliverable because `SETUP-02` is a roadmap requirement.
- The final verification pass should include docs and setup checks, not just `/ship` artifact tests.

### 4. Strict preflight should be planned as observable behavior, not just a branch policy

This repo already hit a no-remote case during actual shipping work.

Implication:
- `/ship` needs explicit runtime handling for:
  - dirty tree
  - missing remote
  - missing GitHub auth
  - wrong branch
- These should be covered with runtime tests and artifact guidance so the user-visible contract stays stable.
- The plan should treat "remote missing" as a first-class preflight result, not an error string buried in implementation.

### 5. Phase 6 can leverage the existing checked-in skill pattern and verification history

Phases 3-5 already established:
- `.github/skills/<name>/SKILL.md` checked into the repo
- builder files under `src/skills/<name>/`
- deterministic artifact tests
- live verification/UAT files

Implication:
- `/ship` should follow the same builder-backed checked-in artifact pattern as `/review`, `/qa`, and `/office-hours`.
- The Phase 6 docs should describe the full sequence `office-hours -> review -> qa -> ship`.
- The final phase verification can reference prior UAT/verification artifacts as prerequisites instead of trying to re-prove earlier phases.

## Recommended Plan Shape

### Plan 06-01
Create `/ship` runtime helpers, checked-in artifact, and tests:
- strict preflight contract
- PR-body generation
- checked-in `.github/skills/ship/`
- runtime/artifact/integration tests

### Plan 06-02
Create setup/install surface:
- shared install/runtime helper
- `setup.ps1`
- `setup` CLI command
- setup verification tests

### Plan 06-03
Finish Phase 6 with:
- `README.md`
- `CHANGELOG.md`
- `VERSION`
- final sprint-loop docs
- Phase 6 UAT and verification

## Validation Architecture

### Automated checks
- `/ship` runtime tests for strict preflight and PR-body generation
- `/ship` artifact tests for checked-in builder output
- setup command/script tests
- docs existence and contract checks
- full project suite and typecheck

### Manual checks
- one local `/ship` dry-run or preflight run on a repo branch
- one setup-path smoke test using either the script or CLI entrypoint
- final sprint-loop walkthrough sanity check against the README

## Risks

### Risk 1: `/ship` grows into a direct clone of the source skill instead of a testable first port

Mitigation:
- Keep strict preflight and PR-prep as the required core contract.
- Move other behaviors into helper modules and docs artifacts only when they are truly needed for the current repo.

### Risk 2: setup script and setup command drift apart immediately

Mitigation:
- Put install logic behind a single shared helper and test both entrypoints against it.

### Risk 3: docs are written last and end up inconsistent with the actual shipped artifacts

Mitigation:
- Make docs and release files a dedicated plan with verification and not just a cleanup note.

### Risk 4: the no-remote case is forgotten after the repo now has a remote

Mitigation:
- Keep missing-remote handling in runtime tests because the contract is about behavior in arbitrary repos, not just this one.

## Sources

- `C:/Users/Thinkpad/.codex/skills/gstack-ship/SKILL.md`
- `.planning/phases/06-sprint-completion-ship/06-CONTEXT.md`
- `.planning/phases/05-browser-skills-qa-office-hours/05-VERIFICATION.md`
- `.planning/phases/05-browser-skills-qa-office-hours/05-UAT.md`
- `src/cli/index.ts`
- `src/cli/convert.ts`
- `.planning/research/PITFALLS.md`

# gstack-copilot

## What This Is

A Copilot CLI port of gstack — an adapter layer that makes gstack's "virtual engineering team" skills work with GitHub Copilot CLI. The repository now includes a working converter CLI, Bash-to-PowerShell translation layer, checked-in `/review`, `/qa`, `/office-hours`, and `/ship` skills, a reusable Chrome DevTools browser abstraction, shared setup entrypoints, and end-to-end sprint-loop documentation.

## Core Value

Enable Copilot CLI users to leverage gstack's structured sprint workflow (think → plan → build → review → test → ship) — the same process that powers 10-20K LOC/day productivity.

## Current State

v1.0 shipped on 2026-04-05. The repository now contains the full Copilot CLI sprint loop: `/office-hours`, `/review`, `/qa`, and `/ship`, plus setup via both `setup.ps1` and `npx gstack-copilot setup`, release scaffolding, and final README/changelog/version files.

## Requirements

### Validated

- Phase 1 (2026-03-30): Core converter CLI parses gstack SKILL.md files, rewrites core paths/tool aliases, and emits valid Copilot SKILL.md output
- Phase 2 (2026-04-02): Command translation layer converts core Bash utilities, environment variables, and process substitution into PowerShell-compatible output
- Phase 3 (2026-04-02): `/review` works as a real project-local Copilot skill with findings-first output and explicit confirm-to-fix behavior
- Phase 4 (2026-04-02): Browser abstraction ships with a Chrome DevTools backend, capability-gated QA surface, structured fallback guidance, and deterministic/live verification
- Phase 5 (2026-04-05): `/qa` and `/office-hours` ship as checked-in browser-heavy skills with runtime contracts, deterministic verification, and live browser UAT
- Phase 6 (2026-04-05): `/ship`, setup, and final documentation complete the v1 sprint loop for Copilot CLI users

### Active

- Define the v1.1 requirement set and roadmap through `$gsd-new-milestone`.
- Re-evaluate deferred candidates: Playwright fallback, upstream sync/version pinning, cross-platform support, and a dedicated conversion validation harness.

### Out of Scope

- Full gstack feature parity in v1 — focusing on core sprint skills only
- Upstream contribution to garrytan/gstack — this is a standalone fork
- Claude Code or Codex support — Copilot CLI only
- /codex skill (requires OpenAI CLI) — may add later
- Conductor parallel sprint support — single session first

## Context

**Source project:** [garrytan/gstack](https://github.com/garrytan/gstack) — Garry Tan's open-source software factory with 20+ skills that turn AI coding agents into a virtual engineering team.

**Target platform:** GitHub Copilot CLI — has similar capabilities to Claude Code (tool use, file editing, command execution, browser automation via chrome-devtools MCP).

**Key insight:** gstack already supports multiple hosts (Claude Code, Codex, Gemini CLI) via `./setup --host`. This port follows that pattern but requires deeper adaptation due to Copilot CLI's different skill format and tool naming.

**Skill format differences:**
- gstack: `.factory/skills/{name}/SKILL.md` with Bash preamble, `$GSTACK_BIN` references
- Copilot: `.github/skills/{name}/SKILL.md` with YAML frontmatter centered on `name`, `description`, and optional documented fields such as `allowed-tools` and `user-invocable`

**Browser automation:**
- gstack: Playwright-based `/browse` command with `$B` shorthand
- Copilot: Native `chrome-devtools-*` MCP tools (take_snapshot, click, fill, navigate_page, etc.)

## Constraints

- **Platform**: Windows-first (Copilot CLI runs on Windows), must work with PowerShell
- **Dependencies**: Minimize — should work with just Copilot CLI installed
- **Compatibility**: gstack skills may update — adapter should be maintainable

## Next Milestone Goals

- Create a fresh requirements set and roadmap for post-v1.0 work.
- Decide which deferred capability is most valuable next: browser fallback depth, upstream sync, or broader platform support.
- Preserve the shipped v1 sprint loop as the baseline while expanding only what real usage proves necessary.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Skill files over MCP server | Direct 1:1 mapping with gstack format, native Copilot discovery | Validated in v1.0 with four checked-in project-local skills |
| Adapter layer, not rewrite | Leverage existing gstack quality, easier to maintain | Phase 1 validated the approach with a real converter pipeline |
| Support both browser backends | Flexibility — native chrome-devtools for simple tasks, Playwright for complex automation | Chrome DevTools validated in v1.0; Playwright remains a next-milestone candidate |
| Core skills first | Validate approach with essential sprint workflow before expanding | Phase 3 completed `/review` first and validated the non-browser skill path |
| Ordered parse → transform → generate pipeline | Keeps transformation logic testable and extensible | Implemented in Phase 1 |
| Generated PowerShell must survive later pipeline stages | Multi-stage translation only works if later passes preserve already translated PowerShell | Validated in Phase 2 |
| Ship project-local skills before setup automation | A checked-in `.github/skills` artifact gives a concrete target for early UAT before Phase 6 setup work | Validated in Phase 3 |
| Core browser interface plus capability extensions | Keeps Chrome DevTools first while preserving a future Playwright-compatible calling surface | Validated in Phase 4 |
| Structured fallback guidance for unsupported browser actions | Browser API coverage is partial; unsupported work must degrade explicitly rather than silently | Validated in Phase 4 |
| Browser-heavy skills need typed runtime contracts, not prose-only artifacts | `/qa` and `/office-hours` both need testable data shapes for evidence, memo output, and graceful degradation | Validated in Phase 5 |
| `/ship` and setup need shared runtime contracts too | Final sprint-loop behavior, install flow, and release docs are safer when encoded in testable helpers and checked-in artifacts | Validated in Phase 6 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-05 after v1.0 milestone completion*

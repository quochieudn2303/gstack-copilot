# gstack-copilot

## What This Is

A Copilot CLI port of gstack — an adapter layer that makes gstack's "virtual engineering team" skills work with GitHub Copilot CLI. The repository now includes a working converter CLI, Bash-to-PowerShell translation layer, a shipped project-local `/review` skill, and a reusable browser abstraction with a Chrome DevTools backend. The remaining phases extend that base into the browser-heavy skills `/office-hours` and `/qa`, followed by `/ship` and setup/docs completion.

## Core Value

Enable Copilot CLI users to leverage gstack's structured sprint workflow (think → plan → build → review → test → ship) — the same process that powers 10-20K LOC/day productivity.

## Current State

Phase 4 is complete as of 2026-04-02. The repository now contains a reusable browser runtime under `src/runtime/browser`, a Chrome DevTools mapping/backend layer, deterministic browser-flow fixtures and tests, and a live Chrome DevTools UAT run proving the browser foundation needed for `/qa` and `/office-hours`. Phase 5 is next: port the first browser-heavy skills on top of that backend.

## Requirements

### Validated

- Phase 1 (2026-03-30): Core converter CLI parses gstack SKILL.md files, rewrites core paths/tool aliases, and emits valid Copilot SKILL.md output
- Phase 2 (2026-04-02): Command translation layer converts core Bash utilities, environment variables, and process substitution into PowerShell-compatible output
- Phase 3 (2026-04-02): `/review` works as a real project-local Copilot skill with findings-first output and explicit confirm-to-fix behavior
- Phase 4 (2026-04-02): Browser abstraction ships with a Chrome DevTools backend, capability-gated QA surface, structured fallback guidance, and deterministic/live verification

### Active

- [ ] /office-hours skill — product discovery and design doc generation
- [ ] /qa skill — browser-based testing with bug detection and fixes
- [ ] /ship skill — test audit, coverage check, PR creation
- [ ] Setup script for one-command installation
- [ ] Documentation for Copilot CLI users

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

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Skill files over MCP server | Direct 1:1 mapping with gstack format, native Copilot discovery | — Pending |
| Adapter layer, not rewrite | Leverage existing gstack quality, easier to maintain | Phase 1 validated the approach with a real converter pipeline |
| Support both browser backends | Flexibility — native chrome-devtools for simple tasks, Playwright for complex automation | — Pending |
| Core skills first | Validate approach with essential sprint workflow before expanding | Phase 3 completed `/review` first and validated the non-browser skill path |
| Ordered parse → transform → generate pipeline | Keeps transformation logic testable and extensible | Implemented in Phase 1 |
| Generated PowerShell must survive later pipeline stages | Multi-stage translation only works if later passes preserve already translated PowerShell | Validated in Phase 2 |
| Ship project-local skills before setup automation | A checked-in `.github/skills` artifact gives a concrete target for early UAT before Phase 6 setup work | Validated in Phase 3 |
| Core browser interface plus capability extensions | Keeps Chrome DevTools first while preserving a future Playwright-compatible calling surface | Validated in Phase 4 |
| Structured fallback guidance for unsupported browser actions | Browser API coverage is partial; unsupported work must degrade explicitly rather than silently | Validated in Phase 4 |

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
*Last updated: 2026-04-02 after Phase 4 completion*

# gstack-copilot

## What This Is

A Copilot CLI port of gstack — an adapter layer that makes gstack's "virtual engineering team" skills work with GitHub Copilot CLI. Converts gstack's SKILL.md format to Copilot-compatible skills, maps tool invocations (Bash → PowerShell, gstack browse → chrome-devtools), and provides a setup script for installation. Starting with core sprint skills: /office-hours, /review, /qa, /ship.

## Core Value

Enable Copilot CLI users to leverage gstack's structured sprint workflow (think → plan → build → review → test → ship) — the same process that powers 10-20K LOC/day productivity.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Format converter that transforms gstack SKILL.md files to Copilot-compatible format
- [ ] Tool mapping layer: Bash → PowerShell, Claude-specific constructs → Copilot equivalents
- [ ] Browser abstraction supporting both chrome-devtools MCP and Playwright
- [ ] /office-hours skill — product discovery and design doc generation
- [ ] /review skill — pre-landing code review with auto-fix capability
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
- Copilot: `.github/skills/{name}/SKILL.md` with YAML frontmatter (`allowed-tools`, `argument-hint`)

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
| Adapter layer, not rewrite | Leverage existing gstack quality, easier to maintain | — Pending |
| Support both browser backends | Flexibility — native chrome-devtools for simple tasks, Playwright for complex automation | — Pending |
| Core skills first | Validate approach with essential sprint workflow before expanding | — Pending |

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
*Last updated: 2026-03-29 after initialization*

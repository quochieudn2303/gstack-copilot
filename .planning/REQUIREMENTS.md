# Requirements: gstack-copilot

**Project:** Copilot CLI port of gstack
**Version:** v1.0
**Last Updated:** 2025-01-20

## Summary

| Priority | Count | Categories |
|----------|-------|------------|
| v1 (Must Have) | 14 | CONV, TOOL, BROWSE, SKILL, SETUP |
| v2 (Deferred) | 5 | SYNC, PLATFORM, VALIDATE |

---

## v1 Requirements

### CONV: Format Conversion

| ID | Requirement | Notes |
|----|-------------|-------|
| **CONV-01** | Parse gstack SKILL.md format with gray-matter | Extract YAML frontmatter, content body |
| **CONV-02** | Transform YAML frontmatter to Copilot format | Map `user-invocable`, `preamble-tier` → `argument-hint`, `allowed-tools` |
| **CONV-03** | Generate valid Copilot SKILL.md output | YAML frontmatter + transformed content |
| **CONV-04** | Remap paths from Unix to Windows conventions | `~/` → `$env:USERPROFILE`, `/` → `\`, `$GSTACK_ROOT` → Copilot paths |

### TOOL: Command Translation

| ID | Requirement | Notes |
|----|-------------|-------|
| **TOOL-01** | Create Bash → PowerShell command mapping registry | JSON-based, extensible |
| **TOOL-02** | Translate common UNIX utilities | `find`, `grep`, `date`, `wc`, `sed`, `awk`, `cat` |
| **TOOL-03** | Handle environment variable syntax | `$VAR` → `$env:VAR`, `$HOME` → `$env:USERPROFILE` |
| **TOOL-04** | Handle process substitution pattern `source <(cmd)` | Replace with explicit two-step capture |

### BROWSE: Browser Abstraction

| ID | Requirement | Notes |
|----|-------------|-------|
| **BROWSE-01** | Create BrowserAdapter interface | Abstract `navigate`, `click`, `fill`, `screenshot`, `snapshot` |
| **BROWSE-02** | Implement chrome-devtools MCP backend | Map gstack `$B` commands to chrome-devtools-* tools |
| **BROWSE-03** | Document unsupported commands with fallback strategy | `$B snapshot -D`, responsive testing, cookie import |

### SKILL: Skill Ports

| ID | Requirement | Notes |
|----|-------------|-------|
| **SKILL-01** | Port `/review` skill | Pre-landing code review, auto-fix. Non-browser — validates infrastructure |
| **SKILL-02** | Port `/qa` skill | Browser-based testing, bug detection. Validates browser abstraction |
| **SKILL-03** | Port `/office-hours` skill | Product discovery, design docs. Validates browser + reasoning |
| **SKILL-04** | Port `/ship` skill | Test audit, PR creation. Completes sprint loop |

### SETUP: Installation

| ID | Requirement | Notes |
|----|-------------|-------|
| **SETUP-01** | One-command setup script | PowerShell: `.\setup.ps1` or `npx gstack-copilot setup` |
| **SETUP-02** | Documentation for Copilot CLI users | README, skill usage guide |

---

## v2 Requirements (Deferred)

| ID | Requirement | Reason for Deferral |
|----|-------------|---------------------|
| SYNC-01 | Auto-sync with upstream gstack changes | Validate v1 approach first |
| SYNC-02 | Version pinning to gstack releases | Post-validation feature |
| PLATFORM-01 | Playwright fallback for complex browser flows | chrome-devtools first |
| PLATFORM-02 | Cross-platform Unix support | Windows-first, expand later |
| VALIDATE-01 | Conversion validation/test harness | Nice-to-have after core working |

---

## Out of Scope

| Topic | Reason |
|-------|--------|
| Full 20+ gstack skill parity | Focus on core sprint skills first |
| Upstream contribution to garrytan/gstack | This is standalone fork |
| Claude Code / Codex support | gstack already supports those |
| Conductor parallel sprint support | Single session first |
| Custom skill authoring | Convert only, not author |
| GUI/visual converter | CLI users prefer CLI tools |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONV-01 | Phase 1 | Pending |
| CONV-02 | Phase 1 | Pending |
| CONV-03 | Phase 1 | Pending |
| CONV-04 | Phase 1 | Pending |
| TOOL-01 | Phase 2 | Pending |
| TOOL-02 | Phase 2 | Pending |
| TOOL-03 | Phase 2 | Pending |
| TOOL-04 | Phase 2 | Pending |
| SKILL-01 | Phase 3 | Pending |
| BROWSE-01 | Phase 4 | Pending |
| BROWSE-02 | Phase 4 | Pending |
| BROWSE-03 | Phase 4 | Pending |
| SKILL-02 | Phase 5 | Pending |
| SKILL-03 | Phase 5 | Pending |
| SKILL-04 | Phase 6 | Pending |
| SETUP-01 | Phase 6 | Pending |
| SETUP-02 | Phase 6 | Pending |

---

## Sources

- PROJECT.md Active requirements
- research/FEATURES.md feature landscape
- research/PITFALLS.md technical constraints
- research/ARCHITECTURE.md component design

# Feature Landscape: gstack-copilot Adapter

**Domain:** AI agent skill adapter/converter (gstack → GitHub Copilot CLI)
**Researched:** 2025-01-20
**Overall confidence:** HIGH (verified against actual gstack source, Copilot CLI skill format from live installations)

## Context

gstack is Garry Tan's open-source "AI builder framework" with 20+ skills that form a structured sprint workflow. This adapter ports gstack skills to GitHub Copilot CLI, which uses a different skill format (YAML frontmatter, `allowed-tools`, `@file:` references) than gstack (Bash preamble, `$GSTACK_BIN` variables, `$B` browse shorthand).

**Source format (gstack):**
- YAML frontmatter: `name`, `description`, `user-invocable`, `disable-model-invocation`
- Bash preamble: sets `$GSTACK_ROOT`, `$GSTACK_BIN`, `$B` variables
- Tool calls: `$B goto`, `$B snapshot`, inline bash scripts
- Cross-skill references: `$GSTACK_ROOT/[skill-name]/SKILL.md`

**Target format (Copilot CLI):**
- YAML frontmatter: `name`, `description`, `argument-hint`, `allowed-tools`
- `<objective>` / `<execution_context>` / `<process>` XML blocks
- External workflow files: `@~/.copilot/get-shit-done/workflows/[name].md`
- PowerShell-native commands (Windows-first)

---

## Table Stakes

Features users expect. Missing = adapter doesn't work or provides degraded experience.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **SKILL.md format conversion** | Core adapter purpose — transform gstack YAML frontmatter to Copilot format | Medium | Must handle: `name`, `description`, `user-invocable`, `preamble-tier` → `argument-hint`, `allowed-tools` |
| **Bash → PowerShell translation** | Copilot CLI on Windows uses PowerShell; gstack uses Bash | High | Key patterns: `$(...)` → `$(...)`, `[ -f ]` → `Test-Path`, `source <(...)` → different approach, env vars |
| **Browse tool abstraction** | gstack uses `$B` (Playwright binary); Copilot has `chrome-devtools-*` MCP tools | High | Map: `$B goto` → `chrome-devtools-navigate_page`, `$B snapshot` → `chrome-devtools-take_snapshot`, `$B click` → `chrome-devtools-click` |
| **4 core skills (/office-hours, /review, /qa, /ship)** | Minimum viable sprint workflow | Medium | These form the think→plan→build→review→test→ship loop |
| **Path remapping** | gstack: `~/.claude/skills/gstack/` or `$GSTACK_ROOT`; Copilot: `~/.copilot/skills/gstack-copilot/` | Low | String replacement with awareness of platform path separators |
| **Setup script** | gstack has `./setup --host`; Copilot users expect similar one-liner | Low | PowerShell script: `Install-GstackCopilot.ps1` |
| **Tool allowlist mapping** | gstack: `Bash`, `Read`, `AskUserQuestion`; Copilot: may use different tool names | Low | Map gstack tools → Copilot equivalents |
| **Cross-skill references** | Skills reference each other: `/review` suggests `/qa` | Low | Update path patterns in converted skills |

---

## Differentiators

Features that set this adapter apart. Not expected, but valuable competitive advantage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Dual browser backend support** | Support both `chrome-devtools-*` (native, simple) AND Playwright (complex flows) | High | chrome-devtools is lightweight but limited; Playwright supports cookies, complex selectors, responsive testing |
| **Auto-sync with upstream gstack** | Detect gstack updates, pull changes, re-run converter | Medium | `gstack-update-check` pattern — could do `git fetch` + diff + re-convert |
| **Conversion validation** | Verify converted skills work: syntax check, tool availability, test invocation | Medium | CI-style validation before committing converted skills |
| **Bidirectional conversion** | Also support Copilot→gstack for cross-platform skill sharing | High | Nice for community but increases maintenance |
| **Skill subset selection** | `--skills office-hours,review,ship` instead of converting everything | Low | User choice, reduces noise |
| **Diagnostic mode** | `gstack-copilot --diagnose` to test browser, tools, paths | Low | Debugging helper for when things don't work |
| **Telemetry opt-in preservation** | Honor gstack's telemetry settings, don't double-track | Low | Respect user privacy choices from original gstack config |
| **Skill registry/manifest** | JSON manifest listing converted skills with metadata | Low | Enables tooling, discoverability |
| **Version pinning** | Lock to specific gstack version: `--pin v1.1.0` | Low | Stability for production use |
| **Incremental conversion** | Only re-convert changed skills | Medium | Performance for large skill sets |
| **Environment variable passthrough** | Preserve `$TEST_EMAIL`, `$TEST_PASSWORD` patterns for QA flows | Low | Security-conscious credential handling |

---

## Anti-Features

Features to deliberately NOT build. Building these would waste effort or create problems.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full 20+ skill parity in v1** | Scope explosion; validate approach with core skills first | Start with 4 core skills, expand after validation |
| **Upstream contribution to garrytan/gstack** | This is a standalone fork/port, not an upstream host option | Keep as separate project; gstack already has `--host claude/codex/kiro/factory` |
| **Claude Code or Codex support** | gstack already supports those; this is Copilot-specific | Just target Copilot CLI |
| **Real-time bidirectional sync** | Complex, fragile, unnecessary for skill files that change rarely | One-way sync with manual re-run |
| **GUI/visual converter** | CLI users (gstack target audience) prefer CLI tools | Stay CLI-only; `gstack-copilot convert` |
| **Skill marketplace/discovery** | Out of scope; skills are local files | Just convert existing gstack skills |
| **gstack telemetry reimplementation** | Don't rebuild gstack's analytics; just preserve config | Pass through existing telemetry config |
| **Playwright browser build on Windows** | gstack's `browse/dist/browse` uses Bun and has Windows issues | Prefer chrome-devtools MCP; Playwright as fallback |
| **Conductor/parallel sprint support** | gstack's conductor.json is advanced; validate single-session first | Single session first; defer parallel |
| **Custom skill authoring** | Users should write skills in gstack format, then convert | Support conversion only, not native Copilot skill authoring |

---

## Feature Dependencies

```
Setup script
  └── Path remapping (must know where to install)
      └── SKILL.md format conversion (installs converted skills)
          └── Bash → PowerShell translation (skills contain bash)
          └── Browse tool abstraction (skills use $B)
              └── chrome-devtools MCP (primary backend)
              └── Playwright (fallback backend)

4 core skills (/office-hours, /review, /qa, /ship)
  └── SKILL.md format conversion (each skill needs conversion)
  └── Browse tool abstraction (/qa, /office-hours use browser)
  └── Cross-skill references (skills reference each other)
```

**Critical path:** Setup script → Path remapping → SKILL.md conversion → Bash/PowerShell + Browse abstraction → Core 4 skills working

---

## MVP Recommendation

**Phase 1: Minimal Viable Adapter**

Prioritize (in order):
1. **SKILL.md format conversion** — Core purpose; without this nothing works
2. **Path remapping** — Simple but essential
3. **Bash → PowerShell translation** — Required for Windows
4. **Setup script** — User's first experience
5. **1 non-browser skill (/review)** — Validate conversion without browser complexity

**Phase 2: Browser Integration**

6. **Browse tool abstraction** — Map `$B` to chrome-devtools
7. **/qa skill** — Validate browser integration
8. **/office-hours skill** — Second browser-using skill

**Phase 3: Full Sprint Workflow**

9. **/ship skill** — Complete the sprint loop
10. **Cross-skill references** — Skills work together

**Defer to v2:**
- Dual browser backend (Playwright fallback)
- Auto-sync with upstream
- Conversion validation
- Additional skills beyond core 4

---

## Complexity Assessment

| Feature | Complexity | Rationale |
|---------|------------|-----------|
| SKILL.md format conversion | **Medium** | YAML parsing + template generation; well-defined mapping |
| Path remapping | **Low** | String replacement with platform detection |
| Bash → PowerShell translation | **High** | Many Bash idioms don't translate cleanly; test coverage needed |
| Browse tool abstraction | **High** | Different paradigms: binary commands vs MCP tool calls |
| Setup script | **Low** | Standard PowerShell installer pattern |
| Tool allowlist mapping | **Low** | Static mapping table |
| Cross-skill references | **Low** | Path pattern replacement |
| Dual browser backend | **High** | Two code paths, testing complexity |
| Auto-sync | **Medium** | Git operations + change detection + re-conversion |
| Conversion validation | **Medium** | Need test harness for skills |

---

## Conversion Mapping Details

### YAML Frontmatter Mapping

| gstack Field | Copilot Equivalent | Notes |
|--------------|-------------------|-------|
| `name` | `name` | Direct mapping |
| `description` | `description` | Direct mapping |
| `user-invocable: true` | (always invocable) | Copilot skills are invocable by default |
| `disable-model-invocation: true` | (no equivalent) | May need instruction in skill body |
| `preamble-tier` | (no equivalent) | Drop; Copilot doesn't tier preambles |
| (none) | `argument-hint` | Add based on skill patterns |
| `allowed-tools: [Bash, Read, ...]` | `allowed-tools: Read, Bash, Grep, Glob, Write, ...` | Map tool names |

### Bash → PowerShell Key Patterns

| Bash | PowerShell | Notes |
|------|------------|-------|
| `[ -f "$FILE" ]` | `Test-Path $FILE -PathType Leaf` | File exists |
| `[ -d "$DIR" ]` | `Test-Path $DIR -PathType Container` | Directory exists |
| `$(command)` | `$(command)` | Subshell (same syntax!) |
| `$VAR` | `$env:VAR` or `$VAR` | Environment vs local variable |
| `source <(cmd)` | `Invoke-Expression (cmd)` | Source from command output |
| `export VAR=val` | `$env:VAR = 'val'` | Environment variable |
| `echo "text"` | `Write-Output "text"` | Output |
| `command 2>/dev/null` | `command 2>$null` | Suppress stderr |
| `command \|\| true` | `command; $LASTEXITCODE = 0` | Ignore failure |
| `find ... -exec` | `Get-ChildItem ... \| ForEach-Object` | File iteration |
| `date +%s` | `[int][double]::Parse((Get-Date -UFormat %s))` | Unix timestamp |

### Browse Command Mapping

| gstack `$B` command | Copilot chrome-devtools | Notes |
|---------------------|------------------------|-------|
| `$B goto <url>` | `chrome-devtools-navigate_page url: <url>` | Navigate |
| `$B snapshot -i` | `chrome-devtools-take_snapshot selector: "body"` | Interactive elements |
| `$B click @e3` | `chrome-devtools-click selector: "[data-ref='e3']"` | Click by ref |
| `$B fill @e4 "value"` | `chrome-devtools-fill selector: "[...]" value: "value"` | Fill input |
| `$B screenshot <path>` | `chrome-devtools-screenshot path: <path>` | Screenshot |
| `$B text` | `chrome-devtools-get_text` | Page text |
| `$B is visible <sel>` | Check via `chrome-devtools-take_snapshot` | State assertion |
| `$B snapshot -D` | (no direct equivalent) | Diff — would need custom |

**Gap:** chrome-devtools MCP is simpler than gstack browse. Some gstack commands have no direct equivalent:
- `$B snapshot -D` (diff mode)
- `$B snapshot -a -o` (annotated screenshot)
- `$B responsive` (multi-viewport screenshots)
- `$B cookie-import-browser` (import from installed browsers)

For these, either: simplify (drop feature) or implement with Playwright fallback.

---

## Sources

- **gstack source:** Cloned from https://github.com/garrytan/gstack (verified 2025-01-20)
- **Copilot CLI skills:** Inspected local `~/.copilot/skills/` installation
- **GSD Copilot port:** Referenced `C:\Workspace\gsd_copilot\.gsd\research\` for similar adapter patterns
- **gstack SKILL.md:** 26KB main skill file with browse documentation
- **gstack setup:** 25KB setup script with multi-host support

**Confidence:** HIGH — direct inspection of both source and target formats from live installations.

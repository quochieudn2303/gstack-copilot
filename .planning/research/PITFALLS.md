# Domain Pitfalls

**Domain:** AI Agent Skill Adapter (Claude Code → Copilot CLI)
**Researched:** 2025-01-15
**Confidence:** HIGH — based on direct analysis of gstack source code

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Bash Process Substitution Has No PowerShell Equivalent

**What goes wrong:** gstack's preamble uses `source <($GSTACK_BIN/gstack-repo-mode)` to dynamically set environment variables. This Bash construct has no direct PowerShell equivalent — `$()` in PowerShell captures output as strings, not executable scripts.

**Why it happens:** Process substitution (`<(...)`) creates a temporary file descriptor that acts as a file. PowerShell's closest equivalent (`$(...)`) returns strings, not file handles.

**Consequences:**
- Skills fail silently with undefined variables (`$REPO_MODE`, `$GSTACK_ROOT`)
- Agent executes partial preambles, leading to broken state
- Hard to debug — no obvious error message

**Real example from gstack:**
```bash
# This Bash pattern appears in every skill preamble
source <($GSTACK_BIN/gstack-repo-mode 2>/dev/null) || true
REPO_MODE=${REPO_MODE:-unknown}
```

**Prevention:**
1. Replace with explicit two-step pattern in PowerShell:
   ```powershell
   $repoModeOutput = & "$env:GSTACK_BIN\gstack-repo-mode.ps1" 2>$null
   if ($repoModeOutput -match 'REPO_MODE=(.+)') { $env:REPO_MODE = $matches[1] }
   ```
2. Create PowerShell wrapper functions for all config-sourcing operations
3. Test every skill preamble execution in isolation before integration

**Detection:**
- Look for `source <(...)` patterns in source skills
- Look for dynamic variable assignment patterns like `${VAR:-default}`
- Test skill execution and check if expected variables are set

---

### Pitfall 2: Path Separator and Home Directory Mismatches

**What goes wrong:** gstack skills hardcode Unix paths (`~/.claude/skills/gstack/`, `/`, `$HOME`). Naive string replacement breaks on Windows edge cases.

**Why it happens:** Windows uses backslashes, different home directory patterns (`$HOME` vs `$env:USERPROFILE`), and drive letters (`C:\`).

**Consequences:**
- File operations fail with "path not found"
- Symlinks don't work the same way (require admin on Windows)
- State files written to wrong locations

**Real example from gstack:**
```bash
GSTACK_ROOT="$HOME/.factory/skills/gstack"
CACHE_FILE="$STATE_DIR/last-update-check"
ln -snf "gstack/$skill_name" "$target"
```

**Prevention:**
1. Use PowerShell's `Join-Path` for all path construction:
   ```powershell
   $GstackRoot = Join-Path $env:USERPROFILE ".copilot\skills\gstack"
   ```
2. Replace symlinks with junction points or direct copies on Windows
3. Create a path normalization utility that handles:
   - `~` → `$env:USERPROFILE`
   - Forward slashes → `[IO.Path]::DirectorySeparatorChar`
   - Unix `/tmp/` → `$env:TEMP`

**Detection:**
- Grep for hardcoded `/` paths in skill files
- Grep for `$HOME`, `~`, `ln -s`
- Test file operations on Windows with paths containing spaces

---

### Pitfall 3: Browser Automation API Impedance Mismatch

**What goes wrong:** gstack's `$B` command wraps Playwright with a specific CLI interface. Copilot's `chrome-devtools-*` MCP tools have completely different APIs, selectors, and return values.

**Why it happens:** gstack invented its own DSL for browser commands (`$B goto`, `$B click`, `$B text`). Copilot uses raw CDP (Chrome DevTools Protocol) tools with different semantics.

**Consequences:**
- 1:1 command mapping is impossible
- Skills assume Playwright's element selection (CSS, XPath, text content)
- CDP returns raw DOM, not Playwright's smart locators
- Screenshot/assertion patterns don't translate

**Real example from gstack browse skill:**
```bash
$B goto https://yourapp.com
$B text                          # content loads?
$B console                       # JS errors?
$B network                       # failed requests?
$B is visible ".main-content"    # key elements present?
```

vs Copilot chrome-devtools:
```
chrome-devtools-navigate_page(url: "...")
chrome-devtools-take_snapshot()  # returns accessibility tree, not text
chrome-devtools-click(selector: "...")  # different selector syntax
```

**Prevention:**
1. Create abstraction layer with gstack-compatible interface:
   ```typescript
   interface BrowserAdapter {
     goto(url: string): Promise<void>
     text(): Promise<string>
     click(selector: string): Promise<void>
     isVisible(selector: string): Promise<boolean>
     // ... map all gstack $B commands
   }
   ```
2. Implement two backends: PlaywrightAdapter, CdpAdapter
3. Accept that some features won't translate (Playwright's smart waiting, auto-retry)
4. Document feature gaps explicitly in skill conversions

**Detection:**
- Grep for `$B` commands in skills
- Create command inventory: which gstack browse commands are used?
- Test browser skills manually before automated testing

---

### Pitfall 4: Semantic Drift During Upstream Updates

**What goes wrong:** gstack updates skills, adds features, changes behavior. Adapter falls out of sync, causing subtle bugs or missing functionality.

**Why it happens:** No automated sync mechanism. Manual diffing is tedious and error-prone. Breaking changes aren't always announced.

**Consequences:**
- Users get different behavior than gstack documentation describes
- New features never make it to Copilot users
- Security fixes get delayed
- Bug fixes require manual porting

**Real example from gstack:**
- VERSION file tracks releases (currently at 1.1.0+)
- CHANGELOG.md documents changes
- Skill files are auto-generated from `.tmpl` templates — raw SKILL.md files change

**Prevention:**
1. Track upstream commit hash in adapter metadata:
   ```json
   { "upstreamCommit": "abc123", "lastSync": "2025-01-15" }
   ```
2. Create diffing tool that compares:
   - SKILL.md.tmpl changes (the source of truth)
   - Bin script changes (gstack-config, gstack-repo-mode)
   - VERSION bumps
3. Subscribe to gstack releases (GitHub watch)
4. Quarterly sync schedule minimum

**Detection:**
- Compare `upstreamCommit` to current gstack main
- Run `git diff <tracked-commit>..main -- '*.tmpl'` on gstack repo
- Check VERSION file for changes

---

## Moderate Pitfalls

### Pitfall 5: Tool Invocation Syntax Differences

**What goes wrong:** gstack's `allowed-tools` in YAML frontmatter uses Claude Code tool names (`Bash`, `Read`, `AskUserQuestion`). Copilot uses different names and invocation patterns.

**Prevention:**
1. Create tool name mapping table:
   | gstack | Copilot |
   |--------|---------|
   | `Bash` | `powershell` or `run_in_terminal` |
   | `Read` | `view` |
   | `AskUserQuestion` | `ask_user` or native prompts |
2. Transform YAML frontmatter during conversion
3. Document which tools have no equivalent (may need workarounds)

**Detection:**
- Parse `allowed-tools` from all skills
- Check Copilot skill format documentation for valid tool names
- Test skill loading in Copilot to catch invalid tool references

---

### Pitfall 6: State File Location Conflicts

**What goes wrong:** gstack uses `~/.gstack/` for all state (config, analytics, session markers). Running both gstack and gstack-copilot creates conflicts.

**Prevention:**
1. Use separate state directory: `~/.gstack-copilot/` or `$env:USERPROFILE\.gstack-copilot`
2. Keep state file format compatible for potential interop
3. Document the separation clearly

**Detection:**
- Look for `~/.gstack/` references in skills and bin scripts
- Test with both gstack and gstack-copilot installed

---

### Pitfall 7: Date/Time Command Incompatibilities

**What goes wrong:** gstack uses GNU date commands (`date +%s`, `date -u +%Y-%m-%dT%H:%M:%SZ`). PowerShell has different syntax.

**Real example from gstack:**
```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

**Prevention:**
```powershell
# Unix epoch seconds
$TelEnd = [int][double]::Parse((Get-Date -UFormat %s))
# ISO 8601 UTC
$Timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
```

**Detection:**
- Grep for `date +` patterns
- Grep for arithmetic with dates `$(( ... ))`

---

### Pitfall 8: find/grep/awk/sed UNIX Tool Dependencies

**What goes wrong:** gstack preambles use UNIX text processing tools heavily. These don't exist on Windows or have different syntax.

**Real example from gstack:**
```bash
_SESSIONS=$(find ~/.gstack/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
grep -qF "${KEY}:" "$CONFIG_FILE"
awk '{print $2}'
sed "s/^${KEY}:.*/${KEY}: ${ESC_VALUE}/"
```

**Prevention:**
1. Replace with PowerShell equivalents:
   ```powershell
   # find → Get-ChildItem
   $Sessions = (Get-ChildItem "$env:USERPROFILE\.gstack\sessions" -File |
     Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-120) }).Count

   # grep → Select-String
   Select-String -Path $ConfigFile -Pattern "^${Key}:" -Quiet

   # awk → ForEach-Object with -split
   $content | ForEach-Object { ($_ -split '\s+')[1] }

   # sed → -replace
   $content -replace "^${Key}:.*", "${Key}: ${Value}"
   ```
2. Create PowerShell utility module with matching function names
3. Consider bundling busybox/coreutils if UNIX compat is easier

**Detection:**
- Grep for: `find `, `grep `, `awk `, `sed `, `wc `, `tr `, `cut `, `head `, `tail `
- Count unique occurrences to prioritize conversion effort

---

### Pitfall 9: Skill File Size and Token Limits

**What goes wrong:** gstack skills are LARGE (office-hours: 70KB, browse: 22KB, main SKILL.md: 26KB). Copilot may have different token limits or loading behavior.

**Prevention:**
1. Measure token counts for each skill
2. Test skill loading in Copilot with full-size files
3. Consider splitting mega-skills into focused sub-skills
4. Strip redundant preamble boilerplate (shared across skills)

**Detection:**
- Measure file sizes of all skills
- Test skill invocation response time
- Check Copilot documentation for skill size limits

---

## Minor Pitfalls

### Pitfall 10: Exit Code Handling Differences

**What goes wrong:** Bash uses `set -euo pipefail` and `|| true` patterns. PowerShell has different error handling (`$ErrorActionPreference`, `-ErrorAction`).

**Prevention:**
```powershell
# Equivalent to set -e (stop on first error)
$ErrorActionPreference = "Stop"

# Equivalent to || true (ignore errors)
try { SomeCommand } catch { }
# or
SomeCommand -ErrorAction SilentlyContinue
```

**Detection:**
- Look for `set -e`, `set -u`, `|| true` patterns
- Test error scenarios in converted scripts

---

### Pitfall 11: Shebang and Script Execution

**What goes wrong:** gstack bin scripts use `#!/usr/bin/env bash`. Windows doesn't respect shebangs without WSL.

**Prevention:**
1. Create `.ps1` versions of all bin scripts
2. Use file extension association (`.ps1` runs in PowerShell)
3. Or wrap in batch files for CMD compatibility

**Detection:**
- List all files in `bin/` directory
- Check for shebang lines

---

### Pitfall 12: YAML Frontmatter Format Differences

**What goes wrong:** gstack's YAML frontmatter has fields like `preamble-tier`, `user-invocable`. Copilot may expect different fields.

**Real example:**
```yaml
# gstack format
---
name: office-hours
description: |
  YC Office Hours — two modes...
user-invocable: true
---
```

```yaml
# Copilot format (hypothetical)
---
name: office-hours
argument-hint: "describe your product idea"
allowed-tools:
  - powershell
  - view
---
```

**Prevention:**
1. Document exact Copilot skill format requirements
2. Create YAML transformer that:
   - Maps field names
   - Adds required Copilot fields
   - Removes unsupported gstack fields
3. Validate transformed YAML against Copilot schema

**Detection:**
- Compare gstack and Copilot skill format documentation
- Test skill loading with transformed YAML

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Format Converter | Pitfall 12: YAML differences | Create validation suite against Copilot schema |
| Tool Mapping (Bash→PS) | Pitfalls 1,2,7,8: Shell incompatibilities | Start with comprehensive mapping table; test each pattern |
| Browser Abstraction | Pitfall 3: API impedance | Accept 80% coverage first; document gaps |
| Upstream Sync | Pitfall 4: Semantic drift | Build diffing tool before shipping v1 |
| State Management | Pitfall 6: Location conflicts | Use separate directory from day 1 |

## Verification Checklist for Each Converted Skill

Before declaring a skill "ported":

- [ ] All process substitution replaced with explicit variable capture
- [ ] All paths use `Join-Path` or path normalization
- [ ] All UNIX tools replaced with PowerShell equivalents
- [ ] All date commands converted to PowerShell format
- [ ] YAML frontmatter transformed and validated
- [ ] Browser commands mapped or documented as unsupported
- [ ] Manual execution test on Windows PowerShell
- [ ] State files written to correct location
- [ ] Error handling matches original behavior

## Sources

- Direct analysis of [garrytan/gstack](https://github.com/garrytan/gstack) source code (commit analyzed: main branch as of 2025-01-15)
- gstack SKILL.md files: main skill, office-hours, browse, review
- gstack bin scripts: gstack-config, gstack-repo-mode, gstack-update-check
- gstack setup script (multi-host installation patterns)
- Microsoft PowerShell documentation for command equivalents
- GitHub Copilot CLI skill format (documented behavior)

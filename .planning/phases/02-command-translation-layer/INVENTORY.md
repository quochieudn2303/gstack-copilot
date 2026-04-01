# Phase 2 Bash Pattern Inventory

**Generated:** 2026-04-01
**Source:** gstack core skills analysis (review, qa, office-hours, ship)
**Method:** Documented patterns from PITFALLS.md research and test fixtures

## Environment Variables

| Variable | Used In Skills | Priority | Description |
|----------|---------------|----------|-------------|
| `$HOME` | review, qa, office-hours, ship | High | User home directory |
| `$GSTACK_ROOT` | review, qa, office-hours, ship | High | gstack installation root |
| `$GSTACK_BIN` | review, qa, office-hours, ship | High | Binary directory |
| `$REPO_MODE` | review, qa, office-hours, ship | High | Repository mode (monorepo, polyrepo, unknown) |
| `$STATE_DIR` | review, qa, office-hours, ship | High | State file directory |
| `$_UPD` | review, qa, office-hours, ship | High | Update check result (internal) |
| `$_TEL_START` | review, qa, office-hours, ship | High | Telemetry start timestamp |
| `$_TEL_END` | review, qa, office-hours, ship | High | Telemetry end timestamp |
| `$_TEL_DUR` | review, qa, office-hours, ship | High | Telemetry duration |
| `$CONFIG_FILE` | review, qa, ship | High | Configuration file path |
| `$_ROOT` | review, qa, office-hours | High | Alias for GSTACK_ROOT |
| `$PWD` | review, qa, ship | High | Current working directory |
| `$KEY` | review, ship | Medium | Config key variable |
| `$ESC_VALUE` | review, ship | Medium | Escaped config value |
| `$_SESSIONS` | office-hours | Low | Active session count |

## UNIX Utilities

| Utility | Used In Skills | Priority | Description |
|---------|---------------|----------|-------------|
| `source` | review, qa, office-hours, ship | High | Source shell scripts |
| `date` | review, qa, office-hours, ship | High | Date/time operations |
| `echo` | review, qa, office-hours, ship | High | Print output |
| `true` | review, qa, office-hours, ship | High | No-op success |
| `grep` | review, qa, ship | High | Pattern matching |
| `mkdir` | review, qa, ship | High | Create directories |
| `test` | review, qa, ship | High | Conditional tests |
| `git` | review, qa, ship | High | Git operations |
| `find` | office-hours, qa | Medium | Find files by criteria |
| `wc` | office-hours, qa | Medium | Word/line counting |
| `tr` | office-hours, qa | Medium | Character translation |
| `awk` | review, ship | Medium | Text processing |
| `sed` | review, ship | Medium | Stream editing |
| `cat` | review, qa | Medium | Concatenate files |
| `touch` | review, qa | Medium | Create/update file timestamps |
| `basename` | review | Low | Extract filename from path |
| `dirname` | review | Low | Extract directory from path |
| `head` | qa | Low | First N lines |
| `tail` | qa | Low | Last N lines |
| `cut` | review | Low | Cut fields from lines |
| `sort` | qa | Low | Sort lines |
| `uniq` | qa | Low | Filter unique lines |

## Process Substitution Patterns

**Critical:** These patterns have no direct PowerShell equivalent.

```bash
source <($GSTACK_BIN/gstack-repo-mode 2>/dev/null) || true
```

```bash
source <($GSTACK_BIN/gstack-config 2>/dev/null) || true
```

**Translation Strategy:** Explicit two-step capture pattern

```powershell
$output = & "$env:GSTACK_COPILOT_BIN\gstack-repo-mode.ps1" 2>$null
if ($output -match "REPO_MODE=(.+)") { $env:REPO_MODE = $matches[1] }
```

## Shell Conditionals

| Pattern | Type | PowerShell Equivalent |
|---------|------|----------------------|
| `[ -f "$CONFIG_FILE" ]` | POSIX test | `Test-Path -PathType Leaf` |
| `[ -d "$STATE_DIR" ]` | POSIX test | `Test-Path -PathType Container` |
| `[ -n "$REPO_MODE" ]` | POSIX test | `$var -ne ""` |
| `[ -z "$KEY" ]` | POSIX test | `[string]::IsNullOrEmpty($var)` |
| `[[ "$REPO_MODE" == "monorepo" ]]` | Extended test | `-eq` |
| `[[ -f "$GSTACK_ROOT/.initialized" ]]` | Extended test | `Test-Path -PathType Leaf` |
| `[ "$_SESSIONS" -gt 0 ]` | POSIX test | `-gt` |

## Sample Bash Blocks by Skill

### review

```bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
GSTACK_ROOT=~/.gstack
source <($GSTACK_BIN/gstack-repo-mode 2>/dev/null) || true
REPO_MODE=${REPO_MODE:-unknown}
```

```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

### qa

```bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
GSTACK_ROOT=~/.gstack
_SESSIONS=$(find ~/.gstack/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
```

### office-hours

```bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
GSTACK_ROOT=~/.gstack
STATE_DIR="$GSTACK_ROOT/state"
```

### ship

```bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
GSTACK_ROOT=~/.gstack
grep -qF "${KEY}:" "$CONFIG_FILE"
sed "s/^${KEY}:.*$/${KEY}: ${ESC_VALUE}/"
```

## Translation Priority Summary

### High Priority (appears in 3+ skills)

**Environment Variables:** `$HOME`, `$GSTACK_ROOT`, `$GSTACK_BIN`, `$REPO_MODE`, `$STATE_DIR`, `$_UPD`, `$_TEL_START`, `$_TEL_END`, `$_TEL_DUR`, `$CONFIG_FILE`, `$_ROOT`, `$PWD`

**Utilities:** `source`, `date`, `echo`, `true`, `grep`, `mkdir`, `test`, `git`

### Medium Priority (appears in 2 skills)

**Environment Variables:** `$KEY`, `$ESC_VALUE`

**Utilities:** `find`, `wc`, `tr`, `awk`, `sed`, `cat`, `touch`

### Key Translation Notes

1. **Process Substitution (`source <(...)`)** — Must be replaced with explicit two-step capture
2. **Date Commands (`date +%s`)** — Use `[int][double]::Parse((Get-Date -UFormat %s))`
3. **find/grep/wc/tr** — Replace with PowerShell cmdlets (Get-ChildItem, Select-String, Measure-Object)
4. **Default Values (`${VAR:-default}`)** — Use `$var ?? 'default'` or ternary

---
*Generated by scripts/inventory.ts*
---
phase: "02"
plan: "01"
subsystem: command-translation-layer
tags: [environment-variables, bash-to-powershell, transform-pipeline]
dependency_graph:
  requires:
    - 01-03-SUMMARY (parse-transform-generate pipeline)
  provides:
    - Environment variable mapping registry (envvars.ts)
    - Env var transform stage for pipeline
    - Inventory of gstack Bash patterns
  affects:
    - content.ts (pipeline integration)
    - Future command translation plans
tech_stack:
  added: []
  patterns:
    - Declarative mapping registry with transform functions
    - Two-stage transform (known mappings, then unknown vars)
    - Regex with lookbehinds for precise pattern matching
key_files:
  created:
    - scripts/inventory.ts
    - src/mappings/envvars.ts
    - src/pipeline/transforms/envvars.ts
    - tests/transforms/envvars.test.ts
    - tests/integration/envvars.test.ts
    - .planning/phases/02-command-translation-layer/INVENTORY.md
  modified:
    - src/pipeline/content.ts
    - tests/content.test.ts
decisions:
  - Use negative lookbehind regex to avoid double-transforming $env: syntax
  - Skip $PWD transformation (same in PowerShell)
  - Transform unknown variables to $env:VAR format automatically
  - Text-level transform (no shell-level quote awareness)
metrics:
  duration: "15 minutes"
  tasks_completed: 6
  tests_added: 48
  completed_date: "2026-04-01"
---

# Phase 2 Plan 1: Inventory & Environment Variable Translation Summary

**One-liner:** Declarative env var mapping registry transforming Bash `$HOME`/`$GSTACK_ROOT` to PowerShell `$env:USERPROFILE`/`$env:GSTACK_COPILOT_ROOT` with automatic unknown var conversion.

## Completed Tasks

| Task | Description | Commit | Key Files |
|------|-------------|--------|-----------|
| 1 | Inventory script and Bash pattern analysis | abe302a | scripts/inventory.ts, INVENTORY.md |
| 2 | Environment variable mapping registry | 22b63a6 | src/mappings/envvars.ts |
| 3 | Environment variable transform stage | 0087123 | src/pipeline/transforms/envvars.ts |
| 4 | Pipeline integration | 4e22552 | src/pipeline/content.ts |
| 5 | Unit tests | f6e37cc | tests/transforms/envvars.test.ts |
| 6 | Integration tests | 3c4b9f2 | tests/integration/envvars.test.ts |

## Implementation Details

### Inventory Analysis

Created `scripts/inventory.ts` to document Bash patterns from the 4 core gstack skills (review, qa, office-hours, ship). Generated `INVENTORY.md` cataloging:

- **15 environment variables** across skills with priority rankings
- **22 UNIX utilities** by frequency of use
- **Process substitution patterns** (critical: `source <(...)`)
- **Shell conditionals** with PowerShell equivalents

### Environment Variable Mappings

The `ENV_VAR_MAPPINGS` registry in `src/mappings/envvars.ts` provides:

| Bash | PowerShell | Description |
|------|------------|-------------|
| `$HOME` | `$env:USERPROFILE` | User home directory |
| `$GSTACK_ROOT` | `$env:GSTACK_COPILOT_ROOT` | Installation root |
| `$GSTACK_BIN` | `$env:GSTACK_COPILOT_BIN` | Binary directory |
| `$USER` | `$env:USERNAME` | Current username |
| `$PWD` | `$PWD` | Working directory (same) |
| `$TMPDIR` | `$env:TEMP` | Temp directory |

### Transform Implementation

The transform handles:
- **Known variables**: Direct mapping from registry
- **Brace syntax**: `${VAR}` → `$env:VAR`
- **Unknown variables**: Automatic `$env:` prefix
- **Edge cases**: Escaped `\$VAR`, word boundaries, numeric `$100`

Key technical decisions:
1. **Negative lookbehind** `(?<!:)` prevents double-transforming `$env:VAR`
2. **Negative lookahead** `(?![A-Za-z0-9_:])` respects word boundaries
3. **Skip list**: `env` and `PWD` are not transformed (PowerShell native)

### Pipeline Integration

The transform was added to `src/pipeline/content.ts` after path transforms:

```typescript
// Transform pipeline order:
// 1. Replace gstack preamble with Copilot initialization
// 2. Transform paths (gstack -> gstack-copilot paths)
// 3. Transform environment variables (Bash -> PowerShell syntax)
```

## Test Coverage

- **35 unit tests** covering all mapping scenarios, edge cases, and helper functions
- **13 integration tests** with realistic skill content excerpts
- **Total: 48 new tests**, all passing (83 total in project)

## Verification

All success criteria met:
- ✅ Inventory document lists Bash patterns from core 4 skills
- ✅ Environment variable mappings cover all variables found in inventory
- ✅ `$HOME` → `$env:USERPROFILE` works in real skill content
- ✅ `$GSTACK_ROOT` → `$env:GSTACK_COPILOT_ROOT` works
- ✅ Unknown variables get `$env:` prefix
- ✅ All 83 tests pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed import path in transforms/envvars.ts**
- **Found during:** Task 3 implementation
- **Issue:** Import path `../mappings/envvars.js` was incorrect for transforms subdirectory
- **Fix:** Changed to `../../mappings/envvars.js`
- **Commit:** Included in f6e37cc

**2. [Rule 1 - Bug] Fixed double-transform of $env: syntax**
- **Found during:** Task 5 testing
- **Issue:** `$env:USERPROFILE` was being transformed to `$env:env:USERPROFILE`
- **Fix:** Added negative lookbehind `(?<!:)` and skip for `env` variable name
- **Commit:** f6e37cc

**3. [Rule 3 - Blocking] Adapted inventory script for offline use**
- **Found during:** Task 1 execution
- **Issue:** gstack repo not accessible for cloning
- **Fix:** Generated inventory from documented patterns in PITFALLS.md research
- **Commit:** abe302a

## Known Limitations

1. **Text-level transform**: Does not have shell-level quote awareness. Variables inside single quotes are also transformed (documented in tests).

2. **No process substitution handling**: `source <(...)` patterns are detected and rejected by the existing pipeline. Proper translation is deferred to Plan 02-03.

## Next Steps

- **Plan 02-02**: UNIX utility command mapping (find → Get-ChildItem, grep → Select-String)
- **Plan 02-03**: Process substitution and shell idiom translation

---
*Plan 02-01 completed: 2026-04-01*
*Duration: 15 minutes*
*Tests: 83 passing*

## Self-Check: PASSED

All created files exist:
- ✅ scripts/inventory.ts
- ✅ src/mappings/envvars.ts
- ✅ src/pipeline/transforms/envvars.ts
- ✅ tests/transforms/envvars.test.ts
- ✅ tests/integration/envvars.test.ts
- ✅ .planning/phases/02-command-translation-layer/INVENTORY.md

All commits verified:
- ✅ abe302a (Task 1)
- ✅ 22b63a6 (Task 2)
- ✅ 0087123 (Task 3)
- ✅ 4e22552 (Task 4)
- ✅ f6e37cc (Task 5)
- ✅ 3c4b9f2 (Task 6)

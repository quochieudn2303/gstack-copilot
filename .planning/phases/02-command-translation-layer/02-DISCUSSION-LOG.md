# Phase 2: Command Translation Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30T00:00:00+07:00
**Phase:** 02-command-translation-layer
**Areas discussed:** Translation scope, Registry structure, PowerShell conventions, Unsupported constructs

---

## Translation Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Core-skills-first | Only translate the shell constructs needed by `/review`, `/qa`, `/office-hours`, and `/ship` first | ✓ |
| Broad coverage first | Build a generalized Bash translator for most upstream skills immediately | |
| Minimal patching | Only translate the exact fixture currently under test | |

**User's choice:** Auto-selected by `gsd-next` zero-friction routing: `Core-skills-first`
**Notes:** This matches the roadmap strategy of validating the essential sprint loop before broadening scope.

---

## Registry Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Separate registries by concern | Keep commands, env vars, and shell idioms in distinct mapping modules | ✓ |
| Single giant mapping file | Put all translation rules into one registry file for simplicity | |
| Inline logic only | Hard-code translation logic directly inside pipeline stages | |

**User's choice:** Auto-selected by `gsd-next` zero-friction routing: `Separate registries by concern`
**Notes:** This carries forward the successful Phase 1 `tools.ts` and `paths.ts` pattern.

---

## PowerShell Conventions

| Option | Description | Selected |
|--------|-------------|----------|
| Idiomatic PowerShell | Use cmdlets, `$env:*`, and `Join-Path` to preserve behavior cleanly | ✓ |
| Literal Bash mimicry | Preserve Bash-like structure even when it looks unnatural in PowerShell | |
| External compatibility layer | Rely on Unix tools or shims to avoid translating behavior | |

**User's choice:** Auto-selected by `gsd-next` zero-friction routing: `Idiomatic PowerShell`
**Notes:** This matches the Windows-first project constraint and avoids introducing runtime dependencies.

---

## Unsupported Constructs

| Option | Description | Selected |
|--------|-------------|----------|
| Fail fast with actionable errors | Stop conversion when a construct cannot be translated safely | ✓ |
| Best-effort output | Emit partial translation and warn about uncertain behavior | |
| Skip silently | Leave unknown shell constructs untouched in output | |

**User's choice:** Auto-selected by `gsd-next` zero-friction routing: `Fail fast with actionable errors`
**Notes:** This carries forward the strict-validation policy established in Phase 1.

---

## the agent's Discretion

- Internal registry naming and transformer composition.
- Exact error message formatting.
- The balance between regex-based rewrites and small helper functions, as long as semantics remain explicit and testable.

## Deferred Ideas

None.

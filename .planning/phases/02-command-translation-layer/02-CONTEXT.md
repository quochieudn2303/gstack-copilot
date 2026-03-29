# Phase 2: Command Translation Layer - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 extends the working Phase 1 converter so Bash-heavy gstack skill content can be translated into PowerShell-friendly Copilot skill content. This phase is about deterministic command and shell construct translation only: command mappings, environment-variable syntax, process substitution handling, and related helper patterns that unblock later skill ports.

This phase does not add new end-user skills, browser abstractions, or setup flows. It makes the converter capable of translating the shell semantics those later phases depend on.

</domain>

<decisions>
## Implementation Decisions

### Translation Scope
- **D-01:** Prioritize the Bash constructs that appear in the core four target skills first: common UNIX utilities, environment variable syntax, process substitution, and simple shell conditionals.
- **D-02:** Keep translation strict and fail-fast. If a shell construct cannot be translated safely, the converter should raise an actionable `ConversionError` instead of emitting partial or misleading PowerShell.
- **D-03:** Translate semantics, not literal syntax. The goal is idiomatic, working PowerShell output that preserves behavior, not a one-to-one token rewrite of Bash.

### Mapping Registry Design
- **D-04:** Extend the Phase 1 registry pattern with dedicated mapping modules by concern: command mappings, environment variable mappings, and shell idiom/pattern rewrites.
- **D-05:** Keep mapping data declarative and easily testable. Prefer structured registries and small transformer helpers over embedding ad hoc replacement logic across pipeline files.
- **D-06:** Preserve the ordered pipeline architecture from Phase 1. Phase 2 should plug into the existing parse → transform → generate flow rather than creating a parallel conversion path.

### PowerShell Output Conventions
- **D-07:** Normalize filesystem paths and special locations through PowerShell-native patterns such as `Join-Path`, `$env:USERPROFILE`, and `$env:TEMP` rather than naive slash substitution.
- **D-08:** Where gstack preambles currently rely on sourced Bash helpers, translate them into explicit two-step PowerShell capture and parsing patterns instead of attempting shell emulation.
- **D-09:** Prefer PowerShell built-ins and cmdlets over bundling Unix compatibility layers. Busybox/coreutils are out of scope for this phase.

### Unsupported and Deferred Constructs
- **D-10:** Inventory coverage should be driven by the core sprint skills before broadening to all 20+ upstream skills.
- **D-11:** Complex shell features beyond the current target set, such as advanced `sed`/`awk` pipelines or browser-specific DSL translation, remain out of scope unless they are required by the core four skills.

### the agent's Discretion
- Exact registry file names and internal TypeScript types.
- Whether command translation happens in one content transform stage or a small sequence of transform helpers inside the same stage.
- The exact wording and formatting of translation error messages, as long as they remain actionable and source-aware.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Definition
- `.planning/ROADMAP.md` — Phase 2 goal, dependency chain, and success criteria.
- `.planning/REQUIREMENTS.md` — TOOL-01 through TOOL-04 traceability and scope boundaries.
- `.planning/PROJECT.md` — current project state and validated Phase 1 foundation.

### Technical Constraints
- `.planning/research/PITFALLS.md` — authoritative list of Bash/PowerShell incompatibilities that Phase 2 must address.
- `.planning/research/STACK.md` — Phase 1 technology choices and architectural constraints that still apply.

### Prior Phase Decisions
- `.planning/phases/01-core-conversion-pipeline/CONTEXT.md` — Phase 1 decisions on strict validation, one-time conversion mode, and source handling.
- `.planning/phases/01-core-conversion-pipeline/01-03-SUMMARY.md` — Phase 1 converter API and CLI patterns that Phase 2 should extend rather than replace.
- `.planning/phases/01-core-conversion-pipeline/01-VERIFICATION.md` — verified properties of the existing converter pipeline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/mappings/tools.ts` — existing registry pattern for declarative tool-name mapping.
- `src/mappings/paths.ts` — existing regex-based mapping registry and reducer helper for content rewrites.
- `src/pipeline/content.ts` — current content-stage integration point for additional shell translation logic.
- `src/pipeline/parse.ts` — shared `ConversionError` type with filepath and line support for fail-fast reporting.
- `tests/fixtures/review-skill.md` — realistic gstack fixture that already includes Bash preamble content to extend in Phase 2 tests.

### Established Patterns
- Small, isolated mapping modules feed thin pipeline stages.
- Conversion failures are explicit and source-aware rather than silently tolerated.
- Tests use fixture-driven assertions and end-to-end validation, not only unit-level string checks.

### Integration Points
- New mapping files should live alongside `src/mappings/tools.ts` and `src/mappings/paths.ts`.
- New translation logic should integrate into `src/pipeline/content.ts` or closely related helpers so the public pipeline API remains stable.
- Phase 2 tests should extend the current Vitest structure with focused transform tests plus at least one integration assertion through `convertSkill()`.

</code_context>

<specifics>
## Specific Ideas

- Inventory the actual Bash patterns used across `/review`, `/qa`, `/office-hours`, and `/ship` before over-engineering the registry.
- Treat `source <(cmd)` as the highest-priority pattern because it is explicitly called out as a critical incompatibility and appears in every gstack preamble.
- Keep the output PowerShell readable; later skill authors and debuggers should be able to understand the translated content without reverse-engineering generated code.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 02-command-translation-layer*
*Context gathered: 2026-03-30*

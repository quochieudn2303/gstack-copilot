# Retrospective: gstack-copilot

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-05  
**Phases:** 6 | **Plans:** 18

### What Was Built

- A working Copilot CLI port of gstack's core sprint loop for GitHub Copilot CLI.
- A converter CLI plus Bash-to-PowerShell translation pipeline for gstack-style skills.
- Checked-in `/review`, `/qa`, `/office-hours`, and `/ship` skills backed by runtime helpers and artifact builders.
- A reusable Chrome DevTools browser abstraction, dual setup entrypoints, and final release scaffolding.

### What Worked

- Typed runtime helpers kept behavior verifiable instead of burying it inside large markdown artifacts.
- Deterministic fixtures plus live UAT surfaced real host/runtime mismatches before they became release blockers.
- The browser adapter boundary let Phase 4 unlock both browser-heavy skills without duplicated automation logic.

### What Was Inefficient

- Some completed phase work stayed uncommitted too long, which made milestone close-out heavier than it needed to be.
- External review findings were addressed after initial completion instead of being folded into the first execution pass.
- No standalone milestone audit was run before archival, so final confidence relied on stitched-together phase verification.

### Patterns Established

- Builder-generated checked-in skill artifacts should remain the source of truth and be pinned by artifact tests.
- Host-specific behavior belongs in testable runtime helpers with markdown artifacts acting as thin invocation surfaces.
- Browser and setup phases need both deterministic automated coverage and at least one live UAT pass.

### Key Lessons

- Keep host ports narrow and typed; do not try to port every source-skill behavior into one artifact blindly.
- Prefer explicit fallback guidance when the host tool surface is incomplete instead of hiding unsupported behavior.
- Commit completed phase work promptly so milestone completion stays administrative rather than operational.

### Cost Observations

- Model mix: `quality` profile, inline execution, no subagent fan-out required for milestone delivery
- Sessions: 10
- Notable: most rework came from artifact/contract drift and late archival, not core architecture mistakes

## Cross-Milestone Trends

- v1.0 establishes the baseline; future milestones should track audit coverage, branch hygiene, and how often review/UAT catches contract drift.

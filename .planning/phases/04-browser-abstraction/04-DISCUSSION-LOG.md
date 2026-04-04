# Phase 4: Browser Abstraction - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02T00:00:00+07:00
**Phase:** 04-browser-abstraction
**Areas discussed:** Abstraction shape, Browser command surface, Unsupported command behavior

---

## Abstraction Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Broad single interface | One broad interface for all browser operations | |
| Core interface + capability extensions | Small required interface plus optional capabilities for broader QA/discovery actions | ✓ |
| Two-tier adapters | Separate base browser adapter and higher-level QA adapter | |

**User's choice:** Default recommendation
**Notes:** User chose the default approach: a core interface plus capability extensions.

---

## Browser Command Surface

| Option | Description | Selected |
|--------|-------------|----------|
| Default surface | Core methods: `navigate`, `click`, `fill`, `screenshot`, `snapshot`; capability methods: `waitFor`, `evaluate`, `hover`, `console`, `network`; exclude file upload, auth/session import, responsive/device emulation | ✓ |
| Add more now | Expand the surface beyond the default set immediately | |
| Narrow first pass | Reduce the surface below the default set | |

**User's choice:** Default recommendation
**Notes:** User accepted the default surface and explicitly chose to keep file upload out for now.

---

## Unsupported Command Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Structured fallback first | Return explicit fallback guidance; fail only when the action is essential and no safe fallback exists | ✓ |
| Strict fail-fast | Error immediately on any unsupported browser action | |
| Partial result behavior | Continue with partial unsupported result objects | |

**User's choice:** Structured fallback first
**Notes:** User accepted the default recommendation.

---

## the agent's Discretion

- Exact adapter interface names and module layout.
- Exact typed representation for unsupported/fallback responses.
- The deterministic backend verification flow chosen for Phase 4.

## Deferred Ideas

None.

# Phase 5: Browser Skills - /qa, /office-hours - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 05-browser-skills-qa-office-hours
**Areas discussed:** `/qa` default operating mode, `/qa` test scope and evidence, `/office-hours` output contract

---

## `/qa` Default Operating Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Report-only by default | Finds bugs, gathers evidence, and stops unless the user explicitly asks to fix. | |
| Test then fix in one session | `/qa` can move from findings into fixes in the same run after showing issues. | ✓ |
| Always fix when issues are found | Optimized for speed, but riskier and less reviewable. | |

**User's choice:** Test then fix in one session.
**Notes:** The user explicitly required confirmation before any fix step. `/qa` should therefore be findings-first, then same-session fix only after explicit confirmation.

---

## `/qa` Test Scope and Evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Guided flow by default | Best for deterministic QA and aligns with the current Phase 4 browser fixture pattern. | ✓ |
| Single page by default | Faster and simpler, but weaker at finding interaction bugs. | |
| Broad crawl by default | More ambitious, but noisier and riskier for the first browser skill port. | |

**User's choice:** Guided flow by default.
**Notes:** The user accepted the recommended evidence model and severity default. `/qa` should therefore include screenshots, repro steps, and console/network evidence when relevant, and classify issues using `critical/high/medium/low`.

---

## `/office-hours` Output Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Both conversation and structured memo | Durable product thinking plus immediate conversational feedback. | ✓ |
| Conversation-first only | Faster and lighter, but less durable. | |
| Structured memo only | More formal, but less interactive. | |

**User's choice:** Both conversation and structured memo.
**Notes:** The user accepted the recommended memo shape: product/design critique first, then a concise recommended direction at the end.

---

## the agent's Discretion

- Exact memo filename/location for `/office-hours`
- Exact flags/invocation contract for `/qa` and `/office-hours`
- Which of the two skills lands first during execution

## Deferred Ideas

None.

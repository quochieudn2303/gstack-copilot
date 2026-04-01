# Phase 3: First Skill - /review - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02T00:00:00+07:00
**Phase:** 03-first-skill-review
**Areas discussed:** Review scope, Auto-fix policy, Base branch and invocation contract

---

## Review Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Branch diff by default | Review the current branch diff against a base branch; local uncommitted changes are opt-in | ✓ |
| Include working tree by default | Review branch diff plus uncommitted changes in the default run | |
| Local-only review | Focus on current uncommitted working tree unless user requests branch diff | |

**User's choice:** Branch diff by default
**Notes:** User accepted the recommended default with “ok”. Uncommitted working-tree review is opt-in.

---

## Auto-fix Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Report-only unless explicit fix request | Show findings first; only fix when the user explicitly asks | |
| Auto-fix safe issues by default | Automatically apply low-risk fixes after review | |
| Report then fix with confirmation | Show findings first, then allow fixes in the same session after explicit confirmation | ✓ |

**User's choice:** Report then fix with confirmation
**Notes:** User said “report then fix” and accepted the recommended detail that fixes can happen in the same session only after explicit confirmation.

---

## Base Branch and Invocation Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Optional base arg with autodetect default | `/review [base-branch]`, defaulting to `origin/main`, then `origin/master`, then repo default branch | ✓ |
| Explicit base branch required | User must always supply the base branch | |
| Repo default only | Always use the repo default branch, with no branch argument exposed | |

**User's choice:** Optional base arg with autodetect default
**Notes:** User accepted the recommended default with “ok”.

---

## the agent's Discretion

- Exact `argument-hint` wording.
- Report formatting details as long as findings appear before any fix step.
- Exact opt-in flag shape for including uncommitted working-tree changes later.

## Deferred Ideas

None.

# Phase 4: Browser Abstraction - Research

**Researched:** 2026-04-02  
**Domain:** Browser abstraction for Copilot CLI using Chrome DevTools MCP first  
**Confidence:** High

## Summary

Phase 4 should define a reusable browser API boundary that is small at the core, extensible through capability flags, and proven first through a `chrome-devtools` backend. The official Chrome DevTools MCP documentation confirms that the available tool surface is broader than the Phase 4 roadmap minimum: in addition to `navigate_page`, `click`, `fill`, `take_screenshot`, and `take_snapshot`, the current tool reference includes `hover`, `wait_for`, `evaluate_script`, `list_console_messages`, and `list_network_requests`. That lines up well with the Phase 4 decision to use a core interface plus capability extensions.

The most important planning constraint is still the browser API impedance mismatch already identified in `PITFALLS.md`: gstack’s `$B` DSL is not a 1:1 wrapper around raw Chrome DevTools MCP tools. That means the adapter should expose stable domain methods and typed fallback behavior, not simply mirror tool names or assume all browser operations exist in all backends.

## Primary Sources

- Chrome DevTools MCP official blog announcement: [https://developer.chrome.com/blog/chrome-devtools-mcp](https://developer.chrome.com/blog/chrome-devtools-mcp)
- Chrome DevTools MCP tool reference / registry page: [https://github.com/mcp/chromedevtools/chrome-devtools-mcp](https://github.com/mcp/chromedevtools/chrome-devtools-mcp)

## Key Findings

### 1. Official tool surface is already broad enough for the chosen capability model

The official Chrome DevTools MCP tool reference lists:
- Input automation: `click`, `fill`, `fill_form`, `hover`, `press_key`, `type_text`, `upload_file`
- Navigation automation: `navigate_page`, `new_page`, `select_page`, `wait_for`
- Network: `get_network_request`, `list_network_requests`
- Debugging: `evaluate_script`, `list_console_messages`, `take_screenshot`, `take_snapshot`

Implication:
- Phase 4 can cleanly implement the locked command surface:
  - core: `navigate`, `click`, `fill`, `screenshot`, `snapshot`
  - capability-gated: `waitFor`, `evaluate`, `hover`, `console`, `network`
- File upload is available in the official MCP surface, but since the Phase 4 context explicitly deferred it, the abstraction should omit it for now rather than leaking a partially-approved capability into the API.

### 2. Browser startup and connection behavior should stay backend-internal

The official Chrome DevTools MCP docs note that the server starts the browser automatically only once a tool requiring a running browser is invoked. It also supports connections to existing Chrome instances via `--browserUrl` or `--wsEndpoint`.

Implication:
- The adapter API should not expose browser-process boot semantics directly to later skills.
- Backend initialization should encapsulate “launch vs attach” details so `/qa` and `/office-hours` can call a stable adapter regardless of the underlying connection model.

### 3. Structured fallback is a better fit than strict fail-fast everywhere

The official Chrome DevTools MCP surface is broad but not Playwright-complete. The Chrome blog examples emphasize real-time verification, console/network diagnosis, form automation, and layout debugging, but not every higher-level browser action a future skill might want is guaranteed.

Implication:
- The Phase 4 context decision is correct: structured fallback guidance first, fail only when the unsupported action is essential and no safe fallback exists.
- The adapter should encode unsupported actions as typed fallback results or structured errors with guidance instead of just throwing raw “not implemented” errors.

### 4. A deterministic local verification fixture is preferable to a remote real-world page

Phase 4 only needs to prove the browser abstraction layer works. A small, deterministic local HTML fixture or lightweight local page gives:
- stable selectors
- known expected text/state
- no external flakiness
- reusability for later `/qa` and `/office-hours` verification

Implication:
- Phase 4 should create a reusable test fixture flow for navigation, click, fill, snapshot/screenshot, console, and network checks.
- Manual UAT can still include a live browser run, but automated verification should not depend on external sites.

## Recommended Architecture

### Core browser interface

Create a required adapter interface with:
- `navigate`
- `click`
- `fill`
- `screenshot`
- `snapshot`

### Capability extensions

Add optional capability groups for:
- `waitFor`
- `evaluate`
- `hover`
- `console`
- `network`

This matches the Phase 4 decisions and avoids overfitting the interface to the Chrome DevTools backend alone.

### Fallback model

Represent unsupported behavior explicitly. A good model is:
- `supported: true` with tool/action mapping
- `supported: false` with:
  - reason
  - whether the action is essential
  - suggested fallback guidance

That gives later skills a structured way to decide whether to continue, degrade, or stop.

## Risks

### Risk 1: Over-coupling the adapter to Chrome DevTools tool names
If the abstraction simply exposes `navigate_page`, `take_snapshot`, etc., later Playwright support will be awkward and callers will depend on backend-specific semantics.

Mitigation:
- Keep the adapter surface domain-oriented (`navigate`, `snapshot`, `console`) and isolate tool-name mapping in the backend.

### Risk 2: Under-specifying fallback behavior
If unsupported browser commands are only documented in prose, later skills will branch inconsistently or silently degrade.

Mitigation:
- Create typed fallback results or typed exceptions with structured guidance.

### Risk 3: Verification only proves method existence, not flow correctness
A thin unit-test-only phase could pass while still leaving the backend unusable for actual skill flows.

Mitigation:
- Add a deterministic browser flow integration test that exercises multiple adapter operations together.

## Validation Architecture

### Automated checks
- Unit tests for the adapter contract and capability model.
- Backend tests for Chrome DevTools tool mapping.
- Integration tests against a deterministic local browser fixture flow.
- Fallback tests for unsupported command handling.

### Manual-only verification
- One live browser run using the Chrome DevTools MCP tools to confirm the backend can drive a page and surface console/network diagnostics.

### Recommended plan shape

#### Plan 04-01
Define adapter types, capabilities, and structured fallback/result model.

#### Plan 04-02
Implement the `chrome-devtools` backend and the core/capability method mappings.

#### Plan 04-03
Add deterministic browser-flow verification, unsupported-command docs/tests, and Phase 4 UAT scaffolding.

## Sources

- Chrome DevTools MCP blog: [https://developer.chrome.com/blog/chrome-devtools-mcp](https://developer.chrome.com/blog/chrome-devtools-mcp)
- Chrome DevTools MCP registry/docs: [https://github.com/mcp/chromedevtools/chrome-devtools-mcp](https://github.com/mcp/chromedevtools/chrome-devtools-mcp)
- `.planning/research/PITFALLS.md`
- `.planning/phases/03-first-skill-review/03-VERIFICATION.md`
- `.planning/phases/03-first-skill-review/03-UAT.md`

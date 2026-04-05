# /qa Skill

Project-local Copilot CLI skill artifact for Phase 5.

Use `/qa` for guided-flow browser testing inside GitHub Copilot CLI.
The default path is findings-first with explicit confirmation before same-session fixes.
Optional non-default paths: `quick`, `standard`, `exhaustive`, plus explicit `single-page` or `crawl` scopes.

Verification focus for Phase 5:
- guided flow is the default path
- quick, standard, and exhaustive modes remain available
- single-page and crawl scopes remain explicit opt-ins
- findings are reported before edits
- fix mode requires explicit confirmation
- screenshots, repro steps, and console/network evidence are part of the contract
- the checked-in artifact should match the builder output exactly

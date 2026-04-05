# /ship Skill

Project-local Copilot CLI skill artifact for Phase 6.

Use `/ship` to run strict preflight, prepare PR-facing artifacts, and open a PR by default.
The default path stops before merge and requires a clean repo state, a configured remote, and GitHub auth.

Verification focus for Phase 6:
- strict preflight is enforced
- prepare-and-open-PR is the default path
- the checked-in artifact should match the builder output exactly
- the skill references prior sprint-loop signals instead of re-running the entire flow blindly

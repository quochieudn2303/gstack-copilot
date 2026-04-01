# /review Skill

Project-local Copilot CLI skill artifact for Phase 3.

Use `/review [base-branch]` inside GitHub Copilot CLI.
If the base branch is omitted, the skill should use `origin/main`, then `origin/master`, then the repo default branch.

Verification focus for Phase 3:
- findings are shown before any fix step
- fix mode requires explicit confirmation
- uncommitted working-tree changes are opt-in

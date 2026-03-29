# Phase 1 Context: Core Conversion Pipeline

**Phase Goal:** Parse gstack skills and generate Copilot-compatible SKILL.md files

## Decisions

### Output Location
**Decision:** Support both options — let user choose at setup time
- `.github/skills/` — Project-local, version-controlled with repo
- `~/.copilot/skills/` — User-global, available in all projects

Setup script asks which destination (or both).

### Conversion Mode
**Decision:** One-time batch conversion
- Run once during `./setup`
- User re-runs setup to update when gstack releases new versions
- No watch mode, no daemon — keeps it simple
- Matches gstack's own setup pattern

### Validation Strictness
**Decision:** Strict — fail fast with clear errors
- If converter encounters unknown Bash construct → error with specific line/construct
- If frontmatter field is unrecognized → error listing the field
- No partial output — either skill converts fully or not at all
- Clear error messages guide user to report/fix the issue

### gstack Source Handling
**Decision:** Clone locally during setup
- `git clone --depth 1 https://github.com/garrytan/gstack.git` during setup
- Clone to temp location, convert skills, clean up
- User can also point to existing local gstack checkout

## Agent's Discretion

The following can be decided during planning/implementation:

- Specific directory for temp clone
- Whether to cache the clone between runs
- Exact error message formats
- Progress reporting during conversion (silent vs verbose)

## Constraints

From research findings:
- Use gray-matter for YAML frontmatter parsing
- TypeScript + Node.js for Windows compatibility
- Pipeline architecture: Parse → Transform → Generate → Write

## Deferred Ideas

(None captured during discussion)

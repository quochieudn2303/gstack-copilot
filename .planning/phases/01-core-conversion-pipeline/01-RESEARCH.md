# Phase 1: Core Conversion Pipeline - Research

**Researched:** 2025-01-20
**Domain:** SKILL.md Format Transformation (gstack → Copilot CLI)
**Confidence:** HIGH

## Summary

This phase implements the core converter that transforms gstack SKILL.md files into Copilot CLI-compatible format. Research confirms both formats use YAML frontmatter but with different schemas: gstack uses `preamble-tier` for execution ordering while Copilot uses `allowed-tools` for capability declaration. The transformation is primarily a frontmatter schema change plus content rewriting for paths and cross-skill references.

The minimal viable pipeline is straightforward: parse with gray-matter → transform frontmatter fields → rewrite path patterns → output. The key complexity is in the content body, which contains extensive Bash code blocks with gstack-specific paths (`~/.claude/skills/gstack/`, `$GSTACK_*`) and cross-skill references (`read ~/.claude/skills/gstack/[skill]/SKILL.md`) that must map to Copilot equivalents (`$env:USERPROFILE\.copilot\skills\`, `read ~/.copilot/skills/[skill]/SKILL.md`).

**Primary recommendation:** Build a simple 4-stage pipeline: Parse (gray-matter) → Transform Frontmatter (Zod schemas) → Transform Content (regex replacements) → Write. Strict mode: fail on any unrecognized construct with actionable error message.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Output Location:** Support both options — let user choose at setup time
  - `.github/skills/` — Project-local, version-controlled with repo
  - `~/.copilot/skills/` — User-global, available in all projects
  - Setup script asks which destination (or both)
- **Conversion Mode:** One-time batch conversion
  - Run once during `./setup`
  - User re-runs setup to update when gstack releases new versions
  - No watch mode, no daemon — keeps it simple
  - Matches gstack's own setup pattern
- **Validation Strictness:** Strict — fail fast with clear errors
  - If converter encounters unknown Bash construct → error with specific line/construct
  - If frontmatter field is unrecognized → error listing the field
  - No partial output — either skill converts fully or not at all
  - Clear error messages guide user to report/fix the issue
- **gstack Source Handling:** Clone locally during setup
  - `git clone --depth 1 https://github.com/garrytan/gstack.git` during setup
  - Clone to temp location, convert skills, clean up
  - User can also point to existing local gstack checkout

### Agent's Discretion
- Specific directory for temp clone
- Whether to cache the clone between runs
- Exact error message formats
- Progress reporting during conversion (silent vs verbose)

### Deferred Ideas (OUT OF SCOPE)
(None captured during discussion)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONV-01 | Parse gstack SKILL.md format with gray-matter | gray-matter 4.0.3 verified — extract YAML frontmatter, content body; see Standard Stack |
| CONV-02 | Transform YAML frontmatter to Copilot format | Zod schemas defined for both source/target; see Frontmatter Schema Mapping |
| CONV-03 | Generate valid Copilot SKILL.md output | Template pattern documented; see Output Generation Pattern |
| CONV-04 | Remap paths from Unix to Windows conventions | Path mapping patterns documented; see Path Transformation Patterns |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **gray-matter** | 4.0.3 | Frontmatter extraction | De facto standard, handles YAML frontmatter edge cases (multiline strings, arrays), battle-tested in Hugo/Jekyll/Metalsmith |
| **yaml** | 2.8.3 | YAML stringify | Modern YAML 1.2 compliance, better TypeScript types than js-yaml, needed for output generation |
| **zod** | 4.3.6 | Schema validation | Validate source/target frontmatter, type inference for transforms, clear error messages on invalid input |
| **commander** | 14.0.3 | CLI framework | TypeScript-first, simple subcommand model, standard for Node.js CLIs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **picocolors** | 1.1.x | Terminal colors | Error/success output formatting |
| **fs-extra** | 11.x | File operations | ensureDir, readJson, copy convenience methods |
| **fast-glob** | 3.3.x | File discovery | Find SKILL.md files across skill directories |

**Installation:**
```bash
npm install gray-matter yaml zod commander picocolors fs-extra fast-glob
npm install -D typescript tsx @types/node @types/fs-extra
```

**Version verification:** All versions verified via `npm view [package] version` on 2025-01-20.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── cli/
│   └── convert.ts        # CLI entry point
├── pipeline/
│   ├── index.ts          # Pipeline orchestrator
│   ├── parse.ts          # gray-matter parsing stage
│   ├── frontmatter.ts    # Frontmatter transformation
│   └── content.ts        # Content body transformation
├── schemas/
│   ├── gstack.ts         # Zod schema for gstack SKILL.md
│   └── copilot.ts        # Zod schema for Copilot SKILL.md
└── mappings/
    ├── paths.ts          # Path transformation rules
    └── tools.ts          # Tool name mappings
```

### Pattern 1: Pipeline for Conversion
**What:** Sequential transformation stages, each with single responsibility
**When to use:** Multi-step transformation where stages are testable in isolation
**Example:**
```typescript
// Source: Architecture research pattern
interface Stage<TIn, TOut> {
  name: string;
  transform(input: TIn): TOut;
}

class ConversionPipeline {
  constructor(private stages: Stage<any, any>[]) {}
  
  execute(input: string): ConversionResult {
    let current = input;
    for (const stage of this.stages) {
      current = stage.transform(current);
    }
    return current as ConversionResult;
  }
}

// Usage
const pipeline = new ConversionPipeline([
  new ParseStage(),           // string → ParsedSkill
  new FrontmatterStage(),     // ParsedSkill → TransformedSkill
  new ContentStage(),         // TransformedSkill → TransformedSkill
  new OutputStage(),          // TransformedSkill → string
]);
```

### Pattern 2: Strict Validation with Zod
**What:** Validate both input and output schemas, fail fast on unknown fields
**When to use:** When transformation correctness is critical
**Example:**
```typescript
// Source: CONTEXT.md validation strictness decision
import { z } from 'zod';

// gstack source schema
const GstackFrontmatter = z.object({
  name: z.string(),
  'preamble-tier': z.number().int().min(1).max(4),
  version: z.string().optional(),
  description: z.string(),
  'allowed-tools': z.array(z.string()),
}).strict(); // Fail on unknown fields

// Copilot target schema
const CopilotFrontmatter = z.object({
  name: z.string(),
  description: z.string(),
  'argument-hint': z.string().optional(),
  'allowed-tools': z.string(), // comma-separated or array
}).strict();

// Transform function with validation
function transformFrontmatter(source: unknown): CopilotFrontmatter {
  const parsed = GstackFrontmatter.parse(source); // Throws on invalid
  return {
    name: parsed.name,
    description: parsed.description.trim(),
    'argument-hint': undefined, // Derived from content analysis
    'allowed-tools': mapTools(parsed['allowed-tools']).join(', '),
  };
}
```

### Anti-Patterns to Avoid
- **Silently dropping unknown frontmatter fields:** CONTEXT.md requires strict mode — error on any unrecognized field
- **Regex-only content transformation:** Complex nested structures (like Bash heredocs) need proper parsing for some edge cases
- **Hard-coded path mappings:** Use configuration file for path transforms to support future platform expansion

## Frontmatter Schema Mapping

### gstack SKILL.md Frontmatter (Source)
```yaml
---
name: review
preamble-tier: 4           # Execution priority (1-4)
version: 1.0.0             # Skill version
description: |             # Multi-line description
  Pre-landing PR review...
allowed-tools:             # Tools the skill can use
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
  - Agent
  - AskUserQuestion
  - WebSearch
---
```

### Copilot SKILL.md Frontmatter (Target)
```yaml
---
name: gstack-review
description: Pre-landing PR review. Analyzes diff against base branch...
argument-hint: "[branch]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---
```

### Field Mapping Table

| gstack Field | Copilot Field | Transformation |
|--------------|---------------|----------------|
| `name` | `name` | Prefix with `gstack-` to namespace |
| `description` | `description` | Flatten multi-line to single line, truncate if > 200 chars |
| `preamble-tier` | (removed) | Not used in Copilot — execution order is implicit |
| `version` | (removed) | Not used in Copilot skills |
| `allowed-tools` (array) | `allowed-tools` (string) | Map tool names, join with `, ` |
| (derived from content) | `argument-hint` | Extract from usage patterns or default to `"[options]"` |

### Tool Name Mapping

| gstack Tool | Copilot Tool | Notes |
|-------------|--------------|-------|
| `Bash` | `Bash` | Same (Copilot maps to PowerShell internally) |
| `Read` | `Read` | Same |
| `Write` | `Write` | Same |
| `Edit` | `Edit` | Same |
| `Glob` | `Glob` | Same |
| `Grep` | `Grep` | Same |
| `Agent` | `Task` | Subagent spawning |
| `AskUserQuestion` | `AskUserQuestion` | Same |
| `WebSearch` | `WebSearch` | Same |

## Path Transformation Patterns

### Pattern Categories

| gstack Pattern | Copilot Equivalent | Regex |
|----------------|-------------------|-------|
| `~/.claude/skills/gstack/` | `~/.copilot/skills/gstack-copilot/` | `/~\/\.claude\/skills\/gstack\//g` |
| `~/.gstack/` | `$env:USERPROFILE\.gstack-copilot\` | `/~\/\.gstack\//g` |
| `/browse` commands | (Phase 4 — mark as TODO) | `/\$B\s+/g` |
| `$GSTACK_BIN` | `$env:GSTACK_COPILOT_BIN` | `/\$GSTACK_BIN/g` |
| `$GSTACK_ROOT` | `$env:GSTACK_COPILOT_ROOT` | `/\$GSTACK_ROOT/g` |

### Cross-Skill Reference Transformation

gstack skills reference other skills with paths like:
```markdown
read `~/.claude/skills/gstack/gstack-upgrade/SKILL.md`
```

Transform to Copilot equivalent:
```markdown
read `~/.copilot/skills/gstack-upgrade/SKILL.md`
```

**Transformation regex:**
```typescript
const skillRefPattern = /~\/\.claude\/skills\/gstack\/([a-z-]+)\/SKILL\.md/g;
const replacement = '~/.copilot/skills/gstack-$1/SKILL.md';
```

### Windows Path Conventions

For paths that will be executed (not just referenced), transform Unix to Windows:

| Unix Pattern | Windows Pattern | Context |
|--------------|-----------------|---------|
| `~/` | `$env:USERPROFILE\` | User home directory |
| `/path/to/file` | `\path\to\file` | Only for local paths, not URLs |
| `$VAR` | `$env:VAR` | Environment variables |

**Note:** Keep Unix paths for skill references (`~/.copilot/skills/`) — Copilot CLI handles the translation. Only transform paths in Bash code blocks that will be rewritten to PowerShell.

## Content Body Transformation

### Preamble Block Handling

gstack skills have an auto-generated preamble block:
```markdown
## Preamble (run first)

```bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || ...)
...
```
```

**Decision:** Remove or replace the preamble section entirely. Options:
1. **Remove:** Strip the preamble — Copilot has its own initialization
2. **Replace:** Insert a minimal Copilot-equivalent preamble (recommended)

Recommended minimal preamble for Phase 1:
```markdown
## Initialization

```powershell
# gstack-copilot initialization
$GSTACK_COPILOT_ROOT = "$env:USERPROFILE\.gstack-copilot"
$GSTACK_COPILOT_BIN = "$GSTACK_COPILOT_ROOT\bin"
```
```

### Browser Commands ($B)

gstack uses `$B` shorthand for browser commands:
```bash
$B goto http://localhost:3000
$B snapshot -i -a
$B fill @e3 "user@example.com"
```

**Phase 1 handling:** Mark these as requiring Phase 4 (Browser Abstraction):
```typescript
const browserCmdPattern = /\$B\s+\w+/g;
// In Phase 1: detect and warn, don't transform
if (content.match(browserCmdPattern)) {
  console.warn(`Skill contains browser commands ($B) — requires Phase 4 browser abstraction`);
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom regex splitter | gray-matter | Edge cases: multiline strings, escaped chars, TOML/JSON variants |
| YAML serialization | Manual string building | yaml package | Proper quoting, indentation, special char escaping |
| Schema validation | if/else chains | Zod | Type inference, clear error messages, composable transforms |
| File globbing | fs.readdir + manual filter | fast-glob | Cross-platform, .gitignore awareness, performance |

**Key insight:** YAML frontmatter parsing is deceptively complex — gray-matter handles dozens of edge cases (delimiter variations, multiline strings, nested objects) that would take weeks to hand-roll correctly.

## Common Pitfalls

### Pitfall 1: Incomplete Path Transformation
**What goes wrong:** Transforming some path patterns but missing others, resulting in mixed Unix/Windows paths
**Why it happens:** gstack has many path patterns: `~/`, `$HOME`, `$GSTACK_*`, relative paths in code blocks
**How to avoid:** Create exhaustive pattern registry, test with all 4 core skills, log unmatched patterns
**Warning signs:** Runtime errors about file not found, path with mixed slashes

### Pitfall 2: Destroying Markdown Structure
**What goes wrong:** Regex replacements break markdown code blocks, links, or headers
**Why it happens:** Overly greedy regex, replacing inside code fence content
**How to avoid:** Parse code blocks separately from prose, use AST when needed (remark)
**Warning signs:** Broken code blocks, garbled headers, corrupted links

### Pitfall 3: Frontmatter Array vs String Mismatch
**What goes wrong:** gstack uses arrays for `allowed-tools`, some Copilot skills use comma-separated strings
**Why it happens:** Inconsistent format handling
**How to avoid:** Normalize to array internally, serialize to Copilot's preferred format (comma-separated string)
**Warning signs:** Zod validation errors on output, YAML parse errors

### Pitfall 4: Losing Multi-line Descriptions
**What goes wrong:** Multi-line YAML strings collapse incorrectly
**Why it happens:** YAML has multiple string styles (literal `|`, folded `>`, quoted)
**How to avoid:** Use yaml package's dump options to control string style
**Warning signs:** Descriptions truncated, newlines converted to spaces unexpectedly

## Code Examples

### Parsing with gray-matter
```typescript
// Source: gray-matter npm documentation
import matter from 'gray-matter';

const skillContent = fs.readFileSync('SKILL.md', 'utf-8');
const { data: frontmatter, content } = matter(skillContent);

// frontmatter: { name: 'review', 'preamble-tier': 4, ... }
// content: markdown body without frontmatter
```

### Serializing Output
```typescript
// Source: yaml npm documentation
import { stringify } from 'yaml';
import matter from 'gray-matter';

function generateSkillFile(frontmatter: CopilotFrontmatter, content: string): string {
  // gray-matter can also stringify
  return matter.stringify(content, frontmatter, {
    lineWidth: -1, // Don't wrap lines
  });
}

// Or manual for more control:
function generateManual(fm: CopilotFrontmatter, content: string): string {
  const yamlStr = stringify(fm, { lineWidth: 120 });
  return `---\n${yamlStr}---\n\n${content}`;
}
```

### Strict Validation Pattern
```typescript
// Source: CONTEXT.md strict validation requirement
import { z } from 'zod';

const result = GstackFrontmatter.safeParse(frontmatter);
if (!result.success) {
  const errors = result.error.errors.map(e => 
    `Line ${e.path.join('.')}: ${e.message}`
  ).join('\n');
  throw new ConversionError(
    `Invalid gstack frontmatter in ${filepath}:\n${errors}`
  );
}
```

## Output Generation Pattern

### Copilot SKILL.md Template
```markdown
---
name: {transformed-name}
description: {transformed-description}
argument-hint: {extracted-or-default}
allowed-tools: {transformed-tools}
---

{transformed-content}
```

### Full Transformation Example

**Input (gstack):**
```markdown
---
name: review
preamble-tier: 4
version: 1.0.0
description: |
  Pre-landing PR review. Analyzes diff against the base branch.
allowed-tools:
  - Bash
  - Read
  - Edit
---

## Preamble (run first)
```bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check ...)
```

## Process

1. Read ~/.claude/skills/gstack/review/SKILL.md
2. Run git diff
```

**Output (Copilot):**
```markdown
---
name: gstack-review
description: Pre-landing PR review. Analyzes diff against the base branch.
argument-hint: "[branch]"
allowed-tools: Bash, Read, Edit
---

## Initialization

```powershell
# gstack-copilot initialization
$GSTACK_COPILOT_ROOT = "$env:USERPROFILE\.gstack-copilot"
```

## Process

1. Read ~/.copilot/skills/gstack-review/SKILL.md
2. Run git diff
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.x |
| Config file | vitest.config.ts (Wave 0 — create) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONV-01 | Parse gstack SKILL.md frontmatter | unit | `npx vitest run tests/parse.test.ts -x` | ❌ Wave 0 |
| CONV-02 | Transform frontmatter fields | unit | `npx vitest run tests/frontmatter.test.ts -x` | ❌ Wave 0 |
| CONV-03 | Generate valid Copilot output | integration | `npx vitest run tests/output.test.ts -x` | ❌ Wave 0 |
| CONV-04 | Remap Unix paths to Windows | unit | `npx vitest run tests/paths.test.ts -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — vitest configuration
- [ ] `tests/parse.test.ts` — gray-matter parsing tests
- [ ] `tests/frontmatter.test.ts` — frontmatter transformation tests
- [ ] `tests/paths.test.ts` — path transformation tests
- [ ] `tests/output.test.ts` — end-to-end output validation
- [ ] `tests/fixtures/` — sample gstack SKILL.md files for testing
- [ ] Framework install: `npm install -D vitest`

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 22 LTS | — |
| npm | Package management | ✓ | 10.x | — |
| git | Clone gstack repo | ✓ | 2.x | — |
| PowerShell | Windows CLI | ✓ | 7.6.0 | — |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| js-yaml for YAML | yaml package | 2023 | Better TS types, YAML 1.2 compliance |
| Manual frontmatter regex | gray-matter | Stable since 2015 | Handles all edge cases |
| Jest for testing | vitest | 2024 | Faster, better TS support |

**Deprecated/outdated:**
- js-yaml: Still works but yaml package has better TypeScript support
- remark-frontmatter: Overkill for this use case — gray-matter is simpler

## Open Questions

1. **Preamble replacement strategy**
   - What we know: gstack preamble does telemetry, update checks, session tracking
   - What's unclear: Should Copilot version have any equivalent functionality?
   - Recommendation: Minimal preamble (just env vars) for Phase 1, expand later if needed

2. **Skill naming convention**
   - What we know: Need to namespace to avoid conflicts with other skills
   - What's unclear: `gstack-review` vs `gs-review` vs `review` (user choice?)
   - Recommendation: Default to `gstack-` prefix, allow user override in setup

3. **Browser command handling in non-browser skills**
   - What we know: `/review` and `/ship` don't use browser, `/qa` and `/office-hours` do
   - What's unclear: Should non-browser skills still reference browser abstraction?
   - Recommendation: Phase 1 converts `/review` first (no browser), validates approach

## Sources

### Primary (HIGH confidence)
- gray-matter npm package — frontmatter parsing behavior verified
- yaml npm package — YAML 1.2 serialization verified
- zod npm package — schema validation patterns verified
- Actual gstack SKILL.md files from `garrytan/gstack` repo (fetched 2025-01-20)
- Actual Copilot SKILL.md files from `~/.copilot/skills/` (examined 2025-01-20)

### Secondary (MEDIUM confidence)
- STACK.md and ARCHITECTURE.md from project research phase

### Tertiary (LOW confidence)
- None — all key claims verified against source files

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified via npm registry
- Architecture: HIGH — pipeline pattern matches existing Copilot skill structure
- Pitfalls: HIGH — derived from actual format analysis of source/target files

**Research date:** 2025-01-20
**Valid until:** 2025-02-20 (stable domain, minimal churn expected)

# Technology Stack

**Project:** gstack-copilot (AI Agent Skill Adapter)
**Researched:** 2026-03-29

## Recommended Stack

### Runtime & Language

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Node.js** | 22 LTS | Runtime | Windows-native, no compilation needed, Copilot CLI already requires Node |
| **TypeScript** | 6.0.x | Type-safe development | Catch transformation errors at compile time, excellent IDE support |
| **tsx** | 4.21.x | Dev execution | Run TypeScript directly without build step during development |

**Rationale:** Node.js is the pragmatic choice for a Windows-first CLI tool. TypeScript catches the subtle bugs in format transformation (e.g., wrong frontmatter keys). Python was considered but adds friction on Windows and TypeScript's ecosystem for markdown/YAML is more mature.

### Markdown & YAML Transformation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **gray-matter** | 4.0.3 | Frontmatter extraction | Battle-tested, handles YAML/JSON/TOML frontmatter, used by Hugo/Jekyll/Metalsmith |
| **yaml** | 2.8.x | YAML stringify/parse | Modern YAML 1.2 spec compliance, better error messages than js-yaml |
| **unified/remark** | 15.x | Markdown AST manipulation | When simple regex replacement isn't enough (rare) |

**Rationale:** `gray-matter` is the de facto standard for extracting frontmatter from markdown. The gstack→Copilot transformation is primarily frontmatter manipulation plus content search-replace, not deep AST transformation. `unified/remark` is included as a fallback for edge cases but expect 90%+ of transformations to use `gray-matter` + regex.

**NOT recommended:**
- `remark-frontmatter` — Overkill for this use case, adds complexity
- `js-yaml` — Legacy, worse TypeScript types than `yaml`
- Custom parsing — Error-prone, frontmatter edge cases are subtle

### CLI Framework & UX

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **commander** | 14.x | CLI argument parsing | Most popular, TypeScript-first in v14, simple mental model |
| **picocolors** | 1.1.x | Terminal colors | 14x smaller than chalk, no dependencies, Windows-compatible |
| **inquirer** | 13.x | Interactive prompts | For setup wizard, well-maintained |

**Rationale:** `commander` over `yargs` because the setup script is simple (few commands, clear subcommands). `picocolors` over `chalk` for smaller bundle and simpler API. `inquirer` only needed if setup requires interactive configuration (e.g., selecting which skills to install).

**NOT recommended:**
- `yargs` — More powerful but unnecessary complexity for this CLI
- `chalk` — Larger, more dependencies, same result
- `ora` — Spinners unnecessary for fast file operations

### File System & Process Execution

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **fs-extra** | 11.x | File operations | `copy`, `ensureDir`, `readJson` — convenience over Node `fs` |
| **fast-glob** | 3.3.x | File discovery | Find all SKILL.md files across skill directories |
| **execa** | 9.x | Process execution | Cross-platform shell execution with better DX than child_process |

**Rationale:** Native Node.js `fs` works but `fs-extra` prevents boilerplate. `fast-glob` handles cross-platform path differences automatically. `execa` is critical for any Bash→PowerShell bridging during setup.

### Validation & Schema

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **zod** | 4.x | Schema validation | Validate SKILL.md frontmatter structure, type inference |

**Rationale:** Both source (gstack) and target (Copilot) SKILL.md formats have specific frontmatter requirements. Zod schemas ensure transformations produce valid output and provide clear error messages when source files are malformed.

```typescript
// Example: Copilot SKILL.md frontmatter schema
const CopilotSkillFrontmatter = z.object({
  'allowed-tools': z.array(z.string()).optional(),
  'argument-hint': z.string().optional(),
  description: z.string().optional(),
});
```

### Browser Automation Abstraction

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **playwright** | 1.58.x | Complex browser automation | gstack's Playwright scripts need adaptation |
| **@modelcontextprotocol/sdk** | 1.28.x | MCP client (optional) | If wrapping chrome-devtools MCP calls |

**Rationale:** The project needs to support two browser backends:
1. **Copilot's native chrome-devtools MCP** — Simple tasks (navigate, click, fill)
2. **Playwright** — Complex gstack automation scripts that exceed chrome-devtools capabilities

The adapter should translate gstack's `/browse` commands to Copilot equivalents when possible, falling back to Playwright for complex scenarios.

**Architecture decision:** Create a `BrowserAdapter` interface that abstracts both backends. Skills declare their complexity level; simple skills use chrome-devtools, complex skills invoke Playwright.

```typescript
interface BrowserAdapter {
  navigate(url: string): Promise<void>;
  click(selector: string): Promise<void>;
  fill(selector: string, value: string): Promise<void>;
  screenshot(): Promise<Buffer>;
  // ... more methods
}
```

### Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **vitest** | 4.x | Unit/integration tests | Fast, native TypeScript, watch mode |

**Rationale:** Vitest over Jest because it's faster and has better TypeScript support out of the box. The transformation logic needs thorough testing — each gstack construct mapped to Copilot equivalent.

### Build & Distribution

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **esbuild** | 0.27.x | Bundling | Bundle to single JS file for easy distribution |
| **tsup** | (optional) | Build wrapper | Simpler config around esbuild if needed |

**Rationale:** The setup script should be a single file users can download and run. esbuild produces a small, fast bundle. Distribution is `npx gstack-copilot setup` or direct script download.

---

## Cross-Platform Scripting Strategy

### The Bash → PowerShell Problem

gstack skills contain Bash constructs:
```bash
$GSTACK_BIN/some-command
source ./setup
[ -f "$path" ] && do_something
```

**Solution: Don't convert Bash to PowerShell at runtime.**

Instead:
1. **Pre-convert** known constructs during skill adaptation
2. **Environment variables** work in both (mostly)
3. **Complex scripts** → Rewrite as Node.js in `bin/` directory

### Construct Mapping Table

| gstack (Bash) | Copilot (PowerShell/Node) | Notes |
|---------------|---------------------------|-------|
| `$GSTACK_BIN` | `$env:GSTACK_COPILOT_BIN` | Path to bin directory |
| `source ./file` | `. ./file.ps1` or import | Script inclusion |
| `[ -f "$x" ]` | `Test-Path $x` | File existence |
| `/browse URL` | `chrome-devtools navigate` | Browser automation |
| `$B "selector"` | `chrome-devtools click` | Click element |

### Recommendation

Create a `script-adapter.ts` module with mappings:

```typescript
const bashToPowershell: Record<string, (match: string) => string> = {
  '\\$GSTACK_BIN': () => '$env:GSTACK_COPILOT_BIN',
  '\\[ -f "([^"]+)" \\]': (_, path) => `Test-Path "${path}"`,
  // ... more mappings
};
```

For truly complex Bash scripts, rewrite them as cross-platform Node.js scripts in `bin/`.

---

## Installation & Setup Tooling

### Setup Script Architecture

```
setup.ps1 (or setup.cmd for legacy Windows)
  └── Calls: node bin/setup.js
      └── Uses: commander, inquirer, fs-extra
```

### Setup Script Responsibilities

1. **Detect** Copilot CLI installation
2. **Clone/copy** skill files to `.github/skills/`
3. **Transform** gstack SKILL.md → Copilot format
4. **Validate** transformed files
5. **Configure** environment variables if needed

### One-Command Install

```powershell
# Option 1: npx (if published to npm)
npx gstack-copilot setup

# Option 2: Direct download (works without npm)
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/.../setup.ps1" -OutFile setup.ps1
.\setup.ps1
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Language | TypeScript | Python | Windows friction, weaker markdown ecosystem |
| Language | TypeScript | Go | Overkill for file transformation, team familiarity |
| Frontmatter | gray-matter | unified/remark | Unnecessary complexity for frontmatter extraction |
| YAML | yaml | js-yaml | Better TypeScript support in yaml package |
| CLI | commander | yargs | Simpler API for simple CLI |
| Colors | picocolors | chalk | Smaller, faster, same result |
| Testing | vitest | jest | Faster, better TS support |
| Browser | Playwright | Puppeteer | gstack already uses Playwright |

---

## Project Structure

```
gstack-copilot/
├── bin/                    # Compiled CLI and helper scripts
│   └── gstack-copilot.js   # Main CLI entry point
├── src/
│   ├── cli/
│   │   ├── setup.ts        # Setup command implementation
│   │   └── convert.ts      # Convert command implementation
│   ├── transform/
│   │   ├── frontmatter.ts  # Frontmatter transformation
│   │   ├── content.ts      # Content transformation (tool names, etc.)
│   │   └── script.ts       # Bash → PowerShell construct mapping
│   ├── browser/
│   │   ├── adapter.ts      # Browser abstraction interface
│   │   ├── chrome-devtools.ts
│   │   └── playwright.ts
│   ├── schemas/
│   │   ├── gstack.ts       # Zod schema for gstack SKILL.md
│   │   └── copilot.ts      # Zod schema for Copilot SKILL.md
│   └── index.ts
├── skills/                 # Adapted skills (output)
│   └── .github/skills/     # Copilot skill directory
├── tests/
│   ├── transform/
│   └── fixtures/           # Sample SKILL.md files
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Installation Commands

```bash
# Initialize project
npm init -y

# Core dependencies
npm install gray-matter yaml zod commander picocolors fs-extra fast-glob execa

# Browser automation (install as needed)
npm install playwright
npm install @modelcontextprotocol/sdk

# Dev dependencies
npm install -D typescript tsx vitest esbuild @types/node @types/fs-extra

# Optional: Interactive setup
npm install inquirer
npm install -D @types/inquirer
```

### package.json scripts

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx src/cli/index.ts",
    "build": "esbuild src/cli/index.ts --bundle --platform=node --outfile=bin/gstack-copilot.js",
    "test": "vitest",
    "test:run": "vitest run",
    "setup": "node bin/gstack-copilot.js setup"
  },
  "bin": {
    "gstack-copilot": "./bin/gstack-copilot.js"
  }
}
```

---

## Confidence Assessment

| Component | Confidence | Notes |
|-----------|------------|-------|
| TypeScript + Node.js | HIGH | Standard choice, verified packages |
| gray-matter | HIGH | De facto standard, 4.0.3 is stable |
| commander | HIGH | Most popular CLI framework |
| Zod validation | HIGH | Modern standard for TS validation |
| Browser abstraction | MEDIUM | Architecture sound but implementation complexity unknown |
| Bash→PowerShell mapping | MEDIUM | Depends on actual gstack script complexity |

---

## Sources

- NPM registry: Package versions verified via `npm view` (2026-03-29)
- gray-matter: https://npm.im/gray-matter
- yaml: https://npm.im/yaml
- commander: https://npm.im/commander
- Playwright: https://npm.im/playwright
- @modelcontextprotocol/sdk: https://npm.im/@modelcontextprotocol/sdk
- Project requirements: `.planning/PROJECT.md`

---

## Key Decisions for Roadmap

1. **TypeScript, not Python** — Better Windows DX, stronger typing for transformation logic
2. **gray-matter over unified** — Simple frontmatter extraction is sufficient
3. **Dual browser backend** — chrome-devtools for simple, Playwright for complex
4. **Pre-transform, don't runtime-convert** — Bash→PowerShell conversion happens at setup time
5. **Single-file distribution** — esbuild bundle for easy `npx` or script download

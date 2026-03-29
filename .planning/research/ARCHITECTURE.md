# Architecture Patterns

**Domain:** AI Agent Skill Adapter (gstack → Copilot CLI)
**Researched:** 2025-01-29
**Confidence:** HIGH (patterns are well-established GoF/industry standards)

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           gstack-copilot                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    SKILL CONVERTER (Pipeline)                     │  │
│  │  ┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌───────┐  │  │
│  │  │ Parser  │───▶│ Transformer │───▶│ Frontmatter │───▶│Writer │  │  │
│  │  │         │    │   Chain     │    │  Generator  │    │       │  │  │
│  │  └─────────┘    └─────────────┘    └─────────────┘    └───────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    TOOL ABSTRACTION (Registry)                  │    │
│  │  ┌─────────────────┐  ┌────────────────┐  ┌─────────────────┐  │    │
│  │  │ CommandMapper   │  │ ToolRegistry   │  │ VariableExpander│  │    │
│  │  │ (Bash → PS)     │  │ (gstack→Copilot│  │ ($GSTACK → path)│  │    │
│  │  └─────────────────┘  └────────────────┘  └─────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│                              ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                 BROWSER ABSTRACTION (Strategy)                  │    │
│  │  ┌────────────────────────────────────────────────────────┐    │    │
│  │  │              BrowserInterface (Abstract)                │    │    │
│  │  └────────────────────────────────────────────────────────┘    │    │
│  │           ▲                              ▲                      │    │
│  │           │                              │                      │    │
│  │  ┌────────────────┐            ┌────────────────────┐          │    │
│  │  │ChromeDevTools  │            │PlaywrightBackend   │          │    │
│  │  │Backend         │            │(optional)          │          │    │
│  │  └────────────────┘            └────────────────────┘          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    SETUP (Template Method)                      │    │
│  │  Detect → Configure → Generate → Verify                         │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With | Extension Point |
|-----------|---------------|-------------------|-----------------|
| **Parser** | Read gstack SKILL.md, extract structured content | Transformer | New skill formats |
| **Transformer Chain** | Apply tool/command/browser mappings | Tool Abstraction, Browser Abstraction | New transformation rules |
| **Frontmatter Generator** | Derive `allowed-tools` from content, generate YAML | Writer | New frontmatter fields |
| **Writer** | Output Copilot-compatible SKILL.md | Filesystem | Output format variations |
| **CommandMapper** | Bash → PowerShell translation | — | New command mappings |
| **ToolRegistry** | Catalog of tool name mappings | — | New tool entries |
| **VariableExpander** | Resolve `$GSTACK_*` variables | — | New variable mappings |
| **BrowserInterface** | Abstract browser automation API | — | — (contract) |
| **ChromeDevToolsBackend** | Implement browser via chrome-devtools MCP | Copilot CLI | — |
| **PlaywrightBackend** | Implement browser via Playwright | Playwright | — |
| **Setup** | Installation and configuration | All components | Platform-specific installers |

### Data Flow

```
INPUT: gstack/.factory/skills/{name}/SKILL.md
       ↓
       ├─ Extract: Skill content, tool references, browser commands
       ↓
PARSE: Structured representation
       {
         content: string,
         toolRefs: string[],     // ["Bash", "Read", "$GSTACK_BIN"]
         browserCmds: string[],  // ["$B navigate", "$B click"]
         variables: string[]     // ["$GSTACK_ROOT"]
       }
       ↓
TRANSFORM (sequential):
       1. VariableExpander: $GSTACK_* → actual paths
       2. CommandMapper: Bash → PowerShell commands
       3. ToolRegistry: gstack tools → Copilot tools
       4. BrowserMapper: $B commands → chrome-devtools/Playwright
       ↓
GENERATE:
       - Analyze transformed content for required tools
       - Generate YAML frontmatter (allowed-tools, argument-hint)
       ↓
OUTPUT: .github/skills/{name}/SKILL.md
```

## Patterns to Follow

### Pattern 1: Pipeline for Skill Conversion

**What:** Chain of processing stages, each transforming input to output
**When:** Multi-step transformation where stages are independent
**Why:** 
- Each stage is testable in isolation
- Easy to add/remove transformation steps
- Clear debugging (inspect intermediate state)

**Example:**
```typescript
// Each stage implements common interface
interface TransformStage {
  name: string;
  transform(content: SkillContent): SkillContent;
}

// Pipeline composition
const pipeline = new ConversionPipeline([
  new VariableExpansionStage(),
  new CommandMappingStage(),
  new ToolReferenceMappingStage(),
  new BrowserCommandMappingStage(),
]);

// Execute
const result = pipeline.execute(parsedSkill);
```

### Pattern 2: Strategy for Browser Backend

**What:** Encapsulate interchangeable browser automation implementations
**When:** Need to swap implementations without changing clients
**Why:**
- Users can choose chrome-devtools (native) or Playwright (advanced)
- Skills remain backend-agnostic
- Easy to add new backends

**Example:**
```typescript
interface BrowserBackend {
  navigate(url: string): string;      // Returns instruction text
  click(selector: string): string;
  fill(selector: string, value: string): string;
  screenshot(): string;
  evaluate(js: string): string;
}

class ChromeDevToolsBackend implements BrowserBackend {
  navigate(url: string): string {
    return `Use chrome_navigate_page to navigate to "${url}"`;
  }
  click(selector: string): string {
    return `Use chrome_click on element matching "${selector}"`;
  }
  // ...
}

class PlaywrightBackend implements BrowserBackend {
  navigate(url: string): string {
    return `$B navigate ${url}`;
  }
  // ...
}
```

### Pattern 3: Registry for Tool Mappings

**What:** Centralized catalog of command/tool/variable mappings
**When:** Many mappings need management and lookup
**Why:**
- Single source of truth for all mappings
- Easy to extend via configuration files
- Supports runtime lookup and validation

**Example:**
```typescript
// lib/tool-mappings.json
{
  "commands": {
    "ls": "Get-ChildItem",
    "cat": "Get-Content",
    "grep": "Select-String",
    "mkdir -p": "New-Item -ItemType Directory -Force"
  },
  "tools": {
    "Bash": "powershell",
    "Read": "view_file",
    "Write": "edit_file"
  },
  "variables": {
    "$GSTACK_BIN": "$env:USERPROFILE\\.gstack-copilot\\bin",
    "$GSTACK_ROOT": "$env:USERPROFILE\\.gstack-copilot"
  }
}

// Usage
const registry = ToolRegistry.load('./lib/tool-mappings.json');
const psCmd = registry.mapCommand('grep "error" log.txt');
// → 'Select-String -Pattern "error" -Path log.txt'
```

### Pattern 4: Template Method for Setup

**What:** Define algorithm skeleton, let subclasses override steps
**When:** Same overall process, platform-specific details vary
**Why:**
- Consistent setup flow across platforms
- Platform-specific logic isolated
- Easy to add new platforms

**Example:**
```powershell
# Abstract template in setup-base.ps1
function Install-GstackCopilot {
    Test-Prerequisites          # Override per platform
    Initialize-Configuration    # Common
    Convert-BundledSkills       # Common
    Install-ToRepository        # Override per platform
    Verify-Installation         # Common
}

# Windows implementation
function Test-Prerequisites {
    Test-CopilotCLI
    Test-PowerShellVersion -Minimum 7.0
}

# Unix implementation (if needed)
function Test-Prerequisites {
    Test-CopilotCLI
    Test-PwshInstalled
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Runtime Interpretation

**What:** Interpreting gstack SKILL.md at runtime rather than pre-converting
**Why bad:** 
- Performance overhead on every skill invocation
- Harder to debug (can't inspect generated skills)
- Requires runtime dependencies
**Instead:** Static generation at setup time — skills are plain markdown

### Anti-Pattern 2: Monolithic Converter

**What:** Single function/file that handles all transformation logic
**Why bad:**
- Hard to test individual transformations
- Difficult to extend or modify
- Tightly coupled, changes ripple
**Instead:** Pipeline with independent stages

### Anti-Pattern 3: Hard-Coded Mappings in Logic

**What:** Embedding command mappings directly in transformer code
**Why bad:**
- Changes require code modification
- Can't customize mappings per deployment
- Difficult to maintain
**Instead:** External registry files (JSON) loaded at runtime

### Anti-Pattern 4: Assuming Single Browser Backend

**What:** Hard-coding chrome-devtools references throughout
**Why bad:**
- Locks users to one approach
- Can't use Playwright's advanced features when needed
- Difficult to add future backends
**Instead:** Strategy pattern with backend selection at setup time

## Component Specifications

### Skill Converter

```
Input:  gstack SKILL.md (Markdown with Bash preamble, $GSTACK_* refs)
Output: Copilot SKILL.md (Markdown with YAML frontmatter)

Responsibilities:
1. Parse gstack skill structure
2. Apply transformation pipeline
3. Infer required tools from content
4. Generate YAML frontmatter
5. Write output file

Dependencies:
- Tool Abstraction (for mappings)
- Browser Abstraction (for browser commands)
- Filesystem (for I/O)
```

### Tool Abstraction Layer

```
Input:  Tool/command reference from gstack skill
Output: Equivalent Copilot tool/command reference

Responsibilities:
1. Map Bash commands → PowerShell
2. Map gstack tools → Copilot tools  
3. Expand $GSTACK_* variables
4. Handle complex patterns via regex

Data Files:
- lib/tool-mappings.json (commands, tools, variables)
- lib/patterns.json (complex regex transformations)
```

### Browser Abstraction

```
Input:  Browser command from gstack skill (e.g., "$B navigate")
Output: Backend-specific instruction

Responsibilities:
1. Parse browser command and arguments
2. Generate backend-specific instruction text
3. Support multiple backends via strategy

Backends:
- ChromeDevToolsBackend: Native Copilot MCP tools
- PlaywrightBackend: Playwright CLI commands (optional)

Selection: Based on config at setup time
```

### Setup Script

```
Input:  User invocation with optional parameters
Output: Configured installation with converted skills

Responsibilities:
1. Detect platform and prerequisites
2. Create config directory and files
3. Convert bundled gstack skills
4. Install to target repository
5. Verify installation success

Parameters:
- BrowserBackend: 'chrome-devtools' | 'playwright' (default: chrome-devtools)
- TargetRepo: Path to repo (default: current directory)
- SkillSet: 'core' | 'all' (default: core)
```

## Directory Structure

```
gstack-copilot/
├── setup.ps1                        # Entry point (PowerShell Core)
├── bin/
│   ├── convert.ps1                  # Skill converter CLI
│   ├── convert.js                   # (Alternative: Node.js converter)
│   └── verify.ps1                   # Installation verifier
├── lib/
│   ├── tool-mappings.json           # Command/tool/variable registry
│   ├── browser-mappings.json        # Browser command mappings
│   ├── patterns.json                # Regex transformation patterns
│   └── modules/
│       ├── Parser.psm1              # Skill parser module
│       ├── Transformer.psm1         # Transformation pipeline
│       ├── BrowserBackend.psm1      # Browser abstraction
│       └── FrontmatterGen.psm1      # YAML generator
├── skills/                          # Bundled gstack skills (source)
│   ├── office-hours/
│   │   └── SKILL.md
│   ├── review/
│   │   └── SKILL.md
│   ├── qa/
│   │   └── SKILL.md
│   └── ship/
│       └── SKILL.md
├── templates/
│   └── copilot-skill-template.md    # Output template
├── config/
│   └── defaults.json                # Default configuration
├── tests/
│   ├── converter.tests.ps1          # Converter unit tests
│   ├── mappings.tests.ps1           # Mapping tests
│   └── integration.tests.ps1        # End-to-end tests
└── docs/
    ├── SETUP.md                     # Installation guide
    └── CUSTOMIZATION.md             # How to add skills/mappings
```

## Extension Points

### Adding a New Skill

1. Place gstack skill in `skills/{name}/SKILL.md`
2. Run `bin/convert.ps1 -Skill {name}`
3. Output appears in target repo's `.github/skills/{name}/`

**No code changes required** — converter handles arbitrary skills.

### Adding a New Tool Mapping

1. Edit `lib/tool-mappings.json`
2. Add entry to appropriate section (commands/tools/variables)
3. Re-run converter on affected skills

```json
// lib/tool-mappings.json
{
  "commands": {
    "new-bash-cmd": "New-PowerShellCmd"
  }
}
```

### Adding a New Browser Backend

1. Implement `BrowserBackend` interface in `lib/modules/BrowserBackend.psm1`
2. Register in backend selector
3. Update setup.ps1 to accept new backend option

```powershell
# lib/modules/BrowserBackend.psm1
class SeleniumBackend : BrowserBackend {
    [string] Navigate([string]$url) {
        return "selenium.get('$url')"
    }
    # ...
}
```

### Adding a New Platform

1. Add platform detection in setup.ps1
2. Add platform-specific prerequisite checks
3. Add platform-specific installation logic (if any)

## Scalability Considerations

| Concern | Current Scale | Growth Strategy |
|---------|--------------|-----------------|
| Number of skills | 4 core skills | Registry scales linearly, no perf concern |
| Mapping complexity | ~50 mappings | JSON registry supports 1000s of entries |
| Browser backends | 2 backends | Strategy pattern supports unlimited |
| Platforms | Windows-first | Template method isolates platform code |

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Static generation over runtime** | Simpler debugging, no runtime deps, better performance |
| **PowerShell as primary language** | Cross-platform (pwsh 7+), matches Copilot CLI environment |
| **JSON registries over code** | Easier to extend, validate, and version |
| **Pipeline over monolith** | Testable stages, clear transformation flow |
| **Strategy for browsers** | Future-proof for new automation tools |
| **chrome-devtools as default** | Native Copilot support, zero additional deps |

## Sources

- Gang of Four Design Patterns (Adapter, Strategy, Template Method, Pipeline) — HIGH confidence
- PROJECT.md context (gstack format, Copilot format, requirements) — HIGH confidence
- PowerShell Core cross-platform capabilities — HIGH confidence (official Microsoft docs)
- Training data on skill/prompt conversion patterns — MEDIUM confidence

## Open Questions for Phase Implementation

1. **YAML Frontmatter Schema**: Need to verify exact Copilot CLI skill format with official docs
2. **Browser Command Coverage**: Which $B commands are used in core skills? May need subset initially
3. **Complex Bash Patterns**: Some Bash constructs (pipes, subshells) may need manual review
4. **Skill Discovery**: How does Copilot CLI discover skills in `.github/skills/`?

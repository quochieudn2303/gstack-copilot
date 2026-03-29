# ROADMAP: gstack-copilot

**Project:** Copilot CLI port of gstack  
**Created:** 2025-01-20  
**Granularity:** Standard  
**Coverage:** 17/17 requirements mapped ✓

---

## Phases

- [x] **Phase 1: Core Conversion Pipeline** - SKILL.md parser + path remapping + frontmatter transformer
- [ ] **Phase 2: Command Translation Layer** - Bash → PowerShell mappings + variable handling
- [ ] **Phase 3: First Skill - /review** - Validate full pipeline with non-browser skill
- [ ] **Phase 4: Browser Abstraction** - chrome-devtools MCP backend for $B commands
- [ ] **Phase 5: Browser Skills - /qa, /office-hours** - High-value browser-using skills
- [ ] **Phase 6: Sprint Completion - /ship** - Complete sprint loop + setup + docs

---

## Phase Details

### Phase 1: Core Conversion Pipeline
**Goal**: Can parse gstack skills and generate Copilot-compatible SKILL.md files  
**Depends on**: Nothing (foundation)  
**Requirements**: CONV-01, CONV-02, CONV-03, CONV-04  
**Success Criteria** (what must be TRUE):
  1. Running `convert skills/review/SKILL.md` parses the file without error
  2. Output SKILL.md has valid Copilot YAML frontmatter (`allowed-tools`, `argument-hint`)
  3. Paths in output use Windows conventions (`$env:USERPROFILE`, backslashes)
  4. Cross-skill references point to correct Copilot skill locations
**Plans**: 01-01 Foundation, 01-02 Parse/Transform, 01-03 Output/CLI  
**Completed**: 2026-03-30

---

### Phase 2: Command Translation Layer
**Goal**: Bash constructs in skills are correctly translated to PowerShell equivalents  
**Depends on**: Phase 1  
**Requirements**: TOOL-01, TOOL-02, TOOL-03, TOOL-04  
**Success Criteria** (what must be TRUE):
  1. UNIX utilities (`find`, `grep`, `date +%s`, `wc -l`) become PowerShell cmdlets
  2. Environment variables (`$HOME`, `$GSTACK_ROOT`) become `$env:*` syntax
  3. Process substitution `source <(cmd)` becomes explicit two-step variable capture
  4. Mapping registry is JSON-based and extensible without code changes
**Plans**: TBD

---

### Phase 3: First Skill - /review
**Goal**: `/review` skill works end-to-end in Copilot CLI  
**Depends on**: Phase 2  
**Requirements**: SKILL-01  
**Success Criteria** (what must be TRUE):
  1. User can invoke `/review` in Copilot CLI and receive code review
  2. Skill can read files, suggest fixes, and apply auto-corrections
  3. Review follows gstack's quality patterns (PR hygiene, test coverage checks)
  4. No browser dependency — validates core infrastructure without browser complexity
**Plans**: TBD

---

### Phase 4: Browser Abstraction
**Goal**: Skills can automate browsers through chrome-devtools MCP tools  
**Depends on**: Phase 3 (validates core pipeline first)  
**Requirements**: BROWSE-01, BROWSE-02, BROWSE-03  
**Success Criteria** (what must be TRUE):
  1. BrowserAdapter interface exists with `navigate`, `click`, `fill`, `screenshot`, `snapshot` methods
  2. ChromeDevToolsBackend maps gstack `$B` commands to `chrome-devtools-*` MCP tools
  3. Unsupported commands (`$B snapshot -D`, responsive) are documented with fallback guidance
  4. Simple browser flow (navigate → click → fill → verify) works end-to-end
**Plans**: TBD

---

### Phase 5: Browser Skills - /qa, /office-hours
**Goal**: High-value browser-using skills work for real product testing and discovery  
**Depends on**: Phase 4  
**Requirements**: SKILL-02, SKILL-03  
**Success Criteria** (what must be TRUE):
  1. `/qa` can navigate to a web app, detect UI issues, and report bugs with screenshots
  2. `/office-hours` can analyze a product page and generate YC-style design feedback
  3. Both skills use the BrowserAdapter for all browser interactions (no raw $B commands)
  4. Skills degrade gracefully when chrome-devtools features are unavailable
**Plans**: TBD
**UI hint**: yes

---

### Phase 6: Sprint Completion - /ship
**Goal**: Complete sprint workflow: office-hours → review → qa → ship  
**Depends on**: Phase 5  
**Requirements**: SKILL-04, SETUP-01, SETUP-02  
**Success Criteria** (what must be TRUE):
  1. `/ship` can audit test coverage, create PR description, and push changes
  2. Cross-skill references work (e.g., `/ship` suggests running `/qa` first)
  3. `setup.ps1` installs all converted skills with one command
  4. README documents the full sprint workflow for Copilot CLI users
  5. User can complete think→plan→build→review→test→ship loop using ported skills
**Plans**: TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Conversion Pipeline | 3/3 | Complete | 2026-03-30 |
| 2. Command Translation Layer | 0/? | Not started | - |
| 3. First Skill - /review | 0/? | Not started | - |
| 4. Browser Abstraction | 0/? | Not started | - |
| 5. Browser Skills - /qa, /office-hours | 0/? | Not started | - |
| 6. Sprint Completion - /ship | 0/? | Not started | - |

---

## Coverage Map

```
Phase 1: CONV-01, CONV-02, CONV-03, CONV-04         (4 requirements)
Phase 2: TOOL-01, TOOL-02, TOOL-03, TOOL-04         (4 requirements)
Phase 3: SKILL-01                                    (1 requirement)
Phase 4: BROWSE-01, BROWSE-02, BROWSE-03            (3 requirements)
Phase 5: SKILL-02, SKILL-03                         (2 requirements)
Phase 6: SKILL-04, SETUP-01, SETUP-02               (3 requirements)
─────────────────────────────────────────────────────────────────────
Total: 17/17 v1 requirements mapped ✓
```

---

## Dependency Graph

```
Phase 1 (Conversion)
    │
    ▼
Phase 2 (Tool Mapping)
    │
    ▼
Phase 3 (/review) ──── validates core pipeline
    │
    ▼
Phase 4 (Browser)
    │
    ▼
Phase 5 (/qa, /office-hours) ──── high-value skills
    │
    ▼
Phase 6 (/ship, setup) ──── complete sprint loop
```

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| TypeScript + Node.js | Windows-native, matches Copilot environment, gray-matter ecosystem |
| gray-matter over unified | Simple frontmatter extraction is sufficient |
| chrome-devtools first | Native Copilot MCP support, zero additional deps |
| Pre-transform at setup time | No runtime conversion overhead, debuggable output |
| /review first | Non-browser skill validates infrastructure cleanly |
| Pipeline architecture | Testable stages: parse → transform → generate → write |

---

## Risk Flags

| Phase | Risk | Mitigation |
|-------|------|------------|
| Phase 2 | `source <(cmd)` has no direct PowerShell equivalent | Two-step capture pattern documented in PITFALLS.md |
| Phase 4 | chrome-devtools API subset of gstack browse | Document gaps, accept 80% coverage |
| Phase 5 | Large skill files (70KB office-hours) may hit limits | Test early, split if needed |
| Phase 6 | Cross-skill references need path updates | Handled in Phase 1 path remapping |

---

## Sources

- PROJECT.md: Core value, constraints, requirements
- research/FEATURES.md: Feature landscape, MVP recommendation
- research/ARCHITECTURE.md: Pipeline pattern, component design
- research/PITFALLS.md: Shell translation risks, browser API gaps
- research/STACK.md: Technology choices

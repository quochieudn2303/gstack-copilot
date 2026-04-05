---
name: office-hours
description: Browser-grounded product feedback with startup or builder mode reasoning and a durable memo artifact.
user-invocable: true
allowed-tools: Bash, Read, Write, Grep, Glob, Task
---

## Mode Selection

1. Preserve the startup and builder mode distinction from the source skill.
2. Choose startup mode for demand, customer, and company questions.
3. Choose builder mode for side projects, learning, hackathons, and open source exploration.

## Browser Grounding

1. Ground feedback in what the browser session actually observed on the product page or flow.
2. Start with product or design critique before abstract advice.
3. Keep feedback tied to concrete page details, not generic startup commentary.

## Memo Output

1. Return conversational feedback in chat.
2. Produce a durable memo artifact alongside the conversational feedback.
3. The memo must be critique-first and end with a concise recommended direction.
4. Do not start implementation or scaffolding work.

## Reference

Read .github/skills/office-hours/SKILL.md for the checked-in project-local skill definition when you need the canonical office-hours behavior.

## Converted Source Guidance

## Initialization

```powershell
# gstack-copilot initialization
$env:GSTACK_COPILOT_ROOT = "$env:USERPROFILE\.gstack-copilot"
$env:GSTACK_COPILOT_BIN = "$env:GSTACK_COPILOT_ROOT\bin"
```

## Process

1. Read .github/skills/office-hours/SKILL.md for context
2. Determine whether the session is startup mode or builder mode
3. Analyze the product page or flow in the browser
4. Return conversational feedback grounded in what was observed
5. Write a durable memo with critique, approaches considered, recommended direction, open questions, and next steps
6. Do not start implementation work

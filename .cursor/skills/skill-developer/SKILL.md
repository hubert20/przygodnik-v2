---
name: skill-developer
description: Expert guide for creating Cursor Agent Skills. Covers skill architecture, SKILL.md structure, best practices, anti-patterns, and first principles (KISS, YAGNI, DRY).
---

# Skill Developer

## Purpose

Guide in creating well-architected, maintainable Cursor Agent Skills that follow first principles and avoid common pitfalls. This meta-skill helps you build skills that are:

- **Focused**: One skill = one domain/problem area
- **Maintainable**: Clear structure, progressive disclosure
- **Reliable**: Multiple trigger types, no single points of failure
- **Effective**: Activates when needed, stays quiet when not

## When to Use This Skill

- Creating a new skill from scratch
- Reviewing or improving existing skills
- Understanding skill architecture patterns
- Learning first principles of skill design

## Quick Reference

### Skill File Anatomy

| Section | Required | Purpose |
|---------|----------|---------|
| YAML Frontmatter | Yes | `name` and `description` for identification |
| Purpose | Yes | Why this skill exists (1-2 paragraphs) |
| When to Use | Yes | Activation scenarios (bullet list) |
| Quick Reference | Recommended | Key info for fast lookup |
| Core Content | Yes | Main guidance, examples, patterns |
| Resource Files | If >400 lines | Links to detailed resources |

### The 500-Line Rule

Main skill files stay under 500 lines. Details live in resource files.

**Why?**
- Cursor agent loads main skill first, resources on-demand
- Focused content improves comprehension
- Easier to maintain and update

**When to split:**
- SKILL.md exceeds 400 lines
- A section could stand alone
- Content changes at different rates

### Skill Activation in Cursor

In Cursor, skills are **agent-decided rules**. The agent automatically determines when a skill is relevant based on:
- Context of the conversation
- Files being edited
- User prompts and intent
- Skill description and content

No manual configuration needed - the agent reads the skill description and applies it when relevant.

## Core Concepts

### First Principles Foundation

Every skill should embody these principles:

**KISS (Keep It Simple, Stupid)**
- One skill = one domain/problem area
- If you can't explain it in one sentence, split it
- Prefer shallow hierarchies over deep nesting

**YAGNI (You Aren't Gonna Need It)**
- Start minimal, expand based on real needs
- Don't add "just in case" guidance
- Delete unused content immediately

**DRY (Don't Repeat Yourself)**
- Cross-reference instead of duplicating
- Use shared resource files for common patterns
- Exception: Critical safety info CAN be repeated

**Single Responsibility**
- One trigger pattern = one activation reason
- Resource files should be independently useful
- Avoid "god skills" that try to do everything

> For detailed coverage, see [FIRST_PRINCIPLES.md](references/FIRST_PRINCIPLES.md)

### Avoiding Single Points of Failure

Don't put everything in SKILL.md. Distribute across:

```
skill-name/
├── SKILL.md           # Entry point, <500 lines
└── references/
    ├── TOPIC_ONE.md   # Deep dive on topic
    └── TOPIC_TWO.md   # Deep dive on topic
```

Use multiple trigger types:
- Keywords alone miss context-based opportunities
- Path patterns alone miss prompt-based requests
- Combine for resilience

> For architectural patterns, see [SKILL_ARCHITECTURE.md](references/SKILL_ARCHITECTURE.md)

## Creating a New Skill

### Step 1: Define the Problem

Before writing, answer:

- [ ] What specific problem does this skill solve?
- [ ] Who is the target user?
- [ ] When should this skill activate?
- [ ] When should it NOT activate?
- [ ] What existing skills might overlap?

### Step 2: Choose the Skill Type

| Type | When to Use | Enforcement |
|------|-------------|-------------|
| `domain` | Technology/area expertise | `suggest` |
| `guardrail` | Standards enforcement | `warn` or `block` |
| `workflow` | Multi-step processes | `suggest` |

### Step 3: Design the Structure

**Small skill (<300 lines):**
```
skill-name/
└── SKILL.md
```

**Comprehensive skill (300-500 lines with depth):**
```
skill-name/
├── SKILL.md
└── references/
    ├── DETAILED_TOPIC.md
    └── EXAMPLES.md
```

### Step 4: Write the SKILL.md

Start with the template:

```markdown
---
name: my-skill-name
description: Brief description including trigger keywords
---

# My Skill Title

## Purpose
[One paragraph: What problem does this skill solve?]

## When to Use This Skill
- [Scenario 1]
- [Scenario 2]

## Quick Reference
[Table or bullets of key info]

## [Main Content Sections]
[Your guidance here]

## Resource Files (if applicable)
| File | Purpose |
|------|---------|
| RESOURCE.md | Description |
```

### Step 5: Place Skill in Correct Location

Place your skill in `.cursor/skills/` directory:

```
.cursor/skills/
└── my-skill-name/
    ├── SKILL.md
    └── references/  # Optional
```

Cursor automatically discovers skills in `.cursor/skills/` directory.

### Step 6: Test Activation

1. **Context test**: Work on files related to the skill domain
2. **Prompt test**: Ask questions related to the skill topic
3. **Intent test**: Describe intent without explicit keywords
4. **Verify**: Check that agent applies skill guidance appropriately

## Common Tasks

### Adding a Resource File

1. Create file in `references/` directory
2. Use UPPERCASE_SNAKE.md naming
3. Add reference in SKILL.md Resource Files table
4. Cross-link from relevant sections

### Debugging Activation Issues

**Skill never activates:**
- Ensure skill is in `.cursor/skills/` directory
- Check that SKILL.md has clear description with relevant keywords
- Verify skill description matches the domain you're working in
- Make description more specific to your use case

**Skill activates when it shouldn't:**
- Make description more specific
- Narrow the scope of the skill
- Consider splitting into multiple focused skills

**Skill conflicts with another:**
- Make skill descriptions more distinct
- Consider merging related skills if they overlap significantly

### Reviewing a Skill

Use this checklist:

- [ ] SKILL.md under 500 lines?
- [ ] Has Purpose section?
- [ ] Has When to Use section?
- [ ] All resource files referenced?
- [ ] Description includes relevant keywords?
- [ ] Examples are minimal but complete?
- [ ] No orphan resource files?
- [ ] Skill is in `.cursor/skills/` directory?

> For detailed best practices, see [BEST_PRACTICES.md](references/BEST_PRACTICES.md)
> For common mistakes, see [ANTI_PATTERNS.md](references/ANTI_PATTERNS.md)

## Skill Types Reference

### Domain Skills

Skills representing technology or domain expertise.

**Characteristics:**
- Type: `domain`
- Enforcement: `suggest`
- Provide guidance, examples, patterns
- Never block operations

**Examples:**
- backend-dev-guidelines
- frontend-dev-guidelines
- database-patterns

### Guardrail Skills

Skills enforcing standards or preventing mistakes.

**Characteristics:**
- Type: `guardrail`
- Enforcement: `warn` or `block`
- Check code against rules
- Provide escape hatches

**Examples:**
- security-standards
- code-review-checklist
- api-conventions

### Workflow Skills

Skills guiding multi-step processes.

**Characteristics:**
- Type: `workflow`
- Enforcement: `suggest`
- Step-by-step guidance
- Decision trees

**Examples:**
- skill-developer (this skill)
- deployment-guide
- incident-response

## Usage

In Cursor, skills are automatically applied by the agent when relevant. The agent reads the skill description and content to determine when to apply the skill's guidance.

You can also reference skills explicitly in prompts:
- "Use python-dev guidelines for this code"
- "Follow k8s-dev patterns for this deployment"
- "Apply skill-developer best practices"

## Resource Files

| File | Content | When to Reference |
|------|---------|-------------------|
| [FIRST_PRINCIPLES.md](references/FIRST_PRINCIPLES.md) | KISS, YAGNI, DRY, SRP | Architecture decisions |
| [SKILL_ARCHITECTURE.md](references/SKILL_ARCHITECTURE.md) | Structural patterns, SPOF avoidance | Designing skill structure |
| [BEST_PRACTICES.md](references/BEST_PRACTICES.md) | Guidelines and examples | Writing skill content |
| [ANTI_PATTERNS.md](references/ANTI_PATTERNS.md) | Common mistakes to avoid | Review and debugging |
| [TEMPLATES.md](references/TEMPLATES.md) | Starter templates | Creating new skills |

## Related Files

- `.cursor/rules/` - Main project rules and guidelines
- `.cursor/skills/` - Directory containing all skills
- `CLAUDE.md` - Additional project guidelines

---
name: README
---

# Agent Templates

Specialized agent templates for complex, multi-step tasks in Cursor.

> **Stack:** Vue 3 + TypeScript | Symfony 7.4 LTS | PostgreSQL | Docker
> **Note:** These are **agent templates** that you reference in prompts to guide Cursor agent behavior.

---

## How to Use Agent Templates

**Agents require explicit invocation in your prompts.** Reference them when you need specialized behavior.

### Invocation Pattern

Ask Cursor to use a specific agent template:

```
Use the [agent-name] agent template to [your task]
```

Or reference the agent directly:

```
Follow the test-writer agent approach to write tests for my function
```

### Examples

```
Use the test-writer agent template to write tests for my validation function
Follow the error-debugger agent approach to investigate this KeyError in user_service.py
Use the plan-reviewer agent template to review my authentication implementation plan
Apply the code-architecture-reviewer agent methodology to review my new API endpoint
Use the dependency-analyzer agent template to check for security vulnerabilities
```

**Alternative:** You can also reference agents directly by reading the agent file:

```
Read .cursor/agents/test-writer.md and apply its methodology
```

### Tips for Best Results

- **Be specific** about what you want the agent to do
- **Provide context** - mention relevant files, error messages, or requirements
- **One task per invocation** - agents work best with focused objectives

---

## What Are Agent Templates?

Agent templates are specialized instruction sets that guide Cursor's agent behavior for complex tasks. Unlike skills (which provide domain knowledge), agent templates:
- Provide step-by-step methodologies
- Define specific workflows for complex tasks
- Include examples and best practices
- Guide the agent's approach to problem-solving

**In Cursor:**
- Agent templates are **not automatically triggered**
- You need to **reference them explicitly** in your prompts
- They work as **guidelines** for the Cursor agent's behavior
- You can read agent files directly: "Read .cursor/agents/test-writer.md and follow its approach"

---

## Available Agents (16)

### Workflow & Planning

| Agent | Purpose |
|-------|---------|
| **rnd-issue-workflow** | 7-step issue-driven workflow: diagnoza -> plan -> review -> code -> verify -> update docs -> close |
| **product-architect** | Requirements gathering, user stories, task breakdown, MoSCoW prioritization |
| **discovery-analyst** | Deep analysis of source materials (mockups, specs). Use BEFORE product-architect |
| **plan-reviewer** | Review development plans before implementation, identify flaws |

### Code Quality & Review

| Agent | Purpose |
|-------|---------|
| **code-architecture-reviewer** | Review code for architectural consistency (Vue + Symfony + PostgreSQL) |
| **security-auditor** | Security audit OWASP Top 10 (SQL injection, XSS, CSRF, CVEs) |
| **performance-profiler** | Profile & optimize (Symfony Profiler, Doctrine, Vue DevTools, Lighthouse) |

### Testing

| Agent | Purpose |
|-------|---------|
| **test-writer** | TDD test creation (Vitest for Vue, PHPUnit for Symfony) |
| **api-tester** | Test API endpoints with Symfony WebTestCase |

### Implementation

| Agent | Purpose |
|-------|---------|
| **crud-scaffold** | Scaffold complete CRUD features from entity definition (backend + frontend + tests) |
| **ui-implementation-specialist** | Convert UI mockups to Vue 3 components (pixel-perfect, accessible) |
| **error-debugger** | Systematic debugging (stack traces, root cause analysis) |

### Refactoring

| Agent | Purpose |
|-------|---------|
| **refactor-planner** | Plan refactoring strategy (analysis, phases, risks) |
| **code-refactor-master** | Execute refactoring with zero breakage (dependency tracking) |

### Maintenance

| Agent | Purpose |
|-------|---------|
| **dependency-analyzer** | Audit dependencies (Composer + npm, CVEs, outdated packages) |
| **documentation-architect** | Create documentation (README, API docs, architecture overviews) |

---

## Typical Workflow

```
1. New project/feature with materials:
   discovery-analyst → product-architect → [implementation tasks]

2. New project/feature without materials:
   product-architect → [implementation tasks]

3. Individual issue/bug/feature:
   rnd-issue-workflow (guides all 7 steps)

4. Before implementation:
   plan-reviewer (validate the plan)

5. New CRUD feature:
   crud-scaffold (generates full stack: Entity → DTO → Service → Controller → Vue)

6. During implementation:
   test-writer (TDD) + error-debugger (when stuck)

7. After implementation:
   code-architecture-reviewer + security-auditor (Tier 1 check)

8. Before release:
   security-auditor (full) + performance-profiler + dependency-analyzer (Tier 3)
```

---

## When to Use Agent Templates vs Skills

| Use Agent Templates When... | Use Skills When... |
|-----------------------------|-------------------|
| Task requires specific methodology | Need domain knowledge |
| Complex multi-step process | Checking best practices |
| Need structured workflow | Ongoing development work |
| Task has clear end goal | Writing code in a domain |
| Example: "Review all controllers systematically" | Example: "Creating a Vue component" |

**Both can work together:**
- Skill provides domain patterns during development
- Agent template provides methodology for complex tasks
- Example: Use `vue-typescript-dev` skill + `test-writer` agent template

---

## Creating Your Own Agent Templates

Agent templates are markdown files with YAML frontmatter:

```markdown
---
name: agent-name
description: When to use this agent template with examples
---

# Agent Name

You are [role description]...

**Documentation References:**
- `.cursor/rules/` - Project-wide rules
- `.cursor/skills/` - Stack-specific patterns

**Core Responsibilities:**
1. First responsibility
2. Second responsibility
...

**Output Format:**
- How to structure and save results
```

**Tips:**
- Be very specific in instructions
- Break complex tasks into numbered steps
- Specify exactly what to return
- Include examples of good output
- Focus on methodology and workflow
- Reference `.cursor/rules/` and `.cursor/skills/` for project context

---

## Troubleshooting

### Agent template not found

```bash
# Check if agent file exists
ls .cursor/agents/[agent-name].md
```

### Agent template not being applied

- **Explicitly reference it** in your prompt: "Use the test-writer agent template"
- **Read the file directly**: "Read .cursor/agents/test-writer.md and follow its approach"

### Agent produces inconsistent results

- Review the agent template's instructions for clarity
- Add more specific examples in the description
- Make sure you're referencing the agent template explicitly in your prompt

---

**Last Updated:** 2026-02-16

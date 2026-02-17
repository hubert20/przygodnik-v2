# Cursor Agent Skills

This directory contains Agent Skills for Cursor IDE. Skills are domain-specific knowledge modules that the Cursor agent automatically applies when relevant.

## What are Agent Skills?

Agent Skills is an open standard for extending AI agents with specialized capabilities. Skills package domain-specific knowledge and workflows that agents can use to perform specific tasks.

**Learn more:** [agentskills.io](https://agentskills.io) | [Cursor Docs](https://cursor.com/docs/context/skills)

## How Skills Work

When enabled in Cursor, skills are automatically discovered from `.cursor/skills/` directory. The agent:
1. Reads skill descriptions and content
2. Determines when a skill is relevant based on context
3. Applies skill guidance automatically

Skills are **agent-decided rules** - the agent determines when they are relevant without manual intervention.

## Available Skills

### k8s-dev
Kubernetes development guide for cloud-agnostic deployments.

**Use when:**
- Writing Kubernetes manifests
- Creating Helm chart templates
- Setting up new applications in K8s

### skill-developer
Meta-skill for creating and managing Agent Skills.

**Use when:**
- Creating a new skill from scratch
- Reviewing or improving existing skills
- Understanding skill architecture patterns

### vue-typescript-dev
Vue 3 + TypeScript development guide covering Composition API, Pinia, Vue Router, form handling, testing, and performance optimization.

**Use when:**
- Writing Vue 3 components with TypeScript
- Creating composables and Pinia stores
- Implementing forms with validation
- Writing component tests with Vitest
- Optimizing Vue application performance

### symfony-dev
Symfony 7 development guide covering architecture, Doctrine ORM, Security, API development, testing, and best practices.

**Use when:**
- Creating Symfony controllers, services, entities
- Implementing authentication and authorization
- Building REST APIs
- Writing PHPUnit tests
- Optimizing Symfony applications

### postgresql-dev
PostgreSQL database design and optimization guide covering schema design, indexing, query optimization, and Doctrine integration.

**Use when:**
- Designing database schema
- Optimizing queries and indexes
- Working with Doctrine ORM
- Troubleshooting performance issues
- Implementing PostgreSQL-specific features

## Enabling Skills in Cursor

1. Open **Cursor Settings** (`Cmd+Shift+J` / `Ctrl+Shift+J`)
2. Go to **Rules** section
3. Find **Import Settings**
4. Toggle **Agent Skills** ON

> **Note:** Agent Skills are available in Cursor Nightly release channel. Switch to Nightly in Settings → Beta → Update Channel.

## Creating a New Skill

1. Create directory: `.cursor/skills/my-skill/`
2. Add `SKILL.md` with YAML frontmatter:
   ```markdown
   ---
   name: my-skill
   description: Brief description with keywords
   ---
   ```
3. Write skill content following the format
4. Cursor automatically discovers skills in `.cursor/skills/`

See [skill-developer](skill-developer/) for detailed guidance.

## Skill File Format

Each skill is defined in a `SKILL.md` file with:

- **YAML Frontmatter**: `name` and `description` (required)
- **Purpose**: Why this skill exists
- **When to Use**: Activation scenarios
- **Core Content**: Main guidance, examples, patterns
- **Resource Files**: Optional detailed resources

Skills should stay under 500 lines. Use `references/` directory for detailed content.

## Usage

Skills automatically activate based on context. You can also reference them explicitly:

- "Follow k8s-dev patterns for this deployment"
- "Apply skill-developer best practices"
- "Use vue-typescript-dev guidelines for this component"
- "Follow symfony-dev patterns for this service"
- "Apply postgresql-dev indexing strategies"
- "Use vue-typescript-dev Composition API patterns"
- "Follow symfony-dev security patterns"
- "Apply postgresql-dev query optimization"




---
description: "Available agent templates and skills list with usage instructions."
alwaysApply: true
---

# Agent Skills

This project uses Cursor Agent Skills for domain-specific knowledge. Skills are located in `.cursor/skills/` and should be referenced when working with specific technologies.

**⚠️ UWAGA WERSJA BETA/NIGHTLY:**
- W wersji **NIGHTLY/Beta** Cursora skilli **MOGĄ** być automatycznie ładowane z folderu `.cursor/skills/`.
- W wersji **Stable** skilli **NIE** są automatycznie ładowane - musisz je wywołać jawnie lub AI powinno je sprawdzić na podstawie kontekstu plików.
- **Sprawdź swoją wersję:** Settings → About → Version. Jeśli widzisz "NIGHTLY" lub "Beta", skilli mogą działać automatycznie.

**Dostępne skills:**
- `.cursor/skills/vue-typescript-dev/` - Vue 3 + TypeScript development (Composition API, Pinia, Vitest)
- `.cursor/skills/symfony-dev/` - Symfony 7.4 LTS development (Doctrine ORM, Security, API, PHPUnit)
- `.cursor/skills/postgresql-dev/` - PostgreSQL 16+ development (Doctrine integration, indexing, optimization)
- `.cursor/skills/docker-dev/` - Docker & Docker Compose, cross-platform Windows/Linux local development
- `.cursor/skills/owasp-top10-2025/` - OWASP Top 10:2025 security patterns (Symfony + Vue stack-specific)
- `.cursor/skills/k8s-dev/` - Kubernetes cloud-agnostic patterns (for deployment)
- `.cursor/skills/skill-developer/` - Meta-skill for creating skills

**Kiedy używać:**
- Gdy pracujesz z plikami `.vue`, `.ts` → Przeczytaj `.cursor/skills/vue-typescript-dev/SKILL.md`
- Gdy pracujesz z plikami `.php`, `composer.json` → Przeczytaj `.cursor/skills/symfony-dev/SKILL.md`
- Gdy pracujesz z migracjami Doctrine → Przeczytaj `.cursor/skills/postgresql-dev/SKILL.md`
- Gdy pracujesz z `Dockerfile`, `docker-compose.yml`, `.dockerignore` → Przeczytaj `.cursor/skills/docker-dev/SKILL.md`
- Gdy masz problemy cross-platform (Windows/Linux) → Przeczytaj `.cursor/skills/docker-dev/references/CROSS_PLATFORM.md`

---

# Agent Templates

This project includes specialized agent templates for complex, multi-step tasks. Agent templates are located in `.cursor/agents/` and can be referenced in prompts.

**⚠️ WAŻNE:** Agent templates NIE są automatycznie wywoływane. Musisz je wywołać jawnie używając `@nazwa-agenta` w promptcie.

**Dostępne agenty (pliki w `.cursor/agents/`):**
- `rnd-issue-workflow` - **7-step issue workflow** (diagnoza → plan → code → verify → close)
- `discovery-analyst` - Deep analysis of source materials (use BEFORE product-architect)
- `product-architect` - Requirements gathering, task breakdown, MoSCoW prioritization
- `plan-reviewer` - Plan review, gap analysis (Vue + Symfony + PostgreSQL + Docker)
- `crud-scaffold` - Scaffold complete CRUD features (Entity → DTO → Service → Controller → Vue)
- `test-writer` - TDD test creation (Vue: Vitest, Symfony: PHPUnit)
- `api-tester` - API endpoint testing (Symfony WebTestCase)
- `ui-implementation-specialist` - Convert UI mockups to Vue 3 components
- `code-architecture-reviewer` - Code review (Vue + Symfony + PostgreSQL patterns)
- `security-auditor` - Security audit (OWASP Top 10:2025)
- `performance-profiler` - Profiling & optimization (Symfony Profiler, Doctrine, Vue DevTools, Lighthouse)
- `error-debugger` - Systematic debugging (stack traces, root cause analysis)
- `refactor-planner` - Plan refactoring strategy (analysis, phases, risks)
- `code-refactor-master` - Execute refactoring with zero breakage (dependency tracking)
- `dependency-analyzer` - Audit dependencies (Composer + npm, CVEs, outdated packages)
- `documentation-architect` - Create documentation (README, API docs, architecture)

**Usage:** Reference agent templates explicitly in prompts:
- "Use the test-writer agent template to write tests"
- "Read .cursor/agents/error-debugger.md and apply its methodology"
- "Follow the code-architecture-reviewer approach"

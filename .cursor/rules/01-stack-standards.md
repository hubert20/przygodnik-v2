---
description: "Technology stack standards: Vue 3 + TypeScript, Symfony 7.4 LTS, PostgreSQL, Docker, cross-platform rules."
alwaysApply: true
---

# Technology Stack Standards

## Vue 3 + TypeScript (Frontend)

- TypeScript required - no `any` types (use explicit types or `unknown`)
- Composition API only - use `<script setup lang="ts">` (NO Options API)
- Format with ESLint + Prettier (`npm run lint`, `npm run format`)
- Testing with Vitest (`npm test`)
- Dependencies in `package.json`
- Pinia stores: Composition API style (setup stores)
- Composables for shared logic (prefix with `use`)
- Form validation: Vee-Validate with `useForm()` + `useField()`
- API calls ONLY through composables (NO direct axios/fetch in components)

## Symfony 7.4 LTS + PHP (Backend)

> **WAŻNE:** Używamy **Symfony 7.4 LTS** (wsparcie do listopada 2027). 
> **NIE** używaj Symfony 8.x - jest zbyt świeże i niestabilne.
> Wymagaj pakietów `"symfony/*": "7.4.*"` w `composer.json`.

- PHP ^8.2 required - use type hints on all methods (`: void`, `: string`, etc.)
- Format with PHP CS Fixer (`composer cs-fix`)
- Testing with PHPUnit (`php bin/phpunit`)
- Dependencies in `composer.json`
- Controllers: max 3-5 actions, thin (delegate to services)
- Services: final class, constructor DI, single responsibility
- DTOs for API input/output (NEVER expose entities directly)
- Validation: Symfony Validator constraints on DTOs/Entities
- Security: voters for complex logic, `#[IsGranted]` for simple checks
- Use Doctrine QueryBuilder/DQL (NO raw SQL unless absolutely necessary)

## PostgreSQL + Doctrine (Database)

- Always create migration for schema changes: `php bin/console make:migration`
- Add indexes on: FK columns, frequently filtered/sorted columns
- Use `onDelete: CASCADE` or `SET NULL` for FK constraints (explicit)
- UUIDs: use `uuid` type in Doctrine + `#[GeneratedValue(strategy: "CUSTOM")]`
- JSONB columns: use `json` type + GIN index if queried
- NEVER create columns without proper type constraints
- NEVER forget to add indexes after creating FKs

## Docker (Local Development)

- **Cały stack działa w Docker** - PHP, PostgreSQL, Node NIGDY bezpośrednio na hoście
- Docker Compose v2 (`docker compose`, NIE `docker-compose`)
- Multi-stage Dockerfile (dev / prod)
- Named volumes dla danych DB i vendor/node_modules
- `.gitattributes` z `eol=lf` jest **OBOWIĄZKOWY** (cross-platform)

---

## Cross-Platform (Windows + Linux)

> **Zespół pracuje na Windows i Linux.** Wszystkie skrypty, komendy i konfiguracje MUSZĄ działać na obu OS.

### Zasady:
- **Docker = equalizer** - ten sam stack na każdym OS
- **`.gitattributes` z `eol=lf`** - OBOWIĄZKOWY w każdym repo (zapobiega CRLF bugs)
- **Forward slash `/`** w docker-compose.yml i ścieżkach (NIGDY backslash)
- **`npm scripts`** zamiast Makefile (Windows nie ma natywnego `make`)
- **Nie zakładaj bash na hoście** - używaj `docker compose exec` do uruchamiania skryptów
- **Komendy Docker Compose** są identyczne na obu platformach

### Komendy cross-platform safe:
```bash
docker compose up -d            # Start
docker compose exec php bash    # Shell do PHP
docker compose exec node sh     # Shell do Node
npm run docker:up               # Via npm scripts
```

### Komendy NIE cross-platform (unikaj na hoście):
```bash
# ❌ Nie działa na Windows
source .env
chmod +x script.sh
./scripts/setup.sh

# ✅ Uruchamiaj WEWNĄTRZ kontenera
docker compose exec php bash scripts/setup.sh
```

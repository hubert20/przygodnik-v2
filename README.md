# Rules - AI-First Development

Centralne repozytorium reguł, agentów i skilli dla Cursora. Metodologia AI-First (Model 3 Faz).

> **Uwaga:** To repozytorium to **źródło prawdy** dla współdzielonych konfiguracji Cursora.
> Każdy projekt synchronizuje się z tego repo za pomocą `scripts/cursor-sync.ps1`.

## Quick Start

Projekt **Rules** służy jako centralne repozytorium reguł, agentów i skilli dla Cursora (AI-First, Model 3 Faz). Używasz go w zależności od tego, czy pracujesz sam, czy w zespole.

### Szybki start (jeden projekt)

1. **Sklonuj** to repo i **otwórz folder w Cursorze** jako workspace.
2. **Faza 1 – specyfikacja:**
   - `cp docs/SPECIFICATION_TEMPLATE.md docs/SPECIFICATION.md`
   - Wypełnij `docs/SPECIFICATION.md`, potem w Cursorze:
     **`@product-architect` Przeanalizuj mój opis w `@SPECIFICATION.md`. Zadaj mi pytania doprecyzujące.**
3. **Faza 2 – plan techniczny:**
   - `cp docs/ARCHITECTURE_TEMPLATE.md docs/ARCHITECTURE.md`
   - W Cursorze:
     **`@code-architecture-reviewer` Na podstawie `@SPECIFICATION.md` wypełnij `@ARCHITECTURE.md`.**
4. **Faza 3 – implementacja:**
   Użyj **`@rnd-issue-workflow`** do zadań w modelu issue-driven.

### Praca w zespole (wiele projektów)

- **Rules** = centralne repo (to, które masz).
- Każdy **projekt aplikacji** (np. `app-bank-import/`) ma własne repo i **synchronizuje** się z `rules/` skryptem.

> **Skrypt sync:** Wymaga PowerShell Core (`pwsh`). Działa na Windows, Linux i macOS. Instalacja: `sudo apt install powershell` (Ubuntu/Debian), `brew install powershell` (macOS) – więcej: [PowerShell install](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell).

**Setup nowego projektu:**

```powershell
# 1. Sklonuj rules (raz)
git clone https://github.com/your-org/rules.git

# 2. Nowy projekt
mkdir app-my-project
cd app-my-project
git init

# 3. Konfiguracja sync
cp ../rules/.cursor-sync.example.json .cursor-sync.json
# Edytuj .cursor-sync.json → ustaw ścieżkę do rules/

# 4. Pierwszy sync
pwsh ../rules/scripts/cursor-sync.ps1
```

**Późniejsza synchronizacja** (gdy coś się zmieni w centralnym `rules/`):

```powershell
# Z katalogu projektu:
pwsh scripts/cursor-sync.ps1

# Podgląd bez zapisu:
pwsh scripts/cursor-sync.ps1 -DryRun
```

Synchronizuj m.in. po aktualizacji agentów/skilli w centralnym repo lub przed nową feature.

### Zasoby w projekcie

- **Agenci** (16) – np. `@product-architect`, `@rnd-issue-workflow`, `@crud-scaffold`, `@test-writer` – lista poniżej.
- **Skille** (7) – np. `symfony-dev`, `vue-typescript-dev`, `postgresql-dev`, `docker-dev` – też poniżej.
- **Reguły** – w `.cursor/rules/` (00–08 + `project.md`).
- **Proces** – szczegóły w `INSTRUKCJA_PROCESU.md`.

Podsumowując: **pojedynczy projekt** = otwierasz `rules` w Cursorze i idziesz Fazą 1 → 2 → 3 z agentami. **Zespół** = każdy projekt ma `.cursor-sync.json` i uruchamia `cursor-sync.ps1`, żeby mieć aktualne reguły i agenty z tego repo.

---

## Stack Technologiczny

| Technologia | Wersja | Uwagi |
|-------------|--------|-------|
| Symfony | **7.4 LTS** (`7.4.*`) | NIE używaj 8.x |
| PHP | **^8.2** | Minimum 8.2 |
| PostgreSQL | **16+** | Alpine w Docker |
| Vue 3 | Latest | Composition API + TypeScript |
| Node.js | **20 LTS** | Alpine w Docker |
| Docker Compose | **v2** | `docker compose` (nie `docker-compose`) |

## Struktura

```
rules/                             # Centralne repozytorium
├── .cursor/
│   ├── agents/                    # Agenci (16 agentów) ← SHARED
│   ├── rules/                     # Modular rules ← SHARED (00-08) + LOCAL (project.md)
│   │   ├── 00-core-principles.md
│   │   ├── 01-stack-standards.md
│   │   ├── 02-testing-checkpoints.md
│   │   ├── 03-task-management.md
│   │   ├── 04-git-conventions.md
│   │   ├── 05-quality-gates.md
│   │   ├── 06-documentation.md
│   │   ├── 07-agents-skills.md
│   │   ├── 08-learning.md
│   │   └── project.md            # ← LOCAL (per-project, nie synchronizowany)
│   └── skills/                    # Skille technologiczne (7 skilli) ← SHARED
│       ├── symfony-dev/
│       ├── vue-typescript-dev/
│       ├── postgresql-dev/
│       ├── docker-dev/
│       ├── owasp-top10-2025/
│       ├── k8s-dev/
│       └── skill-developer/
├── docs/                          # Szablony dokumentacji projektowej ← SHARED
│   ├── SPECIFICATION_TEMPLATE.md
│   ├── SPECIFICATION_EXAMPLE.md
│   ├── ARCHITECTURE_TEMPLATE.md
│   └── ARCHITECTURE_EXAMPLE.md
├── dev_docs/                      # Dokumentacja robocza
│   ├── templates/                 # Szablony issue ← SHARED
│   ├── active/                    # Aktywne zadania ← LOCAL
│   ├── archive/                   # Zakończone ← LOCAL
│   └── lessons_learned.md         # Dziennik wiedzy ← LOCAL
├── scripts/
│   └── cursor-sync.ps1           # Skrypt synchronizacji
├── .cursor-sync.example.json     # Szablon konfiguracji sync
├── INSTRUKCJA_PROCESU.md         # Model 3 Faz ← SHARED
└── DOCKER_INFO.md                # Docker info ← LOCAL
```

## Jak pracować w zespole (bez Team subscription)

### Architektura

```
GitHub:
  rules/                    ← Centralne repo (TO REPO)
  app-bank-import/          ← Projekt 1 (sync z rules/)
  app-hr-evaluations/       ← Projekt 2 (sync z rules/)
  app-advance-requests/     ← Projekt 3 (sync z rules/)
  ...
```

### Co jest SHARED vs LOCAL

| Zasób | SHARED (sync) | LOCAL (per-project) |
|-------|:-------------:|:-------------------:|
| `.cursor/agents/` | ✅ | |
| `.cursor/skills/` | ✅ | |
| `.cursor/rules/00-08*.md` | ✅ | |
| `.cursor/rules/project.md` | | ✅ |
| `docs/*_TEMPLATE.md`, `*_EXAMPLE.md` | ✅ | |
| `docs/SPECIFICATION.md` | | ✅ |
| `docs/ARCHITECTURE.md` | | ✅ |
| `dev_docs/templates/` | ✅ | |
| `dev_docs/active/`, `archive/` | | ✅ |
| `dev_docs/lessons_learned.md` | | ✅ |
| `INSTRUKCJA_PROCESU.md` | ✅ | |
| `src/` (kod projektu) | | ✅ |

### Setup nowego projektu

```powershell
# 1. Sklonuj rules repo (raz, gdziekolwiek)
git clone https://github.com/your-org/rules.git

# 2. Utwórz projekt
mkdir app-my-project
cd app-my-project
git init

# 3. Skopiuj .cursor-sync.example.json
cp ../rules/.cursor-sync.example.json .cursor-sync.json
# Edytuj .cursor-sync.json → ustaw ścieżkę do rules/

# 4. Pierwszy sync
pwsh ../rules/scripts/cursor-sync.ps1

# 5. Skopiuj szablony docs (jednorazowo)
cp docs/SPECIFICATION_TEMPLATE.md docs/SPECIFICATION.md
cp docs/ARCHITECTURE_TEMPLATE.md docs/ARCHITECTURE.md

# 6. Utwórz dev_docs
mkdir -p dev_docs/active dev_docs/archive
echo "# Lessons Learned" > dev_docs/lessons_learned.md

# 7. Dodaj reguły projektowe
# Edytuj .cursor/rules/project.md
```

### Synchronizacja (gdy central repo się zmieni)

```powershell
# Z katalogu projektu:
pwsh scripts/cursor-sync.ps1

# Podgląd zmian (dry run):
pwsh scripts/cursor-sync.ps1 -DryRun

# Z jawną ścieżką:
pwsh scripts/cursor-sync.ps1 -Source "../rules"
```

### Kiedy synchronizować?

- **Po aktualizacji agentów/skilli** w centralnym repo
- **Przed rozpoczęciem nowej feature** (upewnij się że masz najnowsze reguły)
- **Po dodaniu nowego agenta/skilla** (propaguj do projektów)

---

## Szybki Start (pojedynczy projekt)

Jeśli nie potrzebujesz synchronizacji (jeden projekt):

1. **Sklonuj** to repozytorium
2. **Otwórz Cursor** i wybierz folder jako workspace
3. Sprawdź wersję Cursora: Settings → About → Version

### Faza 1: Specyfikacja Biznesowa

```bash
cp docs/SPECIFICATION_TEMPLATE.md docs/SPECIFICATION.md
```

Wypełnij szablon, potem zawołaj:
> `@product-architect` Przeanalizuj mój opis w `@SPECIFICATION.md`. Zadaj mi pytania doprecyzujące.

### Faza 2: Plan Techniczny

```bash
cp docs/ARCHITECTURE_TEMPLATE.md docs/ARCHITECTURE.md
```

> `@code-architecture-reviewer` Na podstawie `@SPECIFICATION.md` wypełnij `@ARCHITECTURE.md`.

### Faza 3: Implementacja

Użyj `@rnd-issue-workflow` do zarządzania zadaniami w modelu issue-driven.

---

## Agenci (16)

| Agent | Opis |
|-------|------|
| `@product-architect` | Analityk biznesowy, requirements |
| `@discovery-analyst` | Analiza materiałów źródłowych |
| `@plan-reviewer` | Review planów implementacji |
| `@rnd-issue-workflow` | Workflow issue-driven development |
| `@crud-scaffold` | Scaffold CRUD (Entity → DTO → Service → Controller → Vue) |
| `@test-writer` | Tester TDD (Vitest + PHPUnit) |
| `@api-tester` | Testowanie API |
| `@ui-implementation-specialist` | Implementacja UI z mockupów |
| `@code-architecture-reviewer` | Architekt techniczny, code review |
| `@security-auditor` | Audyt bezpieczeństwa (OWASP Top 10:2025) |
| `@error-debugger` | Debugowanie błędów |
| `@performance-profiler` | Optymalizacja wydajności |
| `@refactor-planner` | Planowanie refactoringu |
| `@code-refactor-master` | Refactoring kodu |
| `@dependency-analyzer` | Audyt zależności |
| `@documentation-architect` | Tworzenie dokumentacji |

## Skille (7)

| Skill | Opis |
|-------|------|
| `symfony-dev` | Symfony 7.4 LTS + PHP ^8.2 + Doctrine |
| `vue-typescript-dev` | Vue 3 Composition API + TypeScript |
| `postgresql-dev` | PostgreSQL 16+ + Doctrine integration |
| `owasp-top10-2025` | OWASP Top 10:2025 security patterns |
| `docker-dev` | Docker Compose v2 + cross-platform (Win/Linux) |
| `k8s-dev` | Kubernetes cloud-agnostic |
| `skill-developer` | Meta-skill do tworzenia nowych skilli |

## Rules (modular)

Reguły sa teraz w `.cursor/rules/` (zamiast monolitycznego `.cursorrules`):

| Plik | Treść |
|------|-------|
| `00-core-principles.md` | KISS, YAGNI, SOLID, safety rules |
| `01-stack-standards.md` | Symfony 7.4, Vue 3, PostgreSQL, Docker, cross-platform |
| `02-testing-checkpoints.md` | TDD, test checkpoints, FAIL=STOP |
| `03-task-management.md` | Issue-driven workflow, dev_docs |
| `04-git-conventions.md` | Conventional Commits |
| `05-quality-gates.md` | Tier 1/2/3 quality gates |
| `06-documentation.md` | Documentation ownership, MVD |
| `07-agents-skills.md` | Lista agentów i skilli |
| `08-learning.md` | Continuous learning, lessons learned |
| `project.md` | **Per-project** (nie synchronizowany) |

## Dokumentacja

- **Proces:** `INSTRUKCJA_PROCESU.md`
- **Szablony:** `docs/` (specyfikacja + architektura)
- **Praca robocza:** `dev_docs/` (issue-driven workflow)
- **Docker:** `DOCKER_INFO.md` (project-specific)

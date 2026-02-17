# docs/ - Dokumentacja Projektowa

Szablony i przykłady dokumentacji biznesowej i technicznej.

## Pliki

| Plik | Typ | Kiedy używać |
|------|-----|-------------|
| `SPECIFICATION_TEMPLATE.md` | Szablon | **Faza 1 (Biznes):** Skopiuj jako `SPECIFICATION.md` i wypełnij |
| `SPECIFICATION_EXAMPLE.md` | Przykład | Referencja - jak wygląda wypełniona specyfikacja |
| `ARCHITECTURE_TEMPLATE.md` | Szablon | **Faza 2 (Architektura):** Skopiuj jako `ARCHITECTURE.md` i wypełnij |
| `ARCHITECTURE_EXAMPLE.md` | Przykład | Referencja - jak wygląda wypełniona architektura |

## Jak Używać

### Faza 1: Specyfikacja Biznesowa

```bash
# Skopiuj szablon
cp docs/SPECIFICATION_TEMPLATE.md docs/SPECIFICATION.md

# Wypełnij własnymi słowami, potem zawołaj:
# @product-architect Przeanalizuj @SPECIFICATION.md
```

### Faza 2: Plan Techniczny

```bash
# Skopiuj szablon
cp docs/ARCHITECTURE_TEMPLATE.md docs/ARCHITECTURE.md

# Zawołaj:
# @code-architecture-reviewer Na podstawie @SPECIFICATION.md wypełnij @ARCHITECTURE.md
```

## Stack Technologiczny (aktualny)

| Technologia | Wersja | Uwagi |
|-------------|--------|-------|
| Symfony | **7.4 LTS** (`7.4.*`) | NIE używaj 8.x |
| PHP | **^8.2** | Minimum 8.2 |
| PostgreSQL | **16+** | Alpine w Docker |
| Vue 3 | Latest | Composition API + TypeScript |
| Node.js | **20 LTS** | Alpine w Docker |
| Docker Compose | **v2** | `docker compose` (nie `docker-compose`) |

> Przykłady (`_EXAMPLE.md`) pochodzą z projektu SuperW i mogą zawierać starsze wersje - traktuj je jako wzór struktury dokumentu, nie jako źródło prawdy o wersjach.

## Powiązane

- `INSTRUKCJA_PROCESU.md` - Model 3 Faz (Biznes → Architektura → Implementacja)
- `.cursor/agents/product-architect.md` - Agent do Fazy 1
- `.cursor/agents/code-architecture-reviewer.md` - Agent do Fazy 2
- `.cursor/skills/` - Skille technologiczne (Symfony, Vue, PostgreSQL, Docker)

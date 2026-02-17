---
description: "Documentation ownership rules: who updates what, when, and minimal viable documentation (MVD)."
alwaysApply: true
---

# Documentation Ownership

## Zasada: "Kodujący = Dokumentujący"

**Każdy agent który koduje jest odpowiedzialny za swoją dokumentację.**

| Agent/Kontekst | Odpowiedzialność za Dokumentację | Format | Kiedy aktualizować |
|----------------|----------------------------------|--------|-------------------|
| **test-writer** | Aktualizuje `TASKS.md` (test checklist) | Markdown | Po napisaniu testów |
| **Implementacja (każdy agent)** | Aktualizuje `TASKS.md` (subtasks done) | Markdown | Po ukończeniu każdego subtasku |
| **Implementacja (każdy agent)** | Aktualizuje `CHANGES.md` (decisions, changes) | Markdown | Gdy są zmiany architektoniczne |
| **product-architect** | Aktualizuje `PLAN.md`, `ISSUE.md` jeśli requirements się zmieniają | Markdown | Gdy requirements się zmieniają |
| **code-architecture-reviewer** | Aktualizuje `CHANGES.md` (decisions, changes) | Markdown | Po code review (jeśli są zmiany) |
| **documentation-architect** | Tworzy/aktualizuje README, API docs, arch docs | Markdown | Przed release, na żądanie |

## Automatyczna Aktualizacja (wbudowana w workflow)

**Checklist w każdym zadaniu (`TASKS.md`):**
```markdown
## Documentation Updates

- [ ] Update `TASKS.md` after each subtask completion
- [ ] Update `CHANGES.md` if architectural decisions changed
- [ ] Update `PLAN.md` if requirements changed (ask product-architect)
- [ ] Add code comments for complex logic
- [ ] Update API documentation if endpoints changed (use documentation-architect)
```

## Kiedy używać `documentation-architect` agenta?

**Użyj `documentation-architect` gdy:**
- ✅ Potrzebujesz kompleksowej dokumentacji (README, API docs, architecture overview)
- ✅ Dokumentacja wymaga formatowania i struktury (nie tylko update checklist)
- ✅ Chcesz wygenerować dokumentację z komentarzy w kodzie
- ✅ Przed release - final documentation review

**NIE używaj `documentation-architect` gdy:**
- ❌ Tylko update checklist w `TASKS.md` (agent który koduje to robi)
- ❌ Update `CHANGES.md` z decyzji (code-architecture-reviewer to robi)
- ❌ Update test checklist (test-writer to robi)

## Minimal Viable Documentation (MVD)

1. **`TASKS.md`** - zawsze aktualizowane (checklist) ✅
2. **`CHANGES.md`** - aktualizowane gdy są zmiany decyzyjne ✅
3. **`PLAN.md`** - aktualizowane tylko gdy requirements się zmieniają ✅

**In-Line Documentation:**
- Code comments dla złożonej logiki (agent który koduje dodaje)
- JSDoc/PHPDoc dla publicznych funkcji (automatycznie przez agenta)

**External Documentation:**
- README.md - aktualizowane przez `documentation-architect` przed release
- API docs - generowane/aktualizowane przez `documentation-architect`
- Architecture docs - aktualizowane przez `code-architecture-reviewer` lub `product-architect`

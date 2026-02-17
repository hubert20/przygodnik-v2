---
description: "Issue-driven task management workflow, dev_docs structure, and source of truth hierarchy."
alwaysApply: true
---

# Task Management (Issue-Driven)

Praca oparta o issue: jeden problem = jeden folder w `dev_docs/active/`.

## Workflow
Użyj agenta `@rnd-issue-workflow` - prowadzi przez 7 kroków:
Problem → Issue Docs → Review → Implementacja → Weryfikacja → Update Docs → Close

## Starting Tasks
```bash
# Utwórz folder z datą i nazwą problemu
dev_docs/active/YYYY-MM-DD_nazwa-problemu/
```

Skopiuj 4 pliki z `dev_docs/templates/`:
- `ISSUE.md` - Opis problemu
- `PLAN.md` - Plan rozwiązania (wymaga approve od Usera)
- `CHANGES.md` - Faktyczne zmiany w kodzie (aktualizuj real-time)
- `TASKS.md` - Checklist (aktualizuj real-time)

## Continuing Tasks
1. Check `dev_docs/active/` for existing work
2. Read ALL four files before proceeding
3. Mark tasks complete IMMEDIATELY when done in TASKS.md
4. Update CHANGES.md real-time during implementation

## Completing Tasks
- Mark ISSUE.md as RESOLVED
- Move directory to `dev_docs/archive/`
- Add lesson learned to `dev_docs/lessons_learned.md` (if valuable)

## Source of Truth (Hierarchia Dokumentów)

| Pytanie | Źródło Prawdy |
|---------|---------------|
| **Co JEST w systemie?** | `docs/SPECIFICATION.md` |
| **Jak zbudowany?** | `docs/ARCHITECTURE.md` |
| **Jak zacząć?** | `README.md` |
| **Co robię teraz?** | `dev_docs/active/` |

**Zasady anty-konfliktowe:**
- **Kod vs Spec:** Nowszy wygrywa → zaktualizuj starszy
- **Root docs vs dev_docs:** Root docs wygrywają (living > temporary)
- **Jeden temat = jeden issue** (nie mieszaj problemów)

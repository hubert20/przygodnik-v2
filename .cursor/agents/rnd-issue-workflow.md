---
name: rnd-issue-workflow
description: 7-step issue-driven workflow for R&D. Diagnoza, plan, review, implementacja, weryfikacja, update docs, close.
---

# Agent: R&D Issue Workflow

> **Cel:** Prowadzenie issue-driven development w fazie R&D.  
> **Trigger:** User zgłasza problem, bug, feature request, lub mówi "nowy issue".  
> **Wywołanie:** `@rnd-issue-workflow`

---

## Kiedy Używać

- User zgłasza problem do naprawienia
- Rozpoczynasz nowy issue/task/feature
- Musisz uporządkować pracę nad zmianą w kodzie
- Chcesz prowadzić pełny workflow: diagnoza → plan → implementacja → weryfikacja → dokumentacja

## Kiedy NIE Używać

- Proste pytania (nie wymagają issue)
- Jednolinijkowe poprawki (zrób od razu)
- Praca nad istniejącym, już utworzonym issue (wtedy kontynuuj bez tworzenia nowego)

---

## Workflow: 7 Kroków

```
USER ZGŁASZA PROBLEM
        │
        ↓
┌───────────────────┐
│ KROK 1: DIAGNOZA  │ → Zrozum problem
└───────────────────┘
        │
        ↓
┌───────────────────┐
│ KROK 2: ISSUE     │ → Utwórz dokumentację w dev_docs/active/
└───────────────────┘
        │
        ↓
┌───────────────────┐
│ KROK 3: REVIEW    │ → User zatwierdza plan
└───────────────────┘
        │
        ↓ (approved)
┌───────────────────┐
│ KROK 4: CODE      │ → Implementacja + aktualizuj CHANGES.md, TASKS.md
└───────────────────┘
        │
        ↓
┌───────────────────┐
│ KROK 5: VERIFY    │ → Testy + QA
└───────────────────┘
        │
        ↓
┌───────────────────┐
│ KROK 6: UPDATE    │ → Aktualizuj root docs (SPECIFICATION.md etc.)
└───────────────────┘
        │
        ↓
┌───────────────────┐
│ KROK 7: CLOSE     │ → Zamknij issue, przenieś do archive/
└───────────────────┘
```

---

### KROK 1: Diagnoza

**Co robisz:**
- Zrozum problem (co nie działa? co user chce?)
- Zbadaj kod źródłowy (root cause analysis)
- Sprawdź powiązane pliki i testy

**Output:** Jasne zrozumienie problemu, gotowość do utworzenia issue.

---

### KROK 2: Utwórz Issue

**Utwórz folder:**
```bash
dev_docs/active/YYYY-MM-DD_nazwa-problemu/
├── ISSUE.md      ← Skopiuj z dev_docs/templates/ISSUE.md
├── PLAN.md       ← Skopiuj z dev_docs/templates/PLAN.md
├── CHANGES.md    ← Skopiuj z dev_docs/templates/CHANGES.md
└── TASKS.md      ← Skopiuj z dev_docs/templates/TASKS.md
```

**Wypełnij:**
1. `ISSUE.md` - Opisz problem, reprodukcja, kontekst
2. `PLAN.md` - Proponowane rozwiązanie, zmiany w kodzie/DB/API, testy
3. `TASKS.md` - Checklist (zaznacz Przygotowanie jako done)
4. `CHANGES.md` - Na razie pusty (wypełnisz w KROK 4)

**Czas:** ~30-60 min

---

### KROK 3: Review

**Przedstaw Userowi:**
- Pokaż ISSUE.md (problem) + PLAN.md (rozwiązanie)
- Zapytaj: "Czy plan jest OK? Mam implementować?"

**Decyzja:**
- ✅ APPROVE → przejdź do KROK 4
- ❌ REJECT → popraw plan, wróć do KROK 2

**Opcjonalnie:** Użyj `@code-architecture-reviewer` do sprawdzenia planu.

---

### KROK 4: Implementacja

**Koduj:**
- Backend (migrations, entities, services, controllers)
- Frontend (types, stores, components)
- Testy (unit + functional)

**Podczas implementacji (real-time):**
- Aktualizuj `CHANGES.md` - co faktycznie zmieniłeś
- Aktualizuj `TASKS.md` - zaznaczaj [x] done
- Commituj z Conventional Commits

**Czas:** 1-6h (w zależności od złożoności)

---

### KROK 5: Weryfikacja

**Testy automatyczne:**
```bash
docker compose exec php php bin/phpunit          # Backend
docker compose exec node npm test                # Frontend
```

**Local QA (OBOWIĄZKOWE):**
- [ ] Aplikacja startuje (frontend + backend)
- [ ] Baza danych działa
- [ ] Browser console: brak błędów JS
- [ ] Smoke test (5 min) - główne funkcje działają
- [ ] Feature test - zmieniona funkcja działa end-to-end
- [ ] Regression test - inne funkcje nadal działają

**Jeśli FAIL → STOP, napraw, wróć do KROK 4.**

---

### KROK 6: Aktualizuj Root Docs

**Decyzja co aktualizować:**

```
Dodano/zmieniono pole w encji?        → SPECIFICATION.md (Data Model)
Dodano/zmieniono endpoint API?         → SPECIFICATION.md (API) + README.md
Zmieniono business rules/workflow?     → SPECIFICATION.md (Business Rules)
Zmieniono architekturę/nowy serwis?    → ARCHITECTURE.md + SPECIFICATION.md
Zmieniono Docker/setup?                → README.md + ARCHITECTURE.md
Nic z powyższych?                      → Nic nie aktualizuj (nie na siłę)
```

**Zasada:** Aktualizuj TYLKO to co się FAKTYCZNIE zmieniło.

---

### KROK 7: Zamknij Issue

1. **`ISSUE.md`**: Dodaj "RESOLVED ✅" + datę + opis rozwiązania
2. **`CHANGES.md`**: Status = COMPLETED ✅
3. **`TASKS.md`**: Sprawdź że WSZYSTKO jest [x] done
4. **`lessons_learned.md`**: Dodaj wpis jeśli był ciekawy problem/insight
5. **Przenieś folder** do `dev_docs/archive/`

**Anti-Conflict Check:**
- [ ] Root docs (SPECIFICATION.md etc.) zgadzają się z kodem
- [ ] Root docs nie przeczą sobie nawzajem

---

## Source of Truth (Hierarchia Dokumentów)

| Pytanie | Źródło Prawdy |
|---------|---------------|
| **Co JEST w systemie teraz?** | `SPECIFICATION.md` (living document) |
| **Jak system jest zbudowany?** | `ARCHITECTURE.md` |
| **Jak zacząć?** | `README.md` |
| **Co ROBIĘ teraz?** | `dev_docs/active/YYYY-MM-DD_*/` |
| **Co BYŁO zrobione wcześniej?** | `dev_docs/archive/` |

### Zasady Anty-Konfliktowe

1. **Kod vs SPECIFICATION.md:** Sprawdź który jest nowszy → nowszy wygrywa → zaktualizuj starszy
2. **Root docs vs dev_docs:** Root docs wygrywają (living documents)
3. **Issue Plan vs Spec:** Plan to propozycja → po implementacji zaktualizuj Spec
4. **Jeden temat = jeden issue** (nie mieszaj)

---

## Checklist "Done" (przed zamknięciem)

```markdown
✅ Implementacja:
- [ ] Wszystkie tasks z TASKS.md done
- [ ] Wszystkie testy przechodzą
- [ ] Local QA passed (smoke + feature + regression)

✅ Dokumentacja:
- [ ] CHANGES.md zaktualizowany
- [ ] SPECIFICATION.md zaktualizowany (jeśli zmieniono model/API/rules)
- [ ] ARCHITECTURE.md zaktualizowany (jeśli zmieniono architekturę)

✅ Zamknięcie:
- [ ] ISSUE.md: RESOLVED ✅
- [ ] Lesson learned dodany (jeśli wart zapamiętania)
- [ ] Folder przeniesiony do dev_docs/archive/
- [ ] Anti-conflict check passed
```

---

**Agent Version:** 1.0  
**Last Updated:** 2026-02-16  
**Stack:** Symfony 7.4 + Vue 3 + PostgreSQL + Docker

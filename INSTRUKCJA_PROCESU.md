# Instrukcja Procesu AI-First (Model 3 Faz)

Ten dokument opisuje, jak pracujemy w tym projekcie. Trzymaj się tych kroków, a AI będzie Twoim sprzymierzeńcem.

## Mapa Agentów (Kogo wołać?)

| Sytuacja | Kogo wołać? (@) |
| :--- | :--- |
| "Mam mockupy/specyfikacje do analizy" | `discovery-analyst` |
| "Nie wiem jak to opisać / potrzebuję wymagań" | `product-architect` |
| "Czy mój plan ma sens?" | `plan-reviewer` |
| "Chcę zacząć nowy issue/task/bug" | `rnd-issue-workflow` |
| "Napisz mi testy" | `test-writer` |
| "Przetestuj API" | `api-tester` |
| "Zaimplementuj UI z mockupa" | `ui-implementation-specialist` |
| "Sprawdź architekturę kodu" | `code-architecture-reviewer` |
| "Czy to bezpieczne?" | `security-auditor` |
| "Mam błąd, ratuj!" | `error-debugger` |
| "Aplikacja jest wolna" | `performance-profiler` |
| "Sprawdź zależności/CVE" | `dependency-analyzer` |
| "Napisz dokumentację" | `documentation-architect` |
| "Zaplanuj refactoring" | `refactor-planner` |
| "Zrób CRUD dla encji" | `crud-scaffold` |
| "Wykonaj refactoring" | `code-refactor-master` |

---

## Faza 1: BIZNES (Discovery + Specyfikacja)

1. **Skopiuj szablon:** `docs/SPECIFICATION_TEMPLATE.md` -> `docs/SPECIFICATION.md`
2. **Wypełnij szablon** własnymi słowami (cel, użytkownicy, funkcje).
3. **Jeśli masz materiały źródłowe** (mockupy, specs, pliki od klienta):
   - Zawołaj `@discovery-analyst` - przeanalizuje KAŻDY plik, stworzy Data Flow Map, zada pytania.
   - Odpowiedz na pytania analityka.
4. **Zawołaj:** `@product-architect` - doprecyzuje wymagania, stworzy user stories, podzieli na zadania.
5. **Iteruj:** Odpowiadaj na pytania AI, aż powie "Specyfikacja jest kompletna".

## Faza 2: ARCHITEKTURA (Design)

1. **Skopiuj szablon:** `docs/ARCHITECTURE_TEMPLATE.md` -> `docs/ARCHITECTURE.md`
2. **Wypełnij szablon** z pomocą AI na podstawie `docs/SPECIFICATION.md`.
3. **Zawołaj:** `@plan-reviewer` - sprawdzi plan pod kątem luk, ryzyk i błędów.
4. **Opcjonalnie:** `@code-architecture-reviewer` - zrecenzuje architekturę pod kątem stacku (Vue + Symfony + PostgreSQL + Docker).
5. **Zatwierdź:** Jeśli OK -> Idź dalej. Jeśli problemy -> Popraw i wróć do kroku 3.

## Faza 3: IMPLEMENTACJA (R&D)

1. **Zawołaj:** `@rnd-issue-workflow` - prowadzi 7-krokowy workflow dla każdego zadania:
   - Diagnoza -> Issue docs -> Review -> Kod -> Weryfikacja -> Update docs -> Close
2. **Podczas kodowania:**
   - `@test-writer` - pisz testy PRZED kodem (TDD)
   - `@error-debugger` - gdy napotkasz błąd
   - `@api-tester` - po implementacji endpointu API
3. **Po zakończeniu feature/EPIC:**
   - `@code-architecture-reviewer` - review kodu
   - `@security-auditor` - audit bezpieczeństwa
4. **Przed release:**
   - `@security-auditor` (pełny audit OWASP Top 10)
   - `@performance-profiler` (N+1, slow queries, Lighthouse)
   - `@dependency-analyzer` (CVE w paczkach)

---

## Zasady Żelazne

1. **Kodujący = Dokumentujący:** Jeśli AI zmieni kod, poproś je o aktualizację `TASKS.md` i `CHANGES.md`.
2. **Jeden Problem = Jeden Issue:** Nie naprawiaj 5 rzeczy naraz. Użyj `rnd-issue-workflow`.
3. **Checkpoint FAIL = STOP:** Jeśli testy nie przechodzą, NIE przechodź dalej. Napraw najpierw.
4. **Audyt:** Zawsze sprawdzaj bezpieczeństwo przed powiedzeniem "Gotowe".

## Szablony i Przykłady

- **Szablony specyfikacji/architektury:** `docs/*_TEMPLATE.md`
- **Przykłady (referencja):** `docs/*_EXAMPLE.md`
- **Szablony issue:** `dev_docs/templates/` (ISSUE, PLAN, TASKS, CHANGES)

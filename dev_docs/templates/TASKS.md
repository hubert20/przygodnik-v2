# Tasks: [Nazwa Issue]

> **Data:** YYYY-MM-DD  
> **Status:** IN_PROGRESS | COMPLETED

> Zaznaczaj `[x]` gdy task jest done. Aktualizuj real-time.

---

## Przygotowanie

- [ ] ISSUE.md wypełniony
- [ ] PLAN.md wypełniony
- [ ] Plan zatwierdzony przez Usera

---

## Implementacja

- [ ] Kod zaimplementowany
- [ ] Testy napisane
- [ ] Testy przechodzą (backend)
- [ ] Testy przechodzą (frontend)
- [ ] CHANGES.md aktualizowany na bieżąco

---

## Weryfikacja (Krok 5)

- [ ] Wszystkie testy przechodzą
- [ ] Local QA:
  - [ ] Aplikacja startuje (frontend + backend + DB)
  - [ ] Browser console: brak błędów
  - [ ] Smoke test - główne funkcje działają
  - [ ] Feature test - zmieniona funkcja działa end-to-end
  - [ ] Regression test - inne funkcje nadal działają

---

## Dokumentacja (Krok 6)

- [ ] SPECIFICATION.md zaktualizowany (jeśli zmieniono model/API/rules)
- [ ] ARCHITECTURE.md zaktualizowany (jeśli zmieniono architekturę)
- [ ] README.md zaktualizowany (jeśli zmieniono setup)

---

## Zamknięcie (Krok 7)

- [ ] ISSUE.md: Status → RESOLVED, data, opis rozwiązania
- [ ] CHANGES.md: Status → COMPLETED
- [ ] Lesson learned dodany (jeśli wart zapamiętania)
- [ ] Folder przeniesiony do `dev_docs/archive/`
- [ ] Anti-conflict check:
  - [ ] Root docs zgadzają się z kodem
  - [ ] Root docs nie przeczą sobie nawzajem

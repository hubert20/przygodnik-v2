# dev_docs/ - Dokumentacja Deweloperska

Folder zarządzania pracą programistyczną w projekcie.

## Struktura

```
dev_docs/
├── README.md              ← Ten plik
├── active/                ← Aktywne issue/taski (w trakcie pracy)
│   └── YYYY-MM-DD_nazwa/
│       ├── ISSUE.md       (opis problemu)
│       ├── PLAN.md        (plan rozwiązania)
│       ├── CHANGES.md     (faktyczne zmiany - real-time)
│       └── TASKS.md       (checklist - real-time)
├── archive/               ← Zakończone issue (przeniesione z active/)
│   └── YYYY-MM-DD_nazwa/
├── templates/             ← Szablony do kopiowania
│   ├── ISSUE.md
│   ├── PLAN.md
│   ├── CHANGES.md
│   └── TASKS.md
└── lessons_learned.md     ← Baza wiedzy projektowej
```

## Jak Pracować

### Nowy issue/task

1. **Zawołaj** `@rnd-issue-workflow` - agent poprowadzi Cię przez 7 kroków
2. Lub ręcznie: skopiuj `templates/` do `active/YYYY-MM-DD_nazwa/`

### Workflow (7 kroków)

```
Problem → Diagnoza → Issue Docs → Review → Implementacja → Weryfikacja → Update Docs → Close
```

Szczegóły: `.cursor/agents/rnd-issue-workflow.md`

### Zamykanie issue

1. Oznacz ISSUE.md jako RESOLVED
2. Przenieś folder z `active/` do `archive/`
3. Dodaj wpis w `lessons_learned.md` (jeśli wart zapamiętania)

## Zasady

| Zasada | Opis |
|--------|------|
| **Jeden temat = jeden issue** | Nie mieszaj kilku problemów w jednym folderze |
| **Kodujący = Dokumentujący** | Kto koduje, ten aktualizuje CHANGES.md i TASKS.md |
| **Real-time updates** | CHANGES.md i TASKS.md aktualizuj w trakcie pracy, nie po |
| **Root docs = source of truth** | `SPECIFICATION.md` > `dev_docs/` (living > temporary) |

## Powiązane Pliki

| Plik | Rola |
|------|------|
| `docs/SPECIFICATION.md` | Co JEST w systemie (master document) |
| `docs/ARCHITECTURE.md` | Jak system jest zbudowany |
| `INSTRUKCJA_PROCESU.md` | Model 3 Faz (Biznes → Architektura → Implementacja) |
| `.cursor/agents/rnd-issue-workflow.md` | Agent prowadzący workflow |

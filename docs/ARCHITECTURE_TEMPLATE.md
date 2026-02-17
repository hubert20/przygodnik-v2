# ARCHITECTURE.md - Plan Techniczny (Szablon)

> **Status:** W trakcie tworzenia  
> **Ostatnia aktualizacja:** [YYYY-MM-DD]  
> **Tworzony przez:** `@code-architecture-reviewer`  
> **Zatwierdzony przez:** [Twoje Imię] - [Data]

---

## 🎯 Cel Techniczny

**Na podstawie:** `docs/SPECIFICATION.md`

**Co musimy zbudować technicznie, żeby spełnić wymagania biznesowe?**

---

## 🗄️ Baza Danych (Jeśli potrzebna)

**Jakie tabele potrzebujemy?**

| Tabela | Opis | Kluczowe pola |
|--------|------|---------------|
| `[nazwa_tabeli]` | [Co przechowuje?] | `id`, `[pole1]`, `[pole2]` |

**Relacje:**
- [Tabela A] → [Tabela B] (jeden do wielu / wiele do wielu)

---

## 🔌 API Endpoints (Jeśli potrzebne)

**Jakie endpointy musimy stworzyć?**

| Metoda | Endpoint | Opis | Input | Output |
|--------|----------|------|-------|--------|
| `GET` | `/api/[ścieżka]` | [Co robi?] | [Co przyjmuje?] | [Co zwraca?] |
| `POST` | `/api/[ścieżka]` | [Co robi?] | [Co przyjmuje?] | [Co zwraca?] |

---

## 🎨 Frontend (Jeśli potrzebny)

**Jakie komponenty/strony potrzebujemy?**

- [ ] Strona: `[Nazwa]` - [Opis]
- [ ] Komponent: `[Nazwa]` - [Opis]

---

## 🛡️ Bezpieczeństwo

**Zagrożenia i zabezpieczenia:**

- [ ] **RODO:** Czy przechowujemy dane osobowe? Jak je chronimy?
- [ ] **Autoryzacja:** Kto może używać tej funkcji?
- [ ] **Walidacja:** Jak sprawdzamy dane wejściowe?

---

## ⚠️ Ryzyka Techniczne

**Co może pójść nie tak?**

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| [Opis] | Wysokie/Średnie/Niskie | Wysoki/Średni/Niski | [Jak to zabezpieczamy?] |

---

## ✅ Zatwierdzenie

- [ ] Plan przeczytany i zrozumiany
- [ ] Ryzyka zaakceptowane
- [ ] Gotowy do implementacji

**Zatwierdzający:** [Imię] - [Data]

---

**💡 Wskazówka:** Ten plan jest tworzony przez `@code-architecture-reviewer`. Jeśli coś brzmi niebezpiecznie lub niejasno, ZATRZYMAJ i zapytaj programistę.

**Stack:** Symfony 7.4 LTS | PHP ^8.2 | PostgreSQL 16+ | Vue 3 + TypeScript | Docker Compose v2

---
description: "Tiered quality gates strategy: Tier 1 (per task), Tier 2 (per EPIC), Tier 3 (pre-release)."
alwaysApply: true
---

# Quality Gates (Tiered Approach)

**Strategia:** Warstwowe bramy jakości - nie po każdym etapie (zbyt kosztowne), ale strategicznie w punktach krytycznych.

## Tier 1: Lightweight Checks (po każdym zadaniu)

**Czas:** ~15-20 min | **Funkcja:** Szybkie weryfikacje podstawowe

| Agent | Kiedy | Co sprawdza |
|-------|-------|-------------|
| **test-writer** | Automatycznie podczas TDD (testy pisane przed kodem) | Testy jednostkowe i integracyjne |
| **error-debugger** | Gdy testy failują | Systematyczne debugowanie błędów |
| **code-architecture-reviewer** (quick scan) | Po każdym ukończonym zadaniu (>50 linii) | Szybki skan architektury zaimplementowanego kodu |

**Checklist po każdym zadaniu:**
- [ ] All tests pass (unit + integration)
- [ ] No linter errors (`npm run lint` / `composer cs-fix --dry-run`)
- [ ] Quick architecture scan (code-architecture-reviewer) - tylko dla dużych zmian
- [ ] Update task documentation (TASKS.md marked complete)

## Tier 2: Medium Checks (po każdej feature/EPIC - grupa zadań)

**Czas:** ~30-45 min | **Funkcja:** Głębsza weryfikacja po grupie zadań

| Agent | Kiedy | Co sprawdza |
|-------|-------|-------------|
| **code-architecture-reviewer** (full review) | Po ukończeniu EPIC (3-5 zadań) | Cała feature pod kątem architektury |
| **security-auditor** (focused) | Po implementacji auth/security feature | OWASP Top 10 dla danej feature |
| **dependency-analyzer** | Po dodaniu nowych dependencies | Security vulnerabilities w pakietach |

**Przykład:** Po zakończeniu zadań 0004, 0005, 0006 (backend registration + login + admin):
- ✅ Full code-architecture-reviewer review
- ✅ Focused security-auditor (authentication flows)

## Tier 3: Heavy Checks (przed release/critical milestones)

**Czas:** ~2-3h | **Funkcja:** Pełna weryfikacja przed deploymentem

| Agent | Kiedy | Co sprawdza |
|-------|-------|-------------|
| **security-auditor** (full audit) | Przed każdym deploymentem | Pełny audit OWASP Top 10 całej aplikacji |
| **performance-profiler** | Przed release lub gdy performance issues | N+1 queries, memory leaks, slow endpoints |
| **plan-reviewer** | Po ukończeniu całej fazy (np. wszystkie auth features) | Gap analysis, missing requirements |

**Checkpoint przed release:**
- [ ] All tests pass (unit + integration + E2E)
- [ ] Full security-auditor scan (OWASP Top 10)
- [ ] Performance-profiler check (N+1 queries, slow endpoints)
- [ ] Code-architecture-reviewer full review
- [ ] Dependency-analyzer (security vulnerabilities)
- [ ] Documentation complete (documentation-architect review)

**Koszt vs Jakość:**
- **Tier 1:** ~2-3h/miesiąc (10 zadań/tydzień) - **Wymagane** ✅
- **Tier 2:** ~4-6h/miesiąc (2-3 EPIC/miesiąc) - **Wymagane** ✅
- **Tier 3:** ~2-3h/release - **Wymagane** ✅

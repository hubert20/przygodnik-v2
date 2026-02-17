---
description: "Testing guidelines (TDD, atomic tests) and mandatory checkpoint protocol for implementation steps."
alwaysApply: true
---

# Testing Guidelines

## Atomic Tests
- One test = one behavior/scenario
- Test name format: `test_<function>_<scenario>_<expected_result>`
- Each test must be independent and isolated
- No shared mutable state between tests

## Test Workflow
1. Write test BEFORE implementation (TDD preferred)
2. Run existing tests before making changes
3. Run all tests after changes
4. Never commit with failing tests

---

## Checkpoint Protocol (STRICT)

### ALWAYS ask user before:
- Any architectural decision
- Adding/removing dependencies
- Deleting or significantly refactoring code
- Modifying configuration files
- Creating new directories or major files
- Any action that cannot be easily undone

### Summarize progress:
- After completing each logical unit of work
- Before moving to next task
- When encountering blockers or decisions

### Test Checkpoints (MANDATORY after each implementation step)

**Reguła:** Jeśli checkpoint FAIL → **STOP**, nie przechodź dalej, napraw problem.

| Checkpoint | Kiedy | Co sprawdza | Komenda |
|------------|-------|-------------|---------|
| **CP1: Unit Tests** | Po implementacji każdej funkcji/komponentu | Wszystkie testy jednostkowe przechodzą | `npm test` (frontend) lub `php bin/phpunit --testsuite=Unit` (backend) |
| **CP2: Integration Tests** | Po implementacji endpointu/usługi | API/DB integration tests | `php bin/phpunit --testsuite=Functional` (backend) |
| **CP3: E2E Check** | Po ukończeniu całego zadania | Wszystkie testy zadania | `npm test && php bin/phpunit` (full suite) |
| **CP4: Regression** | Przed przejściem do następnego zadania | Wszystkie istniejące testy (nie tylko z aktualnego zadania) | Pełny test suite (frontend + backend) |

**Checkpoint Format in `TASKS.md`:**
```markdown
- [x] Implement feature X
- [x] **CHECKPOINT 1:** Run unit tests - all pass ✅
- [x] Implement feature Y
- [x] **CHECKPOINT 2:** Run integration tests - all pass ✅
- [ ] **CHECKPOINT 3:** Run full test suite - no regressions ⏳
```

**If checkpoint FAIL:**
1. **STOP** - do not proceed to next task
2. Fix failing tests
3. Re-run checkpoint until PASS
4. Only then proceed to next task

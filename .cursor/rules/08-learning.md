---
description: "Continuous learning protocol: lessons learned, environment evolution proposals, and periodic review."
alwaysApply: true
---

# Continuous Learning & Environment Evolution

Prowadzimy `dev_docs/lessons_learned.md` jako **dziennik wiedzy z R&D** - insighty, odkrycia, usprawnienia procesów.

## 1. Podczas pracy/R&D:

Gdy odkryjesz coś istotnego:
- Lepsze podejście do problemu
- Błędne założenie które się okazało
- Możliwość usprawnienia procesu
- Insight architektoniczny
- Wzorzec wart zapamiętania

**ZAPROPONUJ zapis:**
```
"To odkrycie wydaje się istotne. Zapisać w lessons_learned.md?"
```

**Szablon:**
```markdown
### Issue #X: [Nazwa odkrycia/problemu] (YYYY-MM-DD)

#### 🔍 Co wykryliśmy:
[Co się zmieniło w naszym rozumieniu]

#### 🚨 Dlaczego to ważne:
[Dlaczego ma znaczenie / co robiliśmy źle wcześniej]

#### 💡 Jak to stosujemy:
1. **Natychmiastowa zmiana:** [Co robimy teraz]
2. **Wpływ na proces:** [Jak to wpływa na workflow]
3. **Prewencja:** [Jak unikać starego podejścia]
```

## 2. Inteligentna propozycja update'u środowiska:

**Po zapisaniu w lessons_learned.md, PRZEANALIZUJ czy to powinno się rozpropagować:**

Pytania:
- ✅ Czy to **powtarzalny wzorzec** (nie jednorazówka)?
- ✅ Czy wpłynie na **przyszłą pracę** (nie tylko to zadanie)?
- ✅ Czy da się **zgeneralizować** (nie jest project-specific)?

**Jeśli TAK → Zaproponuj konkretny update:**

```
"Ten insight wpływa na [obszar]. Proponuję update:
 
 Opcja A: .cursor/rules/[plik].md → [konkretna sekcja] bo [powód]
 Opcja B: .cursor/agents/X.md → [checkpoint] bo [powód]
 Opcja C: .cursor/skills/Y/SKILL.md → [pattern] bo [powód]
 
 Które mam zaktualizować? (może być kilka lub żadne)"
```

## 3. Minimalne zmiany (zasada LEAN):

**Aktualizując środowisko, bądź MINIMALNY:**

❌ **NIE:**
- Dodawaj do każdego możliwego pliku "na zapas"
- Twórz nowe checkpointy dla jednorazowych problemów
- Duplikuj tej samej reguły w wielu miejscach
- Dodawaj reguł które i tak nie będą stosowane

✅ **TAK:**
- Update 1-2 najbardziej relevantnych plików
- Dodaj do istniejących sekcji (nie twórz nowych bez potrzeby)
- Rób reguły konkretne i wykonalne
- Dbaj o czytelność (ludzie muszą to czytać)

**Przykład:**
```
Learning: "Docker Alpine wymaga explicit instalacji bash"
❌ Źle: Dodaj do wielu plików "na zapas"
✅ Dobrze: Dodaj do code-architecture-reviewer.md → sekcja Docker Review (1 miejsce, tam gdzie ma znaczenie)
```

## 4. Kontekstowe odwoływanie (nie czytaj za każdym razem):

**NIE musisz czytać lessons_learned.md przed każdym zadaniem.**

**ALE JEŚLI:**
- Pracujesz w obszarze z udokumentowanym lessonem (np. Docker, Auth)
- User wspomina "pamiętasz co się nauczyliśmy o X"
- Widzisz podobny wzorzec problemu

**TO:**
- Krótko potwierdź: "Stosuję lesson z Issue #X: [krótko]"
- Nie elaboruj chyba że poproszony

## 5. Okresowy review (nie zapomnij):

**Przed dużymi kamieniami milowymi (release, handoff, nowy dev):**
- Przejrzyj ostatnie wpisy z `lessons_learned.md`
- Sprawdź: Czy rozpropagowaliśmy ważne wzorce?
- Zweryfikuj: Czy środowisko jest zgodne z aktualną wiedzą?

---

**Uwaga:** Agent templates **nie są automatycznie triggerowane** - musisz je wywołać explicite gdy potrzeba.

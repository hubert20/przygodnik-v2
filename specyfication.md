# SPECYFICATION.md - Specyfikacja Biznesowa (Wstepna)

> **Status:** W trakcie tworzenia  
> **Ostatnia aktualizacja:** 2026-02-27  
> **Wlasciciel:** Zespol Przygodnik

---

## 📋 Cel Biznesowy

**Co chcemy osiagnac?**
> Stworzyc lekka, przegladarkowa aplikacje "interaktywny komiks paragrafowy" dla dzieci 8-10 lat, ktora pozwala przejsc historie przez wybory i dotrzec do jednego z kilku zakonczen w 20-30 minut.

**Dlaczego to robimy?**
> Chcemy zaoferowac angazujaca i bezpieczna forme cyfrowej przygody z niskim progiem wejscia (bez logowania), ktora rozwija ciekawosc, sprawczosc i chec ponownego przejscia historii.

---

## 👥 Uzytkownicy (Persony)

**Kto bedzie tego uzywal?**

| Persona | Rola | Potrzeby | Przyklad |
|---------|------|----------|----------|
| Dziecko 8-10 lat | Glowny odbiorca | Proste wybory, czytelny tekst, szybkie przejscia, jasny cel | "Klikam opcje i widze, co sie wydarzy dalej." |
| Rodzic / opiekun | Uzytkownik posredni | Bezpieczny content, brak skomplikowanej rejestracji, przewidywalny czas sesji | "Uruchamiam dziecku historie na telefonie bez zakladania konta." |
| Autor tresci (narracja) | Tworca scenariusza | Latwe mapowanie scen i galezi, kontrola zakonczen | "Definiuje sceny i wybory, ktore prowadza do roznych finalow." |

---

## 🎯 Kluczowe Funkcjonalnosci (Must Have)

1. **Interaktywny przeplyw scen (core story engine)**
   - Uzytkownik przechodzi miedzy scenami poprzez kafle wyboru.
   - System prowadzi nieliniowa historie i pokazuje final zgodnie z logika.

2. **Zapamietywanie decyzji w ramach sesji**
   - Aplikacja zapisuje ukryte zmienne fabularne (np. `curiosity`, `courage`).
   - Decyzje gracza wplywaja na przebieg i rodzaj zakonczenia.

3. **Responsywna obsluga desktop + mobile**
   - Ten sam scenariusz dziala na komputerze i telefonie.
   - UI jest prosty: tekst, ilustracja, wybory, przejscie dalej.

4. **Brak logowania i niski prog wejscia**
   - Start gry bez konta i bez formularzy rejestracji.
   - Stan sesji moze byc zapisany lokalnie (localStorage/cookies).

5. **Wersja V1 z ograniczonym zakresem**
   - Jedna historia (ok. 100 ekranow), 3-5 zakonczen.
   - Brak zaawansowanych animacji i rozbudowanego systemu profilu.

---

## 📊 Zasady Biznesowe (Logika)

**Jesli... to...**

- Jesli gracz wybierze opcje z efektem fabularnym, to odpowiednia zmienna zwieksza sie o wartosc zdefiniowana w scenariuszu.
- Jesli gracz dotrze do punktu finalnego, to system sprawdza reguly zakonczen i wybiera final na podstawie stanu zmiennych.
- Jesli gracz pominie interakcje informacyjne, to nadal moze przejsc glowny przebieg historii.
- Jesli aplikacja zostanie zamknieta, to po ponownym uruchomieniu mozna odtworzyc postep z pamieci lokalnej (w ramach tego samego urzadzenia/przegladarki).
- Jesli scena nie ma juz wyborow, to jest traktowana jako zakonczona i uzytkownik dostaje opcje rozpoczecia od poczatku.

**Przyklady:**
- Jesli `curiosity >= 3`, to pokaz zakonczenie "Odkrywca".
- Jesli `courage >= 3` i warunek "Odkrywca" nie jest spelniony, to pokaz zakonczenie "Straznik".
- Jesli zadna regula premium nie jest spelniona, to pokaz zakonczenie domyslne "Wedrowiec".

---

## 🚫 Czego NIE robimy (Out of Scope)

**Na razie nie implementujemy:**
- Systemu kont, logowania i panelu uzytkownika - aby utrzymac niski prog wejscia.
- Sync postepu miedzy urzadzeniami - bo V1 opiera sie na zapisie lokalnym.
- Zaawansowanego systemu achievementow z oddzielnym UI - zostaje symboliczny feedback narracyjny.
- Dynamicznego renderowania dymkow komiksowych - dialogi sa czescia gotowych ilustracji.
- Rozbudowanej personalizacji interfejsu - aby nie zwiekszac zlozonosci V1.

**Uzasadnienie:** Celem V1 jest szybkie dostarczenie dzialajacego rdzenia produktu, walidacja atrakcyjnosci wsrod dzieci i zebranie danych do decyzji o kolejnym etapie.

---

## 📝 Notatki

- Do doprecyzowania przed produkcja:
  - finalny format scenariusza (JSON schema + walidacja),
  - dokladny zestaw eventow analitycznych (start, wybor, zakonczona sesja, porzucenie),
  - minimalne wymagania dostepnosci i czytelnosci na mobile,
  - limity wagowe assetow ilustracji (performance budget).
- Proponowane KPI dla V1:
  - odsetek ukonczonych historii,
  - sredni czas sesji,
  - odsetek ponownych przejsc.

---

**Stack:** Symfony 7.4 LTS | PHP ^8.2 | PostgreSQL 16+ | Vue 3 + TypeScript | Docker Compose v2

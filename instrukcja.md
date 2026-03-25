Przygodnik – komiks paragrafowy: założenia techniczne i zakres 

1. Cel dokumentu 

Celem dokumentu jest zebranie w jednym miejscu spójnych założeń technicznych, produktowych i zakresowych dla wersji V1 Przygodnika – interaktywnego komiksu paragrafowego online (desktop + mobile). Dokument stanowi punkt odniesienia dla zespołów: produktowego, narracyjnego, artystycznego, UX oraz developerskiego. 

Dokument: 

precyzuje co jest budowane, 

rozdziela odpowiedzialności między zespołami, 

ogranicza scope V1 do świadomie wybranych rozwiązań, 

stanowi podstawę do dalszej implementacji i harmonogramu. 

 

2. Definicja produktu (V1) 

Przygodnik V1 to interaktywny komiks paragrafowy dostępny w przeglądarce, skierowany do dzieci w wieku 8–10 lat. 

Charakterystyka: 

100 ekranów, 3-5 zakończeń 

narracja nielinearna oparta o wybory gracza, 

1 ekran = 1 ilustracja komiksowa, ale podzielona na części 

brak kont, logowania i zapisu stanu gry, 

niski próg wejścia i prosta obsługa, 

wersja desktopowa i mobilna. 

Czas przejścia jednego scenariusza: ok. 20–30 minut. 

 

3. Założenia techniczne – model ekranów 

3.1. Kadry w obrębie jednego ekranu 

podział ilustracji na 2 części (poziome lub pionowe), 

sporadycznie 3 pionowe kadry – wyłącznie, gdy wspiera to narrację. 

możliwość przełączania kadrów w obrębie jednego ekranu (bez zmiany ekranu aplikacyjnego). 

 

4. Skalowanie i responsywność 

Skalowanie treści realizowane jest poprzez standardowe mechanizmy przeglądarki (zoom całego ekranu). 

Brak osobnych mechanizmów skalowania tekstu lub dymków. 

Po stronie developmentu: 

responsywne wyświetlanie ilustracji (desktop / mobile), 

zachowanie proporcji i czytelności. 

 

5. Interakcje na ekranie 

5.1. Interakcje informacyjne 

Możliwe elementy: 

„kliknij przedmiot, aby dowiedzieć się więcej”, 

wyszukiwanie obiektu lub informacji. 

Założenia: 

interakcje nie są obowiązkowe do przejścia fabuły, 

gracz zawsze może przejść dalej bez ich użycia, 

interakcje stosowane głównie przy kadrach statycznych. 

5.2. Tryb prezentacji interakcji 

Informacje prezentowane w panelu pełnoekranowym, aby: 

uniknąć „obsesyjnego klikania”, 

zachować spokój i czytelność odbioru. 

 

6. Wybory gracza i nawigacja 

6.1. Prezentacja wyborów 

Wybory prezentowane jako kafle wyboru w obrębie jednego ekranu. 

Każdy wybór posiada: 

krótki opis tekstowy, 

ilustracje sugerujące kierunek decyzji  

 

6.2. Nawigacja 

proste przyciski: „dalej”, wybór opcji, 

liniowy flow ekranu, 

jasne przejścia między scenami. 

 

7. Zapamiętywanie wyborów (zmienne fabularne) 

7.1. Mechanika 

System zapamiętywania kluczowych decyzji gracza (np. licznik wyborów A/B/C). 

Zmienne: 

nie są widoczne dla gracza, 

wpływają na przebieg i zakończenie historii. 

Przykład: 

3× wybór A → zakończenie A, 

5× wybór B → zakończenie B. 

7.2. Implementacja techniczna 

zapisywanie zmiennych w localStorage / cookies, 

brak kont użytkowników i logowania. 

 

8. Achievementy i nagrody (V1) System achievmentów_JB.docx 

8.1. Założenie 

Achievementy i feedback mają charakter symboliczny i narracyjny. 

Realizowane poprzez: 

dialogi, 

ilustracje, 

tekstowe pop-upy. 

8.2. Zakres 

Do ustalenia-> https://wiosna.sharepoint.com/:w:/s/PlatformaAP/IQCmlX0L8mGcTbGCfVMNIXqGAdv35MA-EmnvI9JwpCYILOU?e=hFuIHg  

 

9. Avatar gracza 

Avatar: 

neutralny wizualnie, 

fantastyczny, 

niehumanoidalny, 

widoczny na ilustracjach. 

Na początku gry: 

wybór płci, 

możliwość wpisania imienia avatara (domyślne + możliwość zmiany). 

9.1. Konsekwencje dla sposobu podawania dialogów 

personalizacja dialogów ograniczona jest wyłącznie do imienia oraz zaimków gracza. Dymki dialogowe pozostają integralną częścią ilustracji i nie są renderowane ani pozycjonowane dynamicznie przez aplikację. Zmienne elementy tekstowe (imię, zaimki) prezentowane są w warstwie narracyjnej lub UI poza dymkami albo poprzez przygotowane warianty ilustracji, bez potrzeby implementowania systemu edytowalnych dymków. 

10. Zakres odpowiedzialności 

10.1. Po stronie produktu / narracji / ilustracji 

kompletny scenariusz fabularny, 

przygotowanie ilustracji komiksowych z dialogami i dymkami, 

dbałość o długość i czytelność tekstów, 

przygotowanie ilustracji w wersji desktop i mobile, 

spójność lore, tonu i wartości rozwojowych. 

10.2. Po stronie UX 

projekt UX aplikacji w rozumieniu: 

nawigacji, 

flow przejść, 

zachowania przycisków, 

makietowanie pełnych ekranów aplikacji, 

ilustracje komiksowe są wyłączone z zakresu UX (dostarczane jako gotowe assety). 

10.3. Po stronie developmentu 

implementacja warstwy aplikacyjnej: 

struktura ekranu (kontener, osadzenie ilustracji), 

nawigacja i logika przejść, 

obsługa wyborów i zakończeń, 

zapamiętywanie zmiennych, 

responsywność, 

preload i podstawowa optymalizacja ładowania. 

 

11. Zakres wyłączony z V1 

system kont i logowania, 

zapisywanie postępów między sesjami, 

zaawansowane animacje, 

rozbudowany system achievementów z osobnym UI, 

dynamiczne renderowanie dialogów i dymków, 

personalizacja interfejsu. 

 

12. Status dokumentu 

Dokument obowiązuje jako punkt odniesienia dla V1. 

Zmiany zakresowe wymagają: 

świadomej decyzji produktowej, 

oceny wpływu na harmonogram i budżet, 

formalnej akceptacji Sponsora. 

 
# Scenariusz V1

Wrzucaj tutaj logike historii jako JSON.

## Jak podmienic demo

1. Podmien `story.json` na swoj plik.
2. Zachowaj te kluczowe pola:
   - `id`, `name`, `firstSceneId`
   - `endingRules[]`
   - `scenes[]`
3. Kazda scena musi miec:
   - `id`, `title`, `text`, `choices[]`
4. Kazdy wybor musi miec:
   - `id`, `label`, `nextSceneId`
   - opcjonalnie `effects[]`, np. `{ "key": "curiosity", "by": 1 }`

## Uwaga

Jesli `nextSceneId` ustawisz na `ending_default`, silnik sprawdzi `endingRules`
i moze automatycznie przelaczyc na inne zakonczenie.

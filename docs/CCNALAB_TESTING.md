# CcnaLab — lokalne uruchamianie i granice testów

Minimalne środowisko: Node.js 20+ oraz npm. Uwaga: obecny import zachowuje 19 brakujących zależności hosta i **nie jest jeszcze samodzielnie działającą aplikacją**.

## Dostępne, niezależne od zewnętrznych bibliotek
```bash
npm ci
npm run test:authoring
npm run test:packetlab:unit
npm run audit:assets
npm run audit:assets:strict
```
`audit:assets` raportuje znane braki; `audit:assets:strict` **powinien obecnie zakończyć się błędem** do momentu usunięcia brakujących zależności. Tego wyniku nie ukrywać.

```bash
npm run validate:lesson -- content/lesson-example.json
```
To uruchamia wstępną bramkę strukturalną: notatkę ze źródłem i czasem, mapowanie celów, cztery różne odpowiedzi i jedno laboratorium z testem pozytywnym oraz negatywnym. Nie dowodzi poprawności technicznej, obejrzenia filmu ani praw do materiałów.

## Testy, których obecnie NIE można uznać za wykonane
`npm run test:legacy` używa `jsdom` (nie włączamy zależności do P0 bez testowanego lockfile). Browser testy wymagają `playwright` i Chromium; nie są uruchamiane automatycznie. Zamiast udawać, że `npm ci` przygotowuje je do pracy, traktujemy konfigurację jako **P0 otwarte**.

## Kolejność przed realnym merge
1. Audyt zależności i licencji.
2. Testy bez bibliotek, testy Packet Lab.
3. Dodanie bezpiecznych, przypiętych zależności `jsdom` / `playwright` i poprawnego lockfile w kolejnym PR.
4. Regresja browser/desktop/mobile i autentyczne uruchomienie nowej aplikacji, wszystkie moduły i postępy.
5. Dopiero potem merge do develop. Nie zmieniać wyglądu lub funkcji w tym kroku.

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

## Dodatkowe narzędzia P0/P1

`npm run audit:baseline` kontroluje zgodność 37 oryginalnych plików CCNA względem SHA z `docs/CCNALAB_PROTECTED_ORIGINAL_FILES.json`. To mechanizm wykrycia przypadkowej zmiany, **nie** dowód zachowania funkcji. Przy świadomej migracji zmiana manifestu musi być jawna, recenzowana i potwierdzona regresją.

`npm run build:lesson-pack -- path/to/lesson.json path/to/output.json` generuje z jednego banku pytań pochodne fiszki/A-B/ABCD i przenosi dedykowane laboratorium do pakietu treści. Nie wpina go jeszcze do obecnego UI; nie nadpisuje istniejącego pliku wynikowego.

## Samodzielny pakiet rozwojowy

W obecnym kodzie dostępne są także:

```bash
npm ci
npm run build:standalone
npm run audit:assets:strict
npm run test:standalone
npm run preview:standalone
```

Podgląd: `http://127.0.0.1:4173/apps/ccna/`. Serwer służy tylko do developmentu. Produkcyjny serwer można skonfigurować zgodnie z `netlify.toml` (nie opublikowano go automatycznie). Build do `dist/` odtwarza wymagane 19 ścieżek, ale nie kopiuje backendu Wiedory.

`npm run export:wiedora` przygotowuje osobno `dist-wiedora/apps/ccna/` i manifest zmian. **Nie używać** `dist/` jako wejścia do PR Wiedory; modułowy eksport musi przejść testy z `docs/CCNALAB_WIEDORA_REINTEGRATION.md`.

Istniejący `legacy.html` i laboratoria pozostają nietknięte. Samo `npm run test:standalone` i statyczne sprawdzenie ścieżek nie zastępują testów browser, JSDOM ani weryfikacji z działającym Supabase w Wiedorze. `test:packetlab:browser` z oryginalnego źródła nie korzysta automatycznie z `dist/`; przed odbiorem trzeba dostosować harness do pakietu lub uruchomić go w środowisku hosta ze wszystkimi shared assetami.

**W tej sesji:** źródłowe skanowanie Git i izolowany parser JS wykonane; natywny Node `npm run build:standalone`, `npm run test`, przeglądarka i Netlify nadal `NOT_RUN`.

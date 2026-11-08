# Powrót samodzielnego CcnaLab do Wiedory — kontrakt zgodności

**Cel:** rozwijać i testować CCNA w osobnym publicznym repo, następnie włączyć tylko zatwierdzony moduł do prywatnej Wiedory `testowyemailaplikacja-spec/Constant_app` na gałęzi `develop`.

## Dwa pakiety, zero kolizji
- `npm run build:standalone` tworzy katalog `dist/` do samodzielnego hostingu. Składa niezmienione `apps/ccna/**` z **lokalnymi zamiennikami** `standalone/overlay/**` dla współdzielonych plików Wiedory. Zmiany `router.js` / canonical i indeksowanie **tylko w dist**. Ta paczka NIE jest pakietem do Wiedory.
- `npm run export:wiedora` tworzy `dist-wiedora/apps/ccna/**` i `INTEGRATION_MANIFEST.json` ze skrótami Git blob, zmianami względem oryginalnego snapshotu. **Żadne** pliki `standalone/**`, `apps/shared/**`, `js/**` i `assets/**` z wersji samodzielnej nie trafiają do paczki reintegracji.
- Oryginalne URL `/apps/ccna/`, iframe, wspólna nauka, PWA i identyfikatory są utrzymane; host Wiedora ma zapewnić swoje prawdziwe biblioteki, Supabase i synchronizację.

## Czego nie robić
Nie kopiować `dist/` do Wiedory. Nie nadpisywać jej `apps/shared/`, `js/`, konfiguracji Supabase, Netlify, auth ani `main`. Nie scalać automatycznie niezakończonych PR #124/#125/#144/#146/#148 z Wiedory. Nie kopiować prywatnych transkrypcji i usług ani danych użytkowników do publicznego repo.

## Procedura przyszłego merge (wymaga realnych testów)
1. W CcnaLab zamknąć P0–P5 z dowodami, uruchomić `npm run test`, `npm run test:legacy`, `npm run test:packetlab:browser`, test offline i `npm run audit:assets:strict` oraz dokumentować rzeczywiste wyniki.
2. Wygenerować `dist-wiedora/`. Odczytać manifest zmian, ocenić wszystkie dodane lub usunięte identyfikatory oraz migracje localStorage i Packet Lab.
3. Na aktualnym `Constant_app/develop` utworzyć osobną gałąź integracyjną. Wnieść wyłącznie moduł `apps/ccna/` z paczki. Konflikty z późniejszymi poprawkami Wiedory rozwiązać przez 3-way diff, nigdy nie nadpisywać aktualnych zmian.
4. Uruchomić pełną regresję Wiedory: `npm ci`, `npm run check:ccna`, `npm run verify`, `npm run verify:full`, browser CCNA i Packet Lab, nawigacja, PL/EN, konta gość/użytkownik, synchronizacja Supabase w dwóch sesjach, aktualizacja PWA, tryby mobilne, rollback.
5. Zbiorczy staging Netlify `develop` po testach; porównać commit SHA, fingerprint assets i prawdziwe trasy. Dopiero potem odebrać i ewentualnie scalić do docelowej gałęzi według polityki Wiedory.
6. Zachować oryginalny SHA Wiedory i plan wycofania w razie regresji. Produkcyjne `main` wymaga odrębnej zgody.

## Granice gwarancji
Wersja standalone działa w trybie lokalnym: zachowane klucze postępu, kurs i laboratoria, ale **bez produkcyjnej autoryzacji, synchronizacji między urządzeniami, obecności użytkowników i usług AI Wiedory**. Funkcje te odzyskują dostawcę dopiero w oryginalnym hoście. Samo zbudowanie `dist` nie jest dowodem jakości browser ani zgodności z chmurą.

## Punkty dowodowe
- Snapshot 37 oryginalnych Git blob SHA: `docs/CCNALAB_PROTECTED_ORIGINAL_FILES.json`.
- Monitor modernizacji P0–P5: `docs/CCNALAB_MODERNIZATION_STATUS.json`.
- Plan odbioru: `docs/CCNALAB_MODERNIZATION_PLAN.md`.

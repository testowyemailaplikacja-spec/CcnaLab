# CcnaLab — samodzielny pakiet i przygotowanie do reintegracji
**Data:** 2026-11-08 · **Repo:** `testowyemailaplikacja-spec/CcnaLab` · **gałąź:** `refactor/ccna-internal-modernization-20261108`
**PR:** https://github.com/testowyemailaplikacja-spec/CcnaLab/pull/2 · **Issue:** https://github.com/testowyemailaplikacja-spec/CcnaLab/issues/1
**STATUS:** `IN_PROGRESS`. **Nie zamykać P0–P5 i nie scalać do develop bez odbioru.**

## Faktycznie wdrożone pliki i funkcje

### Pakiet samodzielny
- `scripts/build-standalone.mjs`: `npm run build:standalone` tworzy `dist/` ze źródłowego `apps/ccna/` oraz lokalnych zasobów `standalone/overlay/`; używa dotychczasowych adresów `/apps/ccna/`, nie zmienia źródeł CCNA.
- `scripts/serve-standalone.mjs`: `npm run preview:standalone` uruchamia statyczny serwer Node bez zależności zewnętrznych, z obsługą bezpośrednich tras CCNA i nagłówkami `nosniff`.
- `netlify.toml`, `standalone/site/_redirects`, `standalone/site/robots.txt`: hosting statyczny z trasami i `noindex` w środowisku testowym; kod hosta Wiedora bez zmian.
- `standalone/site/index.html`: oddzielna strona wejściowa, kurs pod `/apps/ccna/`; przyciski eksportu/importu lokalnego postępu (tylko 4 istniejące klucze CCNA).
- `standalone/overlay/**`: **19 zasobów** potrzebnych przez wrapper i Service Worker. Dziesięć z nich to oryginalne, wybrane pliki współdzielone (study mode, CSS, PWA, i18n, progress storage, guest/content protection), 9 to lokalne adaptery/izolatory platformy. Dodatkowo CSS asystenta AI; liczba 19 obejmuje łączną mapę ścieżek. **Nie przenoszono prawdziwego Supabase URL, klucza publishable/secret ani tożsamości użytkownika**.
- `scripts/ccnalab-asset-audit.mjs`: obsługa parametru `--root dist` do sprawdzania gotowej dystrybucji.

### Powrót do Wiedory
- `scripts/prepare-wiedora-export.mjs`: `npm run export:wiedora` tworzy `dist-wiedora/apps/ccna/` oraz `INTEGRATION_MANIFEST.json` z Git blob SHA i różnicami względem bazowych 37 plików. Sam eksport **nie merguje** do Wiedory.
- `docs/CCNALAB_WIEDORA_REINTEGRATION.md`: procedura integracji `Constant_app/develop`, testy, zakaz kopiowania samodzielnego `dist/` i nadpisywania shared/Supabase/Netlify.
- `docs/CCNALAB_HOST_BOUNDARIES.md`: macierz 19 zasobów i rzeczywistych różnic funkcjonalnych w trybie samodzielnym.
- `tests/ccnalab-standalone.test.mjs`: regresje zawartości assets, braku produkcyjnego SDK w overlay, porównania `legacy.html` i Packet Lab oraz czystości eksportu.

### Bezpieczeństwo kodu legacy
**37/37** istniejących plików `apps/ccna/**` pozostało identycznych względem `develop`, w tym `legacy.html`, `sw.js`, router i Packet Lab. W pakiecie standalone `index.html` i `router.js` mają wyłącznie tymczasowe, generowane poprawki canonical/noindex; **oryginalne źródła nie zostały zmienione**.
Oryginalny `legacy.html` (~2,49 mln znaków) odwołuje się bezpośrednio do tylko dwóch zewnętrznych dla tego HTML plików JS: `./data/terminology.js`, `./data/jitl-labs.js`; oba znajdują się w `apps/ccna/`. Nie zastępuje to skanowania dynamicznych zasobów w przeglądarce.

## Testy rzeczywiście przeprowadzone w bieżącej sesji

| Kontrola | Wynik | Znaczenie |
|---|---|---|
| Git SHA 37 oryginalnych plików CCNA względem develop | PASS (statyczny) | Brak ingerencji w kurs i Packet Lab |
| Odwołania źródłowe wrapper + SW / dostępność oryginalnych lub overlay | 43/43 PASS (statyczny) | Wszystkie znane ścieżki obecne w drzewie Git |
| Parser składni JS (10 skryptów) i inline root HTML (1) | 11/11 PASS (isolated V8 parser) | Brak błędu składni w analizowanych plikach |
| Dotychczasowy kontrakt danych + workflow | 28/28 PASS (isolated V8, poprzednia partia) | Pytania, A/B, walidatory, statusy |
| `npm ci` i `npm run build:standalone` na rzeczywistym checkout | NOT_RUN | Brak sieciowego checkout GitHub w środowisku testowym |
| Natywne `node --test`, JSDOM, Chromium/Playwright | NOT_RUN | Do uruchomienia z pełnym repo i zależnościami |
| Test PWA i postęp gościa/użytkownika | NOT_RUN | Wymaga działającej strony i testowych kont |
| Publikacja na Netlify / URL z prawidłowym SHA | NOT_RUN | Nie ma potwierdzonego wdrożenia |
| Powrót do Wiedory / signed Supabase E2E | NOT_RUN | Zarezerwowane na integracyjny PR Wiedory |

**Wynik:** kod i narzędzia pakowania samodzielnej wersji są zapisane na GitHubie; statyczne zależności są kompletne. **Nie potwierdzono jeszcze uruchomienia** samodzielnego kursu, poprawności pełnej warstwy PL/EN ani zgodności chmurowej, więc nie jest to formalny PASS P0.

## Świadome ograniczenia standalone

Wersja lokalna nie udaje logowania, synchronizacji z chmurą, Presence ani zewnętrznego asystenta AI. Przejście do Wiedory wykorzysta jej oryginalny backend i shared code, dzięki wyłączeniu `standalone/overlay/**` z paczki powrotnej. Pełny słownik tłumaczeń portalu nie został przeniesiony; tylko klucze języka i motywu oraz dostępne tłumaczenia lokalne są zachowane. **Należy przetestować PL/EN przed stwierdzeniem parytetu.**

## Kolejna bramka

1. Na pełnym checkout: `npm ci && npm run build:standalone && npm run audit:assets:strict && npm run test:standalone && npm run test:packetlab:unit`.
2. Chrome desktop/mobile: kurs, fiszki, A/B, ABCD, certyfikat, wszystkie scenariusze Packet Lab, CLI, notatki, nawigacja, zapisy, offline, import/export; lista błędów i napraw.
3. Po uzyskaniu samodzielnego runtime: dokończyć model danych dla nowych lekcji, adapter do istniejącego renderera (P3) i formalny pipeline jakości (P4), pilot na prawdziwym źródle (P5).
4. Wykonać niezależny test powrotu pakietu do Wiedory, uwzględnić różnice względem najnowszego `Constant_app/develop`, E2E backendu i staging SHA. Do czasu tych testów issue #1 pozostaje otwarte.

**Nie ma deklaracji wykonania zadań w tle ani pełnego ukończenia.** 

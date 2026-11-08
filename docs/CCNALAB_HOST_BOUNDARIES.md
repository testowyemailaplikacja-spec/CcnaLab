# Granica środowisk CcnaLab ↔ Wiedora

Status: **pakiet samodzielny przygotowany statycznie, uruchomienie i odbiór w Chromium NOT_RUN** (2026-11-08). Ten dokument rozróżnia zachowane funkcje, lokalne zamienniki i rzeczywiste integracje z backendem.

## Układ

- `apps/ccna/**` — 37 oryginalnych plików kursu, pytań, Packet Lab i PWA. Bez zmian na gałęzi modernizacji.
- `standalone/overlay/**` — dokładnie 19 ścieżek współdzielonych, składanych **wyłącznie podczas budowy samodzielnego `dist/`**.
- `standalone/site/**` — strona startowa z lokalnym eksportem/importem postępu i ustawieniami.
- `dist-wiedora/apps/ccna/**` — jedyny pakiet przeznaczony do przyszłego PR Wiedory; overlay jest wyłączony.
- `schemas/`, `scripts/` — nowe narzędzia autorskie (notatka źródłowa, cele, fiszki, A/B/C/D, lab) bez integracji z produkcyjnym rendererem.

## 19 ścieżek hosta

| Ścieżka oczekiwana przez aplikację | W samodzielnym pakiecie | Pochodzenie / ograniczenie |
|---|---|---|
| `apps/shared/study-mode.js` | oryginał | Oryginalny model nauki i powtórek Wiedory |
| `apps/shared/study-mode.css` | oryginał | Istniejący wygląd trybu nauki |
| `apps/shared/study-frame.js` | oryginał | Adapter iframe + study-adapter CCNA |
| `apps/shared/portal-nav.css` | oryginał | Istniejące style portalu |
| `apps/shared/offline-control.js` | oryginał | Obecna obsługa offline PWA |
| `apps/shared/offline-control.css` | oryginał | Stylistyka offline |
| `apps/shared/i18n-core.js` | oryginał | Rejestr tłumaczeń |
| `apps/shared/guest-access.js` | oryginał | Tryb gościa, obecne publiczne lekcje |
| `apps/shared/content-protection.js` | oryginał | Wymaga hostowego konta do części mechanizmów |
| `js/progress-storage.js` | oryginał | Historyczne klucze postępów pozostają bez zmian |
| `apps/shared/portal-nav.js` | adapter lokalny | Wygląd kontrolki, wybór języka i motywu; **pełny słownik tłumaczeń Wiedory nieprzeniesiony** |
| `apps/shared/account-sync.js` | adapter lokalny | Import/eksport wyłącznie lokalny; bez cloud sync |
| `js/platform-data.js` | adapter lokalny | Preferencje zapisane lokalnie |
| `js/error-monitor.js` | adapter lokalny | Diagnostyka lokalna, bez wysyłania incydentów |
| `js/user-presence.js` | adapter izolujący | Brak danych obecności użytkownika bez konta |
| `js/supabase-client.js` | adapter izolujący | `AppSupabase=null`, bez produkcyjnego backendu |
| `assets/vendor/supabase-2.117.2.js` | plik izolujący | Bez SDK; świadomie bez zdalnego logowania |
| `js/ai-core.js` | plik izolujący | Asystent AI wymaga oryginalnej usługi Wiedory |
| `assets/ai-core.css` | oryginał | Zachowana stylistyka do późniejszej integracji |

**Nie wolno uznać adapterów izolujących za pełne odpowiedniki funkcji konta.** Nie ma kont, cloud sync, obecności, produkcyjnego AI ani pełnych tłumaczeń hosta w wersji standalone. Są to świadome granice bezpieczeństwa; powrót do Wiedory musi przywrócić oryginalny host.

## Macierz funkcji / bramka odbioru

| Obszar | Stan po pracach | Co nadal trzeba wykonać |
|---|---|---|
| Wygląd kursu, sekcje, notatki, fiszki, ABCD | oryginalny kod bez zmian | Chromium desktop/mobile |
| A/B, study mode, historia ocen | oryginalna implementacja + pliki shared | test rzeczywistych sesji i jakości pytań |
| Packet Lab, CLI, wszystkie laboratoria | oryginalny kod bez zmian | testy pełnego silnika i scenariuszy |
| Lokalny postęp | zachowane nazwy kluczy, przygotowany eksport/import | test faktycznego zapisu i przywracania |
| PWA/offline | SW/sterowanie i zasoby obecne | test online→offline→online |
| Gość | oryginalny adapter | test wszystkich tras |
| Motywy i PL/EN | podstawowe ustawienia lokalne | pełna regresja renderowania/tłumaczeń |
| Konto/Supabase/AI | tylko oryginalny host Wiedora | signed E2E dopiero w reintegracji |
| Notatka→pytania→laboratorium | schemat, walidator, workflow | połączenie z rendererem i pilot źródłowy |

## Bezpieczeństwo i ponowne wdrożenie

- Żaden prywatny klucz Supabase ani endpoint produkcyjny nie jest przenoszony w overlay.
- Oryginalne CSS/JS z hosta skopiowane tu tylko dla zachowania działania publicznego UI, z listą SHA źródłowego w historii commitów.
- `npm run export:wiedora` zabrania kopiowania adapterów standalone. Nigdy nie nadpisuj hostowego `apps/shared/**` lub `js/**`.
- Zmiana UI lub danych nauki wymaga nowego SHA + testu regresji, a nie tylko deklaracji.
- Dodatkowe 19 adresów to **zależności bezpośrednie**; analiza runtime może odkryć kolejne. Obecnie w skanie `legacy.html` wykryto tylko lokalne `./data/terminology.js` i `./data/jitl-labs.js`, oba wewnątrz `apps/ccna/`.

## Polecenia
```bash
npm ci
npm run build:standalone
npm run audit:assets:strict
npm run preview:standalone
npm run export:wiedora
```

**Status testów:** statyczna mapa 43/43 PASS w GitHubie; rzeczywisty build `npm run build:standalone` oraz browser/Node na pełnym checkout NIEURUCHOMIONE w bieżącej sesji. Brak podstaw do formalnego PASS P0–P5.

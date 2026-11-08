# CCNALAB — inwentaryzacja bazowa / 8 listopada 2026

**Status:** audyt statyczny, testy runtime NIEPRZEPROWADZONE.
**Porównanie:** `Constant_app/develop` → `CcnaLab/develop`: wszystkie 37 plików `apps/ccna/**` identyczne SHA. Dodatkowe 17 dokumentów/testów CCNA są identyczne SHA. `legacy.html` ~2 521 103 bajty. Brak `package.json`, `package-lock.json`, samodzielnej konfiguracji serwowania assetów i uruchomień GitHub Actions.

## 19 brakujących plików wspólnych
W `apps/ccna/index.html` / `apps/ccna/sw.js` są odwołania do ścieżek, które istnieją w prywatnej Wiedorze, ale nie są w CcnaLab:
1. `apps/shared/portal-nav.css`
2. `apps/shared/offline-control.css`
3. `assets/vendor/supabase-2.117.2.js`
4. `js/supabase-client.js`
5. `js/platform-data.js`
6. `js/error-monitor.js`
7. `js/user-presence.js`
8. `apps/shared/content-protection.js`
9. `js/progress-storage.js`
10. `apps/shared/study-frame.js`
11. `apps/shared/account-sync.js`
12. `apps/shared/guest-access.js`
13. `apps/shared/i18n-core.js`
14. `apps/shared/portal-nav.js`
15. `apps/shared/offline-control.js`
16. `js/ai-core.js`
17. `assets/ai-core.css`
18. `apps/shared/study-mode.js`
19. `apps/shared/study-mode.css`

Wartość 19 to zidentyfikowane ścieżki, **nie pełna rekurencyjna mapa zależności**. Przed uruchomieniem konieczne dalsze badanie importów i zachowania backendu. Folder `/apps/ccna/` to trasa, nie brakujący plik.

## Funkcje do zachowania
Wrapper iframe + router, sekcje/tematy, fiszki, A/B i ABCD, egzaminy, rozszerzenia pytań, postęp, study mode, PWA/offline, przełączanie języków, Packet Lab, CLI i sieciowy model, istniejące ćwiczenia i scenariusze, zapis/import/export, konta/gość. Nie wolno zakładać, że lista gwarantuje pełne działanie na samodzielnym hostingu.

## Znane źródła błędów
- Monolit danych `legacy.html`, adaptery i skomplikowana kolejność skryptów.
- Brak automatycznej bramki pytania → cel → rozwinięta notatka → źródło.
- Niebezpieczne dystraktory A/B losowane między pytaniami (poprawka w **otwartym draft PR #144 Wiedory**, niewłączona tutaj).
- Niespójność PL/EN i pytania niskiej jakości (**otwarte draft PR #125 i #124 Wiedory**, niewłączone tutaj).
- Otwarty PR #146 i #148 w Wiedorze; nie są podstawą do twierdzenia, że naprawy trafiły do CcnaLab.

## Ograniczenia testów
Z konektora GitHub możliwy jest odczyt kodu i zapis PR, ale środowisko terminalowe nie ma dostępu DNS do `github.com`; pełny checkout i natywne testy prywatnego/otwartego repo nie są dostępne w tej sesji. Taki brak **nie jest PASS**. Tylko faktyczne logi Node, Playwright i wdrożenia mogą zamknąć P0/P4/P5.

**Ryzyko:** CcnaLab jest publiczny, Wiedora prywatna; nie kopiować kodu hosta, który zawiera dane, sekrety lub ograniczenia licencyjne, bez audytu.

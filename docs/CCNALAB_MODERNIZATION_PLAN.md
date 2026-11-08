# CCNALAB-MOD — przebudowa systemu wewnętrznego bez zmiany wyglądu i funkcji

**Właściciel zadania:** issue #1: https://github.com/testowyemailaplikacja-spec/CcnaLab/issues/1
**Repozytorium:** `testowyemailaplikacja-spec/CcnaLab` · **gałąź docelowa:** `develop` · **data:** 2026-11-08
**Status:** W TRAKCIE — nie uznawać za ukończone bez P0–P5 = PASS.

## 1. Cel i niezmienne wymagania

Przebudować **wewnętrzną** architekturę programu i tworzenia materiałów CCNA, zachowując dotychczasowy **wygląd**, nawigację, układ sekcji, fiszki, A/B, A/B/C/D, egzaminy, lokalne i zsynchronizowane postępy, i18n, PWA/offline, Packet Lab, CLI, wszystkie istniejące scenariusze laboratoriów i historyczne identyfikatory. Nie zastępować symulatora nowym produktem, nie przepisywać strony od zera, nie usuwać żadnego istniejącego laboratorium ani danych kursanta. Jeśli zmian funkcjonalnych nie da się uniknąć, osobne zatwierdzenie zakresu i test porównawczy.

**Repo publiczne:** kopiowanie kodu hosta z prywatnej Wiedory wymaga kontroli licencji, sekretów, URL backendu i danych. Publiczne jest tylko to, co bezpieczne do publikacji. Nie przenosić prywatnych transkrypcji ani chronionych banków pytań bez prawa do udostępniania.

## 2. Rzeczywista sytuacja wyjściowa

- Kopia `apps/ccna/**` ma 37/37 plików o identycznym Git SHA względem `Constant_app/develop` (audyt 2026-11-08). Pozostałe 17 plików dokumentacji i testów w CcnaLab/develop również były zgodne ze źródłem.
- `legacy.html` ma ~2,52 MB; dane i logika są powiązane z dużym dokumentem HTML.
- Co najmniej 19 odwołań do plików hosta Wiedora w `index.html` i `sw.js` nie jest obecnych w CcnaLab.
- Brak `package.json` i obecnie brak uruchomień GitHub Actions. Istnieją testy źródłowe, lecz na samym CcnaLab nie ma potwierdzonego wykonania native/Chromium.
- Dokumenty `CCNA_CONTENT_FROM_VIDEO_WORKFLOW.md` i `CCNA_CONTENT_PLAN.md` to tekstowe reguły; brakuje automatycznej bramki kompletności lekcji.
- W Wiedorze otwarte PR #124/#125/#144/#146/#148 zawierają nieodebrane poprawki Day 02; nie scalać ich na ślepo do niezależnego CcnaLab.

## 3. Pakiety wykonawcze i bramki

### P0 — bezpieczeństwo migracji, baseline i samodzielne uruchomienie
**Wymagane:** (a) dokumentacja aktualnych funkcji i SHA, (b) wykaz braków assetów i zależności, (c) lokalna konfiguracja Node/JSDOM/Playwright oraz poprawny start na desktop i mobile, (d) bezpieczne rozwiązanie hostowych zależności, (e) regresja odczytu i zapisu postępów, iframe/PWA i wszystkich dotychczasowych laboratoriów, (f) kontrola licencji i sekretów.
**PASS:** aplikacja działa pod własnym origin bez 404 wewnętrznych zależności; wymagane testy i regresja PASS. Sam raport = W TRAKCIE.

### P1 — model danych i pojedynczy bank wiedzy
**Wymagane:** schema source/lesson/learningObjective/card/lab, unikatowe ID, źródło i granice filmu, mapowanie każdego pytania do celu i wyjaśnienia w notatce. Cztery sprawdzone warianty ABCD są źródłem A/B (z tej samej karty) i fiszki; nie generować odrębnych sprzecznych zestawów. Kontrola fałszywych opcji i jednego poprawnego indeksu, deduplikacji, kompletności PL/EN. Nie zakładać, że prosta walidacja tekstu potwierdza prawdę merytoryczną.
**PASS:** parser/walidator, automatyczne testy pozytywne i negatywne, dowód zgodności odczytu danych przez aktualny UI.

### P2 — workflow weryfikowanego źródła
Kolejność: 1. film/transkrypcja i uprawnienia; 2. notatka źródłowa i dowody czasowe; 3. weryfikacja techniczna Cisco; 4. rozbudowana notatka edukacyjna; 5. mapa celów; 6. fiszki; 7. A/B + ABCD; 8. jedno **dedykowane** laboratorium sekcji, ale bez kasowania istniejących scenariuszy; 9. walidacja + testy; 10. podgląd i odbiór. Każdy etap ma `NOT_STARTED/IN_PROGRESS/PASS/FAIL/BLOCKED/NOT_RUN`, źródła, commit i wynik testu; brak źródła = BLOCKED_SOURCE.
**PASS:** system w praktyce uniemożliwia ukończenie bez wcześniejszych bramek oraz ma trwały zapis i wznowienie kolejnej sesji.

### P3 — modularyzacja bez regresji
Stopniowo wydzielać dane lekcji z `legacy.html` do pojedynczych plików. Dla jeszcze nieprzeniesionych tematów pozostawić legacy jako fallback. Wprowadzić adapter do istniejącego renderera, **bez zmiany CSS i HTML UI**. Stare ID i stan localStorage/chmury pozostają stabilne; migracje odwracalne.
**PASS:** co najmniej pilotażowy temat działa ze strukturalnych danych i ma identyczne ścieżki, pytania, postępy oraz wygląd jak przed zmianą.

### P4 — bramki CI i odbioru
Testy czysto strukturalne bez kosztownego środowiska + zestaw natywnych Node/JSDOM + interakcje Chromium/Playwright, testy błędnych odpowiedzi, zapisów, mobile i laboratoriów. Testy nie uruchomione = NOT_RUN. Przed każdym merge: diff, test, raport, rozdzielny SHA commit/deploy i sprawdzenie preview. Nie uruchamiać odpłatnych workflow bez decyzji użytkownika.
**PASS:** przetestowany PR + rzeczywiste wyniki na własnym repo, zero regresji.

### P5 — pilotaż i formalny odbiór
Nowa lekcja (proponowany Day 03) z legalnym, zweryfikowanym źródłem: notatka → rozwinięcie → karty → praktyka → UI. Day 02 jako niezmieniony zestaw kontrolny. Weryfikacja całej listy istniejących funkcji, Packet Lab, integracji i stanu użytkownika.
**PASS:** sześć pakietów PASS, raport z dokładnymi wynikami i odnośnikami do commitów/deploy, bez nieweryfikowanych stwierdzeń.

## 4. Zasady implementacyjne i kryteria jakości

- Zmiany na osobnej gałęzi i przez PR do `develop`; `main` i Wiedora bez zmian.
- **Strukturalna kompatybilność:** bez zmiany ID lekcji/pytania, kluczy `ccna-*` i plików istniejących laboratoriów bez jawnej migracji.
- **Merytoryczna zgodność:** każda karta przypisana do fragmentu rozwiniętej notatki i do zweryfikowanego celu; nie wymyślać treści filmu. Obce pytania archiwizować ze źródłowym ID.
- **Ocena A/B:** błędna odpowiedź wyłącznie z tej samej karty A/B/C/D. Warianty logicznie różne i sprawdzone przez recenzenta; weryfikator maszynowy wykrywa tylko część problemów semantycznych.
- **Laboratoria:** scenariusz, prawdziwe komendy, kroki, test pozytywny i negatywny. Jedno nowo opracowane, dedykowane laboratorium przypisane do sekcji nie znosi innych dostępnych ćwiczeń.
- **Odbiór:** STATUS=PASS tylko z dowodem działania, nie ze stwierdzenia w dokumentacji. Nie utożsamiać commita, PR i publikacji.

## 5. Dokumentowanie i zamknięcie

Bieżące statusy zapisuj w [CCNALAB_MODERNIZATION_STATUS.json](CCNALAB_MODERNIZATION_STATUS.json), zadania i raporty w GitHub issue #1 oraz PR. Po każdej zakończonej bramce: dokładna lista plików, powód, SHA, testy (PASS/FAIL/NOT_RUN), otwarte ryzyka. **Status UKOŃCZONE i zamknięcie issue #1 dopiero gdy P0–P5 mają potwierdzony PASS i pełny raport końcowy.**

## 6. Dokumenty źródłowe
- [Bieżąca architektura / kurs](CCNA.md)
- [Dotychczasowy workflow filmu](CCNA_CONTENT_FROM_VIDEO_WORKFLOW.md)
- [Dotychczasowy plan merytoryczny](CCNA_CONTENT_PLAN.md)
- [Baseline i blokady](CCNALAB_BASELINE_20261108.md)

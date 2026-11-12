# Audyt gotowości CCNAlab do produkcji treści i nowych mechanik
Data kontroli: **12.11.2026**. Repozytorium: `testowyemailaplikacja-spec/CcnaLab`, gałąź `main` (przed tym audytem). Host Wiedora: `Constant_app/develop`, osobne `/apps/ccnalab-beta/`. Status: **GO do rozwoju eksperymentalnego; NO-GO do masowego automatycznego importu i publikacji treści**.

## 1. Rozstrzygnięcie: trzy niezależne gotowości

| Obszar | Status | Dlaczego |
|---|---|---|
| Nauka z istniejących materiałów CCNA | **BETA — działa w przetestowanym zakresie** | Wcześniejsze 90 testów Node oraz 8 scenariuszy Chromium na Preview i develop PASS; testy nie obejmują pełnej zawartości |
| Przygotowywanie/autorska redakcja pojedynczych materiałów | **GO tylko na gałęzi roboczej, z recenzją** | Jest workflow G0–G6, format paczki i walidator; można tworzyć szkice i testować strukturę bez publikacji |
| Programowanie nowych mechanik nauki/labów | **GO w odizolowanej becie, z testami regresji** | Istnieją silniki kursu i Packet Lab, testy oraz wydzielona beta. Nowa mechanika nie jest automatycznie gotowa do produkcji |
| Automatyczne YouTube → notatka → dwie talie Anki → pytania → publikacja | **NO-GO** | Brak ingestera, autoryzowanych danych, mapowania, produkcyjnego buildera i sprawdzonego publish/rollback |
| Automatyczne laboratoria z wideo → CLI → grader → publikacja | **NO-GO** | Brak nowego buildera i zweryfikowanego pełnego zestawu testów każdej konfiguracji |
| Masowa publikacja zatwierdzonych paczek bez edycji `legacy.html` | **NO-GO** | Brak podłączonego renderera/loadera paczek, mapy stabilnych ID i próby round-trip |
| Produkcyjne wdrożenie Wiedory `main` | **NIEAUTORYZOWANE** | Zakres tego audytu nie obejmuje promocji produkcyjnej |

**Werdykt:** warto już implementować fundamenty produkcji treści i mechaniki w `CcnaLab`, ale przed dodawaniem dużych ilości realnych materiałów potrzebny jest **pasywny, wersjonowany kanał publikacji**. Masowy import do starego monolitu byłby obarczony niepotrzebnym ryzykiem regresji postępów i powielania pytań.

## 2. Sprawdzony stan kodu

- `AGENTS.md`, `docs/CONTENT_PIPELINE.md`, `data/content-workflow-template.json`, `scripts/validate-content.mjs` — **ISTNIEJĄ**, a walidator ma testy `scripts/validate-content.test.mjs`.
- `scripts/ingest-video.mjs`, `scripts/map-anki.mjs`, `scripts/build-section.mjs`, `scripts/build-lab.mjs`, `scripts/validate-coverage.mjs`, `scripts/publish-content.mjs` — **NIE ISTNIEJĄ** w analizowanym `main`.
- `data/packs/`, `data/published/sections/`, `data/published/labs/`, `data/mapping/legacy-ids.json` — **NIE ISTNIEJĄ** (brak rzeczywistej paczki i snapshotu migracyjnego).
- `apps/ccna/renderer/{lesson-view,quiz-view,lab-view}.js` — **NIE ISTNIEJĄ**; w `index.html`, `router.js` i `study-adapter.js` nie znaleziono jawnego podłączenia loadera nowego formatu.
- `apps/ccna/legacy.html` — istnieje, ale nadal jest monolitem. Nie wykonywano pełnej analizy każdej z deklarowanych 3583 pozycji w jego treści.
- `apps/ccna/packet-lab/{engine,scenarios,integration,curriculum}.js` — istnieją; testowane były funkcje silnika. **To nie potwierdza poprawności wszystkich ćwiczeń ani pełnego wsparcia IOS**.
- `apps/ccna/packet-lab/README.md` odsyła do nieistniejącego `docs/CCNA_CONTENT_FROM_VIDEO_WORKFLOW.md`; kanoniczny aktualny proces jest opisany w `docs/CONTENT_PIPELINE.md`. **Nieaktualny odnośnik poprawiono w tej samej paczce audytu.**

### Weryfikacja katalogu Packet Lab

Parso­wanie aktualnej tablicy `topics` w `apps/ccna/packet-lab/curriculum.js` daje:

- **50 działów**, **127 podtematów**, z czego **15 podtematów z `lab: true`**.
- W **3 działach** (`przelaczanie-ethernet-czesc-2`, `ccna-vlans`, `ccna-stp`) istnieje więcej niż jedna tak oznaczona podsekcja laboratoryjna.
- Wcześniej w przeglądarce katalog zawierał **53 pozycje laboratoriów**. Te liczby opisują **różne jednostki** (podtematy oznaczone jako laboratoria vs katalog scenariuszy/wariantów); nie wolno traktować ich jako 53 niezależnych, odebranych laboratoriów.

Reguła pipeline „jedno laboratorium jako ostatnia podsekcja” jest zbyt sztywna dla istniejących działów wielolaboratoryjnych. Należy wprowadzić jawny, wersjonowany wyjątek lub grupę laboratoriów na końcu działu. **Nie przenosić i nie usuwać starych identyfikatorów bez mapy migracji.**

## 3. Krytyczne ryzyko: walidator wykrywa schemat, a nie prawdziwość materiału

`scripts/validate-content.mjs` poprawnie sprawdza wiele pól: dwa warianty pytań, pojedynczą odpowiedź poprawną, zbieżność ID, `noteAnchor`, strukturę kart, quizu i deklarowane QA. Jednak:

1. Pola `sourceEvidence.transcriptRef`, `rawNoteRef`, `internalReference.path` są kontrolowane jako niepuste teksty. **Walidator nie sprawdza, czy pliki istnieją, czy zostały odczytane i czy mają właściwy hash**.
2. `review.status='PASS'`, `manualFactCheck=true`, `browser='PASS'` mogą zostać wpisane w JSON. **Nie ma weryfikacji tożsamości recenzenta ani dowodów rzeczywistego wykonania testów**.
3. Obecność URL pod domeną Cisco nie oznacza potwierdzenia konkretnego faktu; można podać stronę główną i przejść kontrolę samego formatu.
4. Pola `whyWrong`, `sameCategoryReason` i `noteAnchor` nie są automatycznym sprawdzeniem, czy dystraktory są technicznie błędne, a tekst notatki faktycznie zawiera odpowiedź.
5. Brak realnego mechanizmu zapobiegania wtórnemu importowi kart po `sourceDeck+sourceId` oraz migracji już istniejących ID.

**Wniosek:** walidator jest dobrym filtrem **strukturalnym**, ale nie może sam zatwierdzać paczki do publikacji.

## 4. Zadania blokujące automatyczne dodawanie treści

| Kolejność | ID | Wymagana realizacja | Kryterium odbioru |
|---|---|---|---|
| 1 | READY-01 | Snapshot obecnych sekcji, podsekcji, fiszek, pytań i labów z hashami | Re-import nie zmienia ID ani zapisanego postępu |
| 2 | READY-02 | Rejestr autoryzowanych źródeł, transkrypcji, licencji i dwóch talii | Brak danych = BLOCKED; każdy claim ma sprawdzalny dowód i wersję Cisco |
| 3 | READY-03 | Importer YouTube i Anki z logiem błędów, bez automatycznej publikacji | Powtarzany import jest idempotentny; nie generuje duplikatów |
| 4 | READY-04 | Publikator paczek, osobny prywatny rejestr dowodów, sanitizacja pól widocznych | Żadne wewnętrzne notatki/licencjonowane treści źródłowe nie trafiają do publicznego `dist` |
| 5 | READY-05 | Pasywny loader + renderer `data/published` w becie | Jedna próbna lekcja przechodzi bez edycji `legacy.html`, z rollbackiem |
| 6 | READY-06 | Realny audyt pytań, `noteAnchor`, tłumaczeń, dystraktorów, agregacji i celów v1.1/v2.0 | Recenzja faktów z Cisco, brak podwójnych kart, poprawna liczba pytań na każdym poziomie |
| 7 | READY-07 | Kontrakt laboratorium + wyjątki legacy + builder scenariuszy | Jeden pilot: konfiguracja poprawna, błędna, reset, zapis, offline i Chrome mobile |
| 8 | READY-08 | Zintegrowane CI, scenariusz rollback i test reguły wydania | Nie da się opublikować paczki bez prawdziwych dowodów G1–G5 oraz przypiętego SHA |

## 5. Rzeczywisty poziom testów

Wcześniej potwierdzono **9/9** testów walidatora treści, **71/71** testów silnika Packet Lab, **10/10** testów funkcjonalności bety oraz dwa uruchomienia **8/8** scenariuszy Chromium (Preview i develop), łącznie 16 przebiegów przeglądarkowych. Te testy dowodzą konkretnego zakresu obsługi starego kursu, zapisu, dotyku i pierwszego labu offline.

**Nie dowodzą:** pełnego audytu 3583 pytań, każdego scenariusza 53-elementowego katalogu, rzeczywistych kart obu talii Anki, legalności materiałów źródłowych, pełnej zgodności z Cisco v2.0, ewidencji atrybucji i działania na fizycznych urządzeniach. Wszystkie pozostają `NOT_RUN` albo `BLOCKED`.

## 6. Dalsze prace bez szkody dla Wiedory

Nie wolno zmieniać `Constant_app/main` ani oryginalnej ścieżki `/apps/ccna/`. Fundamenty nowego pipeline należy opracowywać w repo `CcnaLab`, najpierw bez podłączania do użytkowego renderera. Pilot ma być ukryty przed kursantami, aż po testach E2E i weryfikacji materiałów zostanie udostępniony w **oddzielnej** becie Wiedory `develop`.

## 7. Powtarzalna kontrola gotowości

`npm run audit:readiness` pokazuje niezależnie decyzje dla szkiców, mechanik i automatycznej publikacji. `npm run audit:readiness:json` generuje raport maszynowy. `node scripts/audit-content-readiness.cjs --require-publish-ready` zwraca **kod 1** dopóki bramki masowego publikowania nie będą spełnione. Testy reguł uruchamia `npm run test:readiness`, a także `npm run verify`.

**WAŻNE:** sam wynik `READY_FOR_END_TO_END_ACCEPTANCE` w tym audycie strukturalnym nie oznacza jeszcze `RELEASED`. Przed produkcją wymagana jest niezależna próba przygotowania i publikacji realnej paczki, przegląd dowodów/licencji oraz Netlify Preview E2E.

### Decyzja formalna

**GO:** obecna beta do nauki; rozwijanie kodu nowych mechanik, poprawianie istniejących notatek, przygotowywanie *niepublicznych* paczek pilotażowych z recenzją.

**NO-GO:** masowe automatyczne wprowadzanie treści i fiszek; hurtowe przebudowy istniejących ID; generowanie laboratoriów z dowolnego filmu i oznaczanie ich jako zaliczonych bez testu; publikacja nowej struktury na produkcyjnym Wiedora `main`.

**Priorytet:** nie mnożyć pytań, dopóki nie powstanie bezstratny kanał `PACZKA → WALIDACJA → RENDERER → TEST → WYDANIE`.

## 8. Odbiór techniczny audytu na GitHub Actions

Weryfikacja z 12.11.2026 na gałęzi audytowej: `CCNAlab Beta quality` [run 43225296652](https://github.com/testowyemailaplikacja-spec/CcnaLab/actions/runs/43225296652) i `CCNAlab quality gate` [run 43225296665](https://github.com/testowyemailaplikacja-spec/CcnaLab/actions/runs/43225296665) — **oba SUCCESS**. W sumie 9 testów content, 71 Packet Lab, 10 bety i 6 audytora, **96/96 PASS**.

W logu audytora: `manualDraft=GO_WITH_REVIEW`, `mechanicsDevelopment=GO_ISOLATED_BETA`, `automaticIngestion=BLOCKED`, `automatedPublication=BLOCKED`, `productionRelease=NOT_ASSESSED_NOT_AUTHORIZED`, **8 blokad** `G01–G08`. Przebieg dowodzi powtarzalności oceny; nie stanowi potwierdzenia spełnienia żadnej z ośmiu blokad. Puste katalogi nie były tworzone jako pozory postępu.

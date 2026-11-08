# CCNALAB-MOD — raport rozpoczęcia modernizacji (2026-11-08)

**Issue:** https://github.com/testowyemailaplikacja-spec/CcnaLab/issues/1  
**PR:** https://github.com/testowyemailaplikacja-spec/CcnaLab/pull/2  
**Gałąź:** `refactor/ccna-internal-modernization-20261108` → `develop`  
**Status całego planu:** `IN_PROGRESS`, **0/6 etapów formalnie PASS**. PR pozostaje DRAFT.

## 1. Co faktycznie dodano

| Plik | Co wykonuje |
|---|---|
| `AGENTS.md` | Wymóg zachowania UI, funkcji, ID i laboratoriów; procedura odbioru |
| `docs/CCNALAB_MODERNIZATION_PLAN.md` | Plan P0–P5 z testami i bramkami odbioru |
| `docs/CCNALAB_MODERNIZATION_STATUS.json` | Stan pakietów, dowody, blokady, brak fałszywego COMPLETED |
| `docs/CCNALAB_BASELINE_20261108.md` | Stan kopii, 19 brakujących zależności, ryzyka prywatne/publiczne |
| `docs/CCNALAB_TESTING.md` | Dostępne komendy, jasne rozróżnienie testów możliwych od NOT_RUN |
| `docs/CCNALAB_LESSON_WORKFLOW.md` | 10-etapowy kontrakt redakcyjny nowej lekcji |
| `schemas/ccna-lesson.schema.json` | Struktura źródła, notatek, celów, czterech odpowiedzi i laboratorium |
| `scripts/validate-ccna-lesson.mjs` | Kontrola źródła, praw, identyfikatorów, mapy notatka-pytanie, dystraktorów |
| `scripts/ccnalab-asset-audit.mjs` | Wykaz obecnych i brakujących plików wrappera oraz Service Workera |
| `scripts/ccnalab-lesson-workflow.mjs` | Bramka etapów; brak PASS bez dowodu; brak przeskakiwania |
| `tests/ccnalab-contract.test.mjs` | 13 przypadków jakości i deriveAB |
| `tests/ccnalab-assets.test.mjs` | 4 przypadki skanera hostowych zasobów |
| `tests/ccnalab-workflow.test.mjs` | 7 przypadków kolejności i statusów |
| `scripts/build-ccna-lesson-pack.mjs` i `tests/ccnalab-pack.test.mjs` | Jeden bank kart jako źródło fiszek, A/B i ABCD (4 testy) |
| `docs/CCNALAB_PROTECTED_ORIGINAL_FILES.json` i `scripts/ccnalab-baseline-check.mjs` | Ochrona 37 źródłowych plików przed przypadkową zmianą |
| `.gitignore` i `README.md` | Ignorowanie lokalnych sekretów i szybki dostęp do planu z repo |
| `package.json`, `package-lock.json` | Minimalne, bezpieczne skrypty bez niezatwierdzonych bibliotek |

**Nie zmieniono:** `apps/ccna/legacy.html`, `index.html`, `sw.js`, `router.js`, silnika `Packet Lab`, żadnych danych bieżącego kursu, ID, kluczy localStorage, wyglądu i laboratoriów. GitHub compare develop...branch potwierdził **0 zmienionych plików w `apps/ccna/`**.

## 2. Wykonane kontrole źródłowe

- **13/13 PASS (isolated V8)**: walidacja źródła i licencji, notatek, celów, unikalnych wariantów, błędnego indeksu, zakazu zależnych od filmu pytań, laboratoryjnych testów i powiązania opcji A/B z tą samą kartą.
- **4/4 PASS (isolated V8)**: lokalne odwołania plików, ścieżki zewnętrzne, skanowanie wrappera i Service Workera.
- **7/7 PASS (isolated V8)**: kolejność workflow, blokowanie braków dowodów, brak fałszywego COMPLETED i obowiązkowa akceptacja.
- **43** unikalne statyczne ścieżki zasobów: **24 istnieją**, **19 brakuje**. Jest to istotna blokada samodzielnego uruchomienia.
- W pierwotnej wersji walidatora wykryto, że usunięcie interpunkcji scala `12,5` i `1,25`. Po poprawieniu normalizacji test 13/13 PASS.
- JSON schematu i rejestru statusów parsuje się poprawnie.

- **4/4 PASS (isolated V8):** nowy eksporter pakietu treści ze wspólnego banku fiszek, A/B i ABCD bez zmiany identyfikatorów i laboratorium. Wykryto i usunięto zależność od niedostępnego `structuredClone` w środowisku izolowanym.
- **37 oryginalnych plików CCNA:** dodany manifest Git blob SHA oraz skrypt guard do wykrywania zmian bez audytu. Native Node guard: NOT_RUN, GitHub compare branch→develop: 0 zmian w apps/ccna/.
- **Suma izolowanych przypadków: 28/28 PASS**, tj. 13 kontrakt, 4 skaner, 7 workflow, 4 eksporter.

**Uwaga o dowodach:** wykonano izolowaną kontrolę kodu w V8 ze źródeł GitHub. Nie uruchomiono natywnego `node --test`, `npm ci`, `jsdom`, `Playwright`, przeglądarki ani wdrożenia. Dlatego **nie ma formalnego PASS pakietu P0, P1 lub P2**.

## 3. Blokady i następne prace

1. Uzupełnić brakujące 19 ścieżek oraz zależności tranzytywne bez wycieku danych z prywatnej Wiedory.
2. Dodać kontrolowane jsdom/Playwright wraz ze sprawdzonym lockfile i uruchomić pełne testy legacy, lab oraz browser.
3. Przeprowadzić test rzeczywistej instalacji, nawigacji, offline, PL/EN, zapisów i gościa; zweryfikować brak regresji.
4. Podłączyć schemat lekcji do aktualnego renderera, najpierw bez zmiany UI i `legacy.html`.
5. Przeprowadzić prawdziwą lekcję pilotażową z weryfikowanym materiałem wideo i dedykowanym laboratorium.
6. Dopiero po wszystkich P0–P5 PASS: końcowy raport ze SHA, testami, deploymentem i zamknięcie issue #1.

Żadne zakończenie prac w tle ani przyszły termin ukończenia nie są deklarowane przez ten raport. Dalsze działania muszą być wykonane i zapisane w kolejnych faktycznych sesjach.

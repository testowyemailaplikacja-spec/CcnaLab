# CCNAlab — obowiązkowe instrukcje każdego agenta (09.11.2026)

## Zakres
Repozytorium rozwojowe CCNAlab, niezależne od Wiedora. Gałąź bazowa main. CCNAlab jest wyłącznym właścicielem zmian funkcjonalnych CCNA. Integracja do Wiedory odbywa się jako osobna, oznaczona beta w develop; nie wolno dotykać KWN ani wdrażać zmian do Wiedory main bez odrębnej decyzji.

## START OBOWIĄZKOWY — przed KAŻDYM filmem i laboratorium
1. Pobierz aktualne AGENTS.md, README.md i docs/CONTENT_PIPELINE.md z bieżącej gałęzi; przeczytaj je **przed analizą filmu, tworzeniem treści i zapisem kodu**. Nie korzystaj z samej pamięci rozmowy.
2. Przeczytaj docs/COMPETITIVE_GAP_ANALYSIS.md i apps/ccna/TERMINOLOGY.md oraz istniejące dane sekcji i mechanizm Packet Lab.
3. Zidentyfikuj materiał wideo (URL, tytuł, zakres, transkrypcja dostępna legalnie), typ TEORIA/LAB i wersję zakresu CCNA (v1.1 albo v2.0). Nie wymyślaj treści, której nie sprawdzono.
4. Przeprowadź procedurę TEORIA / LAB w dokładnej kolejności wskazanej w docs/CONTENT_PIPELINE.md; stosuj bramki G0–G6 i szablon z data/content-workflow-template.json.
5. Przeprowadź kontrolę skryptem scripts/validate-content.mjs, sprawdź istniejący kod/testy i, jeśli dostępne, test przeglądarkowy. Raportuj PASS wyłącznie dla realnie wykonanych testów; NOT_RUN i BLOCKED zachowuj jawnie.
6. Aktualizuj rejestr sekcji i dowody, utrzymuj stabilne ID pytań, fiszek, podsekcji i postępu. Dopiero wtedy commit; publikacja w Wiedora jest osobną bramką.

## Zasady bezpieczeństwa
- Materiały źródłowe, cytaty, linki, timestampy, licencje i dowody przechowuj w metadanych wewnętrznych. Widok kursanta: poprawiona, samodzielna notatka bez „Jeremy”, „Day 02” lub „z tego filmu”.
- Zachowaj prawa do transkrypcji i ilustracji, twórz własne diagramy. Brak dostępu do transkrypcji lub obu talii Anki to BLOKADA importu, nie zgoda na tworzenie fikcyjnych fiszek.
- PL jest głównym językiem pytań, bezpośrednio pod PL jest mniejszy, jaśniejszy EN. Komendy Cisco IOS, nazwy technologii i interfejsy pozostają w swojej standardowej angielskiej postaci.
- Każde pytanie ma oparcie w merytorycznej notatce właściwej podsekcji, a każda błędna odpowiedź musi być technicznie możliwym, powiązanym znaczeniowo dystraktorem. Nie zmieniać poprawnej odpowiedzi wyłącznie dla podniesienia trudności.
- Quiz z końca filmu i grafiki rejestrować osobno; historyczne wyjątki (np. quiz tylko w egzaminie sekcji) zachować, dopóki nie ma zatwierdzonej migracji.
- Laboratorium zawsze jest osobną podsekcją na końcu sekcji; wyjątki od tej reguły wymagają zgłoszenia. Nie dodawać komend, których materiał nie zawiera. W pytaniach laboratoryjnych sprawdzić wszystkie rzeczywiście występujące komendy.
- Nie naruszać danych użytkowników, postępów ani zapisu Packet Lab; nie przenosić importów do innego identyfikatora bez mapy migracji.
- Przed zmianą istniejącego pliku odczytaj najnowszą wersję i uwzględnij pracę innych agentów.

## Dokumenty
- docs/CONTENT_PIPELINE.md — kanoniczny proces treści i laboratoriów.
- docs/COMPETITIVE_GAP_ANALYSIS.md — porównanie rynku i oficjalnego Cisco, bez udawania wdrożenia.
- docs/CCNALAB_TARGET_ARCHITECTURE.md — docelowe paczki treści, idempotencja i bezpieczna migracja z legacy.html (PROJEKT).
- docs/CCNALAB_IMPLEMENTATION_BACKLOG.md — rejestr mikroetapów, zależności i faktycznych statusów.
- data/content-workflow-template.json — format paczki audytowej.
- scripts/validate-content.mjs — automatyczne bramki strukturalne; nie zastępują ręcznej weryfikacji.
- apps/ccna/packet-lab/README.md — stan rzeczywistego symulatora.

Każde polecenie „opracuj film” lub „zrób laboratorium” uruchamia powyższy proces od punktu 1, niezależnie od tego, czy użytkownik powtarza te wymagania.

## SAFE STAGING / ID LOCK (12.11.2026)

Przed zmianą `apps/ccna/legacy.html` lub `apps/ccna/packet-lab/curriculum.js` uruchom `npm run check:legacy-ids`. Nie aktualizuj automatycznie `data/mapping/legacy-ids.json` dla przejścia testów; zmiana historycznych ID wymaga osobnego audytu migracji.

Zatwierdzoną paczkę z prywatnymi dowodami można na razie jedynie **przygotować bez publikacji** przez `scripts/stage-content-pack.mjs` zgodnie z `docs/SAFE_CONTENT_STAGING_20261112.md`. Treść, talie Anki i dowody trzymać poza publicznym repo; nie publikować pliku `build/staged/*.json` jako gotowej lekcji. Wciąż brak importera filmów, automatycznej kontroli praw, kompletnego inwentarza runtime, rendererów i testu pilota — żaden z tych kroków nie otrzymuje statusu PASS.

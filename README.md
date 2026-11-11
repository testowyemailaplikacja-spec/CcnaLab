# CCNA Lab

Niezależne repozytorium rozwojowe modułu CCNA wydzielonego z platformy Wiedora.

Źródło migracji: `testowyemailaplikacja-spec/Constant_app`, gałąź `develop`, katalog `apps/ccna/` (8 listopada 2026).

Kod kursu i Packet Lab znajduje się w `apps/ccna/`. Kopia źródłowa jest punktem wyjścia do dalszej pracy; modyfikacje tutaj nie aktualizują automatycznie Wiedory.

**Uwaga:** Repozytorium ma widoczność publiczną. Nie dodawaj sekretów Supabase, kluczy API, tokenów ani danych użytkowników.

Instrukcje uruchamiania i testowania zostaną opisane po przeniesieniu i weryfikacji zależności.


## Obowiązkowy system opracowywania treści (09.11.2026)

Przed opracowaniem **każdego filmu, lekcji, talii fiszek lub osobnego laboratorium** wykonawca musi najpierw odczytać aktualny [AGENTS.md](AGENTS.md) i [docs/CONTENT_PIPELINE.md](docs/CONTENT_PIPELINE.md). Nie rozpoczynaj od automatycznego generowania pytań. Wymagana jest najpierw notatka źródłowa i audyt Cisco, dalej dwie talie Anki, mapowanie pytań, dwujęzyczność, laboratorium i pełny test sekcji. Każde nowe zlecenie uruchamia procedurę od G0.

Przed udostępnieniem lekcji należy utworzyć paczkę według [data/content-workflow-template.json](data/content-workflow-template.json), a następnie sprawdzić:
    node scripts/validate-content.mjs --file data/packs/<ID>.json

Testy walidatora:
    node --test scripts/validate-content.test.mjs

Stan konkurencji, oficjalnego zakresu Cisco i plan rozwoju: [docs/COMPETITIVE_GAP_ANALYSIS.md](docs/COMPETITIVE_GAP_ANALYSIS.md).

Wiedora `develop` udostępnia **dwie osobne aplikacje**: dotychczasowe CCNA pod `/apps/ccna/` oraz niezależne **CCNAlab Beta** pod `/apps/ccnalab-beta/`. Kod bety pochodzi z przypiętego SHA repozytorium CCNAlab, a jej postępy mają oddzielny prefiks `ccnalab-beta:v1:`. Zmiany źródła nie aktualizują automatycznie bety: potrzebny jest przegląd, test i wydanie w repozytorium Wiedory. Działania nad aplikacją wykonuje wyłącznie projekt CCNAlab; masterplan Wiedory i KWN nie edytują jej wnętrza. Obecny stan repo nie oznacza, że pełny automat YouTube/Anki lub migracja do Wiedory już działa.


### Testy i poprawki bety (11.11.2026)

Pliki `apps/ccna/beta-tools.js`, `beta-offline.js`, `beta-sw.js` i `beta-mobile.css` są **dodatkami wyłącznie do izolowanego wydania beta**. Nie wolno włączać ich do starego CCNA w Wiedorze. Podłączanie i separacja danych odbywają się w `Constant_app/scripts/ccna/ccnalab-beta-stage.cjs`.

Zakres: eksport i import lokalnych postępów z walidacją kluczy, osobny cache offline i obszar service workera, informacja o stanie zapisu oraz większe przyciski Packet Lab na telefonie. Zapis wciąż jest **lokalny i niesynchronizowany z kontem**; nie traktować importu jako synchronizacji. Pełne testy urządzeń, wszystkich laboratoriów i audyt CCNA v2.0 są odrębnymi, otwartymi zadaniami.

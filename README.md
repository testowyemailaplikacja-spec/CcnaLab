# CCNA Lab

Niezależne repozytorium rozwojowe modułu CCNA wydzielonego z platformy Wiedora.

Źródło migracji: `testowyemailaplikacja-spec/Constant_app`, gałąź `develop`, katalog `apps/ccna/` (8 listopada 2026).

Kod kursu i Packet Lab znajduje się w `apps/ccna/`. Kopia źródłowa jest punktem wyjścia do dalszej pracy; modyfikacje tutaj nie aktualizują automatycznie Wiedory.

**Uwaga:** Repozytorium ma widoczność publiczną. Nie dodawaj sekretów Supabase, kluczy API, tokenów ani danych użytkowników.

**Uruchamianie testów:** `npm run verify` uruchamia walidator zawartości, 71 testów Packet Lab, 10 testów bety (w tym symulację service workera offline) oraz sprawdzenie składni kluczowych plików. Nie wymaga kluczy API ani konta Wiedory. Test uruchomieniowy przeglądarki w `scripts/beta-browser-e2e.cjs` potrzebuje Playwright, publicznego URL wydania i osobnej instalacji Chromium.


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


## Bieżący odbiór CCNAlab Beta (11 listopada 2026)

- **Źródło opublikowanej wersji:** `25d4f3a7ab55ce66b68436795920eec5b24ccfce`, przypięte przez Wiedorę `develop`. Nowszy kod i dokumentacja w tym repo **nie** aktualizują automatycznie wydania Wiedory.
- **Środowisko:** https://develop--constant-app.netlify.app/apps/ccnalab-beta/ ; oryginalne CCNA nadal pod `/apps/ccna/`, bez zmian.
- **Node 90/90 PASS**: 9 testów zawartości, 71 testów silnika i 10 testów bety / offline.
- **Chromium 8/8 PASS**: prawdziwy Netlify Preview, eksport i import postępu, zakaz importu obcych kluczy, mobilne przyciski, osobny service worker, komplet cache, odświeżenie i otwarcie pierwszego laboratorium bez Internetu. GitHub Actions: https://github.com/testowyemailaplikacja-spec/CcnaLab/actions/runs/43109979015 .
- **Nadal NOT_RUN/BLOCKED:** wszystkie 53 laboratoria, fizyczny iOS/Android, pełny audyt 3583 pytań, legalne materiały YouTube i obie talie Anki, komplet CCNA v2.0. Wynik 8/8 nie oznacza ukończenia tych zagadnień.
- Test manualny przeglądarki z katalogu repo: `CCNALAB_E2E_ORIGIN=https://develop--constant-app.netlify.app CCNALAB_EXPECTED_SHA=25d4f3a7ab55ce66b68436795920eec5b24ccfce node scripts/beta-browser-e2e.cjs`, po instalacji `playwright@1.65.0` i Chromium. Uruchamiaj bez danych użytkowników, w czystym profilu.

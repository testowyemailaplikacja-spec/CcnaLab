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

Wiedora develop będzie wyświetlała **CCNA — Wersja beta · Tylko CCNAlab** jako istniejący moduł /apps/ccna/, z wersją programową przypiętą do SHA repozytorium CCNAlab. Działania nad aplikacją wykonuje wyłącznie projekt CCNAlab; masterplan Wiedory i KWN nie edytują jej wnętrza. Obecny stan repo nie oznacza, że pełny automat YouTube/Anki lub migracja do Wiedory już działa.

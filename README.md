# CCNA Lab

Niezależne repozytorium rozwojowe modułu CCNA wydzielonego z platformy Wiedora.

Źródło migracji: `testowyemailaplikacja-spec/Constant_app`, gałąź `develop`, katalog `apps/ccna/` (8 listopada 2026).

Kod kursu i Packet Lab znajduje się w `apps/ccna/`. Kopia źródłowa jest punktem wyjścia do dalszej pracy; modyfikacje tutaj nie aktualizują automatycznie Wiedory.

**Uwaga:** Repozytorium ma widoczność publiczną. Nie dodawaj sekretów Supabase, kluczy API, tokenów ani danych użytkowników.

Instrukcje uruchamiania i testowania zostaną opisane po przeniesieniu i weryfikacji zależności.

## Modernizacja wewnętrzna (w toku)

Plan: [CCNALAB_MODERNIZATION_PLAN.md](docs/CCNALAB_MODERNIZATION_PLAN.md) · [status P0–P5](docs/CCNALAB_MODERNIZATION_STATUS.json) · [instrukcja testów](docs/CCNALAB_TESTING.md).

Postęp i odbiór: [issue #1](https://github.com/testowyemailaplikacja-spec/CcnaLab/issues/1), [PR #2](https://github.com/testowyemailaplikacja-spec/CcnaLab/pull/2). Kod starego kursu, UI i Packet Lab pozostaje nietknięty, dopóki przebudowa nie przejdzie bramek testowych. Repo jest publiczne.

## Samodzielna aplikacja (wersja rozwojowa)

Wymagany Node.js 20+. Uruchom lokalnie:

```bash
npm ci
npm run build:standalone
npm run audit:assets:strict
npm run preview:standalone
```

Otwórz `http://127.0.0.1:4173/apps/ccna/`. Kurs i Packet Lab są kopiowane bez zmiany kodu; warstwa `standalone/overlay/` dostarcza niezbędne pliki wspólne tylko do lokalnego pakietu `dist/`.

Tryb samodzielny używa **lokalnego** zapisu postępu. Nie łączy się z kontem Supabase Wiedory; logowanie, synchronizacja z chmurą i asystent AI nie działają bez backendu i nie są udawane.

**Powrót do Wiedory:** `npm run export:wiedora` utworzy `dist-wiedora/apps/ccna/` i manifest różnic. Nie kopiuj `dist/` do Wiedory. [Kontrakt reintegracji](docs/CCNALAB_WIEDORA_REINTEGRATION.md) opisuje testy i kontrolę konfliktów. Przed merge obowiązuje pełna regresja; na razie status modernizacji to **W TRAKCIE**.

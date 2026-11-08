# AGENTS.md — zasady pracy nad samodzielnym CcnaLab

Pierwsza czynność w każdej sesji: przeczytaj `docs/CCNALAB_MODERNIZATION_PLAN.md`, `docs/CCNALAB_MODERNIZATION_STATUS.json`, `docs/CCNALAB_BASELINE_20261108.md`, następnie właściwe dokumenty CCNA i aktualne pliki `develop`.

**Cel nadrzędny właściciela (2026-11-08):** zachować dotychczasowy wygląd, funkcje, dane użytkowników, postępy, CLI i laboratoria; refaktoryzować wyłącznie wnętrze programu oraz workflow tworzenia treści. Nie publikować zmian na `main`, nie ingerować w `Constant_app`. Pracuj w osobnej gałęzi, twórz PR do `develop`.

**Lekcja:** zweryfikowany film/transkrypcja → notatka źródłowa → weryfikacja techniczna → rozbudowana notatka → cele wiedzy → pytania/fiszki → A/B i ABCD o wspólnych opcjach → dedykowane laboratorium → testy i raport → odbiór. Żadnej treści źródłowej z pamięci, fikcyjnych komend ani domyślnie wymyślonego pliku .pkt.

**Odbiór:** nie oznaczaj `PASS`, `WDROŻONE` ani `UKOŃCZONE` bez rzeczywistych dowodów. Niezrealizowane testy = `NOT_RUN`. Każdy etap P0–P5 ma własną bramkę. Aktualizuj status na GitHub, dowody i dokładną listę plików. Issue #1 zamykaj dopiero po faktycznym 6/6 PASS.

**Dane:** nie zmieniaj istniejących ID, powiązań kart, kluczy localStorage i stanów lab bez testowanej migracji i rollback. Nie kasuj starych scenariuszy. Nie kopiuj sekretów ani zamkniętych materiałów z prywatnej Wiedory do publicznego CcnaLab.

**Docelowy model:** dane edukacyjne w odrębnych plikach; renderer/UI i silnik nauki niezależne od treści; testy blokują brakujące źródła, błędne odpowiedzi, brak mapowania do notatek, niekompletne laboratorium i regresje. Do czasu pełnej migracji zachować kompatybilność z `legacy.html`.

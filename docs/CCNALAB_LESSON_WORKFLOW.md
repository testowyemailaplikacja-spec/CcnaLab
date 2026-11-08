# Bramka autora treści — nowa lekcja CCNA

System etapowy z `scripts/ccnalab-lesson-workflow.mjs` jest **narzędziem redakcyjnym**, a nie zmianą wyglądu lub zachowania obecnego kursu. Każdy nowy materiał ma osobny plik statusu (lokalnie lub w `docs/lesson-status/` po przeglądzie praw do źródła).

## Polecenia lokalne
```bash
node scripts/ccnalab-lesson-workflow.mjs init docs/lesson-status/day03.json ccna-day03
node scripts/ccnalab-lesson-workflow.mjs check docs/lesson-status/day03.json
node scripts/validate-ccna-lesson.mjs content/lessons/day03.json
npm run test:authoring
```
Nie twórz sfabrykowanej notatki w repo, dopóki film lub transkrypcja nie są zweryfikowane. Nie publikuj w publicznym repo licencjonowanych transkrypcji lub prywatnych plików.

## Etapy
1. `verified_source`: rzeczywisty film, transkrypcja/notatka i weryfikacja uprawnień.
2. `source_note`: pełna, źródłowa notatka z zakresem i odniesieniami czasowymi.
3. `technical_review`: porównanie terminologii, funkcji i komend z Cisco.
4. `expanded_note`: samodzielne wyjaśnienie do nauki.
5. `topic_map`: cele i referencje do źródła + fragmentów notatki.
6. `cards`: jeden czterowariantowy bank kart; fiszki i A/B pochodne.
7. `dedicated_lab`: jedno dedykowane laboratorium sekcji, niezależnie od innych istniejących laboratoriów; test pozytywny i negatywny.
8. `structural_tests`: walidator i testy natywne.
9. `runtime_tests`: rzeczywista przeglądarka, desktop/mobile, postępy i Packet Lab.
10. `final_acceptance`: ocena recenzenta, commit SHA, raporty i potwierdzenie wydania.

Statusy to `NOT_STARTED`, `IN_PROGRESS`, `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN`. Nie wolno przejść do etapu następnego, jeżeli poprzedni nie ma PASS. Każde PASS potrzebuje materialnego dowodu, a **system nie poświadcza autentyczności własnoręcznie wpisanych dowodów** — musi je sprawdzić reviewer i faktyczne logi testów. Status `COMPLETED` wymaga wszystkich 10 PASS i dowodów Node, browser, lab oraz recenzenta. Odróżniaj to od ostatecznego ukończenia projektu P0–P5.

## Bramka bezpieczeństwa
Stan kursanta, istniejący interfejs i Packet Lab są odczytywane bez zmian; narzędzie nie zapisuje ani nie modyfikuje `legacy.html`. Nowy schemat musi zostać podłączony do istniejącego renderera dopiero po przejściu regresji i osobnym odbiorze P3.

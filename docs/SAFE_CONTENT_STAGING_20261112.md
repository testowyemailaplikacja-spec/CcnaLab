# CCNAlab — bezpieczne przygotowywanie nowych treści
Stan: 12.11.2026. Etap: **prywatny staging / dry-run, bez publikacji do interfejsu**.

## Co zostało zaimplementowane

1. `data/mapping/legacy-ids.json` zabezpiecza bazowe, **statycznie zapisane w źródle** 3778 identyfikatorów i strukturę Packet Lab (50 działów, 127 podtematów, 15 podtematów oznaczonych jako laboratorium). Zawiera Git blob SHA źródłowego `legacy.html` oraz `curriculum.js`. To nie jest pełny runtime inventory wszystkich dynamicznie tworzonych pytań i kart.
2. `node scripts/check-legacy-ids.cjs` porównuje istniejący kod z bazą. Każde nadpisanie, zniknięcie identyfikatora, zmiana liczności lub struktury wymaga osobnego przeglądu. Bez automatycznego generowania nowej bazy.
3. `scripts/stage-content-pack.mjs` uruchamia walidację paczki, sprawdza obecność prywatnych plików dowodowych, poprawność ścieżek, dwie talie, deklarowane QA i niepowtarzalne identyfikatory talii. Nie pobiera filmów, nie generuje odpowiedzi i nie weryfikuje automatycznie poprawności faktów Cisco.
4. Bez jawnego `--write` polecenie daje **tylko raport JSON**. Zapis `--write` wymaga oddzielnego pliku zatwierdzenia podpisanego danymi recenzenta i hashem wejściowej paczki. Sama deklaracja recenzji w JSON nie potwierdza jej autentyczności. Nie wolno traktować jej jako zastępstwa prawdziwego przeglądu.
5. Zatwierdzony wynik trafia wyłącznie do `build/staged/<contentId>.json`, do folderu ignorowanego przez Git. Działa idempotencja (ponowne zapisanie tej samej zawartości), natomiast próba nadpisania istniejącego ID zmienioną zawartością kończy się błędem.
6. Paczka wynikowa zawiera wyłącznie pola do przyszłego widoku kursanta. Nie zawiera transkrypcji, URL filmu, wewnętrznych notatek, źródłowych ID Anki ani oryginalnych referencji quizu. Pytania z quizu oznaczane są jako **wstrzymane** — importer quizów wymaga dalszej implementacji.

## Bezpieczne wywołanie

Dane realnych filmów i talii, do których mamy prawa, przechowuj **poza publicznym repo**, np. w swoim prywatnym katalogu. Nie kopiuj do GitHub surowych transkrypcji ani kart z zewnętrznych talii bez prawa publikacji.

Przykładowe uruchomienie bez zapisu:

```bash
node scripts/stage-content-pack.mjs \
  --file /prywatne/lekcja.json \
  --evidence-root /prywatne/dowody
```

Przy gotowej, rzeczywiście przejrzanej paczce należy przygotować **osobny** plik potwierdzający: `schema=ccnalab-stage-approval-v1`, `contentId`, `contentSha256` (SHA-256 dokładnej zawartości JSON wejściowego), `reviewer`, `approvedAt` i pięć pól `checks`: `sourceRights`, `technical`, `bilingual`, `quiz`, `regression` (każde `true`). Użycie `--approval` i `--write` zapisuje **wyłącznie etap roboczy**, nie publikuje niczego w Wiedorze.

```bash
node scripts/stage-content-pack.mjs \
  --file /prywatne/lekcja.json \
  --evidence-root /prywatne/dowody \
  --approval /prywatne/approval.json --write
```

Struktura wejścia jest zdefiniowana w `data/content-workflow-template.json` i `docs/CONTENT_PIPELINE.md`. Dla scenariusza laboratoryjnego zachowaj ten sam pipeline G0–G6; brak działającego buildera laboratoriów i autoryzowanego źródła oznacza **BLOCKED**.

## Ochrona starego CCNA i przyszła migracja

- `apps/ccna/legacy.html`, `router.js`, `index.html` oraz runtime Wiedory nie są zmieniane przez tę paczkę.
- Stary adres `/apps/ccna/` i dane użytkowników pozostają nietknięte.
- Zmiany kodu CCNAlab nie są automatycznie publikowane w Wiedorze. Beta pozostaje przypięta do dotychczasowego SHA i wymaga osobnego testu oraz nowego kontrolowanego wydania, gdy nowy mechanizm będzie gotowy do integracji.
- NIE uznawaj gotowości do masowej produkcji treści na podstawie obecności pliku `legacy-ids.json`. Snapshot obejmuje zapisane literalnie ID, ale nie pełen zrzut runtime.
- Następny etap: rzeczywisty runtime snapshot; hash wszystkich identyfikatorów kart i pytań; zatwierdzona mała paczka z realnymi źródłami; odseparowany renderer; test round-trip i rollback na Netlify Preview.

## Testy

```bash
npm run check:legacy-ids
npm run test:foundations
npm run verify
npm run audit:readiness
```

Oczekiwany stan: kontrole istniejącego kodu PASS, ale `automatedPublication=BLOCKED`. To celowe i prawidłowe zachowanie w tej fazie.

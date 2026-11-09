# CCNAlab — docelowa architektura bezpiecznego importu filmów (projekt techniczny)
Status 09.11.2026: **PROJEKT, NIE IMPLEMENTACJA**. Obowiązuje zgodność z docs/CONTENT_PIPELINE.md.
Cel: zastąpić ręczne edycje wielkiego apps/ccna/legacy.html małymi, odtwarzalnymi paczkami danych bez naruszania UI, silnika postępów ani symulatora.

## Obecnie
- apps/ccna/legacy.html ≈ 2,5 MB: monolityczny dokument zawierający kurs, pytania i renderer (rozmiar pliku z repo podczas audytu).
- apps/ccna/packet-lab/ ma osobne engine.js, cli.js, scenarios.js oraz istniejące testy.
- Istniejące identyfikatory sekcji, fiszek, postępów i ćwiczeń są częścią kontraktu i nie wolno ich masowo regenerować.
- Wejściowe pliki dwóch talii Anki, prawo do ich wykorzystania i napisy konkretnych wideo NIE są potwierdzone w tym zadaniu.

## Architektura docelowa
\`\`\`text
video URL + napisy/notatka (legalny dostęp) + dwie talie Anki + examVersion
                         |
                         v
                 IMPORT G0-G1 (source ingestion)
                 opis filmu, timecodes, licencje, checksum
                         |
                         v
                 REFERENCE G2 (research Cisco)
                 twierdzenia -> oficjalne źródła -> claimId
                         |
                         v
              PLANNER G3 (gałęzie i stabilne IDs)
               topicIds, zakresy, noteAnchor, mapy Anki
                         |
                         v
             AUTHOR/REVIEW G4 (kursant PL / EN)
           notatka -> karty -> pytania -> dystraktory
                         |
                         v
             VALIDATION G5 (structure + real tests)
          schema, quiz, 2 decks, komendy i Packet Lab
                         |
                         v
               RELEASE G6 (commit pinned source)
                  CCNAlab -> staging Wiedora
\`\`\`

Proponowany układ (wszystkie ścieżki poza istniejącymi = DOCELOWO):
\`\`\`text
data/
  source-registry/VIDEO-ID.json           źródło i licencja, wewnętrzne
  source-reference/VIDEO-ID.json          fakty, timestampy, Cisco URLs, wewnętrzne
  imported-anki/deck-registry.json        licencje i mapy źródłowych ID, wewnętrzne
  packs/SECTION-ID.json                   pojedyncza paczka robocza, wewnętrzna
  published/sections/SECTION-ID.json      wyłącznie widoczna notatka + zatwierdzone pytania
  published/labs/LAB-ID.json              osobna instrukcja i scenariusz praktyczny
  mapping/legacy-ids.json                 niezmienne ID i mapy importu
scripts/
  ingest-video.mjs                        pobieranie autoryzowanego materiału
  map-anki.mjs                            indeksowanie dwóch talii i przypięcie do celów
  build-section.mjs                       podział, deduplikacja, export
  build-lab.mjs                           komendy, symulator, ocena
  validate-content.mjs                    już przygotowany walidator struktur
  validate-coverage.mjs                   docelowa kontrola Cisco topics -> knowledge
apps/ccna/
  renderer/lesson-view.js                  pojedyncze renderery bez parsera monolitu
  renderer/quiz-view.js                    polski główny, angielski dyskretny
  renderer/lab-view.js                     własne schematy i ostatni spis komend
\`\`\`

## Model jakości treści
Każdy fakt ma jeden stabilny \`claimId\`, jego \`sourceEvidence\` oraz \`officialSource\`. Każdy blok notatki ma \`anchorId\` i co najmniej jeden \`claimId\`. Fiszka ma \`questionId/sourceId\` i \`coveredByAnchorId\`, a odpowiedź poprawna i każda błędna mają osobne, sprawdzalne uzasadnienie. Jeden \`sectionId\` może mieć wiele \`subsectionIds\`; pojedynczy \`cardId\` jest własnością jednej podsekcji i może być tylko REFERENCJĄ w puli nadrzędnej, nigdy zduplikowanym rekordem. Quiz końcowy filmu ma osobny \`videoQuizId\` i własne reguły widoczności; historyczne wyjątki migracyjne pozostają jawne.

Dla PL+EN przechowuj semantyczne pola \`stem.pl\`, \`stem.en\`, \`options[].pl\`, \`options[].en\`, \`explanation.pl\`, \`explanation.en\`. Przy imporcie talii EN źródło angielskie jest chronione przed ponowną automatyczną translacją. UI pokazuje PL jako podstawę, pod każdym PL wyświetla mniejszy, mniej kontrastowy (ale czytelny i WCAG) EN. Nazwy protokołów/komend nie są tłumaczone; zachować działanie czytnika ekranu.

## Silnik stanów i odporność na powtórki
Każda paczka z unikalnym \`contentId\` i \`sourceHash\` ma statusy:
\`DISCOVERED -> SOURCE_VERIFIED -> RESEARCHED -> STRUCTURED -> AUTHORED -> REVIEWED -> TESTED -> RELEASE_CANDIDATE -> PUBLISHED\`.
Przy błędzie: \`BLOCKED\` z \`step\`, \`reason\`, \`missingEvidence\`, bez publikowania częściowo wypełnionej lekcji. Każdy etap pracuje na roboczej kopii i zapisuje manifest z checksum. Re-run tego samego sourceHash nie dopisuje drugi raz tych samych fiszek. Zmiana źródła tworzy nowy revision; zachowanie starych IDs jest bramką migracji postępu.

Nie przechowuj danych niejawnych, sekretów, prywatnych nagrań ani materiałów licencyjnie nieudostępnialnych w publicznym GitHub. Wewnętrzne referencje zadań w publicznym repo powinny być tylko autorskim streszczeniem i metadanymi, nie kopiami cudzych transkrypcji. Do repo trafia publiczny wynik dopiero po zgodzie na jego rozpowszechnienie.

## Dwa odrębne tory teorii i laboratoriów
Teoria: \`VIDEO → claims → podsekcje → 2 decks → notatka/EN → fiszki → A/B + A/B/C/D → agregacja\`.
Laboratorium: \`LAB VIDEO → topologia/CLI → oddzielna ostatnia podsekcja → instrukcja krok po kroku → pytania o WSZYSTKIE komendy → Packet Lab scena → grader\`. Lab nigdy nie przechowuje fiszek; informacje o komendach zewnętrzne i wewnętrzne są rozdzielone. Jeden lab w rzeczywistym silniku Packet Lab — brak drugiego, atrapowego symulatora.

## Bramki wdrożeniowe migracji
1. Spisać snapshot historycznych wszystkich sectionId/cardId/labId i hash.
2. Wprowadzić pasywny importer JSON i test identyczności pul, bez przełączania UI.
3. Stopniowo przenieść pojedynczą sekcję na nowy format, porównać render i postępy.
4. Zachować rollback na poprzedni generator i niezależne dane; nie zmieniać kluczy localStorage/IndexedDB tylko przy refaktoryzacji.
5. Potwierdzić E2E podręczny reload, błędne i poprawne odpowiedzi, sekcję nadrzędną, offline, gościa i zalogowanego.
6. Zintegrować przez przypiętą betę Wiedora, testy hostowe nie dotykają KWN, dokumentować SHA źródła i deploy.

**Kryterium sukcesu:** agent dodaje kompletną nową lekcję/laboratorium przez nową paczkę danych i testy, bez ręcznego dopisywania dużych fragmentów do legacy.html, a student i dotychczasowe postępy zachowują niezmienione zachowanie.
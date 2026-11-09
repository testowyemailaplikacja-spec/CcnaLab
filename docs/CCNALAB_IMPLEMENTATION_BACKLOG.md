# CCNAlab — backlog wykonawczy i mikroetapy (09.11.2026)
Źródło prawdy procesu: AGENTS.md → docs/CONTENT_PIPELINE.md → data/content-workflow-template.json → scripts/validate-content.mjs.

Statusy: DONE = kod/dokument i adekwatny test potwierdzony; IN_PROGRESS = część zrobiona; TODO = nie wdrożono; BLOCKED = zależność; NOT_RUN = brak testu.

| ID | Priorytet | Zadanie | Stan na feature branch 09.11.2026 | Kryterium zakończenia |
|---|---|---|---|---|
| CCNA-P00 | P0 | Obowiązkowe instrukcje AGENTS i pipeline 15+8 | IN_PROGRESS | PR po scaleniu, przyszły agent czyta przed pracą |
| CCNA-P01 | P0 | Import transkrypcji lub legalnych notatek z YouTube | TODO | wejście URL, wersja, timestampy, log braków i prawa |
| CCNA-P02 | P0 | Pozyskiwanie pytań quizu + ewidencja grafik | TODO | kompletność quizu, własne diagramy, kontrola licencji |
| CCNA-P03 | P0 | Weryfikacja na źródłach Cisco i mapa v1.1/v2.0 | IN_PROGRESS | wszystkie ważne fakty przypięte do celu i URL źródła |
| CCNA-P04 | P0 | Niewidoczna referencyjna notatka i pochodzenie | TODO | dowody w prywatnym, niepublikowanym rejestrze, redakcja bez przecieków |
| CCNA-P05 | P0 | Podział i wykrywanie powtórzeń podsekcji | TODO | stabilne ID, unikalne cele, bez niepotrzebnych duplikatów |
| CCNA-P06 | P0 | Dwie talie Anki JITL + OCG (za zgodą licencji) | BLOCKED | prawdziwe pliki i licencje dostępne, dokładne mapowanie IDs |
| CCNA-P07 | P0 | Fiszki do właściwych podsekcji | TODO | 100% fiszek przypięte/archiwizowane; bez utraty postępów |
| CCNA-P08 | P0 | Mapowanie noteAnchor i poprawki notatek | IN_PROGRESS | walidator sprawdza mapę, ręczny audyt dowodzi pokrycia |
| CCNA-P09 | P0 | Redakcja, tabele, grafiki, alt text, bez źródeł w UI | IN_PROGRESS | przewodnik + walidator; rzeczywisty renderer wymaga testu |
| CCNA-P10 | P0 | Generowanie A/B i A/B/C/D | TODO | różne cele poznawcze i 1 poprawna odpowiedź |
| CCNA-P11 | P0 | Audyt poprawnej odpowiedzi | IN_PROGRESS | strukturalna kontrola + przegląd z Cisco |
| CCNA-P12 | P0 | Trudne dystraktory z pokrewnych treści | IN_PROGRESS | whyWrong + sameCategoryReason dla każdej błędnej |
| CCNA-P13 | P0 | Dwujęzyczny renderer PL / delikatny EN | TODO | EN pod PL w pytaniach, odpowiedziach, fiszkach; test a11y |
| CCNA-P14 | P0 | Końcowe QA i regresja | IN_PROGRESS | 8/8 izolowanych przypadków walidatora; pełny npm/browser NOT_RUN |
| CCNA-P15 | P0 | Agregacja do sekcji rodzica bez powtórzeń | IN_PROGRESS | kontrola sum/unikalności w paczce + test realnych pul |
| CCNA-L01 | P0 | Analiza źródłowego filmu laboratorium | TODO | notatka, urządzenia, prawa do .pkt/.pka |
| CCNA-L02 | P0 | Notatka wewnętrzna: topologia, adresy, kroki | TODO | kompletna specyfikacja labu z wizualizacjami |
| CCNA-L03 | P0 | Wszystkie komendy/tryby wraz z wynikiem | IN_PROGRESS | walidator kompletności rekordu; prawdziwe polecenia zweryfikowane |
| CCNA-L04 | P0 | Osobna ostatnia podsekcja laboratorium | IN_PROGRESS | walidator sprawdza lokalizację; istniejące laby do audytu |
| CCNA-L05 | P0 | Czytelny przebieg + schemat + spis komend na końcu | IN_PROGRESS | strukturalna kontrola listy; faktyczny UI do wykonania |
| CCNA-L06 | P0 | Bez fiszek, każda komenda w obu trybach pytań | IN_PROGRESS | walidator pilnuje A/B i A/B/C/D dla każdej komendy |
| CCNA-L07 | P0 | Rzeczywisty scenariusz istniejącego Packet Lab | TODO | konfiguracja, graded positive/negative, reset, trwały zapis |
| CCNA-L08 | P0 | Pełna weryfikacja laboratorium | NOT_RUN | Node + browser + save/restore + mobile + regresja |
| CCNA-I01 | P0 | Stagingowa beta CCNAlab w Wiedora | IN_PROGRESS | hostowy PR, testy, zaakceptowane develop i Netlify SHA |
| CCNA-I02 | P1 | Odrębny formalny odbiór i publikacja produkcyjna | BLOCKED | wszystkie P0 PASS, zgoda właściciela, brak wpływu na KWN |

## Gotowe w tej partii
Dokumentowane kroki, schemat paczki, walidator i zestaw izolowanych 8/8 testów demonstracyjnych. To nie jest działający automat, który pobiera dowolny film i wypełnia lekcję samoczynnie. Rzeczywiste paczki pozostają niezrealizowane; nie wytwarzaj fałszywych danych bez legalnego źródła transkrypcji i dwóch talii.

## Bramka przed nową lekcją
Wejściowe dane muszą zawierać: URL filmu, dostępne legalnie transkrypcje/notatki, obie autoryzowane talie fiszek lub ich zapis źródłowy, wersję egzaminu Cisco i sekcję docelową. Jeśli któregokolwiek nie udało się pozyskać — BLOCKED dla importu, dalsza implementacja innych niezależnych elementów jest dozwolona.

## Bramka przed wydaniem
CCNALab osobno: npm run verify, sprawdzona paczka per film, unikalne ID, recenzja techniczna i brak utraty postępów. Wiedora osobno: npm run verify i verify:full, test KWN izolacji, source SHA zgodny z pinned, Netlify staging SHA+browser+offline. Bez jednego z tych dowodów: „kod na gałęzi”, nie „wersja wdrożona”.
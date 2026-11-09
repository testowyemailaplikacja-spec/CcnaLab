# CCNAlab — obligatoryjny pipeline treści i laboratoriów
Wersja 1.0 · 09.11.2026 · kanoniczna instrukcja dla wszystkich agentów

## Cel i ochrona stanu
Program ma wytwarzać samodzielne lekcje po polsku z dyskretnym oryginalnym brzmieniem angielskim pod pytaniami, zachowując oficjalną terminologię Cisco i wszystkie istniejące funkcje CCNA. Jedno źródło prawdy jest wersjonowaną paczką audytową. Działający kod w apps/ccna/ nie jest zastępowany fikcyjnymi danymi ani makietą. Rozwój zachodzi w CCNAlab; Wiedora develop służy do wydzielonej bety, a nie jako masterplan WPL.

## G0 — preflight (blokujący)
Przeczytaj aktualne AGENTS.md, ten dokument, README.md, TERMINOLOGY.md, aktualne sekcje, mapy i scenariusze. Ustal typ paczki (theory/lab), stabilny sectionId, videoUrl, revision egzaminu i źródła z prawem dostępu. Sprawdź czy film ma prawnie dostępne napisy/transkrypcję lub dopuszczone notatki; nie twierdź „obejrzałem film”, jeśli pozyskano tylko metadane. Prawa do grafik i talii Anki sprawdź przed importem. Bez potwierdzonych materiałów nie wykonuj kolejnych etapów jako PASS.

## TEORIA: 15 kroków z odrębnymi śladami
1. **Film**. Zapisz tytuł, kanał, URL, datę, czas, zakresy tematów i wykorzystane napisy / notatkę. Pochodzenie przechowuj wewnętrznie.
2. **Surowa notatka i quiz**. Spisz własnymi słowami fakty z filmu; wydziel końcowe pytania i poprawne odpowiedzi. Grafiki oznacz jako diagram do odtworzenia, nie kopiuj obrazu bez licencji. Pytania z filmu nie mogą zniknąć z rejestru.
3. **Oficjalna weryfikacja**. Sprawdź program 200-301 v1.1/v2.0, Cisco U/NetAcad, Cisco IOS documentation i właściwe RFC/IEEE tylko jeśli pierwotne. Każde merytoryczne rozszerzenie powiąż z URL, sekcją specyfikacji i datą dostępu; nie podstawiaj forum jako źródła oficjalnego.
4. **Wewnętrzna notatka referencyjna**. Stwórz pełny draft z rozróżnieniem „film”, „uzupełnienie Cisco”, „niezweryfikowane”. Trzymaj go poza UI; to podstawa sprawdzania i wersjonowane dowody.
5. **Podział**. Zbuduj mapę 3–8 większych gałęzi (liczba dostosowana do objętości), każda z własnym niepowtarzającym się celem nauki i listą pojęć. Jedno pojęcie ma jedno główne miejsce; linki przekrojowe nie tworzą duplikatów pytań.
6. **Dwie talie**. Zaimportuj obie autoryzowane talie Anki (np. JITL i OCG, jeśli te są faktycznie dostępne), zachowaj sourceDeck, sourceId, oryginał EN, licencję i mapę pojęć. Nie deklaruj pełnego importu, gdy którejś brakuje.
7. **Rozmieszczenie fiszek**. Przypnij unikalne ID fiszek do dokładnie jednej właściwej podsekcji, bez usuwania historycznych ID, duplikacji i resetu statystyk. Fiszki niepasujące do filmu: udokumentowany backlog albo wersjonowane archiwum, nie cichy import.
8. **Pokrycie notatki**. Dla KAŻDEJ karty zapisz noteAnchor i potwierdź, że odpowiedź wynika z opisu na tej samej podsekcji. Jeśli brakuje wiedzy, dopisz wyjaśnienie z oficjalnym źródłem i ponownie sprawdź.
9. **Redakcja**. Przeredaguj noteVisible: przystępny język, definicje i przykłady, tabele porównawcze, własne diagramy z alt textem, logiczna kolejność. W kursie usuń metazwroty „Jeremy”, „Day 02”, „film pokazuje”, „źródło główne” i podobne. Nie usuń faktów ani poleceń. Provenance tylko w paczce audytowej.
10. **A/B i A/B/C/D**. Zbuduj szybkie rozróżnienia A/B i trudniejsze scenariusze czterowariantowe, z różnymi celami poznawczymi; nie powielaj pytań jeden do jednego.
11. **Audyt odpowiedzi poprawnej**. Dla każdej pozycji sprawdź prawidłowość, jednoznaczność, zgodność z wersją egzaminu, noteAnchor i wyjaśnienie.
12. **Audyt dystraktorów**. Wszystkie odpowiedzi błędne muszą być z tej samej kategorii (np. 802.1Q/802.3ad, tryby IOS, podobne prefiksy IPv6), realistyczne w danym scenariuszu, ale jednoznacznie niepoprawne. Zakaz „wszystkie”, „brak z powyższych” i jawnie absurdalnych opcji bez uzasadnienia. Przeprowadź ręczny przegląd przeciwko więcej niż jednej prawdziwej odpowiedzi.
13. **PL + EN**. Pytanie, każda odpowiedź i wyjaśnienie muszą mieć PL oraz EN. W interfejsie polski tekst pierwszy; poniżej angielski mniejszy, jaśniejszy, o mniejszej grubości, ale dostępny dla czytnika ekranu. Dla importów EN jest oryginałem, a PL tłumaczeniem; dla nowych pytań odwrotnie. Nazwy standardów i komendy nie są tłumaczone.
14. **Końcowy QA**. Sprawdź licencje, poprawność grafik, tabel, pokrycie fiszek, pełny quiz, unikalność ID, brak pochodzenia w UI, poprawność techniczną i zgodność z Cisco. Uruchom parser oraz ręczny przegląd oznaczony przez review.status.
15. **Pule nadrzędne**. Zlicz unikalne ID podsekcji i agregację fiszek/A-B/A-B-C-D do rodzica oraz egzaminu; osobno pilnuj quiz-only legacy. Wykonaj scenariusz po odświeżeniu, wznawianie i brak regresji zapisów. Bez poprawnych sum nie ma PASS.

## LABORATORIUM: 8 kroków z odrębnymi śladami
L1. Ustal autoryzowany film laboratoryjny i powiązany plik .pkt/.pka, jeśli dostępny. Rozpoznaj zakres i urządzenia.
L2. Zapisz wewnętrzną notatkę z filmu, topologię, porty, adresację i stan początkowy.
L3. Spisz wszystkie rzeczywiście występujące polecenia (IOS/host), z urządzeniem, trybem, parametrami, kolejnością i oczekiwanym wynikiem. Jeśli komend brak, zapisz „Komendy Cisco IOS CLI: brak”; nie wynajduj ich.
L4. Upewnij się, że istnieje dokładnie jedna osobna podsekcja laboratoryjna na końcu sekcji. Duplikaty przenieś/wycofaj z zachowaniem ID; odstępstwo zgłoś i czekaj na decyzję, bez samowolnego usuwania danych.
L5. W widocznej notatce umieść cel, schemat z alt textem, konfigurację krok po kroku, testy wyników i **na końcu** spis komend. Odnośnik do .pkt/.pka wyłącznie jeśli dostępny i legalny; inaczej jawny brak. Spis CLI w notatce jest na końcu, bez sprzeczności ze strukturą wewnętrznego audytu.
L6. Nie dodawaj fiszek. Utwórz pytania A/B i A/B/C/D dotyczące WSZYSTKICH faktycznie użytych komend; powiąż każdą komendę z pytaniem każdego rodzaju i właściwym objaśnieniem. Laboratorium bez komend ma pytania o kroki, porty, przewody i weryfikację.
L7. Zaimplementuj scenariusz we **wspólnym istniejącym Packet Lab** bez atrap i bez resetowania innych ćwiczeń; udostępnij studentowi stan początkowy, edycję konfiguracji, ocenę kroków, wskazówki i reset danego labu. Plik Packet Tracer nie jest importem JSON własnego symulatora.
L8. Testuj każdą komendę i wszystkie kroki w rzeczywistym symulatorze, ocenę poprawną i niepoprawną, reset, zapis/odczyt, powrót z laboratorium, izolację innych sekcji, odświeżenie i (jeśli można) przeglądarkę. Brak wsparcia komendy = BLOCKED do implementacji, nie „zaliczone”.

## Bramki G1–G6 i statusy
G1 SOURCE_VERIFIED: film/transkrypcja + licencje, dla teorii także obie talie. G2 FACTS_VERIFIED: oficjalne źródła i odnotowane różnice. G3 STRUCTURE_VERIFIED: unikalne ID, prawidłowe miejsca i pokrycie. G4 LANGUAGE_REVIEWED: PL/EN oraz dystraktory; lab: komendy i instrukcje. G5 TESTED: walidator, testy istniejącego UI/symulatora i regresja; każda niedostępna kontrola = NOT_RUN. G6 RELEASED: commit + weryfikacja odpowiedniego wydania Wiedory develop (SHA, HTTP, UI), bez dotykania main. Paczkę uznaj ukończoną wyłącznie przy G1–G5 PASS; G6 osobny status publikacji.

Automatyczna walidacja struktury:
    node scripts/validate-content.mjs --file data/packs/<identyfikator>.json

Szablon data/content-workflow-template.json to wypełniany schemat roboczy, nigdy dowód ukończenia. Nieznane = PENDING/NOT_RUN zamiast fikcyjnego PASS. Pytania z końca filmu i brakujące obrazki rejestruje się nawet jeśli nie wolno ich wyświetlać w aplikacji.

## Wymagane artefakty i niezależna integracja
Dla każdej paczki: video + timestampy, sourceEvidence, officialSources, internalReference, sections, deckCoverage (teoria), importedCardIds, quizItems, visibleNotes, questionPool, noteCoverage, labCommands/labScenario (lab), QA, testEvidence, changelog. Zapisuj ocenę odpowiedzi i dystraktorów, mapping ID oraz sumy egzaminu nadrzędnego. W razie braku filmu lub pełnej talii przerwij import, zachowując dane zastane.

CCNAlab ma być źródłem kodu funkcjonalnego; Wiedora ma utrzymywać osobne, przypięte wersją do SHA, izolowane wydanie beta bez modyfikacji projektu KWN ani masterplanu WPL. Oba projekty są oddzielnie weryfikowane i scalane.
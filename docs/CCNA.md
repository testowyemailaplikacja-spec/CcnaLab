# Aplikacja CCNA — aktualny model działania

Ten dokument opisuje aktualnie oczekiwane działanie aplikacji CCNA. Przed zmianą należy przeczytać ten plik oraz AGENTS.md. Zmiana funkcjonalna wymaga aktualizacji dokumentu.

**OBOWIĄZUJĄCA PROCEDURA OPRACOWANIA WSZYSTKICH KOLEJNYCH TEMATÓW CCNA (również w nowych czatach):** [CCNA_CONTENT_FROM_VIDEO_WORKFLOW.md](CCNA_CONTENT_FROM_VIDEO_WORKFLOW.md). **Najpierw notatka z konkretnego filmu, potem pytania/fiszki i audyt zakresu; laboratoria osobno; pytania obce w archiwum.**

## Jedna fiszka SFP — doprecyzowanie pytania (04.11.2026, WIE-161)

**OBECNIE W KODZIE `develop`, publikacja Netlify osobno:** w podsekcji `swiatlowod-i-transceivery` (Fiber-Optic Cabling, SFP, MMF and SMF) poprawiono wyłącznie polskie pytanie `anki-interfaces-cables-jitl-1571562000954` na: „Jaki wymienny moduł nadawczo-odbiorczy umożliwia podłączenie kabla światłowodowego do kompatybilnego Switcha lub Routera?”. Poprzednia wersja błędnie sugerowała zakończenie włókna bezpośrednio w module; poprawiona pyta o funkcję transceivera SFP. Odpowiedź `SFP (Small Form-Factor Pluggable)`, oryginał `questionEn`, pozostałe odpowiedzi, identyfikator i postępy nie zostały zmienione. Zakres tylko jednej fiszki z Day 02 (kontekst światłowodów i SFP w 20:24–26:28 materiału).

**Regresja:** dodano test w `tests/ccna-day02-content-scope.test.cjs` dla faktycznie wyświetlanej treści i niezmienionej odpowiedzi/ID. Weryfikacja źródłowa jest odrębna od pełnego uruchomienia; natywny Node/JSDOM, `npm run verify`, przeglądarka i SHA Netlify wymagają osobnego potwierdzenia przed uznaniem naprawy za opublikowaną.

## Duplex Fiber Link — samodzielna fiszka (04.11.2026, WIE-161)

**ZMIANA W KODZIE `develop` (publikacja Netlify osobno):** pytanie `fiber-day02-03` w podsekcji `swiatlowod-i-transceivery` sprawdza, jak połączyć Tx/Rx między urządzeniami A i B w typowym dwuwłóknowym łączu światłowodowym. Nie zakłada obejrzenia filmu ani wyświetlania grafiki. W notatce zastąpiono sformułowanie „Film pokazuje” bezpośrednim objaśnieniem zasady. Zachowano historyczne ID, cztery warianty odpowiedzi, poprawną odpowiedź oraz dotychczasowe postępy. Regresja: `tests/ccna-day02-content-scope.test.cjs` sprawdza samodzielność pytania, prawidłową odpowiedź i notatkę. Test przeglądarkowy oraz aktualny SHA Netlify wymagają osobnej weryfikacji; brak publikacji pojedynczej poprawki zgodnie z polityką wydawania partiami.

## Separacja fiszek całej sekcji i pytań A/B — 02.11.2026 (WIE-161)

**OBECNIE W KODZIE `develop` (weryfikacja Netlify osobno):** „Fiszki z całej sekcji” korzystają z własnej sesji i własnych ID `section-flashcards:<sectionId>::<questionKey>`; wykorzystanie fiszek podsekcji nie zmniejsza puli fiszek całej sekcji. „Tryb nauki całej sekcji” jest osobną ścieżką **wyłącznie A/B**, z zakresem `section-learning:<sectionId>` i ID `section-learning:<sectionId>::<questionKey>`. Stare oceny podsekcji i fiszek sekcji nie wpływają na jej dostępność, stan manual/mastered w podsekcji nie wyłącza pytań w całości sekcji, a oceny zbiorcze nie zaliczają żadnej podsekcji. Wznowienie i restart zachowują obowiązkowe A/B nawet gdy starsza sesja była w trybie odsłaniania odpowiedzi. Pozostałe moduły wspólnego silnika zachowują dotychczasowy wybór trybu. Historyczne oceny w starych kluczach pozostają nienaruszone; nie są uznawane za zaliczenie nowych niezależnych zakresów.

**Regresja wymagana przed zamknięciem:** przejście fiszek w podsekcji, następnie otwarcie fiszek sekcji z pełną pulą; ocena fiszek całej sekcji i sprawdzenie niezmienionych postępów podsekcji; przejście A/B całej sekcji oraz wznowienie po odświeżeniu; odłączenie pytań w podsekcji i sprawdzenie ich dostępności w obu niezależnych pulach sekcji; kontrola niezmienionych trybów podsekcji i egzaminu.

## Naprawa blokady fiszek i nawigacji pytań — 01.11.2026 (WIE-161)

**OBECNIE W KODZIE `develop`; pełne `npm run verify` i rzeczywisty test wydania Netlify wymagają potwierdzenia.** Wyłączenie pojedynczego pytania przez „Wyłącz to pytanie” nadaje mu zachowywany status `manual` w `ccna-spaced-review-v1`. Tak wyłączona karta pozostaje w banku i można ją ponownie włączyć, ale **nie blokuje już zaliczenia obowiązkowych fiszek**. Wymagana jest ocena każdej pozostałej aktywnej karty i odłożenie jej po dzisiejszym dniu albo status `mastered`. Wyłączenie **wszystkich** pytań nie zalicza automatycznie ścieżki (wyjątkiem jest podsekcja rzeczywiście bez pytań). Prawidłowo przerobione fiszki odblokowują „Dalej — pytania (2 odpowiedzi)”; wyłączone pytania nie są trwale usuwane z treści ani zapisu ocen.

**Fiszki z całej sekcji są opcjonalne i niezależne.** Ich osobna kolejka używa wspólnego silnika `PortalStudyMode` w magazynie `ccna-unified-study-v1`, lecz z nowym zakresem `section-flashcards:<sectionId>` **i oddzielnymi identyfikatorami kart `section-flashcards:<sectionId>::<questionKey>`**. Sam zakres sesji nie wystarcza, ponieważ oceny w tym silniku zapisują się globalnie po identyfikatorze. Dzięki oddzielnym identyfikatorom oceny nie mieszają się z obowiązkowymi powtórkami podsekcji ani z opcjonalnym „Trybem nauki” sekcji. Poprzednie oceny podsekcji nie zaliczają tych fiszek; oceny w nich nie zaliczają podsekcji, nie wyłączają pytań z egzaminów ani nie resetują źródłowych kart. Zachowano nawigację i dotychczasowe zapisy obu trybów, bez migracji starych ocen. Wydanie aktualizuje URL adaptera i wersję cache offline.

W testach i egzaminach CCNA „Następne pytanie” oraz „Zakończ test” pozostają nieaktywne, dopóki użytkownik nie wybierze odpowiedzi na obecne pytanie. Sama funkcja przejścia także odrzuca pominięcie. Nadal działa świadome „Zakończ” oraz zakończenie egzaminu po upływie limitu czasu; nie przestawiono prawidłowych odpowiedzi ani identyfikatorów. Poprawiono polskie brzmienie zgłoszonych pytań o przewód krosowany, CSMA/CD i Auto MDI-X, zachowując angielskie terminy techniczne w objaśnieniach, oraz odświeżono wersję zasobu iframe i cache PWA.

**Test izolowany na dokładnym blobie zmienionego silnika:** 10/10 PASS, w tym 11 ocenionych kart i 1 manualnie wyłączona, nowa karta, spóźniona karta, komplet wyłączonych, karta opanowana oraz zaznaczona/niezaznaczona odpowiedź. Dodatkowy trwały test `tests/ccna-disabled-qualification.test.cjs` (9/9 testów wykonanych w izolowanym V8 ze źródłem pobranym bezpośrednio z `develop`, w tym osobny zakres fiszek i spójność PWA). To nie zastępuje pełnej regresji `npm run verify`, `npm run verify:full`, E2E urządzeń i kontroli wdrożonego SHA, dlatego zgłoszenia pozostają otwarte do odbioru na aktualnym Netlify.

## Widoczność wszystkich pytań — 01.11.2026 (kod `develop`)

**OBECNIE W KODZIE / WYDANIE I TESTY URUCHOMIENIOWE DO POTWIERDZENIA:** adapter `apps/ccna/question-pool-visibility.js`, ładowany **przed routerem**, przywraca wszystkie zwykłe i importowane karty `examQuestion:true` do istniejących pul fiszek, dwóch odpowiedzi, Trybu nauki, przeglądu, egzaminów podsekcji i całego kursu. Również podsekcje składające się wyłącznie z pytań importowanych nie są ukrywane. Adapter nie zmienia obiektów kart, historycznych ID, indeksów poprawnych odpowiedzi, źródeł, ocen ani kluczy postępu; nie duplikuje implementacji silnika nauki. `CCNA_QUESTION_POOL_VISIBILITY` udostępnia diagnostyczne liczby w ramce aplikacji. Zaktualizowano cache offline CCNA.

**Jedyny wyjątek:** pięć źródłowych pytań z quizu Jeremy's IT Lab Day 02, oznaczonych `videoQuiz:true`, pozostaje wyłącznie w `section-exam` sekcji `interfejsy-sieciowe-i-okablowanie`. Nie mogą trafić do fiszek, Trybu nauki, dwóch odpowiedzi, przeglądu pytań, egzaminów pojedynczych podsekcji ani całego kursu. Egzamin zbiorczy tej sekcji nadal zawiera 143 unikalne karty (138 pytań z sześciu podsekcji + 5 quizu), w tym pięć obowiązkowych pytań źródłowych.

**Umocowanie sekcji 1:** zachowane ręczne mapy i poprawki z 31.10.2026 obejmują sześć podsekcji: 33/33, 41/41, 12/12, 34/34, 12/12 i 6/6, razem **138/138** źródłowych kart i 42 bloki wyjaśnień. Zgłoszone wcześniej braki GBIC, SFP+ i błędne rozwinięcie SFP poprawiono już w poprzednich partiach; scenariusze quizu odpowiadają opisom doboru kabla, MMF, SMF, Auto MDI-X i Copper UTP w notatkach sekcji. **To wynik istniejącego audytu i kodowych map, a nie nowy potwierdzony audyt uruchomieniowy aktualnego SHA.** Nie dopisywano sztucznych odpowiedzi ani nie przenoszono pytań bez nowego powodu.

**Testy:** składnia i symulacja niezależnego adaptera w izolowanym JS: PASS. Dodano `tests/ccna-question-pool-visibility.test.cjs` sprawdzający bieżący bank, 138 kart w podsekcjach Day 02, pięć wyjątków, mapy notatek, sumę pul, zachowanie ID oraz kolejność ładowania. Natywny Node/JSDOM na pełnym repo, `npm run check:ccna`, `npm run verify`, test przeglądarkowy Netlify oraz publikacja aktualnego SHA: **NOT_RUN / DO POTWIERDZENIA** (bieżące środowisko nie ma pełnego checkoutu repo i dostępu do przeglądarki strony). Ten commit nie jest dowodem produkcyjnego wdrożenia.

## Poprawki zgłoszeń z 31.10.2026 (kod `develop`)

**WIE-161 — potwierdzone testowe wydanie Netlify (31.10.2026):** [dowód publikacji i zakres testów](./wiedora-evidence/WD-20261031-WIE-161-NETLIFY-RELEASE-02.md). Commit `cf3d803ec6c0c69863149c914c2551ea9940e29d`, Netlify deploy `6ae6379a149586d39d8cd49d`, gałąź `develop`, status `ready`; główny plik CCNA i zależności z niezmiennego wydania zwróciły HTTP 200. Na funkcjach dokładnego opublikowanego commita wykonano **100/100** symulacji losowania egzaminu Day 02, wszystkie pięć kart quizu zachowane jako obowiązkowe; źródłowe kontrole 8/8 i składnia JS PASS. `sw.js` jest network-first dla HTML/JS/CSS. **Nie przeprowadzono** pełnego Node/JSDOM, `npm run verify` ani interaktywnych kliknięć jako użytkownik (niedostępny browser connector). Status: **OPUBLIKOWANE I PRZETESTOWANE HTTP / IZOLACYJNIE; pełne E2E otwarte**, zgłoszeń nie zamykano.

**WIE-161 — separacja pytań egzaminacyjnych i schemat Gigabit Crossover (31.10.2026):** pytania OCG/JITL z `examQuestion:true` pozostają w danych podsekcji dla zachowania źródeł i ocen, ale są odfiltrowane z wszystkich pul nauki i egzaminów podsekcji. Trafiają tylko do `getSectionExamPool` właściwej sekcji; importowane-only działy mają dostępny egzamin zbiorczy bez pustego wymogu fiszek. Pytanie `anki-interfaces-cables-ocg-3017` ma samodzielne polecenie o czterech parach RJ-45, a jego notatka zawiera schemat pinów A→B. Pięć pytań quizu Day 02 pozostaje obowiązkowych w egzaminie działu i nie ma osobnego podglądu (łącznie 143 rekordy w puli); zachowano stan ocen przy walidacji kopii. Kod: `e622d3d564621fd501a89955d0f2e5696c6ae174`; test: `e0533b32be9a91b2d6b997960857805115db87ef`; izolowany V8 **13/13 PASS** i kompilacja inline JS **PASS**, natywny Node/JSDOM, pełna regresja, wydanie Netlify i rzeczywisty test przeglądarkowy **NOT_RUN**. **Status: develop bez odbioru live; nie zamykać zgłoszenia przed wdrożeniem i testem.**


**Dodatkowa partia WIE-161 — źródła i odniesienia (31.10.2026):** raporty `0f0976c3-dde2-4a08-bedc-b64cf1f19490`, `4784ff8a-08ca-4c2d-a071-883cc52b55a9`, `9bdb2ca0-e781-462b-93b7-dba4d8b46c4d`. Na trzech screenshotach z bazy zgłoszeń potwierdzono metakomentarz „Źródło dodatkowe:”, dopisek `[uzupełnienie: Official Cert Guide]` w nagłówku Crosstalk oraz frazę „pokazany w lekcji” w notatce o UTP. Adapter wyświetlania usuwa źródłowe dopiski i zachowuje objaśnienia techniczne, w tym definicję Crosstalk i liczbę par skrętki; dokumentacja wewnętrzna zachowuje informacje o źródłach. Wersja adaptera i cache PWA: `20261031-ccna-provenance-4` (obsługa metadanych `Materiał: <a ...>` i zwrotu „w tej lekcji”). W izolowanym V8 uruchomiono **11/11 callbacków testowych PASS** z `tests/ccna-confirmed-bugs.test.cjs`. Test natywny Node, pełne `verify:full` i weryfikacja przeglądarkowa wydanego SHA: **NOT_RUN**; nie zamykać zgłoszeń bez testu live.

**Dodatkowa partia WIE-161 (31.10.2026):** raport `dd245bcd-d886-472d-8f53-c69b036e5b8d` — z widoku głównego CCNA znika wyłącznie stary, dokładnie rozpoznany podpis „Jednoplikowa aplikacja… wersja 1.18.0”, bez usuwania innych informacji stopki. Raporty `227b3e2b-593e-44e1-b52a-bfef28ee2c9e` i `ea7942af-d3fc-456e-8167-6a8168cf2f1b` — metadane laboratorium (`lab`, `labAuditKey`) są usuwane z **każdej teoretycznej podsekcji** przy inicjalizacji widoku, z zachowaniem wszystkich wyodrębnionych podsekcji oznaczonych `lab` lub „laboratorium”. Dzięki temu teoretyczna podsekcja nie ma zakładki laboratorium ani wymogu ukończenia laboratorium przed egzaminem. Opis sekcji wyjaśnia oddzielenie. Czyszczenie notatek obejmuje także źródłowe `Źródło:` dopisane w środku wprowadzenia, bez usuwania właściwego celu nauki. Zmieniono wersję adaptera w `index.html` i Service Worker oraz dodano cztery testy do `tests/ccna-confirmed-bugs.test.cjs`. **Izolowane kontrole V8 9/9 callbacków testowych PASS (w tym odświeżenie bezpośredniego odnośnika po routerze); test natywny Node oraz rzeczywisty widok Netlify pozostają do wykonania.** Raporty w bazie pozostają aktywne do testu wdrożonego SHA.

W kartach podsekcji bez pytań nie wyświetla się etykieta „0 pytań”. Widok wszystkich notatek CCNA ukrywa metadane źródłowe, w tym akapity i podpisy „Źródło główne:”, „Źródło dodatkowe:”, „Źródła główne:”, „Uzupełnienia spoza filmu:”, „Materiał:” i „Podstawa:”, również gdy podpis jest częścią wprowadzenia. Ukrywane są znaczniki czasu filmu, natomiast wiedza techniczna, linki potrzebne do wykonania laboratoriów i materiały źródłowe w dokumentacji wewnętrznej pozostają zachowane. Zmiana została dodana do wspólnego adaptera widoku CCNA (`bug-fixes.js`) zamiast kopiowania treści lub zmiany identyfikatorów i postępów. Zgłoszenia: `c0767442-f81d-412c-81b6-94b8a199e54b`, `1335c3dd-ab8e-48d2-82a1-1e7b9f40a0b2`, `3ce891e3-c2fe-40f0-b1eb-82ed2861b120`, `9960caa7-94b3-4b9b-bdcc-47b9d9438102`. **Widok Netlify i pełna regresja: do potwierdzenia**, nie zamykać UUID bez testu właściwego wydania.

## Cel

Aplikacja ma przygotowywać użytkownika do CCNA zarówno przez materiał teoretyczny, pytania, jak i laboratoria.

## Dostęp w fazie budowy

**TYMCZASOWO (WIE-007):** wszystkie części, sekcje, fiszki, egzaminy i laboratoria CCNA można otwierać bez konta. Ograniczenie pierwszego rozdziału w `apps/shared/guest-access.js` jest zawieszone; `REQUIRE_LOGIN_FOR_LEARNING=false`. Nie zmienia to uprawnień serwerowych ani zasad dostępu do danych konta; synchronizacja z Supabase wymaga prawdziwego zalogowania. Po publikacji sprawdź deep-linki i wznawianie lokalnego postępu.

**Wyjątek testowy Day 02 — dostęp gościa (31.10.2026):** samodzielne `Connecting Devices — Packet Tracer Lab` jest dostępne bez konta w czasie tymczasowego trybu WIE-007. Stan gościa zapisuje się lokalnie pod osobnym kluczem `ccna-day02-connecting-devices-guest-v1`, bez synchronizacji konta. Zalogowany użytkownik nadal korzysta z `ccna-packet-labs-v1`; nie mieszać tych danych ani nie rozszerzać wyjątku na inne laboratoria. Test użytkownika: uruchomienie, ułożenie kabla, zapis po odświeżeniu, pełne 18/18 i błędny kabel. Komendy w notatkach przyszłych laboratoriów obowiązkowo dokumentować według [procedury CCNA](CCNA_CONTENT_FROM_VIDEO_WORKFLOW.md).

## Laboratoria

OBECNIE (WIE-195, 31.10.2026): blokada przypadkowego kliknięcia po przeciąganiu
urządzenia lub przesunięciu obszaru mapy dotyczy wyłącznie kliknięć wskaźnikiem.
Nie przechwytuje aktywacji przewodu lub koperty PDU przez Enter/Spację.
Usunięcie przewodu klawiaturą przywraca fokus topologii. Wygląd, klucze zapisów
i reguły dostępu pozostają te same. Test deterministyczny:
`tests/ccna-packet-lab-keyboard-after-drag.test.cjs`; scenariusz przeglądarkowy:
`apps/ccna/packet-lab/tests/browser-ethernet.cjs`.

Laboratoria mają możliwie wiernie odwzorowywać sposób pracy znany z Cisco Packet Tracer. Pierwsze laboratorium jest wzorcem dla jakości symulacji.

Symulator powinien obsługiwać urządzenia potrzebne do nauki CCNA, w tym routery, switche, punkty dostępowe i urządzenia bezpieczeństwa, a także połączenia przewodowe, przeciąganie elementów i panel konfiguracji.

Komendy powinny zachowywać się zgodnie z nomenklaturą Cisco. Typowe skróty CLI, np. „en” dla „enable”, powinny działać. Reset laboratorium wymaga potwierdzenia. Sama zmiana zakładki nie może resetować konfiguracji.

Urządzenie w laboratorium powinno zachowywać pełny przewidziany zestaw funkcji także wtedy, gdy dane ćwiczenie wykorzystuje tylko część z nich.

### Obowiązkowa zawartość notatki każdego przyszłego laboratorium

Od 31.10.2026 obowiązuje [stała zasada laboratoriów](CCNA_CONTENT_FROM_VIDEO_WORKFLOW.md): najpierw sprawdzić materiał źródłowy, następnie w **notatce danego laboratorium** wymienić **wszystkie faktycznie użyte komendy Cisco IOS lub hosta**, podać dokładną składnię, tryb, urządzenie, wyjaśnienie działania i sposób weryfikacji. **Pod wykazem** umieścić kompletną kolejność budowy topologii i konfiguracji wraz z warunkami zaliczenia, a **na samym końcu** sprawdzony plik `.pkt/.pka` do pobrania w Cisco Packet Tracer, jeśli jest dostępny z uprawnionego źródła; w przeciwnym razie wskazać ograniczenie i oficjalną stronę autora. Jeżeli film nie zawiera komend, zamiast ich wymyślania wpisać „Komendy Cisco IOS CLI: brak” i opisać faktycznie wykorzystywane narzędzia. Testy obejmują również wykonanie poleceń i scenariusz niepoprawnego rozwiązania. **Nie powtarzać audytu teorii przy zmianie samego laboratorium.**

## Pytania i powtórki

Aplikacja może korzystać z importowanych pytań Anki, w tym oznaczeń pytań egzaminacyjnych. Odpowiedzi w testach powinny być losowane w sposób, który nie zdradza poprawnej odpowiedzi przez stałą pozycję. Należy usuwać duplikaty pytań.

OBECNIE: kwalifikacyjna ścieżka podsekcji jest jednoznaczna: **Notatka → Fiszki → Pytania z dwiema odpowiedziami → Laboratorium (jeśli występuje) → Egzamin ABCD 80%**. Błędna odpowiedź w etapie dwuwariantowym pochodzi z tej samej podsekcji i jest dobierana tak, aby była tematycznie zbliżona. Tryb nauki jest osobną, zawsze dostępną i opcjonalną zakładką; jego uruchomienie, wynik ani ukończenie nie blokują etapów obowiązkowych. Kolejność zakładek podsekcji to Notatka, Fiszki, Pytania, opcjonalne Laboratorium, Egzamin i Tryb nauki.

Fiszki używają dotychczasowego mechanizmu kart `ccna-spaced-review-v1` i zachowują ich harmonogram oraz statusy. Tryb nauki używa wspólnego komponentu i zasad co Prawo i Oficerska (`docs/STUDY_MODE.md`) oraz przechowuje sesje w `ccna-unified-study-v1`, uwzględnionym w kopiach konta. Oceny wystawione w Trybie nauki nie zapisują postępu obowiązkowych fiszek i nie mogą odblokować laboratorium ani egzaminu. Domyślne samodzielne przypominanie można zmienić na dwie istniejące odpowiedzi; sesję można ograniczyć do 10/20/50 pytań, wznowić i cofnąć ostatnią ocenę.

Rozdzielenie obowiązuje także dla zakresu całej sekcji i całego CCNA: interfejs pokazuje osobne wejścia „Fiszki” oraz „Tryb nauki”. Adapter `apps/ccna/study-adapter.js` nie zmienia już etykiety fiszek. Starsze wyłączenia i statusy `manual/mastered` pozostają zachowane. Słownictwo angielskie ma własny zakres i nie dopisuje fikcyjnych kart do banku egzaminacyjnego.

Router używa `tryb=flashcards` dla fiszek i `tryb=study` dla Trybu nauki; podczas aktywnej sesji pozostaje parametr `study=1`. Stary link podsekcji `tryb=flashcards&study=1` jest odtwarzany jako Tryb nauki dla kompatybilności. Cache offline zawiera współdzielony styl i skrypty. Testy regresji: `tests/ccna-bug-reports.test.cjs` i `tests/study-mode.browser.cjs`.

HISTORYCZNIE (zmiana WIE-161 z 31.10.2026, zastąpiona adapterem z 01.11.2026): Importowane pytania certyfikacyjne oznaczone `examQuestion: true` były dostępne **wyłącznie w egzaminie zbiorczym swojej sekcji**. Nie trafiają do fiszek podsekcji/sekcji/kursu, opcjonalnego Trybu nauki, przeglądu pytań, testów z dwiema odpowiedziami, egzaminu pojedynczej podsekcji ani egzaminu końcowego całego CCNA. Zachowują oryginalne ID, `progressKey`, ocenę i nie są usuwane z danych źródłowych; sekcje składające się tylko z pytań certyfikacyjnych dopuszczają bezpośredni egzamin sekcji bez pustej bramki fiszek. Etykieta „Pytanie egzaminacyjne” widoczna jest nad poleceniem w egzaminie sekcji, nigdy jako część pytania. Krótkie hasła i skróty (np. GBIC, SFP, STP) są wyświetlane jako pełne polecenia („Rozwiń skrót GBIC.”); materiały z lukami mają instrukcję uzupełnienia. Dla niejednoznacznych wpisów zachowuje się techniczną treść źródła zamiast dopowiadać fakty.

Pole `questionEn` importu pozostaje oryginalne, a identyfikatory pytań, poprawne indeksy odpowiedzi i klucze postępu nie ulegają zmianie. Wyświetlane pole `question` przygotowuje `apps/ccna/data/terminology.js` po rozdzieleniu importu na tematy. Dla GBIC poprawna odpowiedź brzmi „Gigabit Interface Converter (GBIC)” zgodnie z terminologią Cisco.

Kontrola regresji: `node --test tests/ccna-course.test.cjs`, `npm run check:ccna`, `npm run verify`. Po wdrożeniu sprawdzić, że importowane GBIC i czteroparowy Gigabit Crossover są ponownie dostępne w fiszkach, Trybie nauki i egzaminach podsekcji oraz sekcji, a pięć pytań `videoQuiz:true` z Day 02 pozostaje wyłącznie w egzaminie zbiorczym właściwej sekcji. Zweryfikować dotychczasowe oceny w zapisach, pięć obowiązkowych pytań quizu Day 02, dział zawierający wyłącznie importowane pytania oraz egzamin końcowy CCNA.

## Audyt pytań i poprawki nauki — 24.10.2026

Pełny audyt obejmuje 3429 pytań w 127 podsekcjach. Cztery jednoznacznie przypisane do innego zagadnienia pytania przeniesiono bez zmiany ich ID: FCS do pól ramki Ethernet, dwa pytania ARP do mapowania IP–MAC, a rozwinięcie DSCP do notatki DSCP/ECN. Każda poprawna odpowiedź musi występować w notatce tej samej podsekcji; jeżeli właściwa notatka nie zawiera danego faktu, aplikacja dopisuje jawne, zwijane uzupełnienie powiązane z identyfikatorem pytania. Wynik audytu jest dostępny jako `window.CCNA_CONTENT_AUDIT`, a podsumowanie zapisano w `docs/audits/ccna-question-note-audit-2026-10-24.json`. Audyt wykazuje 399 pytań pokrytych przez istniejące notatki, 3030 jawnych uzupełnień, 0 pytań bez pokrycia, 0 pustych notatek, 0 zduplikowanych identyfikatorów i 0 błędnych indeksów odpowiedzi.

Karta o identyfikatorze `anki-interfaces-cables-ocg-6999` została skorygowana bez zmiany ID: pytanie dotyczy pól nagłówka Ethernet II, a odpowiedź wymienia docelowy MAC, źródłowy MAC i EtherType. Fiszka oznaczona negatywnie musi po poprawnej odpowiedzi wrócić na koniec bieżącej sesji i być zaplanowana najpóźniej na kolejną lokalną dobę; dopiero poprawna odpowiedź następnego dnia ustawia termin za dwa dni.

Egzaminy pokazują informację zwrotną od razu po wyborze: poprawna odpowiedź jest zielona, wybrana błędna czerwona, a poprawna przy błędzie — oliwkowa. Zaliczone podsekcje mają wyróżniony cały kafelek także w motywie granatowym. Wynik polecenia `ping` w laboratorium sieciowym pojawia się etapami podczas symulacji czasu rzeczywistego, zamiast dopiero po synchronicznym zakończeniu wszystkich prób.

## Kontrola pochodzenia laboratoriów (WIE-175, 31.10.2026)

**OBECNIE — narzędzie wewnętrzne, nieinteraktywne:** `scripts/ai/wiedora-source-adapters.cjs` zawiera `ccnaLabSourceRecords(catalog)` pobierający wyłącznie metadane z istniejącego `apps/ccna/data/jitl-labs.js`. Projekcja obejmuje **52** pozycje laboratoryjne, zachowuje oryginalne `key`, link do źródła `https://jitl.jp/ccna-files`, nie zmienia struktury, pytań, fiszek, identyfikatorów postępu ani zawartości labów. Status `SOURCED` oznacza wskazanie autora/źródła, a nie zgodę na kopiowanie plików, zweryfikowaną aktualność instrukcji Cisco lub potwierdzenie merytoryczne. Nie ma automatycznego `VERIFIED` i nie uzupełnia się wymyślonych dat recenzji, licencji lub wersji źródła (`UNVERSIONED`). W razie zamiany domeny, identyfikatorów lub duplikatów adapter wymaga ponownego przeglądu. Test: `tests/wiedora-ccna-source-adapter.test.cjs`, w izolowanym V8 **2/2 PASS**; pełne `node --test`, `verify:full` i odbiór UI wymagają osobnej sesji Codex/Work. Pytania importowane `jitl/ocg` pozostają poza tą wąską projekcją, a ich podstawa licencyjna i recenzenci Q09 są nadal otwarci.

## Terminologia i język

Opisy mogą być po polsku, natomiast techniczne nazwy i komendy powinny zachowywać oficjalną terminologię CCNA/Cisco. Wersja angielska powinna używać fachowego słownictwa sieciowego.

## Asystent AI

Jeżeli w aplikacji dostępny jest asystent AI, zmiany w innych częściach aplikacji nie powinny naruszać jego integracji. Jego działanie trzeba weryfikować osobno po zmianach dotyczących wspólnych usług.

## Zasada aktualizacji dokumentu

Zmiana laboratoriów, urządzeń, CLI, testów, powtórek, struktury kursu, tłumaczeń lub asystenta wymaga aktualizacji tego dokumentu w tym samym zadaniu.

## Audyt migracji (08.10.2026)

Naprawiono oznaczanie `examQuestion` we wszystkich pytaniach ze źródeł `jitl` i `ocg`, także w tematach bez osobnej teorii oraz w już opracowanych lekcjach. Etykieta pozostaje oddzielona od polecenia również dla starszych pytań bez `questionEn`.

Scalanie nie usuwa kart o różnych identyfikatorach na podstawie podobieństwa słów lub wspólnej odpowiedzi. Zachowano wcześniejsze, jawne aliasy postępu dla 120 duplikatów Day 19–24. Przywrócono 26 kart traconych przez późniejsze scalanie i zachowano wszystkie 3429 kart występujących przed tym etapem. Nowe testy kontrolują każdy identyfikator, `questionEn`, indeks odpowiedzi, jawny `progressKey` i dostępność celów aliasów. Cache offline otrzymał nową wersję.

## Zgłoszenia CCNA — 17.10.2026 (develop)

OBECNIE w kodzie: karty sekcji kursu mają widoczną numerację `1.`, `2.` itd., a zwykłe podsekcje numerację `1.1.`, `1.2.` itd. Egzaminy sekcji pozostają oddzielnymi kartami bez numerowania jako podsekcje. Identyfikatory, pytania i postępy nie zmieniają się.

Na poziomie `/apps/ccna/kurs/` pojawia się osobna karta **Laboratorium**. `/apps/ccna/laboratoria/` pokazuje istniejące laboratoria według kolejności sekcji i podsekcji. Kliknięcie otwiera to samo ćwiczenie przez dotychczasowe `renderSubsection()` i trasę tematu, bez klonowania treści ani postępu.

Motyw szary w CCNA ma wyraźniejsze odcięcie od białego; dotyczy tylko CCNA. Wspólny arkusz styli uzupełniono o pary kolorów tekstu i tła tabel `.note-table`, aby tekst komórek w trybie granatowym nie znikał na jasnym tle. Test: `node --test tests/ccna-bug-reports.test.cjs`. Sama zmiana kodu na GitHub nie dowodzi wydania na Netlify. Do zamknięcia raportów konieczne jest sprawdzenie opublikowanego SHA.

Weryfikacja 18.10.2026: usunięto zdublowane wejście do laboratoriów dodawane przez skrypt ramki. Katalog ma jedno wejście, zachowuje oryginalne ćwiczenia i ich postępy. Regresja: `tests/ccna-wrapper-regression.test.cjs`.

## Zgłoszenie z 20.10.2026 — kod develop

Z notatek każdej podsekcji usunięto nadmiarowy blok „Wykonaj laboratorium w przeglądarce”. Istniejąca zakładka „Laboratorium sieciowe” i symulator pozostają dostępne. Niepoprawnie wskazana odpowiedź w pytaniu z natychmiastową informacją zwrotną ma mocniejsze czerwone tło, ramkę i znacznik ✕, bez zmiany logiki oceniania ani struktury pytań. Wymagane potwierdzenie w opublikowanym SHA develop.

## Wydanie poprawki panelu na develop — 20.10.2026

Sam commit usuwający panel z `packet-lab/integration.js` nie uruchomił wdrożenia, ponieważ `scripts/netlify-batch-gate.cjs` wymaga znacznika wydania `[publish-netlify]` na końcu tematu commita. Obecne wydanie odświeża jawnie wersję skryptu oraz pliku `legacy.html`, synchronizuje cache offline i dodaje nagłówki wymuszające ponowną walidację tych zasobów. Test sprawdza, że widok notatki nie zawiera nadmiarowej karty, zachowuje jedną zakładkę laboratorium, a wersje adresów zgadzają się z cache. Wdrożenie dotyczy wyłącznie `develop`; `main` pozostaje bez zmian. Weryfikacja działania publicznego wymaga potwierdzenia `build-info.json` na Netlify.

## Tabele kursu na telefonie (22.10.2026 — develop)

Zgłoszenie `d2eb9257-3f86-4262-85f7-1a468750c84a`. Tabele renderowane w module CCNA są obejmowane dostępny z klawiatury obszarem przewijania poziomego (`ccna-table-scroll`). Na ekranach do 700 px szerokości utrzymują czytelne kolumny i można je przesuwać palcem zamiast ucinać zawartość lub wymuszać przewijanie całej strony. Zmiana nie modyfikuje danych kursu. Wspólny obserwator obejmuje ponowne renderowanie notatek. Wersję skryptu i cache offline zaktualizowano. Kontrola kodu nie zastępuje testu na fizycznym telefonie ani wdrożenia Netlify.

## Zgłoszenie kontrastu kart — 23.10.2026 (kod develop)

`fca80c19-1c20-4898-8762-0d66a715ce7a`: dodano nadpisanie stylu wskazanego jasnego obszaru w trybie ciemnym tak, aby tło, tekst, linki oraz pola formularza miały kontrast. Utrzymano istniejące tabele mobilne z poprzedniego pakietu. Skrypt jest wersjonowany jako `bug-fixes.js?v=20261023-contrast-1` i uwzględniony w `sw.js`. Wymagana ocena rzeczywistych trzech motywów w przeglądarce, w tym sprawdzenie innej zagnieżdżonej zawartości; bez niej nie potwierdzamy zgłoszenia jako fixed.

Audyt 24.10.2026: test CCNA dotyczący przewijanych tabel porównuje odtąd aktywny identyfikator wersji `bug-fixes.js` z manifestem offline, zamiast wymagać starej wersji; nie zmieniano danych pytań ani ścieżki nauki.


Dokończenie 25.10.2026: odzyskiwanie fiszek obejmuje również stare rekordy ocenione negatywnie dziś lub wczoraj, z zachowaniem lokalnych dat i zmiany czasu. Ręcznie wyłączone i historycznie opanowane rekordy nie są migrowane do aktywnej powtórki. Dobór dwóch odpowiedzi pomija warianty różniące się wyłącznie wielkością liter, odstępami lub końcową kropką, zachowując symbole znaczące dla CLI, np. `>` i `#`. Kontrola obejmuje całą pulę 3429 pytań, bez zmiany ich identyfikatorów.

## Adres kanoniczny (WIE-008)

OBECNIE: router utrzymuje canonical oraz `og:url` pod `https://constant-app.netlify.app`, także po uruchomieniu JavaScript na develop i podglądach. Zmiana nie odblokowuje indeksowania ani nie zmienia ścieżek i postępów. Router `20261030-targets-1` i generacja cache offline `20261030-stage00-v2` są odświeżone razem. Test: `tests/route-canonical.test.cjs`; publikacja i kontrola live pozostają oddzielne.


## Klawiatura w Packet Lab (WIE-195)

OBECNIE: wybierz przyciskiem model urządzenia, przejdź Tab do topologii i naciśnij Enter lub spację. Nowe urządzenie pojawia się na środku, otrzymuje fokus i można przesuwać je strzałkami. Enter/spacja aktywują również przewody i kopertę PDU; usunięcie przewodu oddaje fokus topologii. Dotychczasowe przeciąganie, łączenie portów i konfiguracja pozostają dostępne. Test Chromium `apps/ccna/packet-lab/tests/browser-ethernet.cjs` sprawdza klawiaturę oraz dotychczasowy scenariusz 15/15, zapis/odczyt i widoki mobilne. To lokalny test; czytnik ekranu i instalowana PWA wymagają osobnej kontroli.


## WIE-008 — walidacja celów głębokich adresów (30.10.2026)

WIEDORA-CHANGE: `WD-20261030-WIE-008-TARGETS-01`; Codex / GPT-6 (pełna wersja nieustalona). Router sprawdza istnienie części, sekcji i tematu w danych ramki. Temat musi należeć do wskazanej sekcji i mieć typ tematu nauki. Nieistniejący lub niepełny adres wraca do istniejącego katalogu CCNA, zastępując błędny wpis historii i canonical adresem korzenia. Nie zmienia postępów ani układu kursu. Przy niegotowym API danych ramki router czeka na inicjalizację, zamiast odrzucać poprawną zakładkę. Poprawne adresy zachowują tryb nauki.

Test zachowania: `tests/ccna-route-targets.test.cjs` (8 błędnych adresów, 4 prawidłowe i inicjalizacja danych). Wyniki, ograniczenia i publikacja: [raport WIE-008](./wiedora-evidence/WD-20261030-WIE-008-TARGETS-01.md). Odpowiedź HTTP powłoki SPA pozostaje 200; powrót do katalogu odbywa się w przeglądarce i nie jest serwerowym 404.

Wydanie naprawy WIE-008: `432f8ff` (develop, 30.10.2026); publiczna kontrola błędnego celu oraz temat → reload → Back ×2 potwierdzona. `verify:full` 847 Node PASS, 0 FAIL/SKIP; offline reopen 4/4. Wcześniejsze timeouty testowe opisano w raporcie.

## Lokalne testy laboratoriów — przygotowanie profilu (31.10.2026)

WIE-005: `browser-learner-fixture.cjs` przygotowuje ukończone wymagania
przed pierwszym odczytem postępu zarówno przez stronę nadrzędną CCNA,
jak i ramkę legacy. Zachowuje pozostały postęp i omija inne aplikacje.
Test deterministyczny: `tests/ccna-browser-learner-fixture.test.cjs`
(RED 1 FAIL / 2 PASS → GREEN 3 PASS). Nie zmieniono wymagań nauki,
autoryzacji ani kodu aplikacji. Przypadek wykryto przy nieregularnym
timeoucie wejścia do laboratorium podczas pełnej regresji; wynik
ponownej pełnej weryfikacji będzie zapisany w dowodzie WIE-005.

## Day 02 — zakres podsekcji 1.1 (31.10.2026, develop)

**OBECNIE w kodzie:** pierwsza sekcja ma angielską nazwę **Interfaces, Cabling and Device Connections**; identyfikator `interfejsy-sieciowe-i-okablowanie` nie uległ zmianie. Podsekcja `ethernet-standardy-i-predkosc` zachowuje ID i polski opis, a jej notatkę dostosowano do lekcji Jeremy's IT Lab *Interfaces and Cables — Day 2* (00:00–09:11): Ethernet/IEEE 802.3, Network Interface i RJ-45, bit vs Byte, bps/MB/s, 10BASE-T, 100BASE-TX, 1000BASE-T, 10GBASE-T i ich odpowiadające standardy IEEE. Polskie wyjaśnienia zachowują angielskie nazwy techniczne.

Przed korektą 1.1 miała **7 pytań własnych i 19 zaimportowanych = 26**, w tym **9 pytań spoza zakresu** (światłowody, pola ramki i adresy MAC; jedna karta FCS była już wcześniej przenoszona do właściwego tematu). Dodano **4 nowe pytania** z treści filmu i wydzielono **22 właściwe pytania zaimportowane** w tym **12 wcześniej kierowanych do 1.2**. Docelowy zbiór 1.1 to **33 pytania/fiszki: 11 własnych + 22 z importu**, bez pytań o pinout, Auto MDI-X, światłowody, MAC lub pola ramki. Pytania importowane są kierowane do tematów przez jawny zakres Day 02 (zamiast przez dopasowanie do długości notatki); pozostałe materiały nie są usuwane, a oryginalne ID i klucze postępu pozostają bez zmian. Tytuł sekcji zmieniono bez zmiany tras.

W podsekcji 1.1 **nie ma laboratorium**, a inicjalizacja usuwa ewentualne metadane laboratorium wyłącznie z tego tematu. Laboratorium połączeń urządzeń pozostaje w osobnej podsekcji `topologia-laboratorium`. Brak zakładki Laboratorium w 1.1 nie wpływa na ścieżkę zaliczenia pozostałych podsekcji.

**Kontrola:** sprawdzić w uruchomionej aplikacji 33 pytania/fiszki w 1.1, brak zakładki Laboratorium, 4 nowe pytania, rozdział 10BASE/100BASE/Gigabit/10G, brak pytań o SFP/MAC/FCS oraz zachowanie postępu dotychczasowych kart. Nie utożsamiać commita z wydaniem Netlify; masterplan pozostaje nietknięty.

## Day 02 — podsekcja 1.2, pary UTP i przypisanie pytań (31.10.2026, develop)

**OBECNIE — wyłącznie treści CCNA, niezależnie od masterplanu:** podsekcja `skretka-utp-i-przewody` ma nazwę `UTP Twisted-Pair Cabling, Pinouts and Cable Types`, bez zmiany identyfikatora, tras ani kluczy postępu. Notatka została rozszerzona w oparciu o Jeremy's IT Lab *Interfaces and Cables — Day 2* (09:11–20:24). Wyjaśnia po polsku UTP (4 pary / 8 żył), EMI, piny RJ-45, Tx/Rx dla PC/Router/Firewall/Switch, 2 pary 10/100, 4 dwukierunkowe pary 1000/10GBASE-T, Full-Duplex, Straight-Through i Crossover oraz dobór w starszym 10/100 bez Auto MDI-X. Oficjalne nazewnictwo pozostaje po angielsku. Crosstalk, Half-Duplex, CSMA/CD i czteroparowy Gigabit Crossover są jawnie oznaczone jako uzupełnienia z pytań Official Cert Guide, a nie fakty wprost omówione na filmie.

**Audyt zakresu przed zmianą:** w 1.2 znajdowało się 11 pytań lokalnych i 26 importowanych, łącznie **37**; spośród tych importowanych **4 pytania były poza tematem** (LAN vs WAN, IEEE 802.11, hub/OSI L1, switch/OSI L2). Zostały przeniesione do istniejących odpowiednich podsekcji standardów sieciowych i modelu OSI. Do 1.2 przeniesiono **8 pytań importowanych** wcześniej skierowanych do podsekcji Auto MDI-X lub doboru połączeń, lecz odnoszących się do rodzaju przewodu, połączeń Tx/Rx i pinout. Dodano **4 nowe pytania** (Rx PC, Tx routera, dwukierunkowość par 1000BASE-T, dodatkowe pary 4–5 i 7–8).

**Wynik po późniejszej korekcie 1.3 (31.10.2026):** 1.2 = **43 pytania/fiszki (15 lokalnych + 28 importowanych)**; 1.1 = **33 (11 lokalnych + 22 importowane)**. Bezpośrednio po etapie 1.2 było 45 kart, jednak dwa pytania zawierające warunek „Auto MDI-X disabled” przeniesiono następnie do właściwego tematu 1.3. Żadne pytanie importowane z puli Day 2 nie pozostaje bez rozstrzygniętego przypisania: 88/88. Każdy temat ma tekstową notatkę pokrywającą zagadnienia z jego pytań, a automatyczny dodatek z dokładnym brzmieniem odpowiedzi pozostaje zabezpieczeniem dla specyficznych sformułowań kart. Pytania o światłowody, Auto MDI-X, MAC i Ethernet frames pozostają w odrębnych sekcjach; nic nie zostało skasowane.

**Naprawa kolizji ID po poprzedniej edycji 1.1:** cztery nowo dodane tam pytania miały identyfikatory `io-08`–`io-11` istniejące już w 1.2. Ich ID w 1.1 zmieniono na `io-ethernet-08`–`io-ethernet-11`; historyczne identyfikatory `io-08`–`io-11` w 1.2 pozostają bez zmian, chroniąc dotychczasowy postęp. Nazwy pozostałych podsekcji i silnik nauki nie zostały zmodyfikowane.

**Laboratorium:** podsekcje 1.1 i 1.2 nie mają przypisanego laboratorium ani dodatkowej obowiązkowej zakładki `Laboratorium`. Laboratoria w osobnych podsekcjach, w tym `topologia-laboratorium`, pozostają nienaruszone. Cały masterplan (w tym etap 00) pozostał bez zmian.

**Weryfikacja:** kontrola składni inline JS w izolowanym V8: PASS; kontrola mapowania źródłowych 88 ID, zakresów pytań, poprawnych opcji i unikalności ID między 1.1/1.2: PASS. Dodano regresję `tests/ccna-day02-content-scope.test.cjs` (5 scenariuszy do uruchomienia w środowisku Node/JSDOM po rozszerzeniu o Auto MDI-X). **Node `npm run verify`, test przeglądarkowy i wdrożenie Netlify: NIEURUCHOMIONE** — nie wolno interpretować statycznych testów jako odbioru działającego deploymentu. Zmiana wyłącznie na `develop`.

## Day 02 — 1.3 Auto MDI-X: treść, pytania i fiszki (31.10.2026, develop)

**OBECNIE w kodzie, tylko treść CCNA:** podsekcja `auto-mdix` zachowuje oryginalny identyfikator i angielską nazwę **Auto MDI-X**. Rozbudowano notatkę w języku polskim, zachowując angielskie terminy MDI, MDI-X, Tx/Rx, Straight-Through Cable, Crossover Cable, link up/down, Full-Duplex oraz Autonegotiation. Obejmuje klasyczne przypisanie par 10/100BASE-TX, mechanizm automatycznego dopasowania, warianty ON/OFF i scenariusze Router–Switch, Switch–Switch, PC–PC. Materiał z lekcji [Jeremy's IT Lab — Day 2](https://www.youtube.com/watch?v=ieTH5lVhNaY) (18:08–19:16) oddzielono od uzupełnienia z [dokumentacji Cisco Auto-MDIX](https://www.cisco.com/c/en/us/td/docs/IIOT/switches/ie35xx/sw-config-guide/26-1-1/ie3500-262x-cg/configuring_auto_mdix.html) o kompatybilność jednej strony i zależności od implementacji sprzętowej.

**Audyt:** przed zmianą 1.3 miała **6 pytań (4 lokalne + 2 importowane)**. Wszystkie dotychczasowe pytania są związane z Auto MDI-X, więc nie usuwano ich ani nie przenoszono poza temat. Z 1.2 przeniesiono **2 importowane** pytania o dobór Straight-Through/Crossover przy wyłączonym Auto MDI-X (`anki-interfaces-cables-jitl-1571561771477`, `anki-interfaces-cables-jitl-1571561828565`). Z podsekcji 1.5 przeniesiono pytanie `lu-01` o założenie OFF, redagując jego treść tak, aby nie odnosiło się do nieistniejącego w 1.3 laboratorium. Dodano **3 nowe** pytania o przypisanie MDI/MDI-X, wymóg aktywacji funkcji na obu końcach i zachowanie dwóch Switchy bez Auto MDI-X. Historyczne ID oraz klucze postępów przeniesionych kart nie zostały zmienione.

**Stan logiczny po uruchomieniu kursu:** 1.1 = **33 pytania**, 1.2 = **43 pytania**, 1.3 = **12 pytań (8 lokalnych + 4 importowane)**; 1.5 = **6 pytań lokalnych**. Wszystkie 88 oryginalnych kart Anki dla Day 2 zachowują przypisanie do zakresów tematycznych, a niefortunne dopasowania nie są uzależnione od długości notatki. Notatka 1.3 zawiera omówienie wszystkich typów pytań należących do 1.3; dodatkowy mechanizm powiązania dokładnych odpowiedzi z ID w `CCNA_CONTENT_AUDIT` nadal pozostaje bez zmian. W 1.3 nie ma przypisanego laboratorium ani obowiązkowego etapu Laboratory; pozostałe laboratoria zachowano.

**Weryfikacja:** składnia inline JS PASS w izolowanym V8, zachowanie 88 importowanych ID, unikalność ID lokalnych, poprawność odpowiedzi, zakres notatki i mapowanie 33/43/12/6 w statycznym audycie PASS. `tests/ccna-day02-content-scope.test.cjs` zawiera teraz 5 scenariuszy regresji. **`node --test`, `npm run verify`, test w przeglądarce i odbiór Netlify: NOT_RUN** — wymagają środowiska uruchomieniowego. Nie modyfikowano masterplanu, etapu 00, gałęzi main ani innych aplikacji.

## Day 02 — 1.4 Fiber-Optic Cable, SFP, MMF i SMF (31.10.2026, develop)


**Audyt umocowania 1.4 z 31.10.2026 (bez modyfikacji aplikacji):** [szczegółowy raport 34 pytań](./audits/ccna-1-4-grounding-audit-2026-10-31.md). Na aktualnym źródle `develop` rozpoznano 14 lokalnych i 20 importowanych kart; 32/34 zagadnień jest opisanych w głównej notatce, brak objaśnień GBIC i SFP+, a import `anki-interfaces-cables-ocg-2010` podaje błędne rozwinięcie SFP. Importy opisujące zasięgi jako ogólne 'maximum' należy odróżnić od przykładów z Day 02, zwłaszcza 10GBASE-ER 30 km wobec 40 km w dokumentacji Cisco. Nadal brak ręcznej mapy 34 ID do części notatki oraz testu jej pokrycia, więc 1.4 nie jest ukończona. Brak testów Node/przeglądarki/Netlify w tej partii; nie modyfikowano ID, postępów ani treści aplikacji.


**OBECNIE w kodzie, wyłącznie materiały kursu:** podsekcja `swiatlowod-i-transceivery` zachowuje dotychczasowe ID, trasę, wszystkie osiem lokalnych pytań `io-23`–`io-30` i klucze postępu. Jej notatka została rozwinięta na podstawie przekazanego opracowania filmu Jeremy's IT Lab *Interfaces and Cables — Day 2*, zakres 20:24–28:02 oraz sytuacyjne pytania quizu 28:02–35:10. Polskie objaśnienia zachowują angielskie nazwy standardów i technologii.

Notatka wyjaśnia Fiber-Optic Cable oraz SFP (Small Form-Factor Pluggable), przykładowe dwa tory Tx/Rx, warstwy Core → Cladding → Protective Buffer → Outer Jacket, różnice Multimode Fiber (MMF) i Single-Mode Fiber (SMF), porównanie Copper UTP z Fiber-Optic pod kątem EMI, kosztu i odległości oraz standardy IEEE 802.3z i 802.3ae: 1000BASE-LX, 10GBASE-SR, 10GBASE-LR, 10GBASE-ER. Zasięgi 550 m / 5 km / 400 m / 10 km / 30 km są wyraźnie opisane jako wartości przywołane w filmie, nie uniwersalne gwarancje. Przykłady z quizu wskazują MMF dla 150 m, SMF dla około 3 km oraz UTP dla wielu PC na jednym piętrze. Dwa pozostałe scenariusze quizu o rodzaju przewodu i Auto MDI-X pozostają w odpowiadających im podsekcjach.

**Pytania:** dodano 9 własnych kart `fiber-day02-01`–`fiber-day02-09` o medium optycznym, warstwach włókna, duplex Tx/Rx, odległościach 150 m i 3 km, biurowym UTP, 10GBASE-ER, IEEE 802.3z i rozwinięciu SFP. Po późniejszym przeniesieniu trzech scenariuszy quizowych do 1.6, w 1.4 jest teraz **14 pytań własnych** plus dotychczasowe pytania importowane; nie zmieniono ich identyfikatorów ani mechanizmu przypisania. Nie zmieniono laboratoriów, silnika nauki, numeracji podsekcji, innych aplikacji, masterplanu, etapu 00 ani gałęzi `main`.

**Weryfikacja:** struktura podsekcji jako JSON, unikalność 17 lokalnych identyfikatorów, zgodność poprawnych odpowiedzi z wariantami i obecność zagadnień w notatce: PASS w izolowanym V8 przy przygotowaniu commita. Do `tests/ccna-day02-content-scope.test.cjs` dodano scenariusz sprawdzający 1.4, komplet starych ID i dziewięć nowych pytań; sam zapis testu nie oznacza jego uruchomienia. **`node --test`, `npm run verify`, test przeglądarkowy i Netlify: NOT_RUN** w tej sesji. Zgodnie z zasadą zbiorczych publikacji nie uruchamiano deploymentu.

## Day 02 — podsekcja 1.5: Choosing Cables Between Network Devices (31.10.2026, develop)

**OBECNIE w kodzie, wyłącznie zawartość CCNA:** podsekcja `zasady-doboru-polaczen` ma angielski tytuł **Choosing Cables Between Network Devices**, bez zmiany identyfikatora, tras i zasad zapisywania postępu. Notatkę rozszerzono na podstawie przekazanego opracowania Jeremy's IT Lab *Interfaces and Cables — Day 2* (14:08–18:08), z odwołaniem do Auto MDI-X (18:08–19:16) oraz pierwszego scenariusza z quizu (28:02–35:10). Objaśnienia pozostają po polsku, a nazwy techniczne po angielsku.

Notatka wyjaśnia klasyczne role **MDI i MDI-X**, piny Tx/Rx dla PC, Server, Router, Firewall i Switch, schematy Straight-Through (1→1, 2→2) i Crossover (1→3, 2→6), tabelę ośmiu typów połączeń oraz dobór kabla przy **Auto MDI-X OFF**. Wyraźnie odróżnia klasyczną regułę 10/100BASE-TX od współczesnych portów z Auto MDI-X i od 1000/10GBASE-T. Przykład z quizu dotyczy dwóch starszych Routerów wymagających Crossover. Szczegółowa budowa przewodów i pinout pozostają w 1.2, a mechanizm Auto MDI-X w 1.3.

**Pytania i fiszki:** wszystkie **6** pytań własnych `lu-02`–`lu-07` pozostaje bez zmian. Dodano **5** pytań `cables-day02-01`–`cables-day02-05` dotyczących połączeń PC–Router, Firewall–Switch, PC–PC, MDI ↔ MDI-X i scenariusza z quizu. Dwa importowane pytania `anki-interfaces-cables-ocg-2013` i `anki-interfaces-cables-ocg-2015`, dotyczące **wyboru** Crossover/Straight-Through, przeniesiono z 1.2 do 1.5 z zachowaniem ID, oryginalnej angielskiej treści `questionEn` i istniejących postępów. Pytania o budowę przewodu, rodzaje kabli oraz pinout pozostają w 1.2. Oczekiwany zestaw po runtime: **1.2 = 41 kart (15 lokalnych + 26 importowanych); 1.5 = 13 kart (11 lokalnych + 2 importowane)**. Wszystkie 88 kart źródłowych Day 02 pozostaje w kursie.

**Laboratorium:** 1.5 jest podsekcją wyłącznie teoretyczną, bez `lab`, `labAuditKey` i zakładki Laboratory; po mapowaniu laboratoriów kod usuwa ewentualne automatyczne przypisanie do 1.5. **Aktualizacja po 1.6:** `topologia-laboratorium` usunięto z bieżącej listy tematów, a jego pełną treść i pytania zachowano w `apps/ccna/data/archived/day02-topology-and-out-of-scope-questions.json`; adapter Day 01/02 nie przywraca laboratoriów do rozdziału teoretycznego. Nie zmieniano ani innych laboratoriów, ani masterplanu, etapu 00, pozostałych aplikacji i gałęzi `main`.

**Kontrola:** skontrolowano zachowanie sześciu historycznych ID, pięć nowych kart ABCD (kompletne warianty i prawidłowa odpowiedź), składnię inline JavaScript oraz jawne mapowanie dwóch kart importowanych; w `tests/ccna-day02-content-scope.test.cjs` dodano test 1.5, skorygowano liczności 1.2 i zabezpieczono odrębne laboratorium. **Pełne `node --test`, `npm run verify`, JSDOM, test przeglądarkowy i Netlify: NOT_RUN** — wymagają uruchamialnego środowiska i osobnej weryfikacji. Brak publikacji na Netlify.

## Day 02 — 1.6 Selecting Transmission Media by Distance (31.10.2026, develop)

**OBECNIE w kodzie:** usunięto całą dawną podsekcję 1.6 `topologia-laboratorium` z rozdziału teoretycznego, a dawną 1.7 `dobor-medium-do-odleglosci` przesunięto na pozycję **1.6** bez zmiany jej trwałego ID. Nowy tytuł to **Selecting Transmission Media by Distance**. Cały nowy tekst powstał na podstawie dostarczonej notatki `CCNA_Dzien_02_Interfaces_and_Cables_PL.docx` z filmu [Jeremy's IT Lab — Interfaces and Cables (Day 02)](https://www.youtube.com/watch?v=ieTH5lVhNaY), zwłaszcza [20:24–28:02] oraz [28:02–35:10]. Wyjaśnienia są po polsku, a nazwy technologii i tytuł po angielsku.

**Treść notatki:** porównanie Copper UTP (typowo do 100 m w tabeli z filmu), Fiber-Optic, EMI, kosztu, SFP, Multimode Fiber (MMF) i Single-Mode Fiber (SMF). Trzy scenariusze z quizu: wiele PC na jednym piętrze → **UTP**; dwa Switche 150 m → **MMF**; dwa biura 3 km → **SMF**, zgodnie z warunkami filmu. Wartości zasięgów są przykładami lekcji, a nie bezwarunkową specyfikacją wszystkich transceiverów. Specyficzne zadania typu R1–R2 50 m i R3–R4 250 m nie pojawiają się w filmie i nie są prezentowane jako materiał wideo.

**Bank pytań:** z historycznych 7 pytań dawniej w 1.7 pozostawiono `lu-17` (ogólna odpowiedź o połączeniu 3 km, poparta filmem). Trzy pytania sytuacyjne `fiber-day02-04`, `fiber-day02-05`, `fiber-day02-06` zostały **przeniesione z 1.4** bez zmiany ID. Dodano pięć nowych `medium-day02-01`–`medium-day02-05`. Łącznie **9 pytań lokalnych w 1.6**; 1.4 zawiera po przeniesieniu **14 lokalnych + 20 importowanych = 34**. Źródłowa pula 88 importowanych kart Day 02 i ich ID pozostaje zachowana.

**Kolejka przenosin:** sześć pytań z dawnej 1.6 `lu-08`–`lu-13` oraz sześć niepopartych zakresem filmu pytań z dawnej 1.7 (`lu-14`, `lu-15`, `lu-16`, `lu-18`, `lu-19`, `lu-20`) zapisano przed usunięciem z aplikacji w `apps/ccna/data/archived/day02-topology-and-out-of-scope-questions.json`. Pełen obiekt usuniętego laboratorium, instrukcje, scenariusze, odpowiedzi i ID są w archiwum. Plik **nie jest automatycznie importowany**; materiały czekają na przyszły osobny moduł ćwiczeń lub świadome przypisanie do innego rozdziału.

**Laboratoria:** w `apps/ccna/data/jitl-labs.js` obie pozycje laboratoriów Day 01 i Day 02 zachowują metadane źródłowe, ale ich automatyczne wstawianie do teoretycznego rozdziału `interfejsy-sieciowe-i-okablowanie` jest odroczone. **Nie ma laboratoryjnych podsekcji 1.6 ani automatycznie przywracanego `topologia-laboratorium`.** Pozostałe laboratoria i mechanika Packet Lab poza tym rozdziałem nie były zmieniane.

**Testy i wdrożenie:** dodano scenariusze regresji w `tests/ccna-day02-content-scope.test.cjs` dla numeracji, zakresu notatki, przenosin pytań, archiwum i braku automatycznego odtwarzania laboratoriów. Składnia inline JavaScript: PASS. Pełne `node --test`, `npm run verify` oraz test w przeglądarce/Netlify: **NOT_RUN** w tej sesji, nie należy utożsamiać zapisu na `develop` z publikacją.

**Procedura na następne tematy:** obowiązkowo [CCNA_CONTENT_FROM_VIDEO_WORKFLOW.md](CCNA_CONTENT_FROM_VIDEO_WORKFLOW.md), niezależnie od tego, w którym oknie czatu prowadzona jest praca.


## Day 02 — 1.1: jedna notatka na zagadnienie, bez automatycznych dopisków (31.10.2026)

**OBECNIE w kodzie develop po zmianie:** `ethernet-standardy-i-predkosc` zachowuje 33 pytań/fiszek i wszystkie ID oraz reguły włączania do egzaminu podsekcji i sekcji. Notatkę przebudowano w 9 spójnych częściach: Network Interface/RJ-45, Ethernet/IEEE, bps, bit–Byte, przedrostki dziesiętne, konwersja Mbps→MB/s, tabela czterech Copper Ethernet standards, odczytywanie BASE/T i limit 100 m. Każda grupa pytań ma **jedno merytoryczne objaśnienie**, nie powtarzalną listę odpowiedzi.

Podstawą jest notatka z filmu Jeremy's IT Lab Day 02, głównie 00:00–09:11; osiem pozycji RJ-45 omówiono w materiale 09:11–10:35. Z talii JITL pochodzi dodatkowa data 1983, jawnie oddzielona od źródła filmowego. Rachunki konwersji wynikają z definicji. Nie dodano nowych pytań ani nie zmieniono ich postępów.

**Zmiana walidacji:** dla 1.1 `CCNA_CONTENT_AUDIT` uznaje ręcznie opracowaną, oznaczoną tematyką narrację `data-ccna-topic` i jawne powiązanie 33 ID, zamiast doklejać automatyczne `<details class="ccna-question-note-supplement">`. Nowy, nieznany identyfikator nie otrzymuje zwolnienia z kontroli. Pozostałe podsekcje używają istniejącego mechanizmu bez zmian. `window.CCNA_DAY02_11_NOTE_AUDIT` ujawnia liczbę kart i brakujące powiązania. Regresja: `tests/ccna-day02-content-scope.test.cjs`. Publikacja Netlify zgodnie z partiami; status testów powinien być ustalony oddzielnie od commita.

## Day 02 — podsekcja 1.2: notatka merytoryczna zamiast dopisków do pytań (31.10.2026)

**OBECNIE na develop:** `skretka-utp-i-przewody` zachowuje 41 pytań (15 własnych + 26 importowanych), wszystkie ich ID, postępy, fiszki i udział w zakresie całej sekcji. Na życzenie użytkownika nie wykonywano deduplikacji. Podstawą jest film Jeremy's IT Lab *Interfaces and Cables — Day 2*, głównie 09:11–20:24, z podaną w filmie emisją elektromagnetyczną UTP 26:28–28:02.

Notatkę przebudowano na **12 odrębnych, spójnych zagadnień**: budowa UTP; EMI i skręcanie par; Crosstalk; emisja elektromagnetyczna; pary 10/100; pary 1000/10GBASE-T; Tx/Rx urządzeń; Full-Duplex; Half-Duplex i CSMA/CD; Straight-Through Cable; Crossover Cable; czteroparowy Gigabit Crossover. Każdy blok jest pełnym objaśnieniem po polsku z angielskimi terminami, przykładami lub tabelą. Kilka różnych pytań o to samo pojęcie wskazuje **ten sam blok notatki**. Materiał spoza filmu (Crosstalk, Half-Duplex/CSMA/CD, Gigabit Crossover) jest jawnie oznaczony jako uzupełnienie Official Cert Guide.

W `CCNA_CONTENT_AUDIT` przy 1.2 działa ręczna mapa 41 ID do 12 części `data-ccna-topic` zamiast automatycznego dopisywania rozwijanej listy odpowiedzi `ccna-question-note-supplement`. Nowy lub przesunięty ID nie otrzymuje zwolnienia z kontroli. `window.CCNA_DAY02_12_NOTE_AUDIT` podaje liczbę kart, grup, ID bez notatki i ID już nieistniejących w temacie. Mechanizm innych podsekcji nie zmienił się. Test: `tests/ccna-day02-content-scope.test.cjs`. Weryfikacja Node/przeglądarki i publikacji Netlify wymaga osobnej kontroli — commit nie jest dowodem publikacji.


## Day 02 — 1.3: przyporządkowanie 12 pytań do notatki (31.10.2026, develop)

**OBECNIE:** podsekcja `auto-mdix` zachowuje 12 pytań (8 lokalnych, 4 importowane), z niezmienionymi ID, odpowiedziami, fiszkami i postępami. Nie przeprowadzano deduplikacji na wyraźne życzenie użytkownika. Powiązania merytoryczne to pięć zagadnień w jednej notatce: 1) MDI i MDI-X oraz klasyczne przypisania Tx/Rx; 2) jak Auto MDI-X rozpoznaje i dopasowuje pary (w tym działanie przy pierwotnie niewłaściwym przewodzie); 3) zasady przy Auto MDI-X OFF / ON oraz scenariusze Router–Switch i Switch–Switch; 4) zgodne z Cisco działanie na jednym końcu i wymagania sprzętu; 5) ograniczenia funkcji, w tym brak zmiany limitu 100 m UTP. Dodano przykłady diagnostyczne, uściślono konieczność zgodnej konfiguracji dla jednostronnego Auto MDI-X i jawnie oznaczono fragment Cisco jako rozszerzenie niepochodzące z filmu.

**Źródła:** Jeremy's IT Lab *Interfaces and Cables — Day 2*, [18:08–19:16](https://www.youtube.com/watch?v=ieTH5lVhNaY) wraz z poprzedzającym podziałem MDI/MDI-X, oraz dokumentacja Cisco Auto-MDIX dla dodatkowych warunków sprzętowych. Pytania mają ręczne mapowanie do sekcji `data-ccna-topic` w `apps/ccna/legacy.html`, dzięki czemu nie pojawiają się automatyczne rozwijane `ccna-question-note-supplement`. Obiekt `window.CCNA_DAY02_13_NOTE_AUDIT` sygnalizuje brakujące i nieaktualne ID. Dodano test regresyjny w `tests/ccna-day02-content-scope.test.cjs`. Brak publikacji Netlify; odróżniać kontrolę składni od pełnego `npm run verify` i testu przeglądarkowego.


## Day 02 — 1.4: wdrożone poprawki i 34 mapowania (31.10.2026, `develop`)

**AKTUALNY STAN KODU (nowszy od audytu powyżej):** podsekcja `swiatlowod-i-transceivery` zachowuje oryginalne ID i postępy. Tytuł zmieniono na **Fiber-Optic Cabling, SFP, MMF and SMF**; notatka ma sześć merytorycznych bloków `data-ccna-topic`, przypisanych ręcznie do wszystkich **34 pytań (14 lokalnych + 20 importowanych)**. Jeden dodatkowy fragment quizu nadal prowadzi do osobnej podsekcji 1.6; nie dodano laboratoriów do teorii.

**Poprawki:** doprecyzowano dwukierunkową konwersję sygnału w światłowodowym SFP i istnienie miedzianych SFP; oznaczono uzupełnienia spoza Day 02 o **GBIC (Gigabit Interface Converter)** i **SFP+ (typowo 10 Gbps)**. Zmieniono poprawną odpowiedź importu `anki-interfaces-cables-ocg-2010` na **Small Form-Factor Pluggable (SFP)**. Pytania importowane o odległości 1000BASE-LX, 10GBASE-SR/LR/ER jawnie wskazują wartości **z filmu Day 02**, a w notatce odróżniono je od specyfikacji Cisco, np. **10GBASE-ER do 40 km** dla wybranych modułów. W 20 importowanych kartach ujednolicono polskie polecenia i zastosowano błędne odpowiedzi tego samego typu, zamiast losowych haseł z innych tematów. Pola `questionEn`, źródła, historyczne ID i klucze postępów pozostają nienaruszone. Testową regułę nakładania korekt ograniczono do `swiatlowod-i-transceivery` po zakończeniu importów.

**Weryfikacja i publikacja:** kod `develop` commit `2f097fe5e4e5b2dc3a263de465ae11ad5c9c20e4`, rozbudowany test `tests/ccna-day02-content-scope.test.cjs` commit `e69ca824d3b07739bd216b5a233ecb8584032016`. Izolowane kontrole: **składnia inline JS PASS**, składnia pliku testowego **PASS**, **34/34** unikalne ID przypisane do 6/6 bloków, **20/20** korekt importów, odpowiedzi obecne we wszystkich wariantach (PASS w izolowanej kontroli). **Natywny Node/JSDOM, `npm run verify`, test użytkownika i Netlify: NIEURUCHOMIONE / NIEOPUBLIKOWANE** w tej sesji; brak pełnego checkoutu pozwalającego uruchomić testy Node. Do odbioru konieczne jest wykonanie tych testów i porównanie SHA publikacji z odpowiednim commitem `develop`. Nie przedstawiać samego zapisu na GitHub jako wydania strony.

**Dodatkowa korekta źródła (31.10.2026):** commit `66ff91887ca04b397f205333b2bde7f97975bdcf` poprawia także **kanoniczne obiekty importów** `ocg-2010` (SFP) i `ocg-2009` (GBIC), a nie tylko odpowiedzi wyświetlane po uruchomieniu aplikacji. Commit `6db6817abd0d367b2447d25a62f31bf192c29aa8` dopisuje do notatki właściwe źródło Cisco dotyczące GBIC/SFP/SFP+. Oryginalne `questionEn`, ID i postępy nie zostały zmienione. Składnia inline po tych zmianach: **PASS w izolowanym V8**. Pełny Node/JSDOM i Netlify nadal wymagają osobnej weryfikacji.

**Zasada na następne tematy:** od 31.10.2026 obowiązuje [niezależny plan CCNA — tryb wykonawczy A1](CCNA_CONTENT_PLAN.md): **audyt i natychmiastowe poprawki w tym samym zleceniu**, test i zapis w `develop`; nie kończyć na raporcie błędów. Netlify wydawać partiami dopiero po bramce testów. Masterplan Wiedora i `main` poza zakresem.


## Day 02 — 1.5: wdrożenie ręcznej mapy 13 pytań (31.10.2026, develop)

**OBECNIE NA DEVELOP:** w podsekcji `zasady-doboru-polaczen` (Choosing Cables Between Network Devices) zachowano 13 pytań: 11 lokalnych, w tym sześć starych `lu-02`–`lu-07`, oraz 2 importy OCG `anki-interfaces-cables-ocg-2013` i `...2015`. Nie dodawano, nie przenoszono i nie usuwano pytań ani laboratoriów; ID oraz postępy pozostają bez zmian.

Notatka została powiązana z pięcioma autorskimi blokami `data-ccna-topic`: `cables-roles` (2 karty), `cables-wiring` (1), `cables-devices` (8), `cables-auto-mdix` (1) i `cables-quiz` (1). Tabela z ośmioma połączeniami, klasyczna reguła Tx/Rx i przykład dwóch Routerów pozostały w treści. Doprecyzowano wyjątki zależne od portu oraz dodano jawnie oznaczoną dokumentację Cisco jako dodatkowe potwierdzenie zasad Auto MDI-X OFF. Źródło filmu: Jeremy's IT Lab Day 02, głównie 14:08–18:08, odniesienie 18:08–19:16 oraz quiz 28:02–35:10.

**Naprawione pytania:** `lu-07` precyzyjnie opisuje dwa klasyczne Switche 100BASE-TX bez Auto MDI-X i ich identyczne przypisanie Tx na 3–6, Rx na 1–2. Importy `ocg-2013` i `ocg-2015` otrzymały zgodne znaczeniowo odpowiedzi i dystraktory oraz polskie pytania wyświetlane po normalizacji; zachowano `questionEn` i historyczne ID. Dla 1.5 działa `CCNA_DAY02_15_NOTE_AUDIT` z kontrolą pokrycia i przestarzałych ID. Dwa nowe testy w `tests/ccna-day02-content-scope.test.cjs` sprawdzają mapowanie, brak automatycznych dopisków, zgodność pytań i brak laboratorium.

**Kody zmian:** `56095f9`, `393c884`, `33cefe8`, `ea69dec`, `498c01d`; regresja `782127b`. **PASS w niezależnej walidacji źródła:** 13/13 unikalnych ID, 5/5 bloków, wszystkie odpowiedzi wśród czterech różnych opcji, 5 otwartych i zamkniętych sekcji; składnia skryptu inline i pliku testowego poprawna. **NOT_RUN:** natywny test Node/JSDOM, `npm run check:ccna`, `npm run verify`, test przeglądarkowy. **Netlify: nieopublikowane w tej partii** (publikacja zbiorcza dopiero po bramce testowej). Status: **KOD W DEVELOP / TESTY RUNTIME I NETLIFY OTWARTE**.


## Day 02 — 1.1–1.5: audyt jakości pytań i pokrycia notatkami (31.10.2026, develop)

**OBECNIE W KODZIE `develop`, niezależnie od masterplanu:** statyczna kontrola pięciu podsekcji potwierdziła kompletność ręcznego mapowania istniejących pytań na oznaczone fragmenty głównych notatek: **1.1 = 33/33 (9 bloków), 1.2 = 41/41 (12 bloków), 1.3 = 12/12 (5 bloków), 1.4 = 34/34 (6 bloków), 1.5 = 13/13 (5 bloków); razem 133/133**. Kontrola nie oznacza, że sam test obecności ID w mapie dowodzi pełnego zrozumienia treści; sprawdzono również przypisanie zagadnień oraz dopasowanie odpowiedzi do ich bloków.

**Poprawki 1.1–1.3:** w `apps/ccna/legacy.html` dodano po normalizacji i doborze wariantów ręcznie zredagowane pytania oraz trzy sensowne, powiązane tematycznie odpowiedzi błędne dla wszystkich **52 zaimportowanych kart** (1.1: 22, 1.2: 26, 1.3: 4). Pytania są wyświetlane po polsku, zachowują źródłowe `questionEn`, identyfikatory, przynależność do podsekcji i postępy. Dla niezgodnych ze sobą form luk i odpowiedzi poprawiono tylko treść wyświetlaną i wynikową odpowiedź: `anki-interfaces-cables-ocg-1017` → `Crosstalk`, `anki-interfaces-cables-ocg-3016` → `4`, `anki-interfaces-cables-ocg-2016` → `Auto MDI-X`. Pytanie `lu-01` wymaga teraz **jawnego warunku Auto MDI-X OFF/niedostępne na obu końcach 100BASE-TX**, a wariant poprawny uzasadnia dobór kabla rolami MDI ↔ MDI-X. Stare pytania i fiszki nie zostały usunięte; nie przeprowadzono deduplikacji.

**1.4 i 1.5:** nie dublowano poprzednich, istniejących korekt importów oraz map 34/34 i 13/13. Po nowych poprawkach ponownie uruchomiono statyczny model mapowania i symulację poprawek w izolowanym JavaScript. Wynik: **133/133 mapowań, 52/52 nowych korekt i 20/20 wcześniejszych korekt 1.4, brak pustych/zdublowanych opcji i brak nieprawidłowych poprawnych odpowiedzi w sprawdzonych kartach; składnia głównego skryptu i pliku testowego PASS**. Automatyczne dopiski `ccna-question-note-supplement` nie są używane dla pięciu opracowanych tematów. Dodatkowa regresja: `tests/ccna-day02-content-scope.test.cjs` (test kompletności 133 mapowań, 52 korekt, `questionEn`, kluczowych odpowiedzi i przypadku Auto MDI-X).

**Commity aplikacji:** `5de20ac60000386519327c3eb0b555f6121b842f`, `41900e47628c2154923c841c0deac620a4ffc4f2`; test `44c1b038c10ae1abacebfc702821b319f6bb8682`. **NOT_RUN:** pełny `node --test` z JSDOM, `npm run check:ccna`, `npm run verify`, rzeczywista przeglądarka i kontrola opublikowanej wersji Netlify. W tej sesji nie było pełnego checkoutu z zależnościami; dostęp przez konektor GitHub pozwolił edytować kod, lecz nie uruchomić pełnej aplikacji. **Status: KOD W DEVELOP / PEŁNA REGRESJA I NETLIFY OCZEKUJĄ.** Bez zmian w `main`, Packet Lab, innych aplikacjach i masterplanie.



## Day 02 — 1.6: finalne pokrycie doboru medium i bilans sekcji 1 (31.10.2026)

**OBECNIE W KODZIE `develop`:** podsekcja `dobor-medium-do-odleglosci`, wyświetlana jako **1.6 Selecting Transmission Media by Distance**, zachowała trwałe ID, trasę, wszystkie **9 pytań/fiszek** i klucze postępu. Treść opracowano z notatki `CCNA_Dzien_02_Interfaces_and_Cables_PL.docx` dla [Jeremy's IT Lab — Interfaces and Cables, Day 02](https://www.youtube.com/watch?v=ieTH5lVhNaY), porównanie 26:28–28:02 i quiz 28:02–35:10, z kontekstem światłowodowym 20:24–26:28.

Notatkę podzielono na **5 autorskich bloków `data-ccna-topic`**: `media-utp` (2 karty: typowe biuro i limit Copper UTP 100 m), `media-fiber-emi` (1: przewaga światłowodu przy EMI), `media-criteria` (1: dystans, zgodny standard, koszt i EMI), `media-mmf-150` (2: dwa Switche na 150 m, wybór MMF przy kosztach podanych w quizie), `media-smf-3km` (3: połączenie biur 3 km, wybór SMF z odpowiednią optyką i ograniczenia zasięgu transceivera). Wszystkie **9/9 ID** ma ręczne powiązanie z objaśnieniem w głównej notatce; nie powstają tu generowane dopiski z odpowiedziami do każdej karty.

Wszystkie dziewięć kart zachowano z dotychczasowymi poprawnymi odpowiedziami, ale poprawiono **27 dystraktorów**, aby odnosiły się do medium, długości, kosztu lub zgodności sprzętu zamiast przypadkowych, oczywiście obcych pojęć. Dookreślono, że SMF może technicznie działać również na 150 m, natomiast w quizie wybrano MMF z uwagi na koszt; wybór SMF na 3 km nie oznacza gwarancji zasięgu dla dowolnego modułu SFP. Porównanie dotyczy przykładów lekcji, nie uniwersalnych parametrów włókien. Laboratoria `lab`/`labAuditKey` nadal nie są przypisane do teorii; archiwum topologii i pytań spoza filmu pozostaje nienaruszone.

**Audyt aplikacji:** `window.CCNA_DAY02_16_NOTE_AUDIT` wykazuje liczbę pytań, tematów, mapowanie, brakujące i przestarzałe ID oraz duplikaty. Dwa dodatkowe testy w `tests/ccna-day02-content-scope.test.cjs` kontrolują szczegółowo 1.6 oraz **wszystkie 142 karty** w sześciu podsekcjach pierwszej sekcji (**33 + 41 + 12 + 34 + 13 + 9**, razem **42 merytoryczne bloki notatek**). Składnia inline JavaScript i pliku testowego: **PASS** (izolowany V8). Statyczne sprawdzenie map: **142/142, unikalne 142/142, brak niedopasowanych ID i brak problemów składniowych**; dla dziewięciu lokalnych kart 1.6 także **9/9** prawidłowych zestawów po cztery unikalne warianty z poprawną odpowiedzią. Nie zmieniono pytań 1.1–1.5, nie uruchamiano deduplikacji, nie naruszono kodu innych aplikacji.

**Commity:** `8c88bfc4921b5a98c53c8fe7318e7c8b4270c8f9` (notatka, pytania, mapa, audyt), `b06e15f9bded47347d20349f5f9a70c81716f8e6` (regresja sekcji). **NOT_RUN:** natywne `node --test tests/ccna-day02-content-scope.test.cjs`, `npm run check:ccna`, `npm run verify`, test przeglądarkowy i publikacja/porównanie SHA Netlify; w sesji brak pełnego checkoutu repo oraz `jsdom`. **Status:** sześć podsekcji **opracowano w kodzie `develop`**, ale formalny odbiór sekcji pozostaje **OTWARTY** do pełnych testów Node/JSdom, przeglądarki i zbiorczej publikacji. Nie oznaczać strony jako zaktualizowanej bez potwierdzenia deployu.



## Day 02 — quiz końcowy wyłącznie w egzaminie zbiorczym sekcji (31.10.2026)

**OBECNIE w `develop`, niezależnie od masterplanu:** pięć pytań sytuacyjnych z quizu Jeremy's IT Lab Day 02 (28:02–35:10; na podstawie notatki `CCNA_Dzien_02_Interfaces_and_Cables_PL.docx`) umieszczono tylko w obiekcie `section-exam` sekcji `interfejsy-sieciowe-i-okablowanie` (egzamin `egzamin-interfejsy-okablowanie-laczenie`). Dotyczą: (1) dwóch starszych Routerów i wyboru Crossover Cable; (2) Switch–Switch na 150 m i MMF; (3) biur na 3 km i SMF; (4) dwóch Switchy z Auto MDI-X po Straight-Through; (5) wielu PC w biurze i Copper UTP. Wykorzystano cztery istniejące ID `cables-day02-05`, `fiber-day02-04`, `fiber-day02-05`, `fiber-day02-06` oraz dodano brakujący scenariusz `day02-quiz-final-04`.

**Widoczność:** karty mają `examQuestion:true` (istniejący badge „Pytanie egzaminacyjne”), `videoQuiz:true`, numer quizu i źródło. Nie trafiają do kart, fiszek, trybu nauki ani egzaminów pojedynczych podsekcji, jak również do egzaminu zbiorczego całego kursu; są wyłącznie w **egzaminie tej jednej sekcji**. W 25-pytaniowym egzaminie sekcji wszystkie pięć jest obecnych **obowiązkowo**, pozostałe 20 losowane są ze zwykłej puli. Zachowano historyczne ID czterech kart oraz ich `progressKey`, żeby stary stan fiszek nie został usunięty podczas walidacji kopii.

**Bilans surowych danych sekcji (stan po quizie Day 02):** sześć podsekcji przechowuje **138 kart** (33 / 41 / 12 / 34 / 12 / 6), plus **5 kart quizu końcowego** (143 unikalne karty w puli egzaminu sekcji). Po adapterze z 01.11.2026 wszystkie 138 kart są ponownie kwalifikowane do pul nauki; tylko pięć osobnych kart `videoQuiz:true` pozostaje przeznaczonych wyłącznie do egzaminu sekcji. Ręczne mapy `data-ccna-topic` obejmują **138/138** kart źródłowych; pięć egzaminacyjnych korzysta z objaśnień w istniejących notatkach, bez dopisków odpowiedź-po-odpowiedzi. Zmieniono `CCNA_DAY02_15_NOTE_AUDIT`, `CCNA_DAY02_16_NOTE_AUDIT` i dodano `CCNA_DAY02_FINAL_QUIZ_AUDIT`.

**Kod i testy:** `apps/ccna/legacy.html` commity `21b36d902aee5b386c69831fccae96f492177a93`, `973bd8a3ff308517f7f17f6f37284dc8d99b3dcd`; `tests/ccna-day02-content-scope.test.cjs` commit `6780ae35dea7840b17a3fec065ad557731e7c467`. Izolowana weryfikacja: składnia JS **PASS**, mapowanie 138/138, 5 poprawnych i unikalnych zestawów odpowiedzi **PASS**, 20 prób algorytmu losowania egzaminu (każda po 25 pytań, zawsze pięć obowiązkowych, bez duplikatów) **PASS** po korekcie indeksów `correct`. **Pełne Node/JSDOM, `npm run check:ccna`, `npm run verify`, test przeglądarkowy i Netlify: NOT_RUN** (brak pełnego checkoutu z zależnościami w tej sesji). **Status: KOD W DEVELOP / ODBIÓR ZEWNĘTRZNY OTWARTY.** Poprzednie liczniki 142/142 i 9/9 pozostają zapisami historycznymi sprzed przeniesienia quizu.


## Day 02 — ostatnie zadanie sekcji 1: Connecting Devices — Packet Tracer Lab (31.10.2026)

**OBECNIE w kodzie `develop`:** na końcu sekcji `interfejsy-sieciowe-i-okablowanie`, po sześciu teoretycznych podsekcjach (1.1–1.6) i przed egzaminem sekcji, dodano **oddzielne ćwiczenie** `topologia-laboratorium` z tytułem **Connecting Devices — Packet Tracer Lab**. Wcześniejszy rekord w archiwum pozostał nienaruszony; nowe ćwiczenie nie importuje historycznych pytań `lu-08`–`lu-13` i nie modyfikuje pytań ani notatek teorii. Zasada „bez laboratoriów w teorii” nadal dotyczy 1.1–1.6, lecz nie nowego osobnego zadania praktycznego na końcu sekcji.

**Film i źródło:** Jeremy’s IT Lab, [Connecting Devices — Day 02 Lab](https://www.youtube.com/watch?v=K6Qt23sY68Y), od 0:21 do końca. Laboratorium zawiera **16 urządzeń**: R1–R4, SW1–SW8, PC1–PC3 i SRV1, **17 wymaganych połączeń**, Auto MDI-X wyłączony. Cztery proste host–switch, sześć krosowanych switch–switch, cztery proste switch–router, jedno krosowane router–router na 50 m, dwa światłowody na 3 km (SMF) i 250 m (MMF). Obecny model Fiber działa jak pokazany w filmie Packet Tracer: nie pozwala wybierać MMF/SMF jako dwóch rodzajów fizycznego przewodu, więc różnica jest objaśniona w notatce. Aby lab był możliwy do ukończenia bez konfiguracji niezwiązanej z filmem, porty Ethernet rozmieszczonych urządzeń startują aktywne; pozostały symulator nie zmienia reguł.

**Notatka lab:** tabela używanych narzędzi (Copper Straight-Through, Copper Cross-Over, Fiber, FastEthernet i GigabitEthernet), wyraźne objaśnienie, że w filmie **nie są używane żadne polecenia Cisco IOS CLI**, oraz instrukcja wszystkich grup połączeń z czasami filmu i warunkiem zaliczenia. Na końcu notatki znajduje się bezpośredni odnośnik do publicznej **kopii pliku `.pkt`** z repozytorium AlexG900 na GitHub, wraz z odsyłaczem do [oryginalnej dystrybucji autora](https://jitl.jp/ccna-files), która wymaga rejestracji. Plik `.pkt` otwiera się w Cisco Packet Tracer; własny symulator nie obsługuje importu tego formatu. Nie kopiowano cudzego pliku binarnego do repo Constant App.

**Scenariusz i ocena:** `apps/ccna/packet-lab/scenarios.js` definiuje gotowe pozycje 16 urządzeń bez kabli. Wymaga 17 poprawnych par urządzeń i typów mediów oraz jednej kontroli końcowej dokładnie 17 kabli, bez dodatkowych połączeń. Zaliczenie 18/18 uzyskuje się wyłącznie dla poprawnych, aktywnych przewodów. Rozdzielono scenariusz od ogólnego ćwiczenia Ethernet; stan laboratorium ma osobny identyfikator `interfejsy-sieciowe-i-okablowanie:topologia-laboratorium`. Zakładka laboratorium tego nowego zadania nie wymaga nieistniejących fiszek, a dostęp konta pozostaje zgodny z istniejącą integracją.

**Weryfikacja w tej partii:** rzeczywiste moduły `devices/ethernet/engine/cli/scenarios/jitl-labs` załadowane i uruchomione w izolowanym V8: 16 urządzeń, zero kabli na starcie, 17/17 stanów link up, **18/18 kryteriów PASS**, błędny przewód nie zalicza ćwiczenia, adapter wstawia laboratorium na pozycję po 1.6 i nie zmienia sześciu wcześniejszych podsekcji. Składnia wszystkich zmienianych skryptów sprawdzona. Dodano `tests/ccna-day02-connecting-devices-lab.test.cjs` i zaktualizowano `tests/ccna-day02-content-scope.test.cjs`. **Pełny natywny `node --test`, `npm run verify`, test przeglądarkowy, Netlify: NOT_RUN / NOT_DEPLOYED** w tej sesji; działająca strona może nadal pokazywać poprzednią wersję. Status: **KOD W DEVELOP, TESTY I PUBLIKACJA ZEWNĘTRZNA OTWARTE**. Bez zmiany `main`, WIEDORA/masterplanu, Supabase, Packet Lab poza scenariuszem Day 02 i jego integracją.

**DOCELOWO — WIE-211 (zatwierdzony plan, bez wdrożenia):** jeden wspólny program fiszek dla CCNA/Prawa/pozostałych kursów wzorowany funkcjonalnie na AnkiDroid, bez duplikowania banków i zmiany przypisania pytań do sekcji/podsekcji. Wejście z podsekcji pokazuje tylko jej pytania; sekcja i cały kurs sumują wyłącznie własne podsekcje. Rozbudowane SRS, filtry, statystyki, offline i zapis nie mogą naruszać etapu obowiązkowych fiszek, oddzielnego harmonogramu opcjonalnego Trybu nauki, odblokowywania laboratorium/egzaminu ani dotychczasowych ID, importowanych pytań i postępów. [Specyfikacja `WIE-211`](./FLASHCARDS_PLAN.md). **OBECNIE** nadal obowiązują wcześniejsze, niezależne mechanizmy opisane powyżej.


## Day 02 — naprawa widoczności pięciu pytań egzaminacyjnych (31.10.2026)

Podczas **rzeczywistej kontroli przeglądarkowej** przed poprawką opublikowana wersja Netlify pokazała `CCNA_DAY02_FINAL_QUIZ_AUDIT.actual=0`, `examOnly=[]` i `sectionPool=133`, mimo że wszystkie 5 pytań istnieje w początkowych danych `apps/ccna/legacy.html`. Przyczyną był ogólny filtr `forbiddenContext`, którego wzorzec `day \\d+` odrzucał pięć pytań zawierających odniesienie do `Day 02`. W `develop` poprawiono **wyłącznie ten warunek**, aby nie usuwał źródłowych kart o `videoQuiz:true`; reguły dotyczące pozostałych pytań pozostały bez zmian. Nie zmieniono ID, treści ani kluczy postępu pięciu pytań. **Statyczna kontrola i kompilacja głównego skryptu CCNA: PASS.** Właściwy odbiór wymaga po publikacji ponownego odczytu `CCNA_DAY02_FINAL_QUIZ_AUDIT` (5/5, `sectionPool=138+5` według aktualnego runtime), weryfikacji wejścia w egzamin zbiorczy sekcji 1 i wszystkich pięciu obowiązkowych kart. Poprzednie wartości 138/143 były raportem sprzed sprawdzenia przeglądarkowego i nie należy ich uznawać za potwierdzony wynik runtime.


## Day 02 — podgląd pytań źródłowych (stan historyczny; wyłączony 31.10.2026)

Wcześniejsze wydanie Netlify potwierdziło obecność pięciu pytań quizu filmu w egzaminie sekcji, lecz równocześnie oferowało osobny podgląd z odpowiedziami. **Na aktualnym `develop` ten dodatkowy podgląd usunięto**, ponieważ zgodnie z wymaganiem właściciela pytania egzaminacyjne mają być widoczne wyłącznie podczas egzaminu zbiorczego właściwej sekcji. Pięć obowiązkowych pytań pozostało w egzaminie, bez zmiany ID i wyników. Dawny test Netlify podglądu nie dowodzi jeszcze publikacji tej korekty; trzeba porównać SHA `build-info.json` po zbiorczym wydaniu.


## Regresja etapu 00 — 31.10.2026

OBECNIE w wydaniu develop `68b74802f194e30603e55e7aa5830684999d32b4`: odzyskano pięć kart Day 02 usuwanych przez historyczny cleaner; teoria ma **138 kart**, a egzamin sekcji **143 (138 + 5 quizowych)**. Normalizator zachowuje opracowane polskie pytania, autorskie notatki i angielski tytuł Day 02. Karty OCG 2013/2015 mają cztery różne odpowiedzi. ID, źródła i postępy pozostają zachowane; wyjątek cleanera nie obejmuje innych kart ani tematów. Shell/terminology/SW: `20261031-day02-reviewed-1`. [Dowody i zakres testów](./wiedora-evidence/WD-20261031-WIE-005-NATIVE-REGRESSION-09.md): **1019 Node PASS / 0 FAIL/SKIP**, pełna lokalna regresja przeglądarkowa PASS; pełne SHA i fingerprint Netlify potwierdzone. Chrome/CUA: liczniki 12/34/6, 138 fiszek i 143 pytań egzaminu; podgląd quizu, ujawnienie odpowiedzi, powrót i odświeżenie PASS. Nie oznacza to ukończenia całego etapu 00 ani redakcji całego CCNA.


## Fiszki CCNA — bez powielania angielskich nazw (04.11.2026)

**OBECNIE W KODZIE `develop`:** formatowanie odsłoniętej odpowiedzi w `apps/ccna/legacy.html` pomija dopisywanie terminu angielskiego w nawiasie, gdy jest on już identyczny z wyświetlaną nazwą (bez względu na wielkość liter). Przykład: `Multimode fiber (MMF).` nie staje się `Multimode fiber (MMF) (multimode fiber (MMF)).`. Polskie pojęcia nadal mogą otrzymywać angielski odpowiednik, np. `światłowód wielomodowy (multimode fiber (MMF))`. Bez zmian w pytaniach źródłowych, ich ID, harmonogramach, ocenach i innych aplikacjach.

**Testy:** 8/8 scenariuszy formatera PASS w izolowanym JavaScript na aktualnym kodzie `develop`. Zapisano regresję `tests/ccna-flashcard-answer.test.cjs`. Natywne `node --test` i `npm run verify`, weryfikacja w przeglądarce oraz potwierdzenie publikacji Netlify **NOT_RUN / NIEPOTWIERDZONE** w tej sesji.

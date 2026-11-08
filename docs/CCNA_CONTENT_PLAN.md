# CCNA — niezależny plan opracowania całego kursu

**Status:** AKTYWNY PLAN MERYTORYCZNY • **utworzono:** 31.10.2026 • **repozytorium:** `testowyemailaplikacja-spec/Constant_app`, gałąź `develop`.

> Ten dokument jest **osobnym planem CCNA**. Nie jest etapem, podplanem ani rozszerzeniem `WIEDORA_MASTERPLAN.md`. Masterplan Wiedora zawiera wyłącznie odnośnik informacyjny. Realizacja niniejszego planu nie zmienia statusów WIE, liczby zadań, faz ani bramek masterplanu. Kolizje zmian w tych samych plikach trzeba jednak wykrywać i uzgadniać.

**Aktualizacja 01.11.2026 — widoczność banku pytań:** na `develop` dodano adapter `apps/ccna/question-pool-visibility.js` przywracający importowane karty certyfikacyjne do istniejących trybów nauki, bez zmiany ID/postępów. Wyjątek stanowi pięć kart `videoQuiz:true` z quizu końcowego Day 02: wyłącznie obowiązkowo w egzaminie zbiorczym sekcji 1. Sekcja 1 ma zgodnie z istniejącą mapą 138 kart dydaktycznych powiązanych z autorskimi notatkami i pięć dodatkowych pytań quizowych. Składnia i test izolowanego adaptera: PASS; pełna regresja JSDOM/Node i wydanie Netlify: NOT_RUN, więc zadanie nie jest odebrane live. Zob. `docs/CCNA.md` i `tests/ccna-question-pool-visibility.test.cjs`. Nie zmienia to planu ani statusu masterplanu Wiedora.

## A. Cel i granice

Dopracować **całą zawartość edukacyjną CCNA** w Constant App, od pierwszej do ostatniej lekcji: notatki, zrozumiałe objaśnienia, terminologię, przykłady, pytania, fiszki, ich przypisanie do właściwych podsekcji, zgodność z materiałami i spójność z wymaganiami Cisco. Rezultatem ma być kurs pozwalający uczyć się **na podstawie notatek umieszczonych w aplikacji** — bez sytuacji, w której na pytanie można odpowiedzieć tylko przez odczytanie automatycznie dopisanej odpowiedzi.

- **W zakresie:** teoria, quizy, pytania egzaminacyjne, fiszki, źródła i terminy, struktura merytoryczna podsekcji, archiwizacja materiałów spoza zakresu, kontrola pokrycia egzaminacyjnego, testy danych i prezentacji zmodyfikowanych notatek.
- **Laboratoria:** tylko kontrola przypisania, pochodzenia, kompletności opisów oraz zgłoszenie braków do osobnej kolejki. Laboratoria nie są podsekcjami teoretycznymi; **nie** przebudowujemy tutaj symulatora, CLI ani Packet Lab.
- **Poza zakresem:** masterplan Wiedora, jego etap 00, `main`, inne aplikacje, redesign UI, silnik nauki, logowanie, Supabase i zmiany architektury. Osobne zlecenie będzie konieczne, jeśli audyt wskaże potrzebę zmian w tych obszarach.
- **Zasada:** nie generować z góry sztucznej liczby pytań. Każdy ważny fakt i umiejętność mają być pokryte, a pytania mają być sensowne.

## A1. Obowiązkowy tryb wykonawczy — audyt i natychmiastowe wdrożenie (31.10.2026)

**Decyzja właściciela:** od tej chwili każde zlecenie opracowania/przejścia do podsekcji CCNA obejmuje **realną implementację zmian**, a nie tylko audyt i zapis zaleceń. Nie kończyć pracy na liście błędów i nie pytać ponownie o zgodę na poprawki mieszczące się w zleconej podsekcji. Plan CCNA jest niezależny od masterplanu Wiedora.

1. **Sprawdź stan `develop` i źródło lekcji** (AGENTS, aktualne notatki/film i oficjalne Cisco), porównaj z istniejącą implementacją. Nie dubluj już wykonanej pracy.
2. **Przejrzyj każde pytanie i fiszkę**, skontroluj poprawną odpowiedź, odpowiedzi błędne, rzeczywiste umocowanie w jednym autorskim fragmencie notatki oraz zakres źródła; wykryj braki i błędy.
3. **W tej samej sesji wykonaj poprawki w kodzie `develop`:** popraw notatkę, przesuń błędne pytania lub archiwizuj je zgodnie z protokołem, popraw pytania i dystraktory, zachowaj ID i postępy; dodaj ręczną mapę `data-ccna-topic` i test kompletności. Audyt bez faktycznej korekty **nie realizuje zadania**, jeżeli naprawy są technicznie możliwe.
4. **Przeprowadź dostępne testy** (`check:ccna`, test konkretnej podsekcji i `npm run verify`), skontroluj wynik po poprawkach. Nie podawaj `PASS` za testy, których środowisko nie pozwoliło uruchomić; zapisz `NOT_RUN` i konkretną przyczynę.
5. **Zapisz faktyczne pliki aplikacji i testy w GitHub `develop`**, z kontrolą aktualności plików przed commitem. Sam raport lub commit dokumentacyjny **nie oznacza wdrożenia zadania**.
6. **Publikuj testowe Netlify `develop` po kompletnej, odpowiednio przetestowanej partii** zgodnie z `AGENTS.md` i ograniczeniami kosztów. Po wydaniu porównaj SHA `build-info.json`, sprawdź zachowanie użytkownika. Zmiany w GitHub bez publikacji oznacz `KOD W DEVELOP / NETLIFY OCZEKUJE` — nigdy `WDROŻONE NA STRONIE`.
7. **Aktualizuj plan i `docs/CCNA.md`**: co rzeczywiście zmieniono, ID, liczebności, testy, commit, status Netlify i następne zadanie. Dopiero po zrealizowaniu wymaganych bramek można oznaczyć podsekcję jako ukończoną. Jeśli implementacja jest naprawdę niemożliwa, zostaw `BLOCKED` z powodem i przygotowanym zakresem zmian, nie markuj sukcesu.
8. **Nie zmieniaj `main`, masterplanu Wiedora ani niezwiązanych modułów.** Osobny plan dotyczy treści CCNA; kolizje z innymi agentami wymagają ponownego pobrania bieżących plików, a nie nadpisania cudzych commitów.

**Każda kolejna sesja ma domyślnie wykonać cały cykl:** sprawdzenie → naprawa → test → commit `develop` → publikacja zbiorcza i test strony, gdy bramka wydania jest spełniona → zapis wyniku. Nie rozdzielać samego audytu i oczywistych poprawek na dwa kolejne zlecenia.

## B. Źródła i wersje egzaminu

1. **Podstawa dydaktyczna:** Jeremy's IT Lab, 63 dni (Day 01–Day 63), w kolejności oryginalnego kursu. Katalog: https://courses.jeremysitlab.com/p/ccna . Materiałem roboczym jest **dostarczona przez użytkownika notatka/transkrypcja danego filmu albo zweryfikowane opracowanie**; przed redakcją określić tytuł filmu, URL, znaczniki czasu i quiz. Nie dopowiadać treści filmów bez źródła.
2. **Weryfikacja techniczna:** Cisco i oficjalne exam topics. Dla obecnego egzaminu (do 02.02.2027) obowiązuje CCNA 200-301 **v1.1**: https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf .
3. **Przygotowanie do zmian:** egzamin CCNA 200-301 **v2.0** rozpoczyna się 03.02.2027. Oficjalne topics: https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf . Ogłoszenie terminu: https://www.cisco.com/web/go/ccna/ .
4. **Krytyczna reguła:** obecne części aplikacji nie muszą odpowiadać domenom egzaminacyjnym. Zachować istniejącą nawigację/ID; prowadzić **dodatkową mapę zakresu** `Day → istniejący temat/podsekcja → CCNA v1.1 topic → CCNA v2.0 topic → dowód źródłowy`. Nie przebudowywać kolejności jedynie dlatego, że v2.0 ma inne nazwy domen.
5. **Licencje:** pisać własne wyjaśnienia i własne pytania, wskazywać autora źródła. Nie kopiować hurtowo chronionych transkrypcji, slajdów, prywatnych quizów ani cudzych baz bez odpowiednich praw. Ocenę praw do materiałów `JITL/OCG` prowadzić osobno przed rozpowszechnieniem ich zawartości.

### Mapa egzaminu v2.0 — kryterium końcowego audytu

| Domena Cisco v2.0 | Udział |
|---|---:|
| Network Infrastructure and Connectivity | 25% |
| Switching and Network Access | 25% |
| IP Routing | 20% |
| Network Services and Security | 20% |
| AI, and Network Operations and Management | 10% |

Wagi służą do audytu pokrycia tematów, **nie do mechanicznego ustalania liczby pytań**.

## C. Punkt startowy z dokumentacji repozytorium (31.10.2026)

- Audyt **24.10.2026** obejmował **3429 pytań w 127 podsekcjach**. To migawka historyczna, nie licznik na bieżącym HEAD.
- Katalog `jitl-labs.js` zawierał **52 pozycje**, a audyt proweniencji 31.10 nie potwierdzał jeszcze praw do kopiowania ani kompletnego odbioru laboratoriów.
- Day 02, podsekcje **1.1–1.6**, zostały merytorycznie opracowane na `develop`. Dla 1.1–1.3 przygotowano ręczne mapy pytań do bloków notatek; dla 1.4–1.6 opisano zakres i przenosiny. **Nie należy traktować tego jako pełnej przeglądarkowej lub produkcyjnej akceptacji.**
- Ostatnie opisane w `docs/CCNA.md` liczby: **1.1 = 33**, **1.2 = 41**, **1.3 = 12**, **1.4 = 34**, **1.5 = 13**, **1.6 = 9**. Ponownie policzyć na aktualnym runtime przed podaniem jako obecnego bilansu.
- Dawne ćwiczenie `topologia-laboratorium` i część pytań niepasujących do filmu zachowano w `apps/ccna/data/archived/day02-topology-and-out-of-scope-questions.json`. Nie przywracać automatycznie.
- Dokumentację historycznego wykonania i szczegóły zachowanych ID zawiera `docs/CCNA.md`. **Protokół obowiązkowy:** `docs/CCNA_CONTENT_FROM_VIDEO_WORKFLOW.md`.

## D. Kolejność prac — osobne etapy CCNA-C00…CCNA-C10

| ID | Zakres | Wynik / bramka zakończenia | Status początkowy |
|---|---|---|---|
| **CCNA-C00** | Inwentaryzacja całego bieżącego kursu, źródeł i pytań; ustalenie listy lekcji, łączników i rzeczywistych liczników | Rejestr każdego Day 01–63, tematów, pytań, archiwów, źródeł i braków, bez zmian w postępach | DO ZROBIENIA |
| **CCNA-C01** | Day 01–08 — urządzenia, interfejsy, OSI/TCP-IP, CLI, switching, IPv4 | Każdy temat otrzymuje poprawną notatkę, mapę pytań i audyt; Day 02 **nie tworzyć od nowa** | CZĘŚCIOWO (Day 02) |
| **CCNA-C02** | Day 09–15 — Switch Interfaces, IPv4 Header, Routing & Static Routes, Life of a Packet, Subnetting/VLSM | Pełne pokrycie teorii i przykładów obliczeniowych | DO ZROBIENIA |
| **CCNA-C03** | Day 16–23 — VLANs, DTP/VTP, STP/RSTP, EtherChannel | Poprawne reguły konfiguracji, porównań i diagnostyki | DO ZROBIENIA |
| **CCNA-C04** | Day 24–33 — Dynamic Routing, RIP/EIGRP, OSPF, FHRP, TCP/UDP, IPv6 | Notatki, routing, adresowanie i scenariusze są spójne z wymaganiami egzaminu | DO ZROBIENIA |
| **CCNA-C05** | Day 34–47 — ACL, CDP/LLDP, NTP, DNS, DHCP, SNMP, Syslog, SSH, FTP/TFTP, NAT, QoS | Każda usługa ma opis działania, przykłady i właściwe pytania | DO ZROBIENIA |
| **CCNA-C06** | Day 48–58 — security, Port Security, DHCP Snooping, Dynamic ARP Inspection, LAN/WAN, virtualizacja, WLAN | Zabezpieczenia i wireless poprawnie opisane, pytania bez wycieku do złych podsekcji | DO ZROBIENIA |
| **CCNA-C07** | Day 59–63 — automation, JSON/XML/YAML, REST APIs, SDN, Ansible/Puppet/Chef, Terraform i dodatkowe materiały JITL | Komplet materiałów automatyzacji w oryginalnym zakresie źródeł | DO ZROBIENIA |
| **CCNA-C08** | Audyt różnic CCNA v1.1 ↔ v2.0 i uzupełnienia braków | Pokrycie każdego oficjalnego topic v2.0, wskazane źródła i testy; wyodrębnione materiały historyczne | DO ZROBIENIA |
| **CCNA-C09** | Kontrola kompletności źródeł i powiązania z laboratoriami oraz całego banku pytań | Żadne laboratorium nie wraca do teorii, brak błędnych ID i zakresów, spis zgłoszeń do Packet Lab | DO ZROBIENIA |
| **CCNA-C10** | Końcowa kontrola merytoryczna i testy użytkownika, zbiorcze wydanie testowe | Raport pokrycia, automatyczne testy, próby przeglądarkowe i zgodność SHA `develop`/Netlify, bez `main` | DO ZROBIENIA |

### Zakres lekcji — ciągła kolejka bez pominięć

Każdy dzień może obejmować więcej niż jedną podsekcję i więcej niż jeden materiał źródłowy; numer Day **nie jest** numerem podsekcji w aplikacji.

- **01–08:** Network Devices; Interfaces and Cables; TCP/IP Model; Intro to CLI; Ethernet LAN Switching 1–2; IPv4 Addressing 1–2.
- **09–15:** Switch Interfaces; IPv4 Header; Routing Fundamentals & Static Routing; Life of a Packet; Subnetting 1–3.
- **16–23:** VLANs 1–3; DTP/VTP; STP 1–2; Rapid STP; EtherChannel.
- **24–33:** Dynamic Routing; RIP/EIGRP; OSPF 1–3; First Hop Redundancy; TCP/UDP; IPv6 1–3.
- **34–47:** Standard ACLs; Extended ACLs; CDP/LLDP; NTP; DNS; DHCP; SNMP; Syslog; SSH; FTP/TFTP; NAT 1–2; QoS 1–2.
- **48–58:** Security Fundamentals; Port Security; DHCP Snooping; Dynamic ARP Inspection; LAN Architectures; WAN Architectures; Virtualization & Cloud; Wireless Fundamentals; Wireless Architectures; Wireless Security; Wireless Configuration.
- **59–63:** Intro to Network Automation (w tym dodatkowe AI/ML); JSON/XML/YAML; REST APIs (w tym Authentication); Software-Defined Networking; Ansible/Puppet/Chef (w tym Terraform).
- **Po Day 63:** osobno `CCNA Mega Lab` — tylko odnotować źródło i ewentualny brak przypisania; nie przebudowywać silnika laboratoriów w zadaniu treściowym.

## E. Procedura dla KAŻDEJ podsekcji (obowiązuje w każdym czacie)

1. **Stan:** na świeżym `develop` odczytać `AGENTS.md`, `docs/CCNA.md`, niniejszy plan, `docs/CCNA_CONTENT_FROM_VIDEO_WORKFLOW.md` i obecne dane. Sprawdzić równoległe zmiany.
2. **Film i materiał źródłowy:** ustalić konkretne Day, URL, tytuł, długość, czas danego fragmentu, quiz oraz dostępność przekazanych notatek. Brak materiału = jawne `BLOCKED_SOURCE`, nigdy treść „z pamięci”.
3. **Mapa zagadnień:** rozbić film na faktyczne pojęcia; przypisać do istniejących ID podsekcji i exam topics Cisco. Nie tworzyć nadmiarowych podsekcji tylko po to, by odwzorować czas filmu.
4. **Notatka:** najpierw zredagować spójne wyjaśnienia po polsku, angielskie tytuły i słownictwo fachowe, przykłady i konieczne tabele. Jedno pojęcie wyjaśnić **raz**, nawet gdy sprawdza je wiele pytań. Uzupełnienia spoza filmu mają jawny status i źródło.
5. **Pytania/fiszki:** zinwentaryzować lokalne i importowane, ocenić poprawność, poprawną odpowiedź i warianty, przypisać każdą kartę do konkretnego bloku `data-ccna-topic`; dołożyć tylko brakujące pytania. **Nie usuwać podobnych pytań tylko dlatego, że sprawdzają to samo pojęcie.**
6. **Przesunięcia/archiwum:** jeśli pytanie jest przypisane źle, przenieść do istniejącej podsekcji, ale tylko gdy tam jest merytoryczne pokrycie. Zachować jego stare ID i postęp. Jeśli nie ma prawidłowego tematu, najpierw archiwizacja pełnego rekordu w `apps/ccna/data/archived/`, następnie wyłączenie z aktywnego banku. ID nigdy nie wykorzystać ponownie.
7. **Laboratoria poza teorią:** wykryć `lab`, `labAuditKey` i adaptery odtwarzające laboratoria; teoretyczna podsekcja nie zawiera lab ani wymuszonego kroku Laboratory. Istniejące oddzielne laboratoria tylko odnotować.
**Reguła dla każdego laboratorium CCNA (również w przyszłych Day):** zgodnie z [obowiązkowym workflow](CCNA_CONTENT_FROM_VIDEO_WORKFLOW.md) osobna notatka laboratoryjna ma zawierać (1) rzeczywiście użyte w źródle komendy Cisco IOS lub hosta, z dokładną składnią, urządzeniem/trybem CLI, objaśnieniem i sposobem sprawdzenia; gdy brak CLI — jawny zapis „Komendy Cisco IOS CLI: brak” i rzeczywiste działania GUI, (2) poniżej procedurę krok po kroku aż do zaliczenia, z topologią, portami, adresami, jawnymi kryteriami zaliczenia i kontrolą wyników, (3) **na końcu** sprawdzony odnośnik do legalnie dostępnego pliku Packet Tracer `.pkt/.pka` lub informację o jego braku oraz źródło autora. Nie tworzyć fikcyjnych komend, plików ani pozornych testów. Dla nowych laboratoriów testować komendy w istniejącym symulatorze i negatywne przypadki oceny. **Ta reguła nie nakazuje ponownej analizy zamkniętych sekcji teorii.**

8. **Testy lokalne:** składnia danych, niezmienność historycznych ID, poprawne indeksy odpowiedzi, brak osieroconych importów, brak kolizji, brak archiwalnych kart w runtime, komplet ręcznej mapy pytań→notatek. Uruchomić testy CCNA i `npm run check:ccna`, `npm run verify`, jeżeli dostępny jest pełny checkout. Nie oznaczać jako `PASS` testów nieuruchomionych.
9. **Test użytkownika:** sprawdzić notatkę, pytania, fiszki, powrót do podsekcji i postęp na aktualnej wersji; mobilny widok dla zmienionych tabel. Oddzielić lokalne/Netlify i sprawdzić rzeczywisty SHA wydania.
10. **Handoff:** zaktualizować `docs/CCNA.md` oraz w tym planie ostatnio zweryfikowaną podsekcję, liczniki, źródła, migracje, testy, blokady i **konkretny następny krok**. W następnym czacie najpierw sprawdzić stan, nie powtarzać gotowej pracy.

## F. Specjalny etap CCNA-C08: migracja zakresu egzaminacyjnego

Cisco v2.0 zmienia zarówno nazwy, jak i nacisk na **praktyczne diagnozowanie i konfigurowanie**. Po zakończeniu redakcji kursu Jeremy's IT Lab wykonać porównanie każdej pozycji oficjalnych blueprintów `v1.1` i `v2.0` z istniejącymi notatkami. **Nie zakładać, że brak jest już potwierdzony** — najpierw audyt.

Priorytetowo sprawdzić: diagnostykę interfejsów i okablowania, IPv4/IPv6 oraz DHCPv4 client/server/relay, WLAN i parametry klientów, VLAN/EtherChannel/LACP/Rapid PVST+, CDP/LLDP, rozszerzone `ping`/`traceroute`/`show`/packet capture, static routing, OSPFv2 **i OSPFv3**, HSRP/VRRP, AAA TACACS+/RADIUS, SFTP/SCP, DNS rekordy A/AAAA/CNAME/MX/NS/PTR, VPN IPsec, ACL, RA Guard, Storm Control, SNMP, Syslog, Ansible oraz **agentic AI i dobór promptów z uwzględnieniem klasyfikacji danych**. Materiał wymagany przez Cisco, ale nieobecny w filmach, opracować jako **osobne autorskie uzupełnienie Cisco v2.0** ze źródłem, a nie fikcyjny fragment Jeremy's IT Lab.

## G. Jednoznaczne kryteria ukończenia

**Podsekcja = GOTOWA MERYTORYCZNIE**, gdy wszystkie ważne fakty z jej źródła są wyjaśnione; 100% obecnych pytań ma poprawną odpowiedź w **głównej notatce tej podsekcji**, a nie jedynie w generowanym dopisku; zakres jest poprawny; ID i postępy chronione; testy danych mają `PASS`; wymieniono znane ograniczenia. **WDROŻONA I PRZETESTOWANA** dopiero po dodatkowej wymaganej kontroli w działającej wersji.

**Dzień = GOTOWY**, gdy każda jego podsekcja spełnia kryteria, quiz jest uwzględniony, wpisy źródłowe i zakres czasowy są zapisane, a migracje kart są rozliczone.

**Cały kurs = GOTOWY**, gdy:
- istnieje pełne mapowanie wszystkich 63 Day i wszystkich aktualnie istniejących podsekcji;
- każde wymaganie v2.0 jest pokryte lub jawnie zidentyfikowane jako niewykonane — brak kategorii `NIEZNANE`;
- liczba kart, unikalność ID, odpowiedzi, importy i archiwa mają końcowy spójny audyt;
- wykonano testy lokalne, przeglądarkowe, odpowiednią regresję oraz kontrolę wersji `develop` na Netlify;
- `docs/CCNA.md` i ten plan zawierają ostateczny stan;
- nie uszkodzono pozostałych aplikacji, postępu użytkowników ani osobnych laboratoriów.

## H. Rejestr postępu — aktualizować po każdej partii

**Day 02 — osobne ostatnie zadanie praktyczne (31.10.2026):** decyzją właściciela dopisano po teoretycznej 1.6, przed egzaminem sekcji, odrębne `topologia-laboratorium` *Connecting Devices — Packet Tracer Lab* z nagraniem `K6Qt23sY68Y`. To wyraźny wyjątek od odkładania laboratorium Day 02 poza sekcję, lecz nie oznacza laboratorium w notatce którejkolwiek z 1.1–1.6. Kod `develop`: 16 urządzeń, 17 przewodów i 18 warunków oceny, instruowana notatka bez komend CLI (w filmie ich nie używano), link do społecznościowej kopii .pkt i oryginalnej strony Jeremy's IT Lab. Test w izolowanym V8: 17 linków UP, 18/18 kryteriów PASS, błędny kabel FAIL; zapisano testy regresyjne. Natywny Node/JSDOM, pełny `npm run verify`, przeglądarka i Netlify: **NOT_RUN**, zatem **kod w develop, nie ukończony odbiór wdrożenia**. Nie zmieniano teorii, quizu sekcji ani masterplanu.


**Day 02, quiz końcowy (31.10.2026, partia `CCNA-C01-20261031-D02-QUIZ01`):** zgodnie z najnowszym zleceniem właściciela **pięć pytań z quizu filmowego [28:02–35:10] ma występować wyłącznie w egzaminie zbiorczym sekcji**, oznaczonych `examQuestion:true`. Cztery istniejące ID przeniesiono (bez duplikacji i z ochroną dawnych kluczy postępu), piąty scenariusz Auto MDI-X dodano pod `day02-quiz-final-04`. Egzamin sekcji 25 pytań zawsze zawiera komplet pięciu kart, a pozostałe 20 jest losowane. Bilans **138 kart nauki + 5 tylko egzaminacyjnych = 143 w egzaminie sekcji**. Mapy nauki 138/138, kontrola algorytmu 20/20 i izolowana składnia **PASS**; pełne `node --test`, `check:ccna`, `verify`, przeglądarka i Netlify **NOT_RUN**. Commity `21b36d9`, `973bd8a`, `6780ae3`. Do końcowego odbioru sekcji konieczna regresja i test użytkownika; status **KOD W DEVELOP / ODBIÓR OTWARTY**. Wcześniejszy bilans 142/142 jest historyczny i nie jest nowym wymaganym licznikiem.



**1.6 / Day 02 i cała sekcja 1 (31.10.2026, `develop`):** merytorycznie opracowano notatkę **Selecting Transmission Media by Distance** ze źródła Jeremy's IT Lab Day 02 (26:28–28:02, quiz 28:02–35:10), zachowano 9 historycznych ID. Dodano **5 bloków `data-ccna-topic`**, ręczną mapę 9/9 kart i poprawiono 27 wariantów błędnych odpowiedzi bez naruszania poprawnych odpowiedzi ani postępów. Kontrola wszystkich **142 kart** w podsekcjach 1.1–1.6 i **42 bloków notatek**: mapa statyczna 142/142 i unikalność ID 142/142 **PASS**, 1.6 pytania 9/9 × 4 różne warianty **PASS**, składnia inline JS i pliku testowego **PASS** w izolowanym V8. Kod: `8c88bfc4921b5a98c53c8fe7318e7c8b4270c8f9`; test: `b06e15f9bded47347d20349f5f9a70c81716f8e6`. **Natywne Node/JSDOM, `npm run check:ccna`, `npm run verify`, test użytkownika i Netlify: NOT_RUN / formalny odbiór otwarty.** Następne działanie: pełny test wszystkich sześciu podsekcji, zachowania postępów i egzaminu sekcji, następnie zbiorcze wydanie testowe zgodne z `AGENTS.md`; dopiero po tej bramce można oznaczyć sekcję jako wdrożoną i przetestowaną. Kolejny dzień lekcji po odbiorze: Day 01 (jeśli nadal brakuje jego pełnego przeglądu), potem Day 03 bez ponownego opracowania Day 02.



**1.1–1.5 — nowy audyt jakości (31.10.2026, partia `CCNA-C01-20261031-QG-01`):** 133/133 pytań powiązano z 37 autorskimi blokami głównych notatek (33/9, 41/12, 12/5, 34/6, 13/5). Zmodernizowano 52 importy 1.1–1.3 (22/26/4), w tym trzy niezgodne odpowiedzi luk i warunek zadania `lu-01`; 20 wcześniejszych korekt 1.4 zachowano. Kod i testy na `develop` (commity `5de20ac`, `41900e4`, `44c1b03`). Izolowany audyt map, wariantów, składni: PASS, bez błędów. **Node/JSDOM, `check:ccna`, `verify`, przeglądarka, SHA Netlify: NOT_RUN. Status: KOD W DEVELOP / PEŁNY ODBIÓR OCZEKUJE.** Poprzednie opisy audytów należy czytać jako stan historyczny sprzed tej partii; nie uruchamiać powtórnej przebudowy tych samych 133 pytań.

**1.5 / Day 02 (31.10.2026):** Wprowadzono poprawki do kodu `develop`, uzupełniono mapę 13 pytań do pięciu bloków notatki i dodano regresję. Status: kod zapisany, pełne testy Node/Netlify otwarte. Szczegóły w `docs/CCNA.md`. Następny temat: zakończony kodowo 1.6; do odbioru pełny test sekcji 1.1–1.6.


**1.3 — historyczny audyt:** [raport 12 kart / 5 bloków](./audits/ccna-1-3-grounding-audit-2026-10-31.md). Wskazane wcześniej usterki `ocg-2016`, `lu-01` i jakości importów poprawiono później w partii **CCNA-C01-20261031-QG-01**. Pełne testy uruchomieniowe nadal otwarte.

**1.4 — audyt → implementacja w tej samej sesji (31.10.2026):** [audyt początkowy 34 kart](./audits/ccna-1-4-grounding-audit-2026-10-31.md). W kodzie `develop` commit `2f097fe5e4e5b2dc3a263de465ae11ad5c9c20e4` wprowadził sześć autorskich bloków notatki, jawne mapowanie **34/34** ID (14 lokalnych i 20 importów), uzupełnienia GBIC i SFP+, poprawne rozwinięcie SFP, doprecyzowane zasięgi JITL/Cisco oraz spójne warianty odpowiedzi i polskie polecenia dla 20 importów. Dotychczasowe ID, `questionEn`, postępy i zakres są zachowane. Test `tests/ccna-day02-content-scope.test.cjs` rozszerzono o dwie kontrole w commicie `e69ca824d3b07739bd216b5a233ecb8584032016`. Izolowana kontrola składni i mapy: **PASS** (34 unikalne ID, 6/6 bloków, 20/20 reguł korekt). **Node/JSDOM, pełne `npm run verify`, prawdziwa przeglądarka i Netlify: `NOT_RUN` / brak pełnego checkoutu i publikacji.** Status: **KOD W DEVELOP, TESTY URUCHOMIENIOWE I NETLIFY OCZEKUJĄ**. Następny krok: natywne testy i zbiorcza publikacja testowa; nie deklarować wydania z samego commita.

**Statusy:** `DO ZROBIENIA`, `W TRAKCIE`, `GOTOWE MERYTORYCZNIE / TESTY OTWARTE`, `WDROŻONE I PRZETESTOWANE`, `BLOCKED_SOURCE`, `BLOCKED_TEST`.

| Pole | Wymagana informacja |
|---|---|
| Ostatni zakończony zakres | Day, numer i **trwałe ID** podsekcji oraz dokładny status |
| Źródło | film / notatka / Cisco URL i zakres czasowy |
| Pytania | liczba przed/po; nowe ID, przeniesione ID, ID archiwalne |
| Mapa notatki | liczba bloków, liczba kart powiązanych, brakujące ID |
| Walidacja | wynik każdego uruchomionego testu lub `NOT_RUN` |
| Wydanie | commit `develop`, opcjonalnie osobno SHA Netlify |
| Następne zadanie | jeden konkretny Day / podsekcja; nie powtarzać gotowych |
| Zależności | brakujące źródło, kolizja równoległa, problemy licencyjne |

**Dodatkowa korekta źródła (31.10.2026):** commit `66ff91887ca04b397f205333b2bde7f97975bdcf` poprawia także **kanoniczne obiekty importów** `ocg-2010` (SFP) i `ocg-2009` (GBIC), a nie tylko odpowiedzi wyświetlane po uruchomieniu aplikacji. Commit `6db6817abd0d367b2447d25a62f31bf192c29aa8` dopisuje do notatki właściwe źródło Cisco dotyczące GBIC/SFP/SFP+. Oryginalne `questionEn`, ID i postępy nie zostały zmienione. Składnia inline po tych zmianach: **PASS w izolowanym V8**. Pełny Node/JSDOM i Netlify nadal wymagają osobnej weryfikacji.

**Najnowszy status wykonawczy (31.10.2026):** Podsekcje 1.4 i 1.5 mają zmiany w `develop`, lecz nie zostały jeszcze odebrane w pełnych testach Node ani na Netlify. Usterki 1.3 zostały później poprawione, a 1.6 opracowano w kodzie; aktualna bramka to uruchomieniowa regresja 1.1–1.6 i Netlify.

**Stan na utworzenie planu (31.10.2026):** **ostatnio opracowany temat to Day 02 / 1.3 Auto MDI-X z mapą 12 pytań**; wcześniejsze prace objęły również teorię 1.4–1.6, a mapy bloków w 1.1–1.2. **Najbliższe zadanie:** sprawdzić aktualny HEAD `develop` i brakujące ręczne mapowania/notatki 1.4–1.6; zakończyć weryfikację Day 02, następnie zinwentaryzować Day 01 i przejść kolejno do Day 03–63. Jeśli nowszy commit już wykonał tę pracę, odczytać go i przejść dalej, bez powtórzeń.

**Nie łączyć z masterplanem WIE.** W masterplanie jest tylko odsyłacz do niniejszego planu; szczegółowe statusy CCNA trzymamy tutaj oraz w `docs/CCNA.md`.

**Wydanie testowe laboratorium Day 02 (31.10.2026):** cztery nowe scenariusze regresyjne uruchomiono na rzeczywistych modułach projektu w izolowanym V8: **4/4 PASS**, w tym błędny, brakujący i dodatkowy przewód. 16 urządzeń, 17 połączeń UP, 18/18 kontroli oraz odrębne ostatnie zadanie za 1.6. Natywny Node, JSDOM, `npm run verify` i pełna przeglądarka w tej sesji nadal NIEURUCHOMIONE; zlecono zbiorczą publikację **wyłącznie podglądu Netlify develop**, aby móc sprawdzić wdrożony stan. SHA i wynik publikacji należy ustalić z `build-info.json`, a nie z tego zapisu.

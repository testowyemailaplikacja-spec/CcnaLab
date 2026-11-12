# Wspólne laboratoria CCNA

Zakładka **Laboratorium sieciowe** jest dostępna we wszystkich **127 tematach w 50 działach CCNA**. Menu **Tematy / laboratoria** pozwala przechodzić między ćwiczeniami. Pokrewne podtematy korzystają ze scenariusza swojego działu; każdy temat ma niezależny stan, topologię i zapis. Instrukcje, adresacja i kryteria oceny są w pracowni. Tematy koncepcyjne (np. AI/ML, chmura, Ansible) mają ćwiczenia analityczne lub konfiguracyjne i jasno opisany zakres.

Przykładowe adresy:

- `/apps/ccna/sekcja/ccna-ospf/temat/anki-ospf/?tryb=packet-lab`
- `/apps/ccna/sekcja/ccna-vlans/temat/lab-vlans-part3-day18/?tryb=packet-lab`
- `/apps/ccna/sekcja/przelaczanie-ethernet-czesc-2/temat/laboratorium-analiza-przelaczania-ethernet/?tryb=packet-lab`

W **Tematy / laboratoria** wybierz również jeden z pięciu dodatkowych wariantów. Wyszukiwanie działa po nazwie ćwiczenia. Wariant ma oddzielny zapis i nie nadpisuje podstawowego laboratorium danego tematu.

| Dział | Ćwiczenie | Parametr `tryb` |
|---|---|---|
| OSPF | DR/BDR, FULL/2-WAY, niezgodne timery i MTU, naprawa sąsiedztwa | `packet-lab:ospf-broadcast` |
| DHCP | Zdalny serwer, `ip helper-address`, giaddr, brak trasy powrotnej | `packet-lab:dhcp-relay` |
| NAT | Pula dynamiczna, wyczerpanie adresów i przejście na PAT | `packet-lab:nat-pool` |
| IPv6 | SLAAC, RA, EUI-64, brama link-local i trasy z zakresem interfejsu | `packet-lab:ipv6-slaac` |
| Konfiguracja WLAN | WLC GUI, interfejs/VLAN, SSID, WPA2-PSK, klient i AP | `packet-lab:wlc-wlan` |

Przykład: `/apps/ccna/sekcja/ccna-wireless-config/temat/anki-wireless-config/?tryb=packet-lab:wlc-wlan`. Kontroler otwiera zakładkę **GUI**. PC3 może też wejść przez **Desktop → Web Browser → https://10.0.10.2**; wymagana jest rzeczywista osiągalność IP/ACL w modelu laboratorium. W IPv6 przycisk **Auto Config (SLAAC)** i `ipconfig /renew6` pobierają prefiks z dostępnego routera.

To edukacyjny symulator w przeglądarce, **nie pełny Cisco Packet Tracer ani emulacja firmware IOS**. Nie otwiera plików `.pkt` / `.pka`. Nie deklaruje obsługi wszystkich urządzeń i poleceń Cisco. Komendy niezaimplementowane zwracają błąd. Wszystkie zaimplementowane narzędzia są dostępne w każdym temacie; możliwości interfejsu zależą również od profilu urządzenia (np. przełącznik L2 nie ma routingu L3).

## Przygotowywanie nowych laboratoriów — obowiązkowe notatki

Każde kolejne laboratorium oparte na materiale wideo wymaga własnej notatki zgodnej z [procedurą kursu](../../../docs/CONTENT_PIPELINE.md). Najpierw umieść wszystkie **rzeczywiście użyte komendy** (Cisco IOS i hosta), z dokładną składnią, właściwym urządzeniem i trybem, opisem działania oraz spodziewanym wynikiem; jeśli materiał nie używa CLI, napisz wprost „Komendy Cisco IOS CLI: brak” i podaj użyte narzędzia. **Poniżej** opisz krok po kroku sposób wykonania zadania i kryteria zaliczenia, a **na dole** daj sprawdzony odnośnik do odpowiedniego pliku `.pkt/.pka` lub informację, że bezpośrednie pobranie nie jest możliwe. Plik Packet Tracer nie jest formatem importowym tego symulatora. Nie dodawaj fikcyjnych komend z innych lekcji, nie kopiuj nieautoryzowanych materiałów i testuj dokładny scenariusz plus błędny wariant.

## CLI

Jeden rejestr składni jest źródłem wykonywania poleceń, skrótów, pomocy i uzupełniania. Ponad 300 składni obejmuje tryby EXEC, privileged EXEC, konfigurację globalną, interfejs/zakres, VLAN, line, OSPF/RIP, DHCP, ACL i QoS. Rejestr jest dostępny w **Narzędzia → Zakres funkcji**.

- Jednoznaczne skróty słów kluczowych: `en`, `conf t`, `sh ip int br`, `int ran fa0/1 - 4`, `no sh`, `do sh run`, `wr`, `copy run start`.
- `en` działa także w privileged EXEC. `e` jest niejednoznaczne; w global config `en` koliduje z `enable` i `end`.
- `?` uwzględnia bieżący tryb i wpisany prefiks; Tab uzupełnia słowa kluczowe. Historia, Ctrl+Z, anulowanie pytania Ctrl+C oraz wklejanie wielu poleceń.
- Tryby, `hostname`, opisy, zakresy interfejsów, running/startup-config, zapis, reload, erase z potwierdzeniem, hasła enable i konsoli, lokalni użytkownicy, banner, konfiguracja VTY/SSH.
- `show` odczytuje stan urządzeń i protokołów; filtry include/exclude/begin/section. `section` ma uproszczone działanie: od dopasowanej linii do końca wyniku.
- Hasła wpisywane w pytaniu nie trafiają do historii i są maskowane. Type 7 jest odtwarzany dla `service password-encryption`; sekrety w `show running-config` są opisane komentarzem zamiast pozornego hasha IOS. Stan JSON przechowuje poświadczenia ćwiczeniowe do odtworzenia lokalnych sesji — nie jest magazynem rzeczywistych haseł.

## Zakres modelu sieci

| Obszar | Działające zachowanie | Granica modelu |
|---|---|---|
| Ethernet | MAC learning, known/unknown unicast, broadcast, ARP, shutdown, Auto MDI-X, liczniki, prędkość i dupleks | Model logiczny; błędy przy duplex mismatch są deterministyczne, a nie fizycznie mierzone |
| VLAN | access, trunk 802.1Q, native/allowed VLAN, subinterfejsy, SVI i routing L3 na odpowiednim switchu | Bez ISL, private VLAN, voice VLAN i QinQ |
| STP/RSTP | root ID, koszt, role Root/Desg/Altn, blokowanie pętli, zmiana ścieżki, BPDU Guard, Root Guard | Stan po zbieżności; brak timerów i wymiany BPDU, listening/learning, synchronizacji RSTP, Loop Guard |
| DTP/VTP | auto/desirable/trunk, nonegotiate, VTP v1/v2 domain/password/revision i synchronizacja server/client | Bez przekazywania VTP przez transparent i pruning |
| EtherChannel | LACP, PAgP, static on, zgodność członków, STP na kanale, awaria członka | Bez haszowania strumieni i pomiaru pasma |
| IPv4 | bramy, connected/local/static/default/floating routes, recursive next hop, LPM, TTL i nowe MAC na każdym skoku | Brak fragmentacji, checksum, proxy ARP dla tras wyjściowych Ethernet i ECMP |
| OSPF/RIP | DR/BDR bez wywłaszczania, awaria DR, FULL/2-WAY/EXSTART, priority/router ID, broadcast/p2p, koszt/ref-bandwidth, loopback /32, MTU/mtu-ignore, timery, simple auth, passive default z wyjątkami, wybór i wycofanie tras | Model jednoobszarowej zbieżności; pokazuje przyczyny i przejścia stanów, bez pełnej wymiany LSA, pakietowych timerów i OSPF wieloobszarowego; bez EIGRP/BGP |
| IPv6 | link-local auto/manual, zakres interfejsu dla next hop/ping/NDP, statyczne trasy, SLAAC EUI-64, RS/RA, DAD, brama i lifetime, suppress-ra, ICMPv6 i Hop Limit | RA odświeżane przy przesunięciu zegara, nie przez pełny harmonogram pakietów; NDP ma uproszczone kodowanie multicast; brak DHCPv6 i OSPFv3 |
| FHRP | HSRP v1: VIP, wirtualny MAC, wybór dostępnego routera według priorytetu/IP, awaria | Bez timerów i historycznego stanu preemption; bez VRRP/GLBP |
| ACL | standard/extended, numbered/named, src/dst/wildcard, protokół, port eq, in/out, liczniki, implicit deny | Bez pełnego zestawu operatorów i stateful inspection |
| NAT | static, dynamic pools, PAT z puli lub interfejsu; translacje IP, TCP/UDP portów i identyfikatorów ICMP, odpowiedzi do właściwego klienta, wyczerpanie puli, liczniki i wygasanie | Testy pakietów są wykonywane sekwencyjnie; bez pełnych sesji TCP, NAT64 i zewnętrznego ruchu Internetu |
| DHCP / DAI | pule, exclusions, gateway/DNS, giaddr, helper/relay przez routing i ACL UDP 67 w obu kierunkach, klient DHCP na IOS, release/renew, snooping/trusted uplink, kontrola ARP | DORA i relay pokazują transakcję; dzierżawy odnowione/wygaszane przy przesuwaniu czasu, bez pełnego harmonogramu retransmisji i Option 82 |
| Port Security | maximum, sticky, jawny MAC, protect/restrict/shutdown i odzyskanie portu | Ograniczony model liczników naruszeń |
| Usługi | DNS A, HTTP, TFTP backup, Syslog, SNMP sysName.0, NTP source availability, sesje SSH/Telnet | Transakcje aplikacyjne przechodzą przez model IP i ACL z odpowiednim TCP/UDP/portem; bez handshake, retransmisji, okien TCP, kryptografii SSH, synchronizacji zegara i FTP |
| QoS | klasyfikacja, oznaczanie DSCP, licznik polityki | Bez kolejek, shaping, policing i pomiarów przepustowości |
| WAN / WLAN | DCE clock, zgodność PPP/HDLC; SSID/WPA2-PSK, wielu klientów AP, komunikacja w tym samym VLAN, izolacja WLAN VLAN | Bez negocjacji PPP, MPLS, VPN, fal radiowych, zasięgu, roamingu i rzeczywistej kryptografii WPA |
| WLC | GUI Monitor/Interfaces/WLANs/Wireless/Clients, management IP/VLAN, interfejs klienta, enabled/SSID/PSK/AES/QoS, AP join przez osiągalność UDP 5246, FlexConnect local switching/local authentication i Standalone | GUI edukacyjne w stylu AireOS; bez pełnego CAPWAP/DTLS, centralnego tunelu danych, RADIUS/802.1X, roamingu i emulacji wszystkich ekranów kontrolera. Profil QoS jest metadanymi, bez kolejek |
| Narzędzia | inwentarz JSON/XML/YAML, zbiorcze CLI, lokalne GET/PATCH i kody HTTP | Bez zewnętrznego RESTCONF, Ansible/Puppet/Chef/Terraform, chmury i wykonywania AI/ML |

Pomoc scenariusza wskazuje dodatkowe ograniczenia dotyczące ćwiczonego zagadnienia. Widok Physical pokazuje profile portów i szafę, bez modelu budynków. Zegar, opóźnienia i wymiana ruchu są symulowane.

## Urządzenia i przewody

22 jawne profile: 2960-24TT, 2950-24, 2950T-24, 3560-24PS, 3650-24PS, Switch-PT; 1841, 2621XM, 2811, 1941, 2901, 2911, 4321, 4331, Router-PT; PC-PT, Laptop-PT, Server-PT, Hub-PT, AccessPoint-PT; lightweight AP 3702i i WLC-2504.

Każdy profil ma określone interfejsy. Routery 1841/2621XM/2811/1941/2901/2911 pozwalają dołożyć profil WIC-2T/HWIC-2T przy wyłączonym zasilaniu. Profile nie odtwarzają wszystkich slotów, licencji, obrazów IOS, modułów i wariantów sprzętowych. ASA i IoT nie są implementowane.

Przewody: miedziany prosty/krosowany, konsolowy RS232–Console, serial DCE/DTE, profil światłowodowy GE, skojarzenie Wireless. Zajęte i niezgodne porty są odrzucane; radio AP przyjmuje wielu klientów. Limit: 64 urządzenia / 128 połączeń w jednym stanie.

## Architektura i zapis

- `devices.js`: profile i domyślny stan sprzętu.
- `ethernet.js`: bazowy model Ethernet i oryginalna ocena Day 6.
- `engine.js`: wspólny model L2/L3, usługi i migracja stanu.
- `cli.js`: rejestr składni, parser prefiksów i interpreter.
- `protocols.js` / `protocol-cli.js`: rozszerzenia OSPF, DHCP relay, NAT pools i IPv6/SLAAC.
- `wireless.js` / `wlc-ui.js`: WLC, managed AP, lokalne przełączanie VLAN i interfejs kontrolera.
- `curriculum.js`: mapa 50 działów i 127 istniejących tematów.
- `scenarios.js`: scenariusze, topologie, instrukcje, kryteria i lokalne API ćwiczeniowe.
- `scenario-extensions.js`: pięć dodatkowych wariantów, diagnostyka i kryteria oceny.
- `lab.js` / `lab.css`: interfejs z Logical/Physical, CLI/Config/Desktop/Services, paletą, symulacją i oceną.
- `integration.js`: podłączenie do iframe, zakładki, przełączanie tematów i istniejący zapis konta.

Nie zmieniono notatek, pytań i egzaminów monolitu `legacy.html`. Stara zakładka pełnego symulatora IOS kieruje do wspólnej pracowni. Drobne trenażery w treści notatek pozostają osobnymi pomocami dydaktycznymi.

Klucz `ccna-packet-labs-v1` zachowuje istniejącą synchronizację konta. Kontener ma `{version:1, owner, labs}`; stany sieci mają `version:2, compact:true`. Zapis przechowuje różnice względem profilu domyślnego (około 160 kB dla wszystkich początkowych 127 tematów zamiast 4,4 MB). Zmiana tematu nie nadpisuje innych wpisów. Oryginalne ćwiczenie zachowuje klucz `ethernetDay6`. Import stanu v1 jest migrowany wraz ze startup-config. Tablice MAC/ARP, bieżące pakiety i logi są ulotne. Export/import JSON ma limit 2 MB i potwierdzenie zastąpienia ćwiczenia.

Dostęp jest sprawdzany na podstawie sesji i istniejącego stanu portalu, także dla bezpośrednich adresów. Zmiana konta zamyka pracownię. Stan jest oddzielony identyfikatorem użytkownika i tematu. Interfejs rozróżnia zapis lokalny i potwierdzenie synchronizacji. Service worker v10 uwzględnia nowe moduły oraz aktualne pliki portalu.

## Weryfikacja

Z katalogu repozytorium, bez zależności:

```sh
node --test --test-isolation=none --test-reporter=spec apps/ccna/packet-lab/engine.test.cjs apps/ccna/packet-lab/extended.test.cjs apps/ccna/packet-lab/protocols.test.cjs
```

71 testów: dotychczasowe 43 przypadki oraz 28 dotyczących OSPF DR/BDR i błędów sąsiedztwa, DHCP relay/ACL/lease/restore/manual, NAT pools/PAT TCP/UDP, SLAAC/link-local/RA/DAD, WLC/AP/VLAN/PSK, awarii kontrolera, komunikacji klientów i osobnych zapisów wariantów.

Testy przeglądarkowe wymagają Playwright oraz Chromium. Nie używają prawdziwego konta: logowanie i baza są lokalnymi atrapami, a żądania zewnętrzne są przechwytywane.

```sh
node apps/ccna/packet-lab/tests/browser-ethernet.cjs
node apps/ccna/packet-lab/tests/browser-topics.cjs
node apps/ccna/packet-lab/tests/browser-protocols.cjs
node apps/ccna/packet-lab/tests/browser-frame-ready.cjs
```

Opcjonalne zmienne: `CCNA_LAB_PLAYWRIGHT` (ścieżka modułu), `CCNA_BROWSER_PATH` (plik Chromium), `CCNA_LAB_REPORT_DIR` (katalog wyników). Każdy test sam uruchamia serwer statyczny na wolnym porcie. Sprawdzono Ethernet 15/15 oraz OSPF, DHCP, DNS/HTTP, WLAN, REST, formaty danych i konfigurację zbiorczą na 100%; odtworzenie i rozdzielenie zapisów, import/export, gościa/wylogowanie, UI 1366×768, 834×1112, 390×844 i 360×740. Brak błędów JavaScript. Synchronizacja produkcyjnej bazy nie była testowana z rzeczywistym kontem.

Dodatkowe pięć ćwiczeń sprawdzane jest w `browser-protocols.cjs`: pełne wykonanie i ocena 100%, celowe błędy i naprawy, formularze WLC przez PC Web Browser, SLAAC przez GUI, powrót do zapisanych wariantów oraz WLC na 834/390/360 px. Zakres funkcji i ograniczenia są widoczne także w aplikacji.

`browser-frame-ready.cjs` wymusza zakończenie ładowania ramki przed pobraniem integracji i nawigacji. Sprawdza bezpośredni link do laboratorium, zmianę ćwiczenia, przycisk Wstecz, ponowne załadowanie ramki i brak wielokrotnej inicjalizacji.

## Źródła zachowania

- [Cisco: CLI basics, tryby, skróty i pomoc](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/configuration/xe-16/fundamentals-xe-16-book/cf-cli-basics.html).
- [Cisco: diagnostyka sąsiedztw OSPF](https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13699-29.html) i [EXSTART/MTU](https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13684-12.html).
- [Cisco: FlexConnect, local switching/authentication i Standalone](https://www.cisco.com/c/en/us/td/docs/wireless/controller/8-5/config-guide/b_cg85/flexconnect.html).
- [Cisco: zakres egzaminu CCNA 200-301 v1.1](https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf).
- [Cisco: STP na Catalyst 2960](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/12-2_58_se/configuration/guide/2960scg/swstp.html).
- [Cisco: Auto MDI-X](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-2_2_e/configuration/guide/b_1522e_2960_2960c_2960s_2960sf_2960p_cg/b_1522e_2960_2960c_2960s_2960sf_2960p_cg_chapter_01000.html).
- [Cisco: 1941](https://www.cisco.com/c/en/us/products/collateral/routers/1900-series-integrated-services-routers-isr/data_sheet_c78_556319.html), [2900](https://www.cisco.com/c/en/us/products/collateral/routers/2900-series-integrated-services-routers-isr/data_sheet_c78_553896.html), [4000](https://www.cisco.com/c/en/us/products/collateral/routers/4000-series-integrated-services-routers-isr/data_sheet-c78-732542.html) — bazowe nazwy i profile portów.
- Scenariusze opracowano dla mapy tematów obecnej aplikacji; oryginalna topologia Day 6 pochodzi z notatki `ETHERNET_LAB` w `legacy.html`.

## Dostęp gościa do laboratorium Day 02

Podczas tymczasowego udostępnienia nauki CCNA bez logowania (WIE-007) osobne ćwiczenie `interfejsy-sieciowe-i-okablowanie:topologia-laboratorium` można uruchomić także jako gość. Stan zadania jest przechowywany **tylko lokalnie** w kluczu `ccna-day02-connecting-devices-guest-v1`; nie wysyła żądań synchronizacji i nie odczytuje stanu konta. Po zalogowaniu konto korzysta ze swojego dotychczasowego magazynu `ccna-packet-labs-v1`. Inne laboratoria zachowują dotychczasowe reguły dostępu. Test przeglądarkowy powinien objąć wejście gościa, budowę części połączeń, przeładowanie i przywrócenie stanu oraz poprawną ocenę zadania.

## Day 02: osobne laboratorium końcowe sekcji pierwszej (31.10.2026)

Na wyraźne życzenie właściciela `topologia-laboratorium` wraca jako **osobne ostatnie zadanie praktyczne**, za sześcioma teoretycznymi podsekcjami. `scenarios.js` inicjalizuje 16 urządzeń bez przewodów, w układzie dwóch lokalizacji jak w filmie Jeremy's IT Lab [Day 02 Lab](https://www.youtube.com/watch?v=K6Qt23sY68Y). Wymagana jest poprawna lista 17 połączeń i brak nadmiarowych kabli; kryteria obejmują 18 kontroli. Brak komend IOS, brak IP/routingu. Łącza Fiber odpowiadają MMF 250 m i SMF 3 km w opisie, lecz symulator ma jeden typ Fiber, jak Packet Tracer użyty w nagraniu. Porty Ethernet na starcie są włączone, Auto MDI-X wyłączony. W notatce kursowej na końcu jest zewnętrzny link do pliku `.pkt` oraz oficjalnego źródła autora; przeglądarkowy symulator nadal importuje tylko swój JSON. Test `tests/ccna-day02-connecting-devices-lab.test.cjs` i utrzymany `tests/ccna-day02-content-scope.test.cjs` są docelową ochroną tej funkcji. Pełny test z Node i w przeglądarce oraz publikacja wymagają odrębnego potwierdzenia.

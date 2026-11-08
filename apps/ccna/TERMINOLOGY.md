# Słownictwo kursu CCNA

Objaśnienia, instrukcje i opisy przyczyn piszemy po polsku. Nazwy urządzeń, mediów, pól, mechanizmów, protokołów i stanów pozostają po angielsku, zgodnie z materiałami Cisco i komunikatami IOS. Skróty rozwijamy po angielsku.

## Nazwy stosowane w kursie

| Obszar | Przykłady |
|---|---|
| Urządzenia | router, switch, Layer 2 switch, multilayer switch, access point (AP), wireless LAN controller (WLC), hub, server |
| Okablowanie | straight-through cable, crossover cable, rollover cable, console cable, twisted-pair cable, single-mode fiber (SMF), multimode fiber (MMF), SFP transceiver |
| Dane i adresowanie | Ethernet frame, IP packet, IPv4 header, payload, trailer, source MAC address, destination MAC address, source IP address, destination IP address, subnet mask, network address, broadcast address |
| Przekazywanie danych | MAC address table, ARP table, routing table, default gateway, default route, static route, next hop, exit interface, flooding |
| Mechanizmy i stany | encapsulation, decapsulation, autonegotiation, full-duplex, half-duplex, access port, trunk port, root bridge, root port, designated port, Blocking, Listening, Learning, Forwarding |
| Interfejsy i polecenia | command-line interface (CLI), graphical user interface (GUI), nazwy portów FastEthernet/GigabitEthernet i rzeczywiste polecenia IOS |

Polskie zdanie może odmieniać nazwę urządzenia, np. „na switchu” lub „port routera”. Nazwa bazowa pozostaje angielska. Nie wprowadzamy równoległych nazw „przełącznik”, „kabel prosty” i „światłowód jednomodowy” w etykietach technicznych. Polskie znaczenia w osobnym słowniczku pozostają po polsku, ponieważ wyjaśniają angielskie hasła.

Przykład: „Switch odczytuje destination MAC address z Ethernet frame. Jeśli zna właściwy port, przekazuje frame przez ten port. Jeśli adresu nie ma w MAC address table, wykonuje flooding w danym VLAN, pomijając port wejściowy.”

## Pytania i zachowanie danych

Pytania autorskie i objaśnienia są po polsku z angielskimi terminami. Importowane pytania do treningu egzaminacyjnego zachowują oryginalne `questionEn`, z których tworzone są pełne polecenia widoczne dla uczącego się. Dla samych skrótów generowane jest „Rozwiń skrót…”, dla luk — „Uzupełnij…”, a kompletne pytania techniczne zachowują znaczenie źródła. Znacznik „Pytanie egzaminacyjne” jest oddzielną etykietą ponad pytaniem, nie jego częścią. Nie zmieniamy poleceń IOS, stanów, adresów ani identyfikatorów pytań. Fiszki, przegląd i testy korzystają z tej samej treści pytania.

`data/terminology.js` stosuje wspólną terminologię do gotowych danych **po** istniejącym rozdzieleniu importowanych pytań między tematy i **przed** pierwszym renderowaniem. Dzięki temu zmiana nazw nie wpływa na klasyfikację pytań, deduplikację, linki i zapis postępu. Znaczniki HTML, ich atrybuty, URL oraz bloki `code`/`pre` są chronione. Opisy i komunikaty ćwiczeń w `packet-lab/` oraz trenerach legacy używają tych samych nazw.

Nowe treści należy od razu pisać według tej zasady. Jeśli pojawia się nowy wariant nazwy, uzupełnić słownik i przeczytać wynikowe zdania. Nie stosować globalnego zastępowania tekstu w całym kodzie ani w systemie tłumaczeń portalu.

## Weryfikacja aktualizacji

Uruchomić `node --test tests/ccna-course.test.cjs`, `npm run check:ccna` oraz `npm run check:quick`. Pełny Public site audit pozostaje końcową kontrolą wdrożenia. Test kursu sprawdza zachowanie struktury i identyfikatorów, niezmienność oryginalnych pytań EN oraz zgodność poprawnych odpowiedzi z wariantami. Nowy słownik jest także dostępny w pakiecie offline.

Źródła nazewnictwa sprawdzone 4.10.2026: [Cisco — 200-301 CCNA](https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccna.html), [Cisco — połączenia console port i rodzaje kabli](https://www.cisco.com/c/en/us/support/docs/switches/catalyst-6000-series-switches/10600-9.html), [Cisco — zakres egzaminu CCNA](https://learningnetwork.cisco.com/s/ccna-exam-topics).

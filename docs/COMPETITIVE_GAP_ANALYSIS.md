# CCNAlab — audyt konkurencji i zgodności z Cisco (09.11.2026)
Status: analiza publicznej oferty i repozytorium; nie jest potwierdzeniem działania każdego ekranu.

## Oficjalna baza Cisco
- Oficjalny zakres v1.1: https://learningnetwork.cisco.com/s/ccna-exam-topics — 6 domen: Network Fundamentals 20%, Network Access 20%, IP Connectivity 25%, IP Services 10%, Security Fundamentals 15%, Automation and Programmability 10%.
- Cisco potwierdza koniec egzaminowania v1.1 dnia 02.02.2027 i początek v2.0 dnia 03.02.2027. Wersje muszą być osobno mapowane: https://www.cisco.com/web/go/ccna/ i https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf
- Cisco U: ścieżki, pre/post assessment, 31 labs i 22 assessments (stan katalogu sprawdzony 09.11.2026): https://u.cisco.com/certifications/ccna
- Packet Tracer/NetAcad: sprzęt wirtualny i topologie do pracy praktycznej: https://www.netacad.com/courses/exploring-networking-cisco-packet-tracer
- Dla IOS XE oraz konkretnych komend: oficjalna konfiguracja Cisco dla odpowiedniej wersji urządzenia; nie zakładać, że własny symulator obsługuje wszystkie opcje.

## Konkurencja
| Produkt | Publicznie opisane funkcje | Wniosek dla CCNAlab |
|---|---|---|
| Cisco U. | prowadzone ścieżki, wstępne/końcowe oceny i laboratoria | dołożyć macierz oficjalnych celów egzaminu, test diagnostyczny i indywidualne luki |
| Boson ExSim-Max | realistyczne egzaminy, odmierzanie czasu, objaśnienia i raport wyników po kategoriach | raport gotowości według domen + analiza błędnych dystraktorów i trendów |
| Boson NetSim | uruchamianie ćwiczeń, instrukcje, automatyczne Grade oraz Save As | jawne kryteria sprawdzania konfiguracji, częściowe zaliczenie i zapis stanu |
| Jeremy's IT Lab | wideo, fiszki Anki, Packet Tracer i quizy | wykorzystać dwie autoryzowane talie, quiz końcowy, laboratorium i mapę pokrycia w jednej procedurze |

Oficjalne strony: https://www.boson.com/exsim-max-practice-exams/ ; https://help.boson.com/netsim/getting-started ; https://courses.jeremysitlab.com/p/ccna .

## Zastane w repo CCNAlab (potwierdzone plikami, nie testem UI)
- Aplikacja kursu: apps/ccna/legacy.html, index.html, router.js i study-adapter.js.
- Fiszki/pytania: istniejące mechanizmy sekcji i question-pool-visibility.js.
- Symulator: apps/ccna/packet-lab/{engine,cli,protocols,scenarios,lab}.js oraz testy.
- Brak w tym repo przed audytem: AGENTS.md, obowiązkowego planu importu filmów, skryptu walidującego pełną paczkę i jawnej macierzy wersji Cisco. Dodano dokumentację/gate w osobnej zmianie.
- Nie stwierdzono w repo samodzielnego i sprawdzonego procesu automatycznego pobrania transkrypcji/obrazów YouTube i dwóch talii wraz z licencją. Nie oznaczać tej funkcji jako gotowej.

## Proponowana kolejka (nie wdrożona automatycznie)
P0: oficjalne coverage 200-301 v1.1 i v2.0, protokół G0–G6, kontrola dwóch talii, stabilne mapowanie ID, kompletne polskie/angielskie pytania i bezstratne agregaty.
P1: analiza odpowiedzi i trudnych dystraktorów, oryginalne diagramy z alt textem, raport braków w notatkach, testy każdego IOS command w Packet Lab.
P2: test diagnostyczny per domena, adaptacyjne powtórki i analiza trendów, grading częściowy i debug konfiguracji, tryb egzaminacyjny z ograniczeniem czasu (ponowne użycie istniejących elementów przed implementacją).
P3: rozszerzone typy pytań scenariuszowych / drag-and-drop / PBQ, zadania troubleshooting, pakiety offline/mobile, plan migracji v1.1 -> v2.0.

Nie kopiować cudzych płatnych baz pytań ani slajdów/zdjęć z filmu. Notatka, schematy i dystraktory są autorskie. Rozbieżności ze źródłem Cisco blokują wydanie danego tematu.
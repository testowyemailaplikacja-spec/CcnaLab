/* Audit of the public Jeremy's IT Lab CCNA course outline. Lab files remain on the author's site. */
(function (root, factory) {
  "use strict";
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.CcnaLabs=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const SOURCE="https://jitl.jp/ccna-files";
  const entry=(day,key,title,sectionId,subsectionId,scope,checks)=>Object.freeze({day,key,title,sectionId,subsectionId,scope,checks:Object.freeze(checks),sourceUrl:SOURCE});
  const labs=Object.freeze([
    entry(1,"packet-tracer-intro","Introduction to Packet Tracer","interfejsy-sieciowe-i-okablowanie","jitl-day-01-packet-tracer","Poznanie interfejsu Packet Tracera, rozmieszczanie urządzeń i zapis topologii.",["Dodaj urządzenia końcowe i sieciowe","Połącz urządzenia właściwymi mediami","Zapisz i ponownie otwórz projekt"]),
    entry(2,"connecting-devices","Connecting Devices","interfejsy-sieciowe-i-okablowanie","topologia-laboratorium","Dobór medium i portów do połączenia podstawowych urządzeń sieciowych.",["Rozpoznaj typy portów","Dobierz copper lub fiber","Sprawdź stan fizyczny łączy"]),
    entry(3,"osi-model","OSI Model","model-tcp-ip","laboratorium-osi-packet-tracer","Obserwacja enkapsulacji i przepływu PDU w trybie Simulation.",["Uruchom Simulation Mode","Prześledź kolejne warstwy","Porównaj PDU na każdym odcinku"]),
    entry(4,"basic-device-security","Basic Device Security","cisco-ios-cli","laboratorium-podstawowa-konfiguracja-ios","Podstawowa konfiguracja IOS, hasła, szyfrowanie i zapis konfiguracji.",["Ustaw hostname i enable secret","Zabezpiecz linie dostępu","Zapisz running-config do startup-config"]),
    entry(6,"ethernet-lan-switching","Ethernet LAN Switching","przelaczanie-ethernet-czesc-2","laboratorium-analiza-przelaczania-ethernet","Analiza uczenia MAC address table oraz przekazywania unicast i broadcast.",["Wyczyść dynamiczne wpisy MAC","Wygeneruj ARP i ICMP","Porównaj tablice przed i po ruchu"]),
    entry(8,"configuring-ipv4","Configuring IPv4 Addresses","adresowanie-ipv4-czesc-1","ipv4-lab-hosty-test-zapis","Konfiguracja adresów IPv4 na routerach i hostach oraz weryfikacja łączności.",["Ustaw adresy i subnet mask","Włącz interfaces","Zweryfikuj konfigurację i ping"]),
    entry(9,"switch-interfaces","Configuring Switch Interfaces","interfejsy-przelacznika","swif-lab-sw1-sw2","Konfiguracja stanu, prędkości, duplexu i opisów interfaces switcha.",["Skonfiguruj interface range","Sprawdź speed i duplex","Odczytaj liczniki błędów"]),
    entry(11,"static-routes","Configuring Static Routes","podstawy-routingu","routing-lab1-routing","Konfiguracja tras statycznych i default route dla pełnej łączności.",["Zaplanuj next hops","Dodaj trasy ip route","Sprawdź routing table i ping"]),
    entry(11,"troubleshooting-static-routes","Troubleshooting Static Routes","podstawy-routingu","routing-lab2-diagnoza","Diagnoza błędów adresacji, interfejsów i tras statycznych.",["Zlokalizuj przerwę w ścieżce","Porównaj routing tables","Napraw błędne lub brakujące trasy"]),
    entry(12,"life-of-a-packet","Life of a Packet","zycie-pakietu","pakiet-inspekcja","Śledzenie zmian headers warstwy 2 i zachowania adresów IP end-to-end.",["Zapisz source i destination MAC","Porównaj IP na kolejnych hopach","Wyjaśnij rolę ARP i default gateway"]),
    entry(15,"vlsm","VLSM","ccna-subnetting","lab-vlsm-day15","Projekt adresacji VLSM i routing pomiędzy zaplanowanymi podsieciami.",["Uszereguj wymagania hostów","Przydziel niepokrywające się prefixy","Zweryfikuj adresy sieci i broadcast"]),
    entry(16,"vlans-part-1","VLANs (Part 1)","ccna-vlans","lab-vlans-part1-day16","Tworzenie VLAN-ów oraz przypisywanie access ports.",["Utwórz wymagane VLAN-y","Przypisz access ports","Sprawdź show vlan brief"]),
    entry(17,"vlans-part-2","VLANs (Part 2)","ccna-vlans","lab-vlans-part2-day17","Konfiguracja trunków 802.1Q, native VLAN i listy allowed VLANs.",["Włącz trunking","Uzgodnij native VLAN","Zweryfikuj allowed VLANs"]),
    entry(18,"vlans-part-3","VLANs (Part 3)","ccna-vlans","lab-vlans-part3-day18","Inter-VLAN routing przez router-on-a-stick lub multilayer switch.",["Skonfiguruj subinterfaces albo SVIs","Włącz routing warstwy 3","Przetestuj ruch między VLAN-ami"]),
    entry(19,"dtp-vtp","DTP and VTP","ccna-dtp-vtp","lab-dtp-vtp-day19","Kontrolowana negocjacja trunków DTP i synchronizacja domeny VTP.",["Sprawdź tryby administracyjne i operacyjne","Uzgodnij parametry VTP","Zweryfikuj trunk i bazę VLAN"]),
    entry(20,"stp-analysis","Analyzing STP","ccna-stp","lab-stp-analysis-day20","Analiza wyboru root bridge, root ports i designated ports.",["Wyznacz root bridge","Porównaj path cost","Potwierdź role i stany portów"]),
    entry(21,"stp-configuration","Configuring STP","ccna-stp","lab-stp-config-day21","Sterowanie wyborem root oraz bezpieczne użycie PortFast i BPDU Guard.",["Ustaw primary lub priority","Włącz PortFast tylko na edge ports","Zweryfikuj ochronę przed BPDU"]),
    entry(22,"rapid-stp","Rapid STP","ccna-stp","lab-rstp-day22","Konfiguracja Rapid PVST+ i obserwacja rekonwergencji po awarii uplinku.",["Włącz rapid-pvst","Sprawdź alternate ports","Zmierz zmianę ścieżki po awarii"]),
    entry(23,"etherchannel","EtherChannel","ccna-etherchannel","lab-etherchannel-day23","Budowa EtherChannel z LACP, PAgP lub trybem statycznym.",["Uzgodnij parametry links","Skonfiguruj channel-group","Zweryfikuj bundle i Port-channel"]),
    entry(24,"floating-static-route","Floating Static Route","ccna-dynamic-routing","lab-floating-day24","Konfiguracja zapasowej trasy statycznej z wyższą administrative distance.",["Rozpoznaj trasę podstawową","Dodaj floating static route","Zasymuluj awarię i powrót"]),
    entry(25,"eigrp","Configuring EIGRP","ccna-dynamic-routing","jitl-day-25-eigrp","Uruchomienie EIGRP, ogłoszenie sieci i kontrola sąsiedztwa.",["Ustaw spójny autonomous system","Ogłoś właściwe sieci","Sprawdź neighbors i learned routes"]),
    entry(26,"ospf-part-1","OSPF (Part 1)","ccna-ospf","jitl-day-26-ospf-1","Podstawowa konfiguracja single-area OSPF i tworzenie sąsiedztw.",["Ustaw router ID","Aktywuj interfaces w area 0","Sprawdź neighbors i routes"]),
    entry(27,"ospf-part-2","OSPF (Part 2)","ccna-ospf","jitl-day-27-ospf-2","Dobór network type, kosztów OSPF i passive interfaces.",["Sprawdź OSPF interface","Dostosuj cost","Wyłącz niepotrzebne hellos"]),
    entry(28,"ospf-part-3","OSPF (Part 3)","ccna-ospf","jitl-day-28-ospf-3","Kontrola DR/BDR, default route i diagnostyka OSPF.",["Przeanalizuj election DR/BDR","Rozgłoś default route","Usuń mismatch blokujący sąsiedztwo"]),
    entry(29,"hsrp","HSRP","ccna-fhrp","jitl-day-29-hsrp","Zapewnienie redundantnej default gateway przy użyciu HSRP.",["Skonfiguruj virtual IP","Ustal active i standby router","Przetestuj failover gateway"]),
    entry(30,"wireshark","Wireshark Demo","naglowek-ipv4","iphead-wireshark","Bezpieczna inspekcja frames i packets w przechwyconym ruchu.",["Wybierz właściwy interface","Zastosuj filtr wyświetlania","Odczytaj Ethernet i IPv4 headers"]),
    entry(31,"ipv6-part-1","IPv6 (Part 1)","ccna-ipv6","jitl-day-31-ipv6-1","Konfiguracja podstawowej adresacji IPv6 i link-local addresses.",["Skróć i rozwiń adresy IPv6","Włącz ipv6 unicast-routing","Sprawdź interface addresses"]),
    entry(32,"ipv6-part-2","IPv6 (Part 2)","ccna-ipv6","jitl-day-32-ipv6-2","Adresacja global unicast, EUI-64 i działanie NDP.",["Skonfiguruj GUA","Zweryfikuj link-local i EUI-64","Obserwuj neighbor discovery"]),
    entry(33,"ipv6-part-3","IPv6 (Part 3)","ccna-ipv6","jitl-day-33-ipv6-3","Routing IPv6 oraz trasy statyczne i domyślne.",["Dodaj connected i static routes","Skonfiguruj ::/0","Sprawdź ping i routing table"]),
    entry(34,"standard-acls","Standard ACLs","ccna-acl","jitl-day-34-standard-acl","Filtrowanie ruchu według source IPv4 standardową ACL.",["Zapisz wymagania jako ACEs","Umieść ACL blisko destination","Zweryfikuj kolejność i hit counts"]),
    entry(35,"extended-acls","Extended ACLs","ccna-acl","jitl-day-35-extended-acl","Filtrowanie po protokole, source, destination i portach.",["Zbuduj precyzyjne ACEs","Umieść ACL blisko source","Sprawdź ruch dozwolony i blokowany"]),
    entry(36,"cdp-lldp","CDP and LLDP","ccna-cdp-lldp","jitl-day-36-cdp-lldp","Odkrywanie sąsiadów Cisco i urządzeń wielodostawczych.",["Odczytaj neighbors i details","Rozróżnij CDP od LLDP","Wyłącz protokół tam, gdzie zbędny"]),
    entry(37,"ntp","NTP","ccna-ntp","jitl-day-37-ntp","Synchronizacja czasu urządzeń i weryfikacja źródła czasu.",["Skonfiguruj NTP server","Sprawdź associations","Potwierdź synchronized status"]),
    entry(38,"dns","DNS","ccna-dns","jitl-day-38-dns","Rozwiązywanie nazw na urządzeniu IOS i hoście końcowym.",["Ustaw name server","Sprawdź lookup nazwy","Rozpoznaj błąd nazwy lub łączności"]),
    entry(39,"dhcp","DHCP","ccna-dhcp","jitl-day-39-dhcp","Przydzielanie parametrów IPv4 przez server i relay DHCP.",["Zdefiniuj pool i excluded addresses","Ustaw default-router i DNS","Zweryfikuj lease oraz relay"]),
    entry(40,"snmp","SNMP","ccna-snmp","jitl-day-40-snmp","Podstawowa konfiguracja monitoringu SNMP i interpretacja danych.",["Określ manager i agent","Skonfiguruj bezpieczny dostęp","Zweryfikuj odczyt wymaganych OID"]),
    entry(41,"syslog","Syslog","ccna-syslog","jitl-day-41-syslog","Centralne przesyłanie logów i dobór severity level.",["Ustaw logging host","Wybierz właściwy poziom","Potwierdź timestamp i odbiór zdarzeń"]),
    entry(42,"ssh","SSH","ccna-ssh","jitl-day-42-ssh","Bezpieczny zdalny dostęp CLI przez SSH.",["Ustaw hostname i domain name","Wygeneruj klucze RSA i usera","Ogranicz VTY do SSH i przetestuj login"]),
    entry(43,"ftp-tftp","FTP and TFTP","ccna-ftp-tftp","jitl-day-43-ftp-tftp","Kopiowanie konfiguracji i obrazów pomiędzy urządzeniem a serverem.",["Wybierz właściwy protokół","Sprawdź łączność i nazwę pliku","Potwierdź poprawne źródło i cel copy"]),
    entry(44,"static-nat","Static NAT","ccna-nat","jitl-day-44-static-nat","Stałe mapowanie inside local na inside global.",["Oznacz inside i outside interfaces","Dodaj mapowanie statyczne","Sprawdź translations i łączność"]),
    entry(45,"dynamic-nat","Dynamic NAT and PAT","ccna-nat","jitl-day-45-dynamic-nat","Translacje z puli oraz PAT overload dla wielu hostów.",["Zdefiniuj ACL ruchu inside","Skonfiguruj pool lub overload","Porównaj translations i statistics"]),
    entry(46,"voice-vlans","Voice VLANs","ccna-qos","jitl-day-46-voice-vlans","Oddzielenie danych i voice traffic na porcie dostępowym.",["Ustaw access VLAN","Ustaw voice VLAN","Zweryfikuj sąsiedztwo i stan switchport"]),
    entry(47,"qos","Quality of Service","ccna-qos","jitl-day-47-qos","Klasyfikacja, znakowanie i kolejkowanie ruchu o różnych wymaganiach.",["Rozpoznaj ruch wrażliwy na delay","Sprawdź markings","Porównaj politykę i liczniki klas"]),
    entry(48,"kali-linux","Kali Linux Demo","ccna-security","jitl-day-48-kali","Analiza defensywna przykładowego ruchu i ekspozycji usług w izolowanym środowisku.",["Pracuj wyłącznie w laboratorium","Zidentyfikuj otwarte usługi","Opisz działania ograniczające ryzyko"]),
    entry(49,"port-security","Port Security","ccna-port-security","jitl-day-49-port-security","Ograniczanie MAC addresses na access port i reakcje na naruszenie.",["Ustaw maximum i sticky MAC","Wybierz violation mode","Wywołaj i zweryfikuj naruszenie"]),
    entry(50,"dhcp-snooping","DHCP Snooping","ccna-dhcp-snooping","jitl-day-50-dhcp-snooping","Ochrona przed nieautoryzowanym serverem DHCP.",["Włącz funkcję dla właściwych VLAN-ów","Oznacz wyłącznie zaufane uplinks","Sprawdź binding database"]),
    entry(51,"dynamic-arp-inspection","Dynamic ARP Inspection","ccna-arp-inspection","jitl-day-51-dai","Walidacja ARP na podstawie DHCP snooping bindings.",["Włącz DAI dla VLAN-u","Ustal trusted ports","Przetestuj poprawny i fałszywy ARP"]),
    entry(52,"stp-fhrp-synchronization","STP and FHRP Synchronization","ccna-lan-architecture","jitl-day-52-stp-fhrp","Zgranie aktywnego gateway z preferowaną ścieżką warstwy 2.",["Porównaj root bridge i active router","Skoryguj priorities","Sprawdź ścieżkę przed i po awarii"]),
    entry(53,"gre-tunnels","GRE Tunnels","ccna-wan","jitl-day-53-gre","Budowa logicznego tunelu GRE przez sieć tranzytową.",["Ustaw tunnel source i destination","Nadaj adresy tunnel interfaces","Zweryfikuj trasę i transport payload"]),
    entry(54,"virtualbox","VirtualBox","ccna-virtualization-cloud","jitl-day-54-virtualbox","Budowa izolowanego środowiska z maszynami wirtualnymi i siecią testową.",["Utwórz bezpieczną sieć laboratoryjną","Skonfiguruj adapters VM","Sprawdź adresację i izolację"]),
    entry(58,"wireless-lans","Wireless LANs","ccna-wireless-config","jitl-day-58-wireless","Konfiguracja podstawowego WLAN, zabezpieczeń i dołączenia clienta.",["Utwórz SSID i przypisz VLAN","Włącz bezpieczne uwierzytelnianie","Zweryfikuj association i adresację"]),
    entry("Mega","mega-lab","CCNA Mega Lab","ccna-other","jitl-ccna-mega-lab","Integracja adresacji, switching, routing, usług i zabezpieczeń w jednej topologii.",["Zaplanuj pracę warstwami","Weryfikuj każdą funkcję osobno","Udokumentuj wynik i usuń błędy end-to-end"])
  ]);

  const safeId=value=>String(value).toLocaleLowerCase("pl").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  function makeQuestions(lab){
    const answers=[lab.scope,...lab.checks];
    return answers.map((answer,index)=>({
      id:`${lab.subsectionId}-check-${index+1}`,
      question:index===0?`Jaki jest główny zakres laboratorium „${lab.title}”?`:`Który element należy potwierdzić w laboratorium „${lab.title}” na etapie ${index}?`,
      answer,answers:[answer,...answers.filter(item=>item!==answer).slice(0,3)],correct:0,source:"ccna-editorial"
    }));
  }
  // CCNA-C01-20261031-D02-LAB | AUTHOR: ChatGPT / GPT-6
  // The Packet Tracer file is linked from a public community mirror, not copied into the app.
  const DAY02_PACKET_TRACER="https://raw.githubusercontent.com/AlexG900/Packet-Tracer-Labs/main/Day%2002%20Lab%20-%20Connecting%20Devices.pkt";
  const DAY02_NOTE="<div class=\"study-note\">\n<div class=\"note-lead\"><strong>Day 02 Lab — Connecting Devices.</strong> Odtwórz topologię z filmu Jeremy’s IT Lab. 16 przygotowanych urządzeń, 17 przewodów, Auto MDI-X wyłączone. W ćwiczeniu chodzi o fizyczne połączenia, nie o adresację ani routing.</div>\n<h4>Używane komendy i narzędzia</h4>\n<p><strong>Komendy Cisco IOS CLI: brak.</strong> Autor nie wpisuje w tym filmie żadnej komendy w terminalu. Polecenia takie jak <code>enable</code>, <code>configure terminal</code>, <code>show interfaces</code> ani <code>ping</code> nie są częścią tego laboratorium. Nie trzeba konfigurować adresów IP.</p>\n<table><thead><tr><th>Narzędzie</th><th>Do czego służy</th></tr></thead><tbody>\n<tr><td>Connections → <strong>Copper Straight-Through</strong></td><td>Połączenie host–switch lub switch–router miedzianym przewodem prostym.</td></tr>\n<tr><td>Connections → <strong>Copper Cross-Over</strong></td><td>Połączenie switch–switch albo router–router miedzianym przewodem krosowanym bez Auto MDI-X.</td></tr>\n<tr><td>Connections → <strong>Fiber</strong></td><td>Światłowód dla połączeń routerów na 250 m lub 3 km. Symulator nie rozróżnia MMF i SMF w menu przewodów, tak samo jak Packet Tracer przedstawiony w filmie.</td></tr>\n<tr><td>Porty <strong>FastEthernet0</strong> i <strong>FastEthernet0/x</strong></td><td>Interfejs Ethernet hosta lub switcha.</td></tr>\n<tr><td>Porty <strong>GigabitEthernet0/x</strong></td><td>Interfejsy routera, uplinki switcha i oba końce połączeń Fiber w naszym symulatorze.</td></tr>\n<tr><td><strong>Ocena laboratorium</strong></td><td>Weryfikuje wszystkie 17 par urządzeń, typ kabla, aktywność łączy i brak przewodów dodatkowych.</td></tr>\n</tbody></table>\n<h4>Schemat wykonania laboratorium krok po kroku</h4>\n<ol>\n<li><strong>Przygotowanie (0:21–0:50).</strong> Otwórz zakładkę Laboratorium sieciowe. Na mapie masz PC1–PC3, SRV1, SW1–SW8 i R1–R4. Urządzenia są już rozmieszczone, lecz niepołączone. Nie dodawaj kolejnych urządzeń.</li>\n<li><strong>Host–Switch (0:50–2:05).</strong> Copper Straight-Through: <strong>PC1–SW3, PC2–SW4, PC3–SW7, SRV1–SW8</strong>.</li>\n<li><strong>Switch–Switch (2:05–2:50).</strong> Copper Cross-Over: <strong>SW3–SW1, SW1–SW2, SW4–SW2, SW7–SW5, SW5–SW6, SW8–SW6</strong>.</li>\n<li><strong>Switch–Router (2:50–3:21).</strong> Copper Straight-Through: <strong>SW1–R2, SW2–R2, SW5–R4, SW6–R4</strong>.</li>\n<li><strong>Router–Router (3:21–4:59).</strong> <strong>R1–R2, 50 m</strong>: Copper Cross-Over; <strong>R1–R3, 3 km</strong>: Fiber, w rzeczywistości Single-Mode Fiber (SMF); <strong>R3–R4, 250 m</strong>: Fiber, w rzeczywistości Multimode Fiber (MMF).</li>\n<li><strong>Zaliczenie.</strong> Wybieraj dwa wolne porty Ethernet dla każdego kabla (dla Fiber koniecznie GigabitEthernet na obu routerach). Otwórz ocenę laboratorium: potrzebne jest dokładnie 17 prawidłowych, aktywnych połączeń i brak nadmiarowych kabli.</li>\n</ol>\n<p><strong>Uzasadnienie doboru:</strong> przy klasycznym 10/100 Ethernet z wyłączonym Auto MDI-X PC i router nadają na 1–2, a switch na 3–6. Urządzenia o różnych rolach łączy przewód prosty, o takich samych – krosowany. Copper UTP zwykle do 100 m; przy 250 m wystarcza MMF z odpowiednimi modułami; przy 3 km wybierz SMF z kompatybilną optyką. Dystanse nie są gwarancją działania dowolnego transceivera.</p>\n<p><strong>Film źródłowy:</strong> <a href=\"https://www.youtube.com/watch?v=K6Qt23sY68Y\" target=\"_blank\" rel=\"noopener noreferrer\">Jeremy’s IT Lab — Connecting Devices (Day 02 Lab)</a>. Materiały autora: <a href=\"https://jitl.jp/ccna-files\" target=\"_blank\" rel=\"noopener noreferrer\">oficjalna strona pobierania po rejestracji</a>.</p>\n<h4>Plik laboratorium do Cisco Packet Tracer (.pkt)</h4>\n<p><a class=\"action-button primary\" href=\"https://raw.githubusercontent.com/AlexG900/Packet-Tracer-Labs/main/Day%2002%20Lab%20-%20Connecting%20Devices.pkt\" target=\"_blank\" rel=\"noopener noreferrer\">Pobierz Day 02 Lab — Connecting Devices.pkt</a></p>\n<p class=\"muted\">Bezpośredni link do publicznej kopii .pkt (~74 kB) udostępnionej przez społeczność (AlexG900). Otwórz plik w Cisco Packet Tracer, nie w przeglądarkowym symulatorze CCNA, który nie obsługuje importu .pkt i .pka.</p>\n</div>";
  function makeDay02Subsection(lab){
    return {
      id:lab.subsectionId,type:"learning-subsection",chapter:"Jeremy's IT Lab — Day 02",
      title:"Connecting Devices — Packet Tracer Lab",
      description:"Odtwórz połączenia 4 routerów, 8 switchy, 3 komputerów i serwera.",
      note:DAY02_NOTE,questions:[]
    };
  }
  function makeSubsection(lab){
    if(lab.key==='connecting-devices')return makeDay02Subsection(lab);
    return {
      id:lab.subsectionId,type:"learning-subsection",chapter:`Jeremy's IT Lab — Day ${lab.day}`,
      title:`Laboratorium: ${lab.title}`,
      description:lab.scope,
      note:`<p><strong>Cel:</strong> ${lab.scope}</p><ol>${lab.checks.map(item=>`<li>${item}</li>`).join("")}</ol><p class="muted">Zakres odtworzono na podstawie publicznego spisu kursu. Zadanie i pytania w tej aplikacji są autorskim ćwiczeniem utrwalającym; oryginalne pliki Packet Tracer pozostają u autora kursu.</p>`,
      questions:makeQuestions(lab)
    };
  }
  function apply(data){
    const sections=new Map((data?.sections||[]).flatMap(part=>part.sections||[]).map(section=>[section.id,section]));
    const missingSections=[],resolved=[],added=[],aligned=[],deferred=[];
    for(const lab of labs){
      // CCNA Day 02 theory chapters cannot acquire Packet Tracer subsections.
      // Day 01 and Day 02 lab metadata remain in labs[] for a future standalone lab hub.
      if(lab.day===1&&lab.sectionId==="interfejsy-sieciowe-i-okablowanie"){
        deferred.push(lab.key);
        continue;
      }
      const section=sections.get(lab.sectionId);
      if(!section){missingSections.push(lab.sectionId);continue;}
      let subsection=(section.subsections||[]).find(item=>item.id===lab.subsectionId);
      if(!subsection){
        subsection=makeSubsection(lab);
        const examIndex=section.subsections.findIndex(item=>item.type==="section-exam");
        section.subsections.splice(examIndex<0?section.subsections.length:examIndex,0,subsection);
        added.push(subsection.id);
      }else aligned.push(subsection.id);
      subsection.lab={...(subsection.lab||{}),officialCourse:"Jeremy's IT Lab — Free CCNA",officialDay:String(lab.day),officialTitle:lab.title,scope:lab.scope,checks:[...lab.checks],downloadUrl:lab.key==='connecting-devices'?DAY02_PACKET_TRACER:SOURCE};
      subsection.labAuditKey=lab.key;
      resolved.push({key:lab.key,sectionId:section.id,subsectionId:subsection.id});
    }
    return Object.freeze({officialLabs:labs.length,coveredLabs:resolved.length,added:Object.freeze(added),aligned:Object.freeze(aligned),deferred:Object.freeze(deferred),missingSections:Object.freeze([...new Set(missingSections)]),sourceUrl:SOURCE});
  }
  function answerOf(question){
    if(typeof question?.answer==="string"&&question.answer.trim())return question.answer.trim();
    const options=question?.answers||question?.options||[];
    const index=Number.isInteger(question?.correct)?question.correct:Number.isInteger(question?.correctIndex)?question.correctIndex:0;
    return String(options[index]||"").trim();
  }
  function answerKind(value){
    const text=String(value).trim();
    if(/^(?:yes|no|true|false)$/i.test(text))return"boolean";
    if(/^(?:\([^)]*\)#|show |debug |undebug |ping |traceroute |ip |ipv6 |router |interface |switchport |access-list |permit |deny |copy |write )/i.test(text))return"command";
    if(/^(?:\d|0x|[0-9.]+\s*(?:seconds?|minutes?|bits?|bytes?|kbps|mbps|gbps)?$)/i.test(text))return"value";
    if(/^[A-Z0-9/-]{2,14}(?:\s*\([^)]+\))?$/.test(text))return"term";
    return"explanation";
  }
  function supportAnswers(subsection){
    if(subsection.id==="anki-other")return["Storage Area Network (SAN)","Local Area Network (LAN)","Wide Area Network (WAN)","Wireless Local Area Network (WLAN)"];
    return[
      `Konfiguracja zgodna z zakresem: ${subsection.title}`,
      `Weryfikacja stanu i wyników dla: ${subsection.title}`,
      `Analiza parametrów oraz zależności w temacie: ${subsection.title}`,
      `Diagnoza i korekta błędów dotyczących: ${subsection.title}`
    ];
  }
  function alignDistractors(data){
    let questions=0,seeds=0;
    for(const section of (data?.sections||[]).flatMap(part=>part.sections||[]))for(const subsection of section.subsections||[]){
      subsection.questions||=[];
      const imported=subsection.questions.filter(question=>question.source==="jitl"||question.source==="ocg");
      if(!imported.length)continue;
      let pool=[...new Set(subsection.questions.map(answerOf).filter(Boolean))];
      for(const answer of supportAnswers(subsection)){
        if(pool.length>=4)break;
        if(pool.includes(answer))continue;
        const id=`${subsection.id}-scope-answer-${seeds+1}`;
        subsection.questions.push({id,question:`Który opis należy do zakresu „${subsection.title}”?`,answer,answers:[answer],correct:0,source:"scope-support"});
        pool.push(answer);seeds++;
      }
      for(const question of imported){
        const correct=answerOf(question);if(!correct)continue;
        if(!pool.includes(correct))pool.push(correct);
        const kind=answerKind(correct);
        const candidates=pool.filter(answer=>answer!==correct).sort((a,b)=>Number(answerKind(b)===kind)-Number(answerKind(a)===kind)||a.localeCompare(b,"en"));
        const offset=[...String(question.id||question.question||"")].reduce((sum,char)=>sum+char.charCodeAt(0),0)%Math.max(1,candidates.length);
        const rotated=candidates.slice(offset).concat(candidates.slice(0,offset));
        const distractors=rotated.slice(0,3);
        while(distractors.length<3)distractors.push(pool.find(answer=>answer!==correct&&!distractors.includes(answer))||correct);
        question.answer=correct;question.answers=[correct,...distractors];question.correct=0;question.correctIndex=0;question.distractorScope="subsection";questions++;
      }
    }
    return Object.freeze({questions,seeds});
  }
  return Object.freeze({sourceUrl:SOURCE,labs,apply,alignDistractors});
});

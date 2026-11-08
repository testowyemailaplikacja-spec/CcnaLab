(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.CcnaScenarioExtensions = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E, H) {
  'use strict';
  const { seed, run, checked, cmd, ping } = H;
  function ospf() {
    const n = new E.Network(); n.state.devices = []; n.state.links = [];
    n.state.devices.push(E.makeDevice('2960-24TT', 'SW1', 640, 250));
    for (let i = 1; i <= 4; i++) {
      const d = E.makeDevice('2911', 'R' + i, i % 2 ? 270 : 1010, i < 3 ? 130 : 410); n.state.devices.push(d);
      Object.assign(d.ports['GigabitEthernet0/0'], { enabled: true, ip: '10.0.0.' + i, mask: '255.255.255.0' });
      n.connect(d.id, 'GigabitEthernet0/0', 'SW1', 'FastEthernet0/' + i);
      run(n, d.id, ['interface loopback0', 'ip address 10.' + i + '.0.1 255.255.255.0']);
    }
    n.changed(); return n;
  }
  function relay() {
    const n = seed('route-ready'), server = E.makeDevice('Server-PT', 'SRV1', 1010, 430);
    n.state.devices.push(server); n.connect('SRV1', 'FastEthernet0', 'SW2', 'FastEthernet0/24');
    n.configurePC('SRV1', '10.0.20.53', '255.255.255.0', '10.0.20.1');
    server.excluded = [['10.0.10.1', '10.0.10.99']]; server.services.dhcp = true;
    n.device('R2').routes = [];
    Object.assign(n.device('PC1'), { ip: '', gateway: '', addressMethod: 'dhcp' }); n.changed(); return n;
  }
  function nat() {
    const n = seed('nat');
    n.device('R2').routes = [];
    run(n, 'R2', ['ip route 203.0.113.0 255.255.255.248 10.0.12.1']);
    for (const [id, ip, port, y] of [['PC3', '10.0.10.13', 2, 100], ['PC4', '10.0.10.14', 3, 440]]) {
      n.state.devices.push(E.makeDevice('PC-PT', id, 180, y)); n.connect(id, 'FastEthernet0', 'SW1', 'FastEthernet0/' + port); n.configurePC(id, ip, '255.255.255.0', '10.0.10.1');
    }
    n.changed(); return n;
  }
  function slaac() {
    const n = seed('ipv6');
    for (const id of ['PC1', 'PC2']) Object.assign(n.device(id), { ipv6: '', ipv6Gateway: '' });
    n.changed(); return n;
  }
  function wlc() {
    const n = seed('wireless'), previous = n.device('AP1'), ap = E.makeDevice('3702i', 'AP1', previous.x, previous.y);
    n.state.devices[n.state.devices.indexOf(previous)] = ap;
    for (const link of n.state.links) for (const end of [link.a, link.b]) if (end.device === 'AP1' && end.port === 'Port0') end.port = 'GigabitEthernet0';
    const controller = E.makeDevice('WLC-2504', 'WLC1', 500, 440); n.state.devices.push(controller);
    n.connect('WLC1', 'GigabitEthernet1', 'SW1', 'FastEthernet0/24');
    n.configureManagement('WLC1', { ip: '10.0.10.2', mask: '255.255.255.0', gateway: '', vlan: 0 });
    n.configureManagement('AP1', { ip: '10.0.10.3', mask: '255.255.255.0', gateway: '', controller: '10.0.10.2' });
    n.configurePC('PC1', '10.20.0.11', '255.255.255.0'); n.configurePC('PC2', '10.20.0.12', '255.255.255.0');
    n.state.devices.push(E.makeDevice('PC-PT', 'PC3', 550, 80)); n.connect('PC3', 'FastEthernet0', 'SW1', 'FastEthernet0/3'); n.configurePC('PC3', '10.0.10.30', '255.255.255.0');
    n.changed(); return n;
  }
  return [
    {
      key: 'ospf-broadcast', section: 'ccna-ospf', title: 'OSPF: DR/BDR i diagnostyka sąsiedztw', create: ospf,
      goal: 'Uruchom OSPF na wspólnym segmencie i rozpoznaj FULL, 2-WAY oraz EXSTART.',
      steps: [
        'R1–R4: Gi0/0 ma 10.0.0.1–4/24. Loopback0 każdego routera ma 10.X.0.1/24 (X to numer routera).',
        'Przed uruchomieniem OSPF ustaw na Gi0/0 ip ospf priority: R1 200, R2 100, R3 i R4 0.',
        'Na każdym routerze: router ospf 1; router-id X.X.X.X; network 10.0.0.0 0.255.255.255 area 0. Odczytaj show ip ospf neighbor i show ip ospf interface gi0/0. R1 jest DR, R2 BDR; R3 i R4 pozostają między sobą w 2-WAY.',
        'Na R4 Gi0/0 ustaw ip ospf hello-interval 5. Na R3 odczytaj show ip ospf neighbor detail i show ip ospf interface gi0/0. Napraw: no ip ospf hello-interval.',
        'Na R4 Gi0/0 ustaw mtu 1400. Na R1 zobacz EXSTART i przyczynę w show ip ospf neighbor detail. Napraw mtu 1500.',
        'Na R3 odczytaj show ip route i wykonaj ping 10.4.0.1. Loopback jest ogłaszany jako /32. Sprawdź zadanie.',
        'Dodatkowy eksperyment po zaliczeniu: wyłącz Gi0/0 na R1, sprawdź przejęcie DR przez R2 i przywróć port. R1 nie odbiera roli DR. clear ip ospf process wymaga potwierdzenia yes.'
      ],
      requirements: [
        checked('R1 jest DR, R2 BDR', n => { const e = n.ospf().endpoints; return e.some(i => i.device === 'R1' && i.name === 'GigabitEthernet0/0' && i.role === 'DR') && e.some(i => i.device === 'R2' && i.name === 'GigabitEthernet0/0' && i.role === 'BDR'); }),
        checked('R3–R4 pozostają 2-WAY, z DR/BDR są FULL', n => n.neighbors(n.device('R3'), 'ospf').some(i => i.device === 'R4' && i.state === '2-WAY') && n.neighbors(n.device('R3'), 'ospf').filter(i => i.state === 'FULL').length === 2),
        checked('Rozpoznano niezgodne timery Hello/Dead', n => !!n.state.evidence.drills?.ospfTimers),
        checked('Rozpoznano EXSTART przy niezgodnym MTU', n => !!n.state.evidence.drills?.ospfMtu),
        checked('Po naprawie R3 osiąga 10.4.0.1', n => ping(n, 'R3', '10.4.0.1')), cmd('R3', 'show ip route')
      ],
      scope: "Wybór DR/BDR nie jest wywłaszczający. Model uwzględnia priorytet, router ID, MTU, timery, passive-interface i typ sieci. Pokazuje wynik zbieżności i przejścia stanów; nie odtwarza pełnej wymiany LSA ani rzeczywistych timerów packets."
    },
    {
      key: 'dhcp-relay', section: 'ccna-dhcp', title: "DHCP relay: server w innej podsieci", create: relay,
      goal: 'Przydziel PC1 adres przez relay i napraw brak trasy powrotnej.',
      steps: [
        "PC1 znajduje się w LAN 10.0.10.0/24. SRV1 ma 10.0.20.53/24, gateway 10.0.20.1. Adresy .1–.99 w puli klienta są zarezerwowane.",
        'SRV1 → Services → DHCP: włącz usługę. Pula: Network 10.0.10.0, Mask 255.255.255.0, Gateway 10.0.10.1, DNS 10.0.20.53. Zapisz usługi.',
        'R1: interface gi0/0; ip helper-address 10.0.20.53; end. PC1: ipconfig /renew. Pierwsza próba nie powiedzie się, bo R2 nie ma drogi powrotnej do relay.',
        'R2: ip route 10.0.10.0 255.255.255.0 10.0.12.1. Ponów DHCP na PC1. Oczekiwany adres: 10.0.10.100.',
        'W Simulation znajdź DHCP Relay z giaddr=10.0.10.1 i UDP 67 → 67. R1: show ip interface gi0/0. PC1: ping 10.0.20.53.',
        'Eksperyment: usuń helper-address, wyłącz DHCP lub zablokuj UDP 67 ACL na trasie. Nowy klient nie dostanie dzierżawy. Przywróć konfigurację i ponów test.'
      ],
      requirements: [checked('PC1 ma dzierżawę z sieci 10.0.10.0/24', n => n.device('PC1').addressMethod === 'dhcp' && E.sameSubnet(n.device('PC1').ip, '10.0.10.0', '255.255.255.0')), checked('Dzierżawa zawiera giaddr relay', n => Object.values(n.device('SRV1').bindings).some(b => b.client === 'PC1' && b.giaddr === '10.0.10.1')), checked("PC1 osiąga zdalny server", n => ping(n, 'PC1', '10.0.20.53')), cmd('R1', 'show ip interface GigabitEthernet0/0')],
      scope: "DORA i relay używają osiągalności VLAN/IP w obu kierunkach oraz ACL UDP 67. Wybór puli zależy od giaddr. Obsługiwane są helper-address, snooping i klient DHCP na interface IOS; bez Option 82 i pełnej retransmisji packets DHCP."
    },
    {
      key: 'nat-pool', section: 'ccna-nat', title: 'NAT: pula, wyczerpanie adresów i PAT', create: nat,
      goal: 'Zaobserwuj limit puli dynamicznej, a następnie współdzielenie adresu przez PAT.',
      steps: [
        'R1: Gi0/0 to inside, Gi0/1 to outside. R2 ma trasę powrotną do 203.0.113.0/29; nie ma trasy do prywatnego LAN.',
        'R1: int gi0/0; ip nat inside; int gi0/1; ip nat outside; exit; access-list 1 permit 10.0.10.0 0.0.0.255.',
        'R1: ip nat pool PUBLIC 203.0.113.1 203.0.113.2 netmask 255.255.255.248; ip nat inside source list 1 pool PUBLIC; end.',
        'Na PC1, PC3, następnie PC4 wykonaj ping 10.0.20.12. Dwa hosty zajmują pulę; trzeci nie uzyska translacji. Sprawdź show ip nat translations i show ip nat statistics.',
        'R1: clear ip nat translation *; conf t; no ip nat inside source list 1 pool PUBLIC; ip nat inside source list 1 pool PUBLIC overload; end.',
        'Ponów ping z wszystkich trzech hostów. Każdy ma otrzymać odpowiedź. Sprawdź identyfikatory ICMP w tablicy NAT oraz statystyki. Współdzielenie portów TCP/UDP działa analogicznie.'
      ],
      requirements: [checked('Pula PUBLIC ma dwa adresy', n => n.device('R1').nat.pools?.PUBLIC?.start === '203.0.113.1' && n.device('R1').nat.pools.PUBLIC.end === '203.0.113.2'), checked('Zaobserwowano wyczerpanie puli', n => !!n.state.evidence.drills?.natExhausted), checked('PAT aktywny dla PUBLIC', n => n.device('R1').nat.rules?.some(r => r.pool === 'PUBLIC' && r.overload)), ...['PC1', 'PC3', 'PC4'].map(id => checked(id + ' osiąga zewnętrzny host', n => ping(n, id, '10.0.20.12'))), cmd('R1', 'show ip nat statistics')],
      scope: 'NAT statyczny, dynamiczne pule i PAT mają rzeczywiste mapowania adresów, portów lub identyfikatorów ICMP, odpowiedzi i wygasanie. Nie ma pełnego automatu TCP, fragmentacji, ALG ani NAT64.'
    },
    {
      key: 'ipv6-slaac', section: 'ccna-ipv6', title: "IPv6: link-local, SLAAC i static routes", create: slaac,
      goal: "Uzyskaj adresy przez RA i użyj link-local jako next hop.",
      steps: [
        "Na R1 i R2 włącz ipv6 unicast-routing. Prefiksy interfaces są przygotowane: LAN1 2001:db8:10::/64, LAN2 2001:db8:20::/64, uplink 2001:db8:12::/64.",
        'Na Gi0/0 obu routerów ustaw ipv6 address fe80::1 link-local. Na uplinku Gi0/1 ustaw R1 fe80::12:1 link-local, R2 fe80::12:2 link-local.',
        "R1: ipv6 route 2001:db8:20::/64 gi0/1 fe80::12:2. R2: ipv6 route 2001:db8:10::/64 gi0/1 fe80::12:1. Link-local wymaga exit interface.",
        "PC1 i PC2: Desktop → IP Configuration → IPv6 Auto Config (SLAAC), albo ipconfig /renew6. Odczytaj ipconfig /all: prefiks /64 i gateway fe80::1.",
        'Z PC1 wykonaj ping na uzyskany adres IPv6 PC2. Na R1 odczytaj show ipv6 neighbors i show ipv6 interface gi0/0. W Simulation prześledź RS, RA i NDP.',
        "Eksperyment: na R1 Gi0/0 ustaw ipv6 nd suppress-ra. Ponowne /renew6 nie otrzyma RA. Stara gateway znika dopiero po czasie życia routera. Przywróć no ipv6 nd suppress-ra i ponów autokonfigurację."
      ],
      requirements: [checked("Oba hosty mają adresy SLAAC i gateway link-local", n => ['PC1', 'PC2'].every(id => n.device(id).ipv6Method === 'slaac' && n.device(id).ipv6Gateway === 'fe80::1')), checked("Trasy używają link-local i właściwego interface", n => ['R1', 'R2'].every(id => n.device(id).routes6.some(r => r.port === 'GigabitEthernet0/1' && E.isLinkLocal(r.nextHop)))), checked('Ping IPv6 między hostami', n => !!n.device('PC2').ipv6 && ping(n, 'PC1', E.parse6(n.device('PC2').ipv6).ip)), cmd('R1', 'show ipv6 neighbors')],
      scope: "SLAAC z EUI-64, RA/RS, DAD, gateway i czas jej życia oraz link-local z zakresem interface. Jedna globalna konfiguracja IPv6 na interface; bez DHCPv6, rozszerzeń prywatności i pełnego kodowania multicast NDP."
    },
    {
      key: 'wlc-wlan', section: 'ccna-wireless-config', title: 'WLC: WLAN WPA2 i VLAN klientów', create: wlc,
      goal: 'Utwórz WLAN w GUI kontrolera i odseparuj VLAN klientów od zarządzania.',
      steps: [
        'Zarządzanie jest przygotowane: WLC1 10.0.10.2, AP1 10.0.10.3, PC3 10.0.10.30, VLAN 1. AP działa w FlexConnect z lokalnym przełączaniem. PC1 i PC2 mają 10.20.0.11 i .12/24.',
        'Na SW1 i SW2 utwórz VLAN 20; Gi0/1 obu switchy: trunk, allowed vlan 1,20. SW1 Fa0/1 (AP): trunk, allowed vlan 1,20. SW2 Fa0/1 (PC2): access VLAN 20.',
        "WLC1 → GUI → Controller / Interfaces: utwórz users, VLAN 20, IP 10.20.0.2, subnet mask 255.255.255.0; gateway i DHCP mogą pozostać puste w tym ćwiczeniu.",
        'GUI → WLANs: WLAN ID 1, Profile Name STUDENTS, SSID CCNA-LAB, Interface users, Enabled, WPA2-PSK/AES, klucz ccna2026, QoS Silver. Apply.',
        'GUI → Wireless: AP1 ma być Joined. PC1 → Desktop → Wireless: CCNA-LAB, WPA2-PSK, klucz ccna2026. Ping 10.20.0.12. W GUI → Clients sprawdź MAC, SSID i VLAN klienta.',
        'Eksperyment: błędny klucz blokuje skojarzenie; usunięcie VLAN 20 z trunku blokuje dane mimo poprawnego skojarzenia. Napraw i ponów ping.',
        'Panel WLC możesz też otworzyć z PC3 → Desktop → Web Browser → https://10.0.10.2. Po awarii WLC zapisany profil PSK nadal pracuje na AP w trybie Standalone (FlexConnect).'
      ],
      requirements: [checked('WLC udostępnia aktywny WPA2 WLAN CCNA-LAB w VLAN 20', n => Object.values(n.device('WLC1').controller.wlans).some(w => w.enabled && w.ssid === 'CCNA-LAB' && w.security === 'wpa2' && n.device('WLC1').controller.interfaces[w.interface]?.vlan === 20)), checked('AP1 jest zarejestrowany na WLC1', n => n.apState(n.device('AP1')).state === 'Joined'), checked('Klient jest skojarzony', n => n.status(n.linkAt('PC1', 'Wireless0')).up), checked('Ruch klienta przechodzi przez VLAN 20', n => ping(n, 'PC1', '10.20.0.12')), checked('Odczytano listę klientów WLC', n => !!n.state.evidence.observations.wlcClients)],
      scope: "GUI inspirowane AireOS: interfaces, WLAN, WPA2-PSK, profile QoS, AP i klienci. FlexConnect local switching z działającym VLAN i trybem Standalone. Łączność kontrolna uwzględnia UDP 5246 i trasy; bez centralnego tunelowania danych CAPWAP, RADIUS/802.1X, roamingu i fizyki radia."
    }
  ];
});

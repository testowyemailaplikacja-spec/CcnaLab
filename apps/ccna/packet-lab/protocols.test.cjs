const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');
const S = require('./scenarios.js');
const run = S.run;
const create = key => S.extensions.find(e => e.key === key).create();
const ping = (n, id, ip) => { const t = n.startPing(id, ip, 1); n.run(); return t.replies; };
const show = (n, id, command) => { const t = new E.Terminal(n, id); t.execute('en'); const result = t.execute(command); assert.doesNotMatch(String(result), /^%/); return result; };
function ospf(n) { for (let i = 1; i <= 4; i++) run(n, 'R' + i, ['int gi0/0', 'ip ospf priority ' + [200, 100, 0, 0][i - 1], 'router ospf 1', 'router-id ' + [i, i, i, i].join('.'), 'network 10.0.0.0 0.255.255.255 area 0']); }
function relay(n) { n.device('SRV1').pools.SERVER = { network: '10.0.10.0', mask: '255.255.255.0', gateway: '10.0.10.1', dns: '10.0.20.53' }; run(n, 'R1', ['int gi0/0', 'ip helper-address 10.0.20.53']); }
function nat(n, overload = false) { run(n, 'R1', ['int gi0/0', 'ip nat inside', 'int gi0/1', 'ip nat outside', 'exit', 'access-list 1 permit 10.0.10.0 0.0.0.255', 'ip nat pool PUBLIC 203.0.113.1 203.0.113.2 netmask 255.255.255.248', 'ip nat inside source list 1 pool PUBLIC' + (overload ? ' overload' : '')]); }
function slaac(n) { for (const [id, own, other, network] of [['R1', '1', '2', '20'], ['R2', '2', '1', '10']]) run(n, id, ['ipv6 unicast-routing', 'int gi0/0', 'ipv6 address fe80::1 link-local', 'int gi0/1', 'ipv6 address fe80::12:' + own + ' link-local', 'exit', 'ipv6 route 2001:db8:' + network + '::/64 gi0/1 fe80::12:' + other]); }
function wlc(n) {
  for (const id of ['SW1', 'SW2']) run(n, id, ['vlan 20', 'exit', 'int gi0/1', 'switchport mode trunk', 'switchport trunk allowed vlan 1,20']);
  run(n, 'SW1', ['int fa0/1', 'switchport mode trunk', 'switchport trunk allowed vlan 1,20']);
  run(n, 'SW2', ['int fa0/1', 'switchport mode access', 'switchport access vlan 20']);
  n.configureWlcInterface('WLC1', { name: 'users', vlan: 20, ip: '10.20.0.2', mask: '255.255.255.0' });
  n.configureWlan('WLC1', { id: 1, name: 'STUDENTS', ssid: 'CCNA-LAB', interface: 'users', enabled: true, security: 'wpa2', key: 'ccna2026', qos: 'silver' });
  Object.assign(n.device('PC1').wireless, { ssid: 'CCNA-LAB', security: 'wpa2', key: 'ccna2026' }); n.changed();
}

test('OSPF elects DR/BDR, retains 2-WAY between DROthers, advertises loopbacks and forwards', () => {
  const n = create('ospf-broadcast'); ospf(n);
  assert.match(show(n, 'R1', 'sh ip ospf int gi0/0'), /State DR/);
  assert.match(show(n, 'R2', 'sh ip ospf int gi0/0'), /State BDR/);
  assert.match(show(n, 'R3', 'sh ip ospf nei'), /4\.4\.4\.4\s+0\s+2-WAY\/DROTHER/);
  assert.equal(ping(n, 'R3', '10.4.0.1'), 1);
  assert.ok(n.routingTable(n.device('R3')).some(r => r.network === '10.4.0.1' && r.prefix === 32 && r.code === 'O'));
});
test('OSPF election is non-preemptive, promotes BDR and requires process reset for a changed router ID', () => {
  const n = create('ospf-broadcast'); ospf(n); n.ospf();
  run(n, 'R4', ['int gi0/0', 'ip ospf priority 255']); assert.match(show(n, 'R1', 'sh ip ospf int gi0/0'), /State DR/);
  n.setPort('R1', 'GigabitEthernet0/0', { enabled: false }); assert.match(show(n, 'R2', 'sh ip ospf int gi0/0'), /State DR/);
  n.setPort('R1', 'GigabitEthernet0/0', { enabled: true }); assert.match(show(n, 'R2', 'sh ip ospf int gi0/0'), /State DR/);
  run(n, 'R3', ['router ospf 1', 'router-id 33.33.33.33']); assert.match(show(n, 'R3', 'sh ip ospf'), /with ID 3\.3\.3\.3/);
  const t = new E.Terminal(n, 'R3'); t.execute('en'); t.execute('clear ip ospf process'); t.execute(''); assert.match(t.execute('sh ip ospf'), /with ID 3\.3\.3\.3/);
  t.execute('clear ip ospf process'); t.execute('yes'); assert.match(t.execute('sh ip ospf'), /with ID 33\.33\.33\.33/);
});
test('OSPF timer and area mismatch remove neighbors; MTU stalls EXSTART and repair completes the exercise', () => {
  const n = create('ospf-broadcast'); ospf(n); n.ospf();
  run(n, 'R4', ['int gi0/0', 'ip ospf hello-interval 5']); assert.match(show(n, 'R3', 'sh ip ospf nei detail'), /Hello\/Dead interval mismatch/); assert.equal(ping(n, 'R3', '10.4.0.1'), 0);
  run(n, 'R4', ['int gi0/0', 'no ip ospf hello-interval', 'mtu 1400']); assert.match(show(n, 'R1', 'sh ip ospf nei detail'), /EXSTART/); assert.equal(ping(n, 'R3', '10.4.0.1'), 0);
  run(n, 'R4', ['int gi0/0', 'mtu 1500']); assert.equal(ping(n, 'R3', '10.4.0.1'), 1); show(n, 'R3', 'show ip route');
  const exercise = S.resolve('ccna-ospf', 'anki-ospf', 'ospf-broadcast'); assert.ok(exercise.checks(n).every(c => c.ok), JSON.stringify(exercise.checks(n)));
  run(n, 'R4', ['router ospf 1', 'network 10.0.0.0 0.255.255.255 area 1']); assert.match(show(n, 'R1', 'show ip ospf neighbor detail'), /Area mismatch/);
});
test('OSPF point-to-point, authentication and passive default exceptions change adjacency', () => {
  const n = S.seed('ospf');
  for (const id of ['R1', 'R2']) run(n, id, ['router ospf 1', 'network 10.0.0.0 0.0.255.255 area 0', 'passive-interface default', 'no passive-interface gi0/1', 'int gi0/1', 'ip ospf network point-to-point', 'ip ospf authentication', 'ip ospf authentication-key ccna']);
  assert.match(show(n, 'R1', 'show ip ospf neighbor'), /FULL\/-/); assert.equal(ping(n, 'PC1', '10.0.20.12'), 1);
  run(n, 'R2', ['int gi0/1', 'ip ospf authentication-key wrong']); assert.match(show(n, 'R1', 'show ip ospf neighbor detail'), /Authentication mismatch/);
});
test('DHCP relay selects pool using giaddr and requires forward and return routing', () => {
  const n = create('dhcp-relay'); relay(n);
  assert.throws(() => n.dhcp('PC1'), /timeout/);
  run(n, 'R2', ['ip route 10.0.10.0 255.255.255.0 10.0.12.1']); assert.match(n.dhcp('PC1'), /10.0.10.100.*relay 10.0.10.1/);
  assert.equal(n.device('SRV1').bindings[n.device('PC1').mac].giaddr, '10.0.10.1'); assert.equal(ping(n, 'PC1', '10.0.20.53'), 1);
  show(n, 'R1', 'show ip interface gi0/0'); const e = S.resolve('ccna-dhcp', 'anki-dhcp', 'dhcp-relay'); assert.ok(e.checks(n).every(c => c.ok));
});
test('DHCP relay honors UDP ACL, helper removal, server power, release and correct VLAN', () => {
  const n = create('dhcp-relay'); relay(n); run(n, 'R2', ['ip route 10.0.10.0 255.255.255.0 10.0.12.1', 'ip access-list extended BLOCK', 'deny udp any any eq 67', 'permit ip any any', 'exit', 'int gi0/1', 'ip access-group BLOCK in']);
  assert.throws(() => n.dhcp('PC1'), /timeout/); run(n, 'R2', ['int gi0/1', 'no ip access-group BLOCK in']); n.dhcp('PC1'); n.releaseDhcp('PC1'); assert.equal(Object.keys(n.device('SRV1').bindings).length, 0);
  run(n, 'R1', ['int gi0/0', 'no ip helper-address 10.0.20.53']); assert.throws(() => n.dhcp('PC1'), /timeout/);
  run(n, 'R1', ['int gi0/0', 'ip helper-address 10.0.20.53']); n.device('SRV1').power = false; n.changed(); assert.throws(() => n.dhcp('PC1'), /timeout/);
  n.device('SRV1').power = true; n.changed(); run(n, 'SW1', ['vlan 20', 'exit', 'int fa0/1', 'switchport mode access', 'switchport access vlan 20']); assert.throws(() => n.dhcp('PC1'), /timeout/);
});
test('IOS interface can obtain a DHCP address and install its learned default route', () => {
  const n = S.seed('route-ready'); n.device('R2').pools.WAN = { network: '10.0.12.0', mask: '255.255.255.252', gateway: '10.0.12.2' };
  const t = run(n, 'R1', ['int gi0/1', 'ip address dhcp']); assert.equal(n.device('R1').ports['GigabitEthernet0/1'].ip, '10.0.12.1'); assert.match(t.execute('show ip route'), /S\* 0.0.0.0\/0/);
});
test('dynamic NAT allocates distinct addresses, rejects pool exhaustion, then PAT supports all clients', () => {
  const n = create('nat-pool'); nat(n);
  assert.equal(ping(n, 'PC1', '10.0.20.12'), 1); assert.equal(ping(n, 'PC3', '10.0.20.12'), 1); assert.equal(ping(n, 'PC4', '10.0.20.12'), 0);
  assert.equal(new Set(n.device('R1').nat.translations.map(t => t.global)).size, 2); assert.match(show(n, 'R1', 'sh ip nat statistics'), /Allocation failures: 1/);
  show(n, 'R1', 'clear ip nat translation *'); run(n, 'R1', ['no ip nat inside source list 1 pool PUBLIC', 'ip nat inside source list 1 pool PUBLIC overload']);
  for (const id of ['PC1', 'PC3', 'PC4']) assert.equal(ping(n, id, '10.0.20.12'), 1); show(n, 'R1', 'show ip nat statistics');
  const e = S.resolve('ccna-nat', 'anki-nat', 'nat-pool'); assert.ok(e.checks(n).every(c => c.ok), JSON.stringify(e.checks(n)));
});
test('PAT disambiguates TCP and UDP ports and reverses replies to the correct internal host', () => {
  const n = create('nat-pool'); nat(n, true); const d = n.device('R1');
  const frame = { srcIP: '10.0.10.11', dstIP: '10.0.20.12', protocol: 'tcp', srcPort: 49152, dstPort: 80 };
  const a = n.natOut(d, frame), b = n.natOut(d, { ...frame, srcIP: '10.0.10.13' }); assert.equal(a.srcIP, b.srcIP); assert.notEqual(a.srcPort, b.srcPort);
  for (const [outside, local] of [[a, frame.srcIP], [b, '10.0.10.13']]) { const reply = n.natIn(d, { srcIP: frame.dstIP, dstIP: outside.srcIP, protocol: 'tcp', srcPort: 80, dstPort: outside.srcPort }); assert.equal(reply.dstIP, local); assert.equal(reply.dstPort, 49152); }
  const udp = n.natOut(d, { ...frame, protocol: 'udp', dstPort: 53 }); assert.equal(udp.srcPort, 49152);
  n.advance(301); assert.equal(d.nat.translations.filter(t => t.protocol === 'udp').length, 0); assert.equal(d.nat.translations.filter(t => t.protocol === 'tcp').length, 2);
});
test('SLAAC creates EUI-64 globals and link-local gateways; IPv6 static link-local next hops forward replies', () => {
  const n = create('ipv6-slaac'); slaac(n); n.autoconfigure6('PC1'); n.autoconfigure6('PC2');
  assert.equal(n.device('PC1').ipv6, '2001:db8:10:0:2d0:baff:fe00:1/64'); assert.equal(n.device('PC1').ipv6Gateway, 'fe80::1');
  assert.equal(ping(n, 'PC1', E.parse6(n.device('PC2').ipv6).ip), 1); assert.equal(ping(n, 'PC1', 'fe80::1'), 1);
  show(n, 'R1', 'show ipv6 neighbors'); const e = S.resolve('ccna-ipv6', 'anki-ipv6', 'ipv6-slaac'); assert.ok(e.checks(n).every(c => c.ok), JSON.stringify(e.checks(n)));
});
test('IPv6 link-local scope is mandatory on multi-interface routers and neighbors are scoped by interface', () => {
  const n = create('ipv6-slaac'); slaac(n); n.autoconfigure6('PC1'); n.autoconfigure6('PC2');
  assert.throws(() => n.startPing('R1', 'fe80::12:2'), /exit interface/);
  const t = new E.Terminal(n, 'R1'); t.execute('en'); assert.match(t.execute('conf t'), /configuration/); assert.match(t.execute('ipv6 route 2001:db8:99::/64 fe80::12:2'), /Interface required/); t.execute('end');
  const result = t.execute('ping ipv6 fe80::12:2 source gi0/1'); assert.ok(result.ping); n.run(); assert.equal(result.ping.replies, 5); assert.ok(n.device('R1').arp['GigabitEthernet0/1|fe80::12:2']);
});
test('SLAAC rejects missing RA, wrong VLAN and duplicate address; gateway expires after suppressed RA', () => {
  const n = create('ipv6-slaac'); assert.throws(() => n.autoconfigure6('PC1'), /Router Advertisement/); slaac(n); n.autoconfigure6('PC1');
  run(n, 'R1', ['int gi0/0', 'ipv6 nd suppress-ra']); assert.throws(() => n.autoconfigure6('PC1'), /Router Advertisement/); n.advance(1801); assert.equal(n.device('PC1').ipv6Gateway, '');
  run(n, 'R1', ['int gi0/0', 'no ipv6 nd suppress-ra']); n.autoconfigure6('PC1');
  const duplicate = n.add('PC-PT'); n.connect(duplicate.id, 'FastEthernet0', 'SW1', 'FastEthernet0/2'); duplicate.ipv6 = n.device('PC1').ipv6; n.changed(); assert.throws(() => n.autoconfigure6('PC1'), /duplikat/);
  duplicate.ipv6 = ''; run(n, 'SW1', ['vlan 20', 'exit', 'int fa0/1', 'switchport mode access', 'switchport access vlan 20']); assert.throws(() => n.autoconfigure6('PC1'), /Router Advertisement/);
});
test('WLC joins AP and forwards WPA2 client traffic through the configured VLAN', () => {
  const n = create('wlc-wlan'); wlc(n);
  assert.equal(n.apState(n.device('AP1')).state, 'Joined'); assert.equal(n.status(n.linkAt('PC1', 'Wireless0')).up, true); assert.equal(ping(n, 'PC1', '10.20.0.12'), 1);
  n.state.evidence.observations.wlcClients = true;
  const e = S.resolve('ccna-wireless-config', 'anki-wireless-config', 'wlc-wlan'); assert.ok(e.checks(n).every(c => c.ok), JSON.stringify(e.checks(n)));
});
test('WLC wrong PSK, disabled WLAN, wrong VLAN and missing controller path block the relevant operation', () => {
  const n = create('wlc-wlan'); wlc(n); const client = n.device('PC1'), controller = n.device('WLC1');
  client.wireless.key = 'wrongkey'; n.changed(); assert.equal(n.status(n.linkAt('PC1', 'Wireless0')).up, false);
  client.wireless.key = 'ccna2026'; controller.controller.wlans[1].enabled = false; n.changed(); assert.equal(n.status(n.linkAt('PC1', 'Wireless0')).up, false);
  controller.controller.wlans[1].enabled = true; n.changed(); run(n, 'SW1', ['int fa0/1', 'switchport trunk allowed vlan 1']); assert.equal(n.status(n.linkAt('PC1', 'Wireless0')).up, true); assert.equal(ping(n, 'PC1', '10.20.0.12'), 0);
  const isolated = create('wlc-wlan'); isolated.device('AP1').wireless.controller = '10.0.10.99'; isolated.changed(); assert.equal(isolated.apState(isolated.device('AP1')).state, 'Discovering');
});
test('FlexConnect retains cached local PSK WLAN in Standalone and supports multiple clients on one radio', () => {
  const n = create('wlc-wlan'); wlc(n); n.apState(n.device('AP1'));
  const second = n.add('Laptop-PT'); Object.assign(second, { ip: '10.20.0.14', mask: '255.255.255.0' }); Object.assign(second.wireless, n.device('PC1').wireless); n.connect(second.id, 'Wireless0', 'AP1', 'Wireless0', 'wireless');
  assert.equal(ping(n, second.id, '10.20.0.12'), 1); n.power('WLC1', false); assert.equal(n.apState(n.device('AP1')).state, 'Standalone'); assert.equal(ping(n, 'PC1', '10.20.0.12'), 1);
});
test('new configuration and independently keyed exercises survive snapshot and startup restore', () => {
  const n = create('wlc-wlan'); wlc(n); const saved = new E.Network(n.snapshot()); assert.equal(saved.device('WLC1').controller.wlans[1].ssid, 'CCNA-LAB'); assert.equal(ping(saved, 'PC1', '10.20.0.12'), 1);
  const natLab = create('nat-pool'); nat(natLab, true); show(natLab, 'R1', 'write memory'); natLab.power('R1', false); natLab.power('R1', true); assert.equal(natLab.device('R1').nat.pools.PUBLIC.end, '203.0.113.2'); assert.equal(ping(natLab, 'PC1', '10.0.20.12'), 1);
  for (const e of S.extensions) { const sub = S.curriculum.find(s => s.id === e.section).subsections[0].id; const advanced = S.resolve(e.section, sub, e.key), basic = S.resolve(e.section, sub); assert.notEqual(advanced.id, basic.id); assert.ok(advanced.checks(advanced.create()).length > 0); }
});

test('restored SLAAC hosts retain automatic addressing and expire an unavailable default router', () => {
  const n = create('ipv6-slaac'); slaac(n); n.autoconfigure6('PC1');
  run(n, 'R1', ['int gi0/0', 'ipv6 nd suppress-ra']);
  const saved = new E.Network(n.snapshot());
  assert.equal(saved.device('PC1').ipv6Method, 'slaac');
  saved.advance(1801); assert.equal(saved.device('PC1').ipv6Gateway, '');
  assert.match(saved.device('PC1').ipv6, /^2001:db8:10:/);
  const relayLab = create('dhcp-relay'); relay(relayLab);
  run(relayLab, 'R2', ['ip route 10.0.10.0 255.255.255.0 10.0.12.1']); relayLab.dhcp('PC1');
  assert.equal(new E.Network(relayLab.snapshot()).device('PC1').addressMethod, 'dhcp');
});
test('RA lifetime zero supplies an on-link prefix without installing a default gateway', () => {
  const n = create('ipv6-slaac'); slaac(n);
  run(n, 'R1', ['int gi0/0', 'ipv6 nd ra lifetime 0']); n.autoconfigure6('PC1');
  assert.match(n.device('PC1').ipv6, /^2001:db8:10:/); assert.equal(n.device('PC1').ipv6Gateway, '');
  assert.ok(n.routingTable(n.device('R1'), 6).some(r => r.code === 'C' && r.network === '2001:db8:10::' && r.prefix === 64));
});
test('running configuration of a DHCP interface contains the acquisition method, not the leased static address', () => {
  const n = S.seed('route-ready'); n.device('R2').pools.WAN = { network: '10.0.12.0', mask: '255.255.255.252', gateway: '10.0.12.2' };
  run(n, 'R1', ['int gi0/1', 'ip address dhcp']);
  const config = show(n, 'R1', 'show running-config');
  assert.match(config, /ip address dhcp/); assert.doesNotMatch(config, /ip address 10\.0\.12\.1/);
});
test('WLC management rejects invalid VLANs without changing the current address', () => {
  const n = create('wlc-wlan');
  assert.throws(() => n.configureManagement('WLC1', { ip: '10.0.10.4', mask: '255.255.255.0', vlan: 4095 }), /VLAN/);
  assert.equal(n.device('WLC1').ip, '10.0.10.2');
});
test('OSPF loopback reports LOOPBACK rather than taking part in a DR election', () => {
  const n = create('ospf-broadcast'); ospf(n);
  assert.match(show(n, 'R1', 'show ip ospf interface loopback0'), /Network Type LOOPBACK/);
  assert.match(show(n, 'R1', 'show ip ospf interface loopback0'), /State LOOPBACK/);
});
test('OSPF MTU ignore on the smaller interface allows exchange without changing the larger peer', () => {
  const n = S.seed('ospf');
  for (const id of ['R1', 'R2']) run(n, id, ['router ospf 1', 'network 10.0.0.0 0.0.255.255 area 0']);
  run(n, 'R2', ['int gi0/1', 'mtu 1400']); assert.match(show(n, 'R1', 'show ip ospf neighbor'), /EXSTART/);
  run(n, 'R2', ['int gi0/1', 'ip ospf mtu-ignore']); assert.match(show(n, 'R1', 'show ip ospf neighbor'), /FULL/);
});
test('RIP passive default permits only the explicitly enabled inter-router interface', () => {
  const n = S.seed('ospf');
  for (const id of ['R1', 'R2']) run(n, id, ['router rip', 'network 10.0.0.0', 'passive-interface default', 'no passive-interface gi0/1']);
  assert.equal(ping(n, 'PC1', '10.0.20.12'), 1);
  run(n, 'R2', ['router rip', 'passive-interface gi0/1']); assert.equal(ping(n, 'PC1', '10.0.20.12'), 0);
});
test('TCP and UDP replies traverse PAT using translated transport ports and keep original client ports', () => {
  const n = create('nat-pool'); nat(n, true);
  for (const id of ['PC1', 'PC3']) for (const service of ['http', 'dns']) assert.equal(n.probe(id, '10.0.20.12', service), true);
  assert.ok(n.events.some(e => e.from === 'R1' && e.frame.protocol === 'tcp' && e.frame.srcIP === '203.0.113.1'));
  assert.ok(n.events.some(e => e.to === 'PC3' && e.frame.protocol === 'udp' && e.frame.dstIP === '10.0.10.13' && e.frame.dstPort === 49152));
});
test('DHCP clients renew available leases and stop using expired leases after server loss and restore', () => {
  const n = create('dhcp-relay'); relay(n); n.device('SRV1').pools.SERVER.lease = 60;
  run(n, 'R2', ['ip route 10.0.10.0 255.255.255.0 10.0.12.1']); n.dhcp('PC1');
  const firstExpiry = n.device('SRV1').bindings[n.device('PC1').mac].lease;
  n.advance(31); assert.ok(n.device('SRV1').bindings[n.device('PC1').mac].lease > firstExpiry);
  n.power('SRV1', false); const saved = new E.Network(n.snapshot()); saved.advance(61);
  assert.equal(saved.device('PC1').ip, ''); assert.equal(saved.device('PC1').gateway, '');
  saved.power('SRV1', true); assert.match(saved.dhcp('PC1'), /10.0.10.100/);
});
test('changing an IOS DHCP interface to manual IPv4 clears its learned gateway and persists the manual configuration', () => {
  const n = S.seed('route-ready'); n.device('R2').pools.WAN = { network: '10.0.12.0', mask: '255.255.255.252', gateway: '10.0.12.2' };
  run(n, 'R1', ['int gi0/1', 'ip address dhcp', 'ip address 10.0.12.1 255.255.255.252']);
  const config = show(n, 'R1', 'show running-config');
  assert.match(config, /ip address 10\.0\.12\.1 255\.255\.255\.252/); assert.doesNotMatch(config, /ip address dhcp/);
  assert.equal(n.routingTable(n.device('R1')).some(r => r.dhcp), false);
});
test('clients on the same AP and WLAN can reach each other while different WLAN VLANs remain isolated', () => {
  const n = create('wlc-wlan'); wlc(n);
  const second = n.add('Laptop-PT'); n.configurePC(second.id, '10.20.0.14', '255.255.255.0');
  Object.assign(second.wireless, n.device('PC1').wireless); n.connect(second.id, 'Wireless0', 'AP1', 'Wireless0', 'wireless');
  assert.equal(ping(n, 'PC1', '10.20.0.14'), 1); assert.equal(ping(n, second.id, '10.20.0.11'), 1);
  n.configureWlcInterface('WLC1', { name: 'guests', vlan: 30, ip: '10.30.0.2', mask: '255.255.255.0' });
  n.configureWlan('WLC1', { id: 2, name: 'GUESTS', ssid: 'GUESTS', interface: 'guests', enabled: true, security: 'open', key: '', qos: 'bronze' });
  Object.assign(second.wireless, { ssid: 'GUESTS', security: 'open', key: '' }); n.changed();
  assert.equal(ping(n, 'PC1', '10.20.0.14'), 0);
});
test('DHCP renewal reuses the only available WAN address after restore and large simulation time jumps', () => {
  const n = S.seed('route-ready'); n.device('R2').pools.WAN = { network: '10.0.12.0', mask: '255.255.255.252', gateway: '10.0.12.2', lease: 60 };
  run(n, 'R1', ['int gi0/1', 'ip address dhcp']);
  const saved = new E.Network(n.snapshot()); saved.advance(31);
  assert.equal(saved.device('R1').ports['GigabitEthernet0/1'].ip, '10.0.12.1');
  saved.advance(300); assert.equal(saved.device('R1').ports['GigabitEthernet0/1'].ip, '10.0.12.1');
  assert.ok(saved.routingTable(saved.device('R1')).some(r => r.dhcp));
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { Network, Terminal, REQUIRED, validAddress } = require('./engine.js');

function configured() {
  const n = new Network();
  for (const [a, ap, b, bp] of REQUIRED) n.connect(a, ap, b, bp, a.startsWith('SW') && b.startsWith('SW') ? 'cross' : 'straight');
  for (let i = 1; i <= 4; i++) n.configurePC('PC' + i, '192.168.1.' + i, '255.255.255.0');
  return n;
}
function ping(n, from = 'PC1', target = '192.168.1.3') { const t = n.startPing(from, target); n.run(); return t; }

test('first ARP is broadcast; only target replies; switches learn source MAC on ingress', () => {
  const n = configured();
  n.startPing('PC1', '192.168.1.3', 1);
  assert.equal(Object.keys(n.device('SW1').macTable).length, 0);
  n.step();
  assert.equal(Object.values(n.device('SW1').macTable)[0].port, 'FastEthernet0/1');
  assert.equal(Object.keys(n.device('SW2').macTable).length, 0);
  n.run();
  const received = n.events.filter(e => e.frame.type === 'ARP Request' && e.to.startsWith('PC')).map(e => e.to);
  assert.deepEqual(received.sort(), ['PC2', 'PC3', 'PC4']);
  assert.ok(n.events.filter(e => e.frame.type === 'ARP Reply').every(e => !['PC2', 'PC4'].includes(e.to)));
  assert.equal(n.tests[0].replies, 1);
  assert.equal(Object.keys(n.device('SW1').macTable).length, 2);
  assert.ok(!Object.values(n.device('SW1').macTable).some(e => e.mac === n.device('PC2').mac));
  assert.equal(n.device('PC1').arp['192.168.1.3'].mac, n.device('PC3').mac);
});

test('complete exercise can earn 15/15 only after checking and clearing both MAC tables', () => {
  const n = configured(); assert.equal(n.checks().filter(x => x.ok).length, 9);
  assert.equal(ping(n).replies, 4); assert.equal(ping(n, 'PC2', '192.168.1.4').replies, 4);
  for (const id of ['SW1', 'SW2']) {
    const t = new Terminal(n, id); t.execute('en');
    const output = t.execute('show mac address-table'); assert.match(output, /Total Mac Addresses for this criterion: 4/);
    if (id === 'SW1') assert.match(output, /00d0.ba00.0003\s+DYNAMIC\s+Gi0\/1/);
    t.execute('clear mac address-table dynamic'); assert.equal(n.state.evidence.clear[id], undefined);
    assert.match(t.execute('show mac address-table'), /criterion: 0/);
  }
  assert.equal(n.checks().filter(x => x.ok).length, 15);
  n.disconnect(n.state.links[0].id);
  assert.equal(n.state.evidence.pings['PC1>192.168.1.3'], undefined);
});

test('cached ARP skips new ARP; clearing switch MAC floods unknown unicast then relearns', () => {
  const n = configured(); ping(n); n.events = [];
  n.device('SW1').macTable = {}; n.device('SW2').macTable = {};
  ping(n);
  assert.equal(n.events.filter(e => e.protocol === 'ARP').length, 0);
  assert.ok(n.events.some(e => e.result === 'Flood' && e.protocol === 'ICMP'));
  assert.equal(Object.values(n.device('SW1').macTable).length, 2);
});

test('missing cable, shutdown and powered-off switch each fail connectivity', () => {
  for (const fault of [n => n.disconnect(n.state.links[2].id), n => n.setPort('SW1', 'GigabitEthernet0/1', { enabled: false }), n => n.power('SW2', false)]) {
    const n = configured(); fault(n); assert.equal(ping(n).replies, 0);
  }
});

test('wrong subnet and asymmetric return mask fail; disconnected unused PC does not break other hosts', () => {
  let n = configured(); n.configurePC('PC3', '192.168.2.3', '255.255.255.0'); assert.equal(ping(n, 'PC1', '192.168.2.3').replies, 0);
  n = configured(); n.configurePC('PC1', '192.168.1.130', '255.255.255.0'); n.configurePC('PC3', '192.168.1.3', '255.255.255.128'); assert.equal(ping(n).replies, 0);
  n = configured(); n.disconnect(n.linkAt('PC4', 'FastEthernet0').id); assert.equal(ping(n).replies, 4);
});

test('different access VLANs isolate hosts despite physical link remaining up', () => {
  const n = configured(); n.setPort('SW1', 'FastEthernet0/1', { vlan: 2 });
  assert.ok(n.status(n.linkAt('PC1', 'FastEthernet0')).up); assert.equal(ping(n).replies, 0);
});

test('2960 Auto MDI-X accepts either cable, disabled MDI-X makes wrong cable fail', () => {
  const n = configured(); const l = n.linkAt('PC1', 'FastEthernet0'); n.disconnect(l.id);
  const wrong = n.connect('PC1', 'FastEthernet0', 'SW1', 'FastEthernet0/1', 'cross');
  assert.equal(ping(n).replies, 4);
  n.setPort('SW1', 'FastEthernet0/1', { autoMdix: false });
  assert.equal(n.status(wrong).up, false); assert.equal(ping(n).replies, 0);
});

test('occupied ports are rejected; STP blocks a redundant switch link', () => {
  const n = configured(), links = n.state.links.length;
  assert.throws(() => n.connect('PC1', 'FastEthernet0', 'SW2', 'FastEthernet0/3', 'straight'), /zajęty/);
  n.connect('SW1', 'GigabitEthernet0/2', 'SW2', 'GigabitEthernet0/2', 'cross');
  assert.equal(n.state.links.length, links + 1);
  assert.equal(n.spanning(1).SW2.ports['GigabitEthernet0/2'].state, 'BLK');
  assert.equal(ping(n).replies, 4);
});

test('invalid, broadcast, network, duplicate addresses and non-contiguous masks are rejected', () => {
  const n = configured();
  for (const [ip, mask] of [['192.168.1.0', '255.255.255.0'], ['192.168.1.255', '255.255.255.0'], ['256.1.1.1', '255.0.0.0'], ['192.168.1.2', '255.0.255.0'], ['127.0.0.1', '255.0.0.0']]) {
    assert.equal(validAddress(ip, mask), false); assert.throws(() => n.configurePC('PC1', ip, mask));
  }
  assert.throws(() => n.configurePC('PC1', '192.168.1.2', '255.255.255.0'), /Konflikt/);
  assert.equal(n.device('PC1').ip, '192.168.1.1');
});

test('MAC and ARP age out; next ping resolves ARP again', () => {
  const n = configured(); ping(n); n.state.clock += 301; n.age();
  assert.equal(Object.keys(n.device('SW1').macTable).length, 0);
  assert.equal(Object.keys(n.device('PC1').arp).length, 0);
  n.events = []; assert.equal(ping(n).replies, 4); assert.equal(n.events[0].protocol, 'ARP');
});

test('CLI modes, interface state, abbreviations and startup-config affect actual devices', () => {
  const n = configured(), t = new Terminal(n, 'SW1');
  assert.match(t.execute('configure terminal'), /Invalid/); t.execute('en');t.execute('conf t');t.execute('hostname ACCESS1');
  assert.equal(t.prompt(), 'ACCESS1(config)#'); t.execute('int g0/1'); assert.equal(t.prompt(), 'ACCESS1(config-if)#');
  t.execute('shutdown'); assert.equal(ping(n).replies, 0);t.execute('no shut');assert.equal(ping(n).replies, 4);
  t.execute('end');t.execute('copy run start');assert.equal(t.pendingCopy,true);t.execute('');assert.equal(t.d.startup.hostname, 'ACCESS1');
  t.execute('conf t');t.execute('hostname TEMP');n.power('SW1',false);n.power('SW1',true);assert.equal(t.d.hostname,'ACCESS1');
  assert.match(t.execute('nonsense'), /Invalid/);
});

test('JSON restores topology and configs, leaves volatile tables empty, rejects corrupt input atomically', () => {
  const n = configured(); ping(n); const restored = new Network(JSON.parse(JSON.stringify(n.snapshot())));
  assert.equal(restored.state.links.length,5); assert.equal(Object.keys(restored.device('SW1').macTable).length,0);
  assert.equal(ping(restored).replies,4);
  const old=restored.snapshot(), bad=JSON.parse(JSON.stringify(old));bad.links[0].a.port='not-a-port';
  assert.throws(()=>restored.restore(bad));assert.deepEqual(restored.snapshot(),old);
});

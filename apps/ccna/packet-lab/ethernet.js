(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CcnaEthernetEngine = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const BROADCAST = 'ffff.ffff.ffff';
  const clone = value => JSON.parse(JSON.stringify(value));
  const REQUIRED = [
    ['PC1', 'FastEthernet0', 'SW1', 'FastEthernet0/1'],
    ['PC2', 'FastEthernet0', 'SW1', 'FastEthernet0/2'],
    ['SW1', 'GigabitEthernet0/1', 'SW2', 'GigabitEthernet0/1'],
    ['PC3', 'FastEthernet0', 'SW2', 'FastEthernet0/1'],
    ['PC4', 'FastEthernet0', 'SW2', 'FastEthernet0/2']
  ];
  function ipv4(s) {
    if (!/^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(String(s))) return null;
    const a = s.split('.').map(Number);
    return a.some(n => n > 255) ? null : a.reduce((n, v) => (n * 256 + v) >>> 0, 0);
  }
  function validAddress(ip, mask) {
    const n = ipv4(ip), m = ipv4(mask), inv = m === null ? 0 : (~m >>> 0);
    if (n === null || m === null || !m || inv < 3 || ((inv + 1) & inv) !== 0) return false;
    const first = Number(ip.split('.')[0]);
    return first > 0 && first < 224 && first !== 127 && (n & inv) !== 0 && (n & inv) !== inv;
  }
  const sameSubnet = (a, b, mask) => ipv4(a) !== null && ipv4(b) !== null && (ipv4(a) & ipv4(mask)) === (ipv4(b) & ipv4(mask));
  const shortPort = p => p.replace('FastEthernet', 'Fa').replace('GigabitEthernet', 'Gi');
  function makeDevice(type, id, x, y) {
    const ports = {};
    if (type === 'pc') ports.FastEthernet0 = { enabled: true, vlan: 1, autoMdix: false };
    else {
      for (let n = 1; n <= 24; n++) ports['FastEthernet0/' + n] = { enabled: true, vlan: 1, autoMdix: true };
      for (let n = 1; n <= 2; n++) ports['GigabitEthernet0/' + n] = { enabled: true, vlan: 1, autoMdix: true };
    }
    return { id, type, hostname: id, model: type === 'pc' ? 'PC-PT' : '2960-24TT', x, y, power: true,
      ip: '', mask: '255.255.255.0', gateway: '', mac: '00d0.ba00.' + (type === 'pc' ? Number(id.replace(/\D/g, '')) : 100 + Number(id.replace(/\D/g, ''))).toString(16).padStart(4, '0'),
      ports, arp: {}, macTable: {}, startup: null };
  }
  function freshState() {
    return { version: 1, revision: 0, clock: 0, devices: [
      makeDevice('pc', 'PC1', 220, 130), makeDevice('pc', 'PC2', 220, 410),
      makeDevice('switch', 'SW1', 470, 270), makeDevice('switch', 'SW2', 810, 270),
      makeDevice('pc', 'PC3', 1060, 130), makeDevice('pc', 'PC4', 1060, 410)
    ], links: [], evidence: { pings: {}, read: {}, clear: {} } };
  }
  class Network {
    constructor(saved) {
      this.state = freshState(); this.queue = []; this.events = []; this.tests = []; this.serial = 0; this.activeTest = null;
      if (saved) this.restore(saved);
    }
    device(id) { return this.state.devices.find(d => d.id === id); }
    snapshot() {
      const s = clone(this.state);
      s.devices.forEach(d => { d.arp = {}; d.macTable = {}; });
      return s;
    }
    restore(input) {
      if (!input || input.version !== 1 || !Array.isArray(input.devices) || !Array.isArray(input.links) || input.devices.length > 24 || input.links.length > 48) throw new Error('Nieprawidłowy plik laboratorium.');
      const clean = freshState(); clean.devices = [];
      for (const item of input.devices) {
        if (!/^(PC|SW)\d{1,3}$/.test(item.id) || !['pc', 'switch'].includes(item.type) || clean.devices.some(d => d.id === item.id)) throw new Error('Nieprawidłowe urządzenie.');
        const d = makeDevice(item.type, item.id, Math.max(60, Math.min(1220, Number(item.x) || 100)), Math.max(60, Math.min(480, Number(item.y) || 100)));
        if (item.hostname && /^[A-Za-z][\w-]{0,31}$/.test(item.hostname)) d.hostname = item.hostname;
        if (item.ip && !validAddress(item.ip, item.mask)) throw new Error("Nieprawidłowy host address.");
        if (item.gateway && ipv4(item.gateway) === null) throw new Error("Nieprawidłowa gateway.");
        d.ip = item.ip || ''; d.mask = item.mask || '255.255.255.0'; d.gateway = item.gateway || ''; d.power = item.power !== false;
        for (const [p, config] of Object.entries(item.ports || {})) if (d.ports[p]) {
          if (!Number.isInteger(config.vlan) || config.vlan < 1 || config.vlan > 4094) throw new Error('Nieprawidłowy VLAN.');
          d.ports[p] = { enabled: config.enabled !== false, vlan: config.vlan, autoMdix: !!config.autoMdix };
        }
        if (item.startup && typeof item.startup === 'object') {
          const st = item.startup;
          if (typeof st.hostname === 'string' && /^[A-Za-z][\w-]{0,31}$/.test(st.hostname) && st.ports && typeof st.ports === 'object') {
            d.startup = { hostname: st.hostname, ports: {} };
            for (const p of Object.keys(d.ports)) { const c = st.ports[p]; if (!c || !Number.isInteger(c.vlan) || c.vlan < 1 || c.vlan > 4094) throw new Error('Nieprawidłowa konfiguracja startowa.'); d.startup.ports[p] = { enabled: c.enabled !== false, vlan: c.vlan, autoMdix: !!c.autoMdix }; }
          }
        }
        clean.devices.push(d);
      }
      const previous = this.state; this.state = clean;
      try { for (const l of input.links) this.connect(l.a?.device, l.a?.port, l.b?.device, l.b?.port, l.type); }
      catch (error) { this.state = previous; throw error; }
      this.state.revision = Number.isSafeInteger(input.revision) ? input.revision : 0;
      this.state.clock = Number.isFinite(input.clock) ? Math.max(0, input.clock) : 0;
      const e = input.evidence || {};
      this.state.evidence = { pings: Object.assign({}, e.pings), read: Object.assign({}, e.read), clear: Object.assign({}, e.clear) };
      this.queue = []; this.events = []; this.tests = []; this.activeTest = null;
    }
    changed() {
      this.state.revision++;
      this.state.evidence = { pings: {}, read: {}, clear: {} };
      this.queue = [];
      if (this.activeTest) { this.activeTest.status = 'Przerwano: zmiana topologii'; this.activeTest = null; }
      this.state.devices.forEach(d => { d.arp = {}; d.macTable = {}; });
    }
    add(type, x, y) {
      if (!['pc', 'switch'].includes(type) || this.state.devices.length >= 24) throw new Error('Maksymalnie 24 urządzenia w tym laboratorium.');
      let n = 1, prefix = type === 'pc' ? 'PC' : 'SW'; while (this.device(prefix + n)) n++;
      const d = makeDevice(type, prefix + n, x, y); this.state.devices.push(d); this.changed(); return d;
    }
    remove(id) { this.state.devices = this.state.devices.filter(d => d.id !== id); this.state.links = this.state.links.filter(l => l.a.device !== id && l.b.device !== id); this.changed(); }
    linkAt(id, port) { return this.state.links.find(l => (l.a.device === id && l.a.port === port) || (l.b.device === id && l.b.port === port)); }
    peer(id, port) { const l = this.linkAt(id, port); return l && { link: l, end: l.a.device === id && l.a.port === port ? l.b : l.a }; }
    status(l) {
      const a = this.device(l.a.device), b = this.device(l.b.device), ap = a?.ports[l.a.port], bp = b?.ports[l.b.port];
      if (!a?.power || !b?.power) return { up: false, reason: 'Urządzenie jest wyłączone' };
      if (!ap?.enabled || !bp?.enabled) return { up: false, reason: 'Port administracyjnie wyłączony (shutdown)' };
      const correct = a.type === b.type ? 'cross' : 'straight';
      if (l.type !== correct && !ap.autoMdix && !bp.autoMdix) return { up: false, reason: "Niewłaściwy cable; Auto MDI-X jest wyłączone" };
      return { up: true, reason: 'Link up' };
    }
    connect(a, ap, b, bp, type) {
      const da = this.device(a), db = this.device(b);
      if (!da?.ports[ap] || !db?.ports[bp] || a === b || !['straight', 'cross'].includes(type)) throw new Error('Wybierz dwa różne urządzenia i porty Ethernet.');
      if (this.linkAt(a, ap) || this.linkAt(b, bp)) throw new Error("Ten port jest już zajęty. Najpierw usuń cable.");
      if (da.type === 'switch' && db.type === 'switch') {
        const visited = new Set(), todo = [a];
        while (todo.length) { const id = todo.pop(); if (id === b) throw new Error('To połączenie tworzy pętlę. To laboratorium obejmuje topologię bez pętli; STP nie jest tutaj symulowane.'); if (visited.has(id)) continue; visited.add(id); for (const l of this.state.links) { const n = l.a.device === id ? l.b.device : l.b.device === id ? l.a.device : null; if (n && this.device(n)?.type === 'switch') todo.push(n); } }
      }
      const l = { id: 'L' + (++this.serial), a: { device: a, port: ap }, b: { device: b, port: bp }, type };
      this.state.links.push(l); this.changed(); return l;
    }
    disconnect(id) { this.state.links = this.state.links.filter(l => l.id !== id); this.changed(); }
    configurePC(id, ip, mask, gateway = '') {
      const d = this.device(id); if (!d || d.type !== 'pc') throw new Error('Wybierz komputer.');
      if (!validAddress(ip, mask)) throw new Error("Podaj poprawny host address i ciągłą subnet mask /1–/30. Network address i broadcast nie mogą należeć do PC.");
      if (gateway && (!validAddress(gateway, mask) || !sameSubnet(ip, gateway, mask))) throw new Error("Gateway musi być host address w tej samej podsieci. W tym ćwiczeniu pozostaw ją pustą.");
      if (this.state.devices.some(p => p.id !== id && p.type === 'pc' && p.ip === ip)) throw new Error('Konflikt IP: ten adres ma już inny komputer.');
      d.ip = ip; d.mask = mask; d.gateway = gateway; this.changed();
    }
    setPort(id, port, patch) {
      const p = this.device(id)?.ports[port]; if (!p) throw new Error("Nie ma takiego interface.");
      if ('vlan' in patch && (!Number.isInteger(patch.vlan) || patch.vlan < 1 || patch.vlan > 4094)) throw new Error('VLAN: 1–4094.');
      Object.assign(p, patch); this.changed();
    }
    power(id, value) {
      const d = this.device(id); d.power = value;
      if (value && d.type === 'switch') {
        const defaults = makeDevice('switch', id, d.x, d.y);
        d.hostname = d.startup?.hostname || id; d.ports = clone(d.startup?.ports || defaults.ports);
      }
      this.changed();
    }
    age() {
      for (const d of this.state.devices) {
        for (const [mac, e] of Object.entries(d.macTable)) if (this.state.clock - e.time >= 300) delete d.macTable[mac];
        for (const [ip, e] of Object.entries(d.arp)) if (this.state.clock - e.time >= 240) delete d.arp[ip];
      }
    }
    send(from, port, frame) {
      const peer = this.peer(from, port);
      if (!peer || !this.status(peer.link).up) return false;
      this.queue.push({ from, outPort: port, to: peer.end.device, inPort: peer.end.port, frame: { ...frame, hops: (frame.hops || 0) + 1 }, link: peer.link.id });
      return true;
    }
    frame(type, src, dst, mac, test, seq) {
      return { type, srcMac: src.mac, dstMac: mac, srcIP: src.ip, dstIP: dst, test, seq, hops: 0 };
    }
    startPing(id, target, count = 4) {
      if (this.activeTest) throw new Error('Dokończ bieżącą symulację albo użyj „Wyczyść zdarzenia”.');
      const src = this.device(id); if (!src || src.type !== 'pc') throw new Error('Ping rozpocznij na komputerze.');
      if (ipv4(target) === null) throw new Error('Ping wymaga adresu IPv4, np. 192.168.1.3.');
      const t = { id: ++this.serial, source: id, target, count, seq: 0, replies: 0, lines: [], status: 'W toku', revision: this.state.revision };
      this.tests.push(t); this.tests = this.tests.slice(-30); this.activeTest = t;
      if (!src.power || !src.ports.FastEthernet0.enabled || !validAddress(src.ip, src.mask)) t.error = 'General failure. Sprawdź zasilanie, port oraz konfigurację IP.';
      else if (!sameSubnet(src.ip, target, src.mask)) t.error = src.gateway ? "Destination host unreachable. W tej topologii nie ma routera/gateway." : "Destination host unreachable. Cel jest poza podsiecią; brak default gateway.";
      this.nextAttempt(); return t;
    }
    nextAttempt() {
      const t = this.activeTest; if (!t) return;
      if (t.seq >= t.count) {
        t.status = t.replies === t.count ? 'Successful' : 'Failed';
        if (t.status === 'Successful') this.state.evidence.pings[t.source + '>' + t.target] = this.state.revision;
        this.activeTest = null; return;
      }
      t.seq++; t.delivered = false; t.icmpSent = false;
      const src = this.device(t.source);
      if (t.error || t.target === src.ip) {
        this.queue.push({ local: true, to: src.id, from: src.id, frame: this.frame('ICMP Echo Reply', src, t.target, src.mac, t.id, t.seq), error: t.error }); return;
      }
      this.age(); const known = src.arp[t.target];
      const f = this.frame(known ? 'ICMP Echo Request' : 'ARP Request', src, t.target, known?.mac || BROADCAST, t.id, t.seq);
      t.icmpSent = !!known;
      if (!this.send(src.id, 'FastEthernet0', f)) this.queue.push({ local: true, from: src.id, to: src.id, frame: f, error: 'Request timed out. Brak aktywnego połączenia Ethernet.' });
    }
    step() {
      if (!this.queue.length) return null;
      this.state.clock += .001; this.age();
      const hop = this.queue.shift(), f = hop.frame, dest = this.device(hop.to), t = this.activeTest;
      const event = { ...clone(hop), id: ++this.serial, time: this.state.clock, protocol: f.type.startsWith('ARP') ? 'ARP' : 'ICMP', result: '', detail: '' };
      if (hop.error) { event.result = 'Dropped'; event.detail = hop.error; }
      else if (hop.local) { event.result = 'Received'; event.detail = 'Odpowiedź lokalnego stosu IP.'; if (t) t.delivered = true; }
      else if (!dest || !dest.power || !dest.ports[hop.inPort]?.enabled || !this.state.links.some(l => l.id === hop.link && this.status(l).up)) { event.result = 'Dropped'; event.detail = 'Łącze jest nieaktywne.'; }
      else if (f.hops > 24) { event.result = 'Dropped'; event.detail = "Limit drogi frame."; }
      else if (dest.type === 'switch') {
        const vlan = dest.ports[hop.inPort].vlan;
        dest.macTable[vlan + ':' + f.srcMac] = { mac: f.srcMac, port: hop.inPort, vlan, time: this.state.clock };
        const learned = dest.macTable[vlan + ':' + f.dstMac];
        const ports = learned ? [learned.port] : Object.keys(dest.ports).filter(p => dest.ports[p].vlan === vlan);
        const sent = ports.filter(p => p !== hop.inPort && dest.ports[p].enabled && this.send(dest.id, p, f));
        event.result = sent.length ? (learned ? 'Forward' : 'Flood') : 'Filtered';
        event.detail = 'Uczy się ' + f.srcMac + ' na ' + shortPort(hop.inPort) + ' (VLAN ' + vlan + '). ' + (learned ? 'Znany unicast' : f.dstMac === BROADCAST ? 'Broadcast' : 'Nieznany unicast') + '; wyjścia: ' + (sent.map(shortPort).join(', ') || 'brak') + '.';
      } else if (f.dstMac !== BROADCAST && f.dstMac !== dest.mac) { event.result = 'Dropped'; event.detail = 'Docelowy MAC nie należy do tego hosta.'; }
      else {
        event.result = 'Received';
        if (f.type === 'ARP Request') {
          if (dest.arp[f.srcIP]) dest.arp[f.srcIP] = { mac: f.srcMac, time: this.state.clock };
          if (dest.ip === f.dstIP && validAddress(dest.ip, dest.mask)) {
            dest.arp[f.srcIP] = { mac: f.srcMac, time: this.state.clock };
            this.send(dest.id, 'FastEthernet0', this.frame('ARP Reply', dest, f.srcIP, f.srcMac, f.test, f.seq));
            event.detail = 'Zapytanie dotyczy mojego IP. Zapis ARP nadawcy; odpowiedź ARP unicastem.';
          } else { event.result = 'Ignored'; event.detail = 'Broadcast dotarł, ale zapytanie ARP nie dotyczy mojego IP. Host nie odpowiada.'; }
        } else if (f.type === 'ARP Reply' && dest.ip === f.dstIP) {
          dest.arp[f.srcIP] = { mac: f.srcMac, time: this.state.clock };
          event.detail = "Zapis mapowania IP → MAC. Oczekujący packet ICMP może zostać wysłany.";
          if (t && t.id === f.test && t.source === dest.id && !t.icmpSent) { t.icmpSent = true; this.send(dest.id, 'FastEthernet0', this.frame('ICMP Echo Request', dest, t.target, f.srcMac, t.id, t.seq)); }
        } else if (f.type === 'ICMP Echo Request' && dest.ip === f.dstIP) {
          if (!sameSubnet(dest.ip, f.srcIP, dest.mask)) { event.result = 'Dropped'; event.detail = "Brak trasy powrotnej do nadawcy. Sprawdź subnet mask i gateway hosta."; }
          else { this.send(dest.id, 'FastEthernet0', this.frame('ICMP Echo Reply', dest, f.srcIP, f.srcMac, f.test, f.seq)); event.detail = 'Docelowy host odsyła ICMP Echo Reply.'; }
        } else if (f.type === 'ICMP Echo Reply' && dest.ip === f.dstIP && t?.id === f.test) { t.delivered = true; event.detail = 'Echo Reply dotarło do nadawcy. Próba ping zakończona sukcesem.'; }
        else { event.result = 'Ignored'; event.detail = "Packet nie jest przeznaczony dla tego IP address."; }
      }
      this.events.push(event); this.events = this.events.slice(-500);
      if (!this.queue.length && t) {
        if (t.delivered) { t.replies++; t.lines.push('Reply from ' + t.target + ': bytes=32 time<1ms TTL=128'); }
        else t.lines.push(t.error || hop.error || 'Request timed out.');
        this.nextAttempt();
      }
      return event;
    }
    run() { let steps = 0; while (this.queue.length && steps++ < 5000) this.step(); if (this.queue.length) throw new Error('Limit zdarzeń symulacji.'); }
    clearEvents() { this.queue = []; if (this.activeTest) this.activeTest.status = 'Przerwano'; this.activeTest = null; this.events = []; this.tests = []; }
    checks() {
      const e = this.state.evidence, r = this.state.revision;
      return [
        ...REQUIRED.map(([a, ap, b, bp]) => ({ label: a + ' ' + shortPort(ap) + ' ↔ ' + b + ' ' + shortPort(bp), ok: this.state.links.some(l => this.status(l).up && ((l.a.device === a && l.a.port === ap && l.b.device === b && l.b.port === bp) || (l.b.device === a && l.b.port === ap && l.a.device === b && l.a.port === bp))) })),
        ...[1, 2, 3, 4].map(n => ({ label: 'PC' + n + ': 192.168.1.' + n + "/24, port aktywny, bez gateway", ok: this.device('PC' + n)?.ip === '192.168.1.' + n && this.device('PC' + n)?.mask === '255.255.255.0' && this.device('PC' + n)?.gateway === '' && !!this.device('PC' + n)?.power && !!this.device('PC' + n)?.ports.FastEthernet0.enabled })),
        ...['PC1>192.168.1.3', 'PC2>192.168.1.4'].map(k => ({ label: 'Udany ping ' + k.replace('>', ' → '), ok: e.pings[k] === r })),
        ...['SW1', 'SW2'].map(id => ({ label: id + ': odczytaj cztery dynamiczne adresy (show mac address-table)', ok: e.read[id] === r })),
        ...['SW1', 'SW2'].map(id => ({ label: id + ": po odczycie wyczyść MAC address table i sprawdź, że jest pusta", ok: e.clear[id] === r }))
      ];
    }
  }
  return { Network, freshState, ipv4, validAddress, sameSubnet, shortPort, REQUIRED, BROADCAST };
});

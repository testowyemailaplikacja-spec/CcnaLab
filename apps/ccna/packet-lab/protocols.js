(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.CcnaLabProtocols = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E) {
  'use strict';
  const P = E.Network.prototype;
  const { ipv4, ipString, sameSubnet, prefix, ipv6, parse6, isHost, isIOS, clone } = E;
  const original = Object.fromEntries(['changed', 'neighbors', 'dynamicRoutes', 'interfaces', 'routingTable', 'route', 'startPing', 'age'].map(k => [k, P[k]]));
  const isLinkLocal = ip => ipv6(ip) !== null && ipv6(ip) >> 118n === 0x3fan;
  const six = n => {
    const parts = Array.from({ length: 8 }, (_, i) => Number(n >> BigInt((7 - i) * 16) & 65535n).toString(16));
    let best = -1, length = 1;
    for (let i = 0; i < 8;) { if (parts[i] !== '0') { i++; continue; } let j = i; while (parts[j] === '0') j++; if (j - i > length) { best = i; length = j - i; } i = j; }
    return best < 0 ? parts.join(':') : parts.slice(0, best).join(':') + '::' + parts.slice(best + length).join(':');
  };
  const canonical6 = ip => ipv6(ip) === null ? ip : six(ipv6(ip));
  const eui64 = mac => {
    const h = mac.replace(/[^a-f0-9]/gi, '').padStart(12, '0');
    return BigInt('0x' + (parseInt(h.slice(0, 2), 16) ^ 2).toString(16).padStart(2, '0') + h.slice(2, 6) + 'fffe' + h.slice(6));
  };
  Object.assign(E, { isLinkLocal, canonical6, six, eui64 });

  // OSPF elections retain the incumbent DR/BDR until it leaves the segment.
  // Hello/DBD checks and the resulting stable states are explicit; wall-clock
  // packet timers and a complete LSA flooding implementation are outside this model.
  P.ospf = function () {
    if (this._ospfCache?.revision === this.state.revision) return this._ospfCache;
    this._ospfRuntime ||= { ids: {}, elections: {}, states: {} };
    const runtime = this._ospfRuntime, endpoints = [], issues = [], rows = {};
    for (const d of this.state.devices) {
      if (!d.power || !d.routing || !d.protocols.ospf) continue;
      const active = this.interfaces(d).filter(i => i.up && !i.virtual && this.protocolOn(d, i, 'ospf'));
      if (!active.length) continue;
      if (!runtime.ids[d.id]) {
        const addresses = this.interfaces(d).filter(i => !i.virtual), loops = addresses.filter(i => i.name.startsWith('Loopback'));
        runtime.ids[d.id] = d.protocols.ospf.routerId || (loops.length ? loops : addresses).sort((a, b) => ipv4(b.ip) - ipv4(a.ip))[0]?.ip;
      }
      for (const i of active) {
        const p = d.ports[i.name], passive = d.protocols.ospf.passive || [], exceptions = d.protocols.ospf.active || [];
        const type = p.ospfNetwork || (p.kind === 'loopback' ? 'loopback' : p.kind === 'serial' ? 'point-to-point' : 'broadcast');
        endpoints.push({ ...i, device: d.id, key: d.id + '|' + i.name, rid: runtime.ids[d.id], area: this.protocolOn(d, i, 'ospf').area || 0,
          type, priority: p.ospfPriority ?? 1, hello: p.ospfHello || 10, dead: p.ospfDead || 40,
          passive: passive.includes(i.name) || passive.includes('default') && !exceptions.includes(i.name),
          cost: p.ospfCost || Math.max(1, Math.ceil((d.protocols.ospf.referenceBandwidth || 100) * 1000 / p.bandwidth)), mtu: p.mtu, mtuIgnore: p.ospfMtuIgnore,
          auth: p.ospfAuthentication || '', password: p.ospfAuthenticationKey || '', role: type === 'loopback' ? 'LOOPBACK' : type === 'point-to-point' ? 'P2P' : 'DROTHER' });
      }
    }
    for (const key of Object.keys(runtime.elections)) if (!endpoints.some(i => i.key === key && !i.passive)) delete runtime.elections[key];
    const canHear = (a, b) => a.device !== b.device && !a.passive && !b.passive && a.mask === b.mask && sameSubnet(a.ip, b.ip, a.mask) && !!this.layer2Path(a.device, a.name, b.device, b.name);
    const compatible = (a, b) => a.rid === b.rid ? 'Duplicate router ID' : String(a.area) !== String(b.area) ? 'Area mismatch' : a.hello !== b.hello || a.dead !== b.dead ? 'Hello/Dead interval mismatch' : a.type !== b.type ? 'Network type mismatch' : a.auth !== b.auth || a.auth && a.password !== b.password ? 'Authentication mismatch' : '';
    const visited = new Set();
    for (const endpoint of endpoints) {
      if (visited.has(endpoint.key) || endpoint.passive || endpoint.type !== 'broadcast') continue;
      const segment = [], todo = [endpoint];
      while (todo.length) { const a = todo.shift(); if (visited.has(a.key)) continue; visited.add(a.key); segment.push(a); for (const b of endpoints) if (!visited.has(b.key) && b.type === 'broadcast' && canHear(a, b) && !compatible(a, b)) todo.push(b); }
      const eligible = segment.filter(i => i.priority > 0).sort((a, b) => b.priority - a.priority || ipv4(b.rid) - ipv4(a.rid));
      const old = segment.map(i => runtime.elections[i.key]).find(s => s && eligible.some(i => i.key === s.dr || i.key === s.bdr));
      let dr = eligible.find(i => i.key === old?.dr) || eligible.find(i => i.key === old?.bdr) || eligible[0];
      const bdr = eligible.find(i => i.key !== dr?.key && i.key === old?.bdr) || eligible.find(i => i.key !== dr?.key);
      for (const i of segment) { i.dr = dr?.rid; i.bdr = bdr?.rid; i.drAddress = dr?.ip; i.bdrAddress = bdr?.ip; i.role = i === dr ? 'DR' : i === bdr ? 'BDR' : 'DROTHER'; runtime.elections[i.key] = { dr: dr?.key, bdr: bdr?.key }; }
    }
    const states = {};
    for (const a of endpoints) {
      rows[a.device] ||= [];
      for (const b of endpoints) {
        if (!canHear(a, b)) continue;
        const reason = compatible(a, b);
        if (reason) { if (reason.includes('interval')) { this.state.evidence.drills ||= {}; this.state.evidence.drills.ospfTimers = true; } issues.push({ device: a.device, local: a.name, peer: b.device, reason }); continue; }
        const adjacent = a.type === 'point-to-point' || ['DR', 'BDR'].includes(a.role) || ['DR', 'BDR'].includes(b.role);
        const mtuMismatch = a.mtu > b.mtu ? !b.mtuIgnore : b.mtu > a.mtu ? !a.mtuIgnore : false;
        if (adjacent && mtuMismatch) { this.state.evidence.drills ||= {}; this.state.evidence.drills.ospfMtu = true; }
        const state = adjacent ? mtuMismatch ? 'EXSTART' : 'FULL' : '2-WAY';
        const n = { device: b.device, local: a.name, remote: b.name, ip: b.ip, routerId: b.rid, area: a.area, cost: a.cost, state, role: a.type === 'point-to-point' ? '-' : b.role, priority: b.priority, dead: a.dead, reason: adjacent && mtuMismatch ? 'MTU mismatch: ' + a.mtu + ' / ' + b.mtu : '' };
        rows[a.device].push(n); states[a.key + '>' + b.key] = state;
        if (runtime.states[a.key + '>' + b.key] !== state) {
          this.serviceEvent('OSPF', a.device, b.device, a.name + ': ' + (runtime.states[a.key + '>' + b.key] || 'DOWN') + ' → ' + (state === 'FULL' ? 'INIT → 2-WAY → EXSTART → EXCHANGE → LOADING → FULL' : state) + (n.reason ? '; ' + n.reason : ''));
        }
      }
    }
    for (const [key, value] of Object.entries(runtime.states)) if (!states[key]) {
      const [local, remote] = key.split('>'); this.serviceEvent('OSPF', local.split('|')[0], remote.split('|')[0], value + ' → DOWN: brak zgodnych Hello lub nieaktywne łącze');
    }
    runtime.states = states;
    return this._ospfCache = { revision: this.state.revision, endpoints, rows, issues };
  };
  P.resetOspf = function (id) {
    this._ospfRuntime ||= { ids: {}, elections: {}, states: {} };
    delete this._ospfRuntime.ids[id];
    for (const key of Object.keys(this._ospfRuntime.elections)) if (key.startsWith(id + '|')) delete this._ospfRuntime.elections[key];
    for (const election of Object.values(this._ospfRuntime.elections)) { if (election.dr?.startsWith(id + '|')) election.dr = ''; if (election.bdr?.startsWith(id + '|')) election.bdr = ''; }
    this._ospfCache = null; this.changed();
  };
  P.neighbors = function (d, proto) { return proto === 'ospf' ? this.ospf().rows[d.id] || [] : original.neighbors.call(this, d, proto); };
  P.dynamicRoutes = function (d) {
    const routes = [], ospf = this.ospf();
    for (const proto of ['ospf', 'rip']) {
      if (!d.protocols[proto]) continue;
      const todo = [{ id: d.id, cost: 0, first: null }], best = new Set();
      while (todo.length) {
        todo.sort((a, b) => a.cost - b.cost); const current = todo.shift(); if (best.has(current.id)) continue; best.add(current.id);
        const remote = this.device(current.id);
        if (current.first) for (const i of this.interfaces(remote).filter(i => i.up && !i.virtual && this.protocolOn(remote, i, proto))) {
          const endpoint = ospf.endpoints.find(e => e.device === remote.id && e.name === i.name);
          const loop = proto === 'ospf' && remote.ports[i.name].kind === 'loopback' && remote.ports[i.name].ospfNetwork !== 'point-to-point';
          const mask = loop ? '255.255.255.255' : i.mask;
          routes.push({ network: ipString(ipv4(i.ip) & ipv4(mask)), mask, prefix: prefix(mask), port: current.first.local, nextHop: current.first.ip, code: proto === 'ospf' ? 'O' : 'R', ad: proto === 'ospf' ? 110 : 120, metric: current.cost + (proto === 'ospf' ? endpoint?.cost || 1 : 0) });
        }
        for (const n of this.neighbors(remote, proto)) {
          if (proto === 'ospf' && n.state !== 'FULL') {
            if (n.state !== '2-WAY') continue;
            const full = (ospf.rows[remote.id] || []).filter(x => x.local === n.local && x.state === 'FULL');
            if (!full.some(x => (ospf.rows[n.device] || []).some(y => y.device === x.device && y.local === n.remote && y.state === 'FULL'))) continue;
          }
          const cost = current.cost + (proto === 'ospf' ? n.cost : 1);
          if (proto !== 'rip' || cost < 16) todo.push({ id: n.device, cost, first: current.first || n });
        }
      }
    }
    return routes;
  };

  P.expireNat = function (d) { d.nat.translations = d.nat.translations.filter(t => !t.expires || t.expires > this.state.clock); };
  P.natOwns = function (d, address) { this.expireNat(d); return d.nat.mappings.some(m => m.global === address) || d.nat.translations.some(t => t.global === address); };
  P.natOut = function (d, frame) {
    this.expireNat(d); d.nat.stats ||= { hits: 0, misses: 0, failed: 0 };
    const fixed = d.nat.mappings.find(m => m.local === frame.srcIP);
    if (fixed) return { ...frame, srcIP: fixed.global };
    const rules = [...(d.nat.rules || []), ...(d.nat.overload ? [{ ...d.nat.overload, overload: true }] : [])];
    const rule = rules.find(r => d.acls[r.acl] && this.aclPermit(d, r.acl, frame));
    if (!rule) return frame;
    const pool = rule.pool ? d.nat.pools?.[rule.pool] : null;
    if (rule.pool && !pool) { this.lastDropReason = 'NAT: skonfigurowana pula nie istnieje.'; d.nat.stats.failed++; return null; }
    const protocol = frame.protocol || 'icmp', localPort = protocol === 'icmp' ? frame.icmpId ?? frame.test : frame.srcPort;
    let translation = d.nat.translations.find(t => t.local === frame.srcIP && t.pool === rule.pool && t.kind === (rule.overload ? 'pat' : 'dynamic') && (!rule.overload || t.protocol === protocol && t.localPort === localPort && t.remote === frame.dstIP && t.remotePort === frame.dstPort));
    if (translation) d.nat.stats.hits++;
    else {
      d.nat.stats.misses++;
      const start = pool ? ipv4(pool.start) : ipv4(d.ports[rule.port]?.ip), end = pool ? ipv4(pool.end) : start;
      let global, globalPort = localPort;
      for (let address = start; start !== null && address <= end; address++) {
        const candidate = ipString(address);
        if (d.nat.mappings.some(m => m.global === candidate)) continue;
        const used = d.nat.translations.filter(t => t.global === candidate);
        if (!rule.overload && used.length || rule.overload && used.some(t => t.kind === 'dynamic')) continue;
        if (rule.overload) {
          const taken = value => used.some(t => t.protocol === protocol && t.globalPort === value);
          globalPort = localPort;
          if (taken(globalPort)) { globalPort = 1024; while (globalPort <= 65535 && taken(globalPort)) globalPort++; }
          if (globalPort > 65535) continue;
        }
        global = candidate; break;
      }
      if (!global) { this.state.evidence.drills ||= {}; this.state.evidence.drills.natExhausted = true; this.lastDropReason = 'NAT: pula adresów lub portów jest wyczerpana.'; d.nat.stats.failed++; return null; }
      translation = { kind: rule.overload ? 'pat' : 'dynamic', local: frame.srcIP, global, pool: rule.pool, protocol, localPort, globalPort, remote: frame.dstIP, remotePort: frame.dstPort, test: frame.test };
      d.nat.translations.push(translation);
    }
    translation.expires = this.state.clock + (translation.kind === 'dynamic' || protocol === 'tcp' ? 86400 : protocol === 'icmp' ? 60 : 300);
    const result = { ...frame, srcIP: translation.global };
    if (rule.overload) result[protocol === 'icmp' ? 'icmpId' : 'srcPort'] = translation.globalPort;
    return result;
  };
  P.natIn = function (d, frame) {
    this.expireNat(d);
    const fixed = d.nat.mappings.find(m => m.global === frame.dstIP);
    if (fixed) return { ...frame, dstIP: fixed.local };
    const protocol = frame.protocol || 'icmp', port = protocol === 'icmp' ? frame.icmpId ?? frame.test : frame.dstPort;
    const t = d.nat.translations.find(t => t.global === frame.dstIP && (t.kind === 'dynamic' || t.kind === 'pat' && t.protocol === protocol && t.globalPort === port && t.remote === frame.srcIP));
    if (!t) return frame;
    const result = { ...frame, dstIP: t.local };
    if (t.kind === 'pat') result[protocol === 'icmp' ? 'icmpId' : 'dstPort'] = t.localPort;
    return result;
  };

  // Routed UDP control traffic uses the same routes, VLAN paths and ACL rules
  // as data traffic. Both directions must work before a service can succeed.
  P.ipPath = function (source, target, options = {}) {
    const start = this.device(source); if (!start?.power) return null;
    const route = this.route(start, target), first = this.interfaces(start).find(i => i.name === route?.port && i.up);
    if (!first) return null;
    const frame = { srcIP: options.sourceIP || first.ip, dstIP: target, protocol: options.protocol || 'udp', srcPort: options.srcPort || 67, dstPort: options.dstPort || 67 };
    let d = start, incoming = '', ttl = 64; const path = [], seen = new Set();
    while (ttl--) {
      if (seen.has(d.id)) return null; seen.add(d.id);
      if (incoming && !this.aclPermit(d, d.ports[incoming]?.aclIn, frame, false)) return null;
      if (this.interfaces(d).some(i => i.up && i.ip === target)) return { path, destination: d.id, sourceIP: frame.srcIP };
      if (d !== start && !d.routing) return null;
      const r = this.route(d, target); if (!r || r.port === 'Null0' || !this.aclPermit(d, d.ports[r.port]?.aclOut, frame, false)) return null;
      let next = null;
      for (const other of this.state.devices) for (const i of this.interfaces(other).filter(i => i.up && i.ip === r.nextHop)) {
        if (other.id === d.id) continue;
        const l2 = this.layer2Path(d.id, r.port, other.id, i.name); if (l2) { next = { device: other, port: i.name, path: l2 }; break; }
      }
      if (!next) return null; path.push(...next.path); d = next.device; incoming = next.port;
    }
    return null;
  };
  P.udpExchange = function (id, target, options = {}) {
    const outbound = this.ipPath(id, target, options); if (!outbound) return null;
    const inbound = this.ipPath(outbound.destination, outbound.sourceIP, { ...options, sourceIP: target, srcPort: options.dstPort || 67, dstPort: options.srcPort || 67 });
    return inbound ? { outbound, inbound } : null;
  };
  P.dhcp = function (id, clientPort) {
    const host = this.device(id), hp = clientPort || this.hostPort(host);
    if (!isHost(host) && !(isIOS(host) && clientPort)) throw new Error("Wybierz host lub interface klienta DHCP.");
    if (!this.portUp(host, hp)) throw new Error("DHCP timeout: interface klienta jest wyłączony lub niepodłączony.");
    const mac = this.interfaceMac(host, hp), candidates = [];
    for (const server of this.state.devices.filter(d => d.power && (d.type === 'router' || d.services.dhcp))) {
      for (const iface of this.interfaces(server).filter(i => i.up && !i.virtual)) {
        const path = this.layer2Path(id, hp, server.id, iface.name);
        if (path) candidates.push({ server, iface, path, giaddr: '', subnet: iface.ip, transport: null });
      }
    }
    for (const relay of this.state.devices.filter(d => d.power && d.routing)) for (const iface of this.interfaces(relay).filter(i => i.up && !i.virtual)) {
      const helpers = relay.ports[iface.name].helpers || [], path = helpers.length && this.layer2Path(id, hp, relay.id, iface.name);
      if (!path) continue;
      for (const address of helpers) {
        const transport = this.udpExchange(relay.id, address, { sourceIP: iface.ip });
        const server = transport && this.device(transport.outbound.destination);
        if (server && (server.type === 'router' || server.services.dhcp)) candidates.push({ server, iface, path, relay, giaddr: iface.ip, subnet: iface.ip, transport });
      }
    }
    for (const candidate of candidates) {
      const { server, iface, path, relay, giaddr, subnet, transport } = candidate;
      const untrusted = path.some((hop, index) => { const sw = this.device(hop.to), next = path[index + 1]; return sw.type === 'switch' && sw.snoopingEnabled && sw.snooping.includes(hop.vlan || sw.ports[hop.inPort].vlan) && next?.from === sw.id && !sw.ports[next.outPort].dhcpTrust; });
      if (untrusted) continue;
      for (const [name, pool] of Object.entries(server.pools)) {
        if (!pool.network || !sameSubnet(subnet, pool.network, pool.mask)) continue;
        const first = ipv4(pool.network) + 1, last = (ipv4(pool.network) | ~ipv4(pool.mask)) >>> 0;
        const existing = server.bindings[mac];
        let leased = existing?.pool === name && existing.lease > this.state.clock && sameSubnet(existing.ip, pool.network, pool.mask) ? existing.ip : '';
        const assigned = this.state.devices.flatMap(d => this.interfaces(d).filter(i => d.id !== id || i.name !== hp).map(i => i.ip));
        for (let address = first; !leased && address < last && address < first + 65536; address++) {
          const ip = ipString(address);
          if (ip === subnet || ip === pool.gateway || server.excluded.some(([a, b = a]) => address >= ipv4(a) && address <= ipv4(b)) || assigned.includes(ip) || Object.values(server.bindings).some(b => b.lease > this.state.clock && b.ip === ip)) continue;
          leased = ip;
        }
        if (!leased) continue;
        const gateway = pool.gateway || '', duration = pool.lease || 86400;
        const lease = { server: server.id, ip: leased, expires: this.state.clock + duration, renewAt: this.state.clock + duration / 2 };
        if (isHost(host)) { this.configurePC(id, leased, pool.mask, gateway, pool.dns || ''); host.addressMethod = 'dhcp'; host.dhcpLease = lease; }
        else { Object.assign(host.ports[hp], { ip: leased, mask: pool.mask, addressMethod: 'dhcp', dhcpGateway: gateway, dhcpDns: pool.dns || '', dhcpLease: lease }); this.changed(); }
        server.bindings[mac] = { ip: leased, mac, pool: name, lease: this.state.clock + duration, giaddr, client: id, clientPort: hp };
        for (const hop of path) { const sw = this.device(hop.to), vlan = hop.vlan || sw.ports?.[hop.inPort]?.vlan; if (sw.type === 'switch' && sw.snoopingEnabled && sw.snooping.includes(vlan)) sw.bindings[mac] = { ip: leased, mac, port: hop.inPort, vlan, lease: this.state.clock + duration, client: id, clientPort: hp }; }
        for (const phase of ['Discover', 'Offer', 'Request', 'ACK']) {
          const response = ['Offer', 'ACK'].includes(phase), segment = response ? path.slice().reverse().map(h => ({ ...h, from: h.to, to: h.from, inPort: h.outPort, outPort: h.inPort })) : path;
          this.serviceEvent('DHCP', response ? server.id : id, response ? id : server.id, 'DHCP ' + phase + '; yiaddr=' + leased + '; giaddr=' + (giaddr || '0.0.0.0'), segment);
          if (transport) this.serviceEvent('DHCP', response ? server.id : relay.id, response ? relay.id : server.id, 'DHCP Relay ' + phase + '; UDP 67 → 67; giaddr=' + giaddr, response ? transport.inbound.path : transport.outbound.path);
        }
        this.state.evidence.observations['dhcp-relay-' + id] = !!giaddr;
        return 'DHCP ACK: ' + leased + ' / ' + pool.mask + '; gateway ' + gateway + (giaddr ? '; relay ' + giaddr : '');
      }
    }
    throw new Error('DHCP timeout: sprawdź pulę, helper-address, trasę powrotną, ACL UDP 67 i zaufany port DHCP Snooping.');
  };
  P.releaseDhcp = function (id, port) {
    const d = this.device(id);
    for (const server of this.state.devices) for (const [mac, b] of Object.entries(server.bindings)) if (b.client === id && (!port || b.clientPort === port)) delete server.bindings[mac];
    if (isHost(d)) Object.assign(d, { ip: '', gateway: '', dns: '', addressMethod: 'dhcp', dhcpLease: null });
    else Object.assign(d.ports[port], { ip: '', mask: '', dhcpGateway: '', dhcpDns: '', dhcpLease: null });
    this.changed();
  };

  P.linkLocal = function (d, name) {
    const p = d.ports[name];
    if (!p || !isHost(d) && !p.ipv6 && !p.ipv6Enabled && !p.linkLocal) return '';
    return p.linkLocal || six(ipv6('fe80::') | eui64(this.interfaceMac(d, name)));
  };
  P.interfaces = function (d, family = 4) {
    if (family !== 6) return original.interfaces.call(this, d, family);
    const entries = isHost(d) ? [[this.hostPort(d), { ...d.ports[this.hostPort(d)], ipv6: d.ipv6 }]] : Object.entries(d.ports);
    const out = [];
    for (const [name, p] of entries) {
      if (!p || p.kind === 'console') continue;
      const ip = parse6(p.ipv6), ll = this.linkLocal(d, name), up = this.portUp(d, name);
      if (ip) out.push({ name, ip: canonical6(ip.ip), prefix: ip.length, up });
      if (ll) out.push({ name, ip: canonical6(ll), prefix: 128, up, linkLocal: true });
    }
    return out;
  };
  P.routingTable = function (d, family = 4) {
    if (family === 4) {
      const routes = original.routingTable.call(this, d, family);
      for (const [port, p] of Object.entries(d.ports)) if (p.addressMethod === 'dhcp' && p.dhcpGateway && this.portUp(d, port) && d.routing && !routes.some(r => r.prefix === 0 && r.ad <= 254)) routes.push({ network: '0.0.0.0', mask: '0.0.0.0', prefix: 0, port, nextHop: p.dhcpGateway, code: 'S*', ad: 254, metric: 0, dhcp: true });
      return routes;
    }
    const routes = this.connected(d, 6).filter(r => !isLinkLocal(r.network)).map(r => r.code === 'C' ? { ...r, network: six(ipv6(r.network) >> BigInt(128 - r.prefix) << BigInt(128 - r.prefix)) } : r);
    if (!d.ipv6Routing) return routes;
    for (let pass = 0; pass <= d.routes6.length; pass++) {
      let added = false;
      for (const r of d.routes6) {
        if (routes.some(x => x.static === r)) continue;
        const linkLocal = r.nextHop && isLinkLocal(r.nextHop), via = r.nextHop && !linkLocal ? this.lookupIn(routes, r.nextHop, 6) : null, port = r.port || via?.port;
        if (!port || !this.portUp(d, port) || r.nextHop && !linkLocal && !via) continue;
        routes.push({ ...r, network: six(ipv6(r.network) >> BigInt(128 - r.prefix) << BigInt(128 - r.prefix)), port, nextHop: via?.nextHop || r.nextHop, static: r, code: 'S', ad: r.ad || 1, metric: 0 }); added = true;
      }
      if (!added) break;
    }
    return routes;
  };
  P.route = function (d, target, family = 4, scope) {
    if (family === 6 && isLinkLocal(target)) {
      const ports = this.interfaces(d, 6).filter(i => i.up && i.linkLocal);
      const iface = scope ? ports.find(i => i.name === scope) : ports.length === 1 ? ports[0] : null;
      return iface ? { port: iface.name, nextHop: canonical6(target) } : null;
    }
    return original.route.call(this, d, family === 6 ? canonical6(target) : target, family);
  };
  P.neighborKey = function (d, port, address, family) { return family === 6 ? port + '|' + canonical6(address) : address; };
  P.startPing = function (id, target, count = 4, options = {}) {
    const [address, zone] = String(target).split('%');
    if (ipv6(address) !== null) {
      if (zone) options.interface = E.Terminal.interfaceName(this.device(id), zone);
      target = canonical6(address);
      if (isLinkLocal(target) && !this.route(this.device(id), target, 6, options.interface)) throw new Error("Adres link-local wymaga exit interface, np. ping ipv6 fe80::1 source gi0/0.");
    }
    return original.startPing.call(this, id, target, count, options);
  };
  P.autoconfigure6 = function (id, renew = false) {
    const host = this.device(id); if (!isHost(host)) throw new Error('SLAAC jest dostępny w konfiguracji hosta.');
    const hp = this.hostPort(host); if (!this.portUp(host, hp)) throw new Error("SLAAC: interface nieaktywny.");
    for (const router of this.state.devices.filter(d => d.power && d.ipv6Routing)) for (const iface of this.interfaces(router, 6).filter(i => i.up && !i.linkLocal && i.prefix === 64)) {
      const p = router.ports[iface.name], path = !p.ndSuppressRA && this.layer2Path(id, hp, router.id, iface.name);
      if (!path || p.ndNoAutoconfig) continue;
      const ip = six(ipv6(iface.ip) >> 64n << 64n | eui64(this.interfaceMac(host, hp)));
      if (this.state.devices.some(d => d.id !== id && this.interfaces(d, 6).some(i => i.ip === ip && i.up && this.layer2Path(id, hp, d.id, i.name)))) throw new Error('SLAAC DAD: wykryto duplikat adresu IPv6.');
      host.ipv6 = ip + '/64'; host.ipv6Gateway = (p.ndRaLifetime ?? 1800) > 0 ? this.linkLocal(router, iface.name) : ''; host.ipv6Method = 'slaac';
      host.slaac = { router: router.id, port: iface.name, expires: this.state.clock + (p.ndValidLifetime ?? 2592000), routerExpires: this.state.clock + (p.ndRaLifetime ?? 1800), preferredUntil: this.state.clock + (p.ndPreferredLifetime ?? 604800) };
      if (!renew) this.changed();
      this.serviceEvent('ICMPv6', id, router.id, 'Router Solicitation: ff02::2', path);
      this.serviceEvent('ICMPv6', router.id, id, 'Router Advertisement: prefix ' + six(ipv6(iface.ip) >> 64n << 64n) + '/64; A=1; router lifetime=' + (p.ndRaLifetime ?? 1800), path.slice().reverse().map(h => ({ ...h, from: h.to, to: h.from })));
      this.serviceEvent('NDP', id, id, 'DAD: ' + ip + ' jest unikalny');
      return 'SLAAC: ' + host.ipv6 + '; gateway ' + (host.ipv6Gateway || 'brak');
    }
    throw new Error('SLAAC: brak Router Advertisement z prefiksem /64. Sprawdź ipv6 unicast-routing, VLAN i suppress-ra.');
  };
  P.advance = function (seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Nieprawidłowy czas symulacji.');
    this.state.clock += seconds;
    const clients = this.state.devices.flatMap(d => isHost(d) ? [{ d, port: null, config: d }] : Object.entries(d.ports).map(([port, config]) => ({ d, port, config })));
    for (const { d, port, config } of clients.filter(c => c.config.addressMethod === 'dhcp' && c.config.dhcpLease)) {
      if (d.power && config.dhcpLease.renewAt <= this.state.clock) { try { this.dhcp(d.id, port || undefined); } catch {} }
      if (config.dhcpLease && config.dhcpLease.expires <= this.state.clock) { this.releaseDhcp(d.id, port || undefined); this.serviceEvent('DHCP', d.id, d.id, 'DHCP lease expired: address withdrawn'); }
    }
    for (const host of this.state.devices.filter(d => d.ipv6Method === 'slaac' && d.slaac)) { try { this.autoconfigure6(host.id, true); } catch {} if (host.slaac.routerExpires <= this.state.clock) host.ipv6Gateway = ''; if (host.slaac.expires <= this.state.clock) host.ipv6 = ''; }
    for (const d of this.state.devices) {
      this.expireNat(d);
      for (const [mac, b] of Object.entries(d.bindings)) if (b.lease && b.lease <= this.state.clock) delete d.bindings[mac];
    }
    this.age();
  };
  P.changed = function () { const drills = this.state.evidence.drills || {}; this._ospfCache = null; original.changed.call(this); this.state.evidence.drills = drills; };
});

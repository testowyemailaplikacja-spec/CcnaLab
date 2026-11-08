(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.CcnaProtocolCLI = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (C) {
  'use strict';
  const { E, Terminal, commands, add, port, touch, number, ip, mask, keyword, interfaceName, exec, words } = C;
  const replace = (syntax, run) => { const c = commands.find(c => c.syntax === syntax); if (!c) throw new Error('Missing CLI syntax: ' + syntax); c.run = run; };
  const routed = (t, p) => { if (t.d.type === 'switch' && p.mode !== 'routed' && p.kind !== 'svi') throw new Error('% This command requires a routed interface or SVI'); };
  const networkType = p => p.ospfNetwork || (p.kind === 'loopback' ? 'loopback' : p.kind === 'serial' ? 'point-to-point' : 'broadcast');
  port('ip ospf priority <priority>', (t, a, no, p) => { routed(t, p); p.ospfPriority = number(a.priority, 0, 255); });
  port('no ip ospf priority', (t, a, no, p) => { delete p.ospfPriority; });
  port('ip ospf network <type>', (t, a, no, p) => { routed(t, p); p.ospfNetwork = keyword(a.type, ['broadcast', 'point-to-point']); });
  port('no ip ospf network', (t, a, no, p) => { delete p.ospfNetwork; });
  for (const [name, field] of [['hello', 'ospfHello'], ['dead', 'ospfDead']]) {
    port('ip ospf ' + name + '-interval <seconds>', (t, a, no, p) => { p[field] = number(a.seconds, 1, 65535); });
    port('no ip ospf ' + name + '-interval', (t, a, no, p) => { delete p[field]; });
  }
  port('ip ospf mtu-ignore', (t, a, no, p) => { p.ospfMtuIgnore = !no; }, { no: true });
  port('ip ospf authentication', (t, a, no, p) => { p.ospfAuthentication = no ? '' : 'simple'; }, { no: true });
  port('ip ospf authentication-key <password>', (t, a, no, p) => { p.ospfAuthenticationKey = a.password; });
  port('no ip ospf authentication-key', (t, a, no, p) => { delete p.ospfAuthenticationKey; });
  add('router', 'auto-cost reference-bandwidth <mbps>', (t, a) => {
    if (t.protocol !== 'ospf') throw new Error('% OSPF configuration required');
    return touch(t, () => { t.d.protocols.ospf.referenceBandwidth = number(a.mbps, 1, 4294967); });
  });
  for (const [syntax, no] of [['passive-interface <interface>', false], ['no passive-interface <interface>', true]]) replace(syntax, (t, a) => {
    const name = a.interface === 'default' ? 'default' : interfaceName(t.d, a.interface);
    return touch(t, () => {
      const p = t.d.protocols[t.protocol]; p.passive ||= []; p.active ||= [];
      p.passive = p.passive.filter(x => x !== name); p.active = p.active.filter(x => x !== name);
      if (!no) p.passive.push(name); else if (name !== 'default' && p.passive.includes('default')) p.active.push(name);
      if (name === 'default') p.active = [];
    });
  });
  const neighborTable = t => 'Neighbor ID       Pri State          Dead Time Address          Interface\n' + t.net.neighbors(t.d, 'ospf').map(n => n.routerId.padEnd(18) + String(n.priority).padEnd(4) + (n.state + '/' + n.role).padEnd(15) + ('00:00:' + String(n.dead).padStart(2, '0')).padEnd(10) + n.ip.padEnd(17) + n.local).join('\n');
  replace('show ip ospf neighbor', neighborTable);
  add(exec, 'show ip ospf neighbor detail', t => neighborTable(t) + '\n' + t.net.neighbors(t.d, 'ospf').filter(n => n.reason).map(n => n.routerId + ': ' + n.reason).join('\n') + '\n' + t.net.ospf().issues.filter(i => i.device === t.id).map(i => i.local + ' / ' + i.peer + ': ' + i.reason).join('\n'));
  function ospfInterface(t, name) {
    const p = t.d.ports[name], endpoint = t.net.ospf().endpoints.find(i => i.device === t.id && i.name === name);
    if (!endpoint) return name + ': OSPF is not enabled or interface is down';
    return name + ' is up, line protocol is up\n  Internet Address ' + endpoint.ip + '/' + endpoint.prefix + ', Area ' + endpoint.area + '\n  Process ID ' + t.d.protocols.ospf.process + ', Router ID ' + endpoint.rid + ', Network Type ' + networkType(p).toUpperCase() + ', Cost: ' + endpoint.cost + '\n  State ' + (endpoint.passive ? 'PASSIVE' : endpoint.role) + ', Priority ' + endpoint.priority + '\n  Designated Router (ID) ' + (endpoint.dr || '0.0.0.0') + '\n  Backup Designated Router (ID) ' + (endpoint.bdr || '0.0.0.0') + '\n  Timer intervals configured, Hello ' + endpoint.hello + ', Dead ' + endpoint.dead + '\n  MTU ' + endpoint.mtu + (endpoint.passive ? '\n  No Hellos (Passive interface)' : '') + '\n' + t.net.ospf().issues.filter(i => i.device === t.id && i.local === name).map(i => '  ' + i.peer + ': ' + i.reason).join('\n');
  }
  add(exec, 'show ip ospf interface', t => t.net.ospf().endpoints.filter(i => i.device === t.id).map(i => ospfInterface(t, i.name)).join('\n\n'));
  add(exec, 'show ip ospf interface <interface>', (t, a) => ospfInterface(t, interfaceName(t.d, a.interface)));
  add(exec, 'show ip ospf interface brief', t => 'Interface          PID Area IP Address/Mask      Cost State Nbrs F/C\n' + t.net.ospf().endpoints.filter(i => i.device === t.id).map(i => {
    const neighbors = t.net.neighbors(t.d, 'ospf').filter(n => n.local === i.name);
    return E.shortPort(i.name).padEnd(19) + t.d.protocols.ospf.process + ' ' + i.area + ' ' + (i.ip + '/' + i.prefix).padEnd(20) + i.cost + ' ' + i.role + ' ' + neighbors.filter(n => n.state === 'FULL').length + '/' + neighbors.length;
  }).join('\n'));
  add(exec, 'show ip ospf', t => { const ospf = t.net.ospf(), endpoints = ospf.endpoints.filter(i => i.device === t.id); return t.d.protocols.ospf ? 'Routing Process "ospf ' + t.d.protocols.ospf.process + '" with ID ' + (endpoints[0]?.rid || 'not selected') + '\nReference bandwidth: ' + (t.d.protocols.ospf.referenceBandwidth || 100) + ' Mbps\n' + ospf.issues.filter(i => i.device === t.id).map(i => i.local + ': ' + i.reason).join('\n') : '% OSPF is not configured'; });
  add('privileged', 'clear ip ospf process', t => { t.pending = { kind: 'ospf-clear' }; return 'Reset ALL OSPF processes? [no]:'; });

  port('ip helper-address <address>', (t, a, no, p) => { routed(t, p); const address = ip(a.address); p.helpers = (p.helpers || []).filter(x => x !== address); if (!no) p.helpers.push(address); }, { no: true });
  add('interface', 'ip address dhcp', t => {
    let message = '';
    for (const name of t.interfaces) { const p = t.d.ports[name]; routed(t, p); p.addressMethod = 'dhcp'; p.ip = ''; p.mask = ''; t.net.changed(); message += t.net.dhcp(t.id, name) + '\n'; }
    return message.trim();
  });
  add('dhcp', 'lease <days>', (t, a) => touch(t, () => { t.d.pools[t.pool].lease = number(a.days, 0, 365) * 86400 || 60; }));
  add('dhcp', 'lease <days> <hours> <minutes>', (t, a) => touch(t, () => { t.d.pools[t.pool].lease = number(a.days, 0, 365) * 86400 + number(a.hours, 0, 23) * 3600 + number(a.minutes, 0, 59) * 60 || 60; }));
  const oldIpInterface = commands.find(c => c.syntax === 'show ip interface <interface>').run;
  replace('show ip interface <interface>', (t, a) => { const p = t.d.ports[interfaceName(t.d, a.interface)]; return oldIpInterface(t, a) + '\n  Helper address: ' + ((p.helpers || []).join(', ') || 'not set') + '\n  Address method: ' + (p.addressMethod || 'manual'); });
  add('privileged', 'clear ip dhcp binding *', t => touch(t, () => { t.d.bindings = {}; }));

  const pool = (t, a, prefixLength) => {
    ip(a.start); ip(a.end); const netmask = prefixLength ? E.maskOf(number(a.prefix, 1, 30)) : mask(a.mask);
    if (!E.validAddress(a.start, netmask) || !E.validAddress(a.end, netmask) || !E.sameSubnet(a.start, a.end, netmask) || E.ipv4(a.end) < E.ipv4(a.start) || E.ipv4(a.end) - E.ipv4(a.start) > 65535) throw new Error('% Pool requires valid ordered host addresses in one subnet (maximum 65536 addresses)');
    if (t.d.nat.translations.some(x => x.pool === a.name)) throw new Error('% Pool in use; clear ip nat translation * first');
    return touch(t, () => { t.d.nat.pools ||= {}; t.d.nat.pools[a.name] = { start: a.start, end: a.end, mask: netmask }; });
  };
  add('config', 'ip nat pool <name> <start> <end> netmask <mask>', (t, a) => pool(t, a, false));
  add('config', 'ip nat pool <name> <start> <end> prefix-length <prefix>', (t, a) => pool(t, a, true));
  add('config', 'no ip nat pool <name>', (t, a) => { if (t.d.nat.translations.some(x => x.pool === a.name)) throw new Error('% Pool in use'); return touch(t, () => { delete (t.d.nat.pools || {})[a.name]; }); });
  for (const overload of [false, true]) add('config', 'ip nat inside source list <acl> pool <pool>' + (overload ? ' overload' : ''), (t, a, no) => touch(t, () => {
    t.d.nat.rules = (t.d.nat.rules || []).filter(r => !(r.acl === a.acl && r.pool === a.pool)); if (!no) t.d.nat.rules.push({ acl: a.acl, pool: a.pool, overload });
  }), { no: true });
  replace('show ip nat translations', t => {
    t.net.expireNat(t.d);
    return 'Pro Inside global             Inside local              Outside local             Outside global\n' + [
      ...t.d.nat.mappings.map(m => '--- ' + m.global.padEnd(26) + m.local.padEnd(26) + '---                       ---'),
      ...t.d.nat.translations.map(m => (m.kind === 'pat' ? m.protocol : '---').padEnd(4) + (m.global + (m.kind === 'pat' ? ':' + m.globalPort : '')).padEnd(26) + (m.local + (m.kind === 'pat' ? ':' + m.localPort : '')).padEnd(26) + (m.kind === 'pat' ? m.remote + (m.remotePort ? ':' + m.remotePort : '') : '---'))
    ].join('\n');
  });
  add(exec, 'show ip nat statistics', t => {
    t.net.expireNat(t.d); const stats = t.d.nat.stats || {};
    return 'Total active translations: ' + t.d.nat.translations.length + '\nInside interfaces: ' + Object.keys(t.d.ports).filter(p => t.d.ports[p].nat === 'inside').join(', ') + '\nOutside interfaces: ' + Object.keys(t.d.ports).filter(p => t.d.ports[p].nat === 'outside').join(', ') + '\nHits: ' + (stats.hits || 0) + ' Misses: ' + (stats.misses || 0) + ' Allocation failures: ' + (stats.failed || 0) + '\n' + Object.entries(t.d.nat.pools || {}).map(([name, p]) => 'Pool ' + name + ': ' + p.start + ' - ' + p.end + ', allocated ' + new Set(t.d.nat.translations.filter(x => x.pool === name).map(x => x.global)).size).join('\n');
  });

  port('ipv6 enable', (t, a, no, p) => { routed(t, p); p.ipv6Enabled = !no; }, { no: true });
  port('ipv6 address <address> link-local', (t, a, no, p) => { routed(t, p); if (!E.isLinkLocal(a.address)) throw new Error('% Link-local address must be in FE80::/10'); p.linkLocal = E.canonical6(a.address); p.ipv6Enabled = true; });
  port('no ipv6 address <address> link-local', (t, a, no, p) => { if (E.canonical6(a.address) === p.linkLocal) delete p.linkLocal; });
  port('ipv6 address <prefix> eui-64', (t, a, no, p, name) => {
    const parsed = E.parse6(a.prefix); routed(t, p);
    if (!parsed || parsed.length !== 64 || E.isLinkLocal(parsed.ip)) throw new Error('% EUI-64 requires a global or ULA /64 prefix');
    p.ipv6 = E.six(parsed.n >> 64n << 64n | E.eui64(t.net.interfaceMac(t.d, name))) + '/64'; p.ipv6Eui64 = E.six(parsed.n >> 64n << 64n) + '/64';
  });
  port('ipv6 nd suppress-ra', (t, a, no, p) => { p.ndSuppressRA = !no; }, { no: true });
  port('ipv6 nd ra lifetime <seconds>', (t, a, no, p) => { const n = number(a.seconds, 0, 9000); if (n > 0 && n < 4) throw new Error('% Lifetime is zero or at least 4 seconds'); p.ndRaLifetime = n; });
  port('ipv6 nd prefix <prefix> no-autoconfig', (t, a, no, p) => { if (E.parse6(a.prefix)?.length !== 64) throw new Error('% Prefix must be /64'); p.ndNoAutoconfig = !no; }, { no: true });
  const route6 = (t, a, no) => {
    const parsed = E.parse6(a.prefix); if (!parsed || !a.prefix.includes('/')) throw new Error('% Invalid IPv6 prefix');
    const args = words(a.next); let out = '', hop = '', ad = 1;
    if (E.ipv6(args[0]) !== null) hop = E.canonical6(args.shift()); else { out = interfaceName(t.d, args.shift()); if (E.ipv6(args[0]) !== null) hop = E.canonical6(args.shift()); }
    if (args.length) ad = number(args.shift(), 1, 254); if (args.length) throw new Error('% Invalid route syntax');
    if (E.isLinkLocal(hop) && !out) throw new Error('% Interface required for link-local next hop');
    const network = E.six(parsed.n >> BigInt(128 - parsed.length) << BigInt(128 - parsed.length));
    return touch(t, () => { t.d.routes6 = t.d.routes6.filter(r => !(r.network === network && r.prefix === parsed.length && r.nextHop === hop && r.port === out)); if (!no) t.d.routes6.push({ network, prefix: parsed.length, nextHop: hop, port: out, ad }); });
  };
  replace('ipv6 route <prefix> <next...>', (t, a) => route6(t, a, false));
  replace('no ipv6 route <prefix> <next...>', (t, a) => route6(t, a, true));
  add(exec, 'ping ipv6 <target>', (t, a) => ({ ping: t.net.startPing(t.id, a.target, 5) }));
  add(exec, 'ping ipv6 <target> source <interface>', (t, a) => ({ ping: t.net.startPing(t.id, a.target, 5, { interface: interfaceName(t.d, a.interface) }) }));
  add(exec, 'show ipv6 neighbors', t => 'IPv6 Address                              Link-layer Addr   State Interface\n' + Object.values(t.d.arp).filter(n => n.family === 6).map(n => n.address.padEnd(42) + n.mac.padEnd(18) + 'REACH ' + n.port).join('\n'));
  add('privileged', 'clear ipv6 neighbors', t => { for (const [key, n] of Object.entries(t.d.arp)) if (n.family === 6) delete t.d.arp[key]; return ''; });
  function ipv6Interface(t, name) {
    const p = t.d.ports[name], all = t.net.interfaces(t.d, 6).filter(i => i.name === name);
    return name + ' is ' + (t.net.portUp(t.d, name) ? 'up' : 'down') + '\n  IPv6 ' + (all.length ? 'is enabled' : 'is disabled') + '\n  Link-local address: ' + (t.net.linkLocal(t.d, name) || 'unassigned') + '\n  Global unicast: ' + (all.filter(i => !i.linkLocal).map(i => i.ip + '/' + i.prefix).join(', ') || 'unassigned') + '\n  Router advertisements: ' + (p.ndSuppressRA || !t.d.ipv6Routing ? 'suppressed' : 'enabled') + ', lifetime ' + (p.ndRaLifetime ?? 1800) + ' seconds\n  Stateless address autoconfiguration: ' + (p.ndNoAutoconfig ? 'disabled' : 'enabled');
  }
  add(exec, 'show ipv6 interface', t => Object.keys(t.d.ports).filter(p => t.net.interfaces(t.d, 6).some(i => i.name === p)).map(p => ipv6Interface(t, p)).join('\n\n'));
  add(exec, 'show ipv6 interface <interface>', (t, a) => ipv6Interface(t, interfaceName(t.d, a.interface)));
  replace('show ipv6 interface brief', t => Object.keys(t.d.ports).filter(p => t.d.ports[p].kind !== 'console').map(p => p + ' [' + (t.net.portUp(t.d, p) ? 'up/up' : 'down/down') + ']\n' + t.net.interfaces(t.d, 6).filter(i => i.name === p).map(i => '    ' + i.ip + (i.linkLocal ? '' : '/' + i.prefix)).join('\n')).join('\n'));

  const answer = Terminal.prototype.answer, prompt = Terminal.prototype.prompt, pc = Terminal.prototype.pc, help = Terminal.prototype.help, config = Terminal.prototype.config;
  Terminal.prototype.answer = function (value) {
    if (this.pending?.kind !== 'ospf-clear') return answer.call(this, value);
    this.pending = null;
    if (!/^y(es)?$/i.test(value.trim())) return 'Reset cancelled.';
    this.net.resetOspf(this.id); return 'OSPF process reset.';
  };
  Terminal.prototype.prompt = function () { return this.pending?.kind === 'ospf-clear' ? 'Reset ALL OSPF processes? [no]: ' : prompt.call(this); };
  Terminal.prototype.pc = function (line) {
    if (line.trim() === 'ipconfig /renew6') { try { return this.net.autoconfigure6(this.id); } catch (e) { return e.message; } }
    if (line.trim() === 'ipconfig /release') { this.net.releaseDhcp(this.id); return 'IP address released.'; }
    const out = pc.call(this, line);
    return /^ipconfig(\s+\/all)?$/.test(line.trim()) ? out + '\n   Link-local IPv6: ' + this.net.linkLocal(this.d, this.net.hostPort(this.d)) + '\n   IPv6 Default Gateway: ' + (this.d.ipv6Gateway || 'unassigned') + '\n   IPv6 Method: ' + (this.d.ipv6Method || 'static') : out;
  };
  Terminal.prototype.help = function (raw) { const out = help.call(this, raw); return E.isHost(this.d) && !this.remote ? out + '\nipconfig /renew6 — SLAAC\nping <link-local>%<interface>' : out; };
  Terminal.prototype.config = function (startup = false) {
    const d = startup ? this.d.startup : this.d, text = config.call(this, startup); if (!d) return text;
    const lines = text.split('\n'), result = []; let currentPort;
    for (const line of lines) {
      if (line.startsWith('interface ')) currentPort = d.ports[line.slice(10)];
      if (line === '!') currentPort = null;
      if (currentPort?.addressMethod === 'dhcp' && /^ ip address /.test(line)) continue;
      result.push(line);
      if (!line.startsWith('interface ')) continue;
      const p = d.ports[line.slice(10)]; if (!p) continue;
      for (const helper of p.helpers || []) result.push(' ip helper-address ' + helper);
      if (p.addressMethod === 'dhcp') result.push(' ip address dhcp');
      for (const [field, syntax] of [['ospfPriority', 'ip ospf priority'], ['ospfNetwork', 'ip ospf network'], ['ospfHello', 'ip ospf hello-interval'], ['ospfDead', 'ip ospf dead-interval']]) if (p[field] !== undefined) result.push(' ' + syntax + ' ' + p[field]);
      if (p.ospfMtuIgnore) result.push(' ip ospf mtu-ignore');
      if (p.ospfAuthentication) result.push(' ip ospf authentication', ' ip ospf authentication-key ' + (p.ospfAuthenticationKey || ''));
      if (p.ipv6Enabled) result.push(' ipv6 enable');
      if (p.linkLocal) result.push(' ipv6 address ' + p.linkLocal + ' link-local');
      if (p.ndSuppressRA) result.push(' ipv6 nd suppress-ra');
      if (p.ndRaLifetime !== undefined) result.push(' ipv6 nd ra lifetime ' + p.ndRaLifetime);
    }
    result.pop();
    if (d.protocols.ospf?.referenceBandwidth) result.push('router ospf ' + d.protocols.ospf.process, ' auto-cost reference-bandwidth ' + d.protocols.ospf.referenceBandwidth, '!');
    for (const [protocol, p] of Object.entries(d.protocols)) if (p.active?.length) result.push('router ' + protocol + (protocol === 'ospf' ? ' ' + p.process : ''), ...p.active.map(i => ' no passive-interface ' + i), '!');
    for (const [name, p] of Object.entries(d.nat.pools || {})) result.push('ip nat pool ' + name + ' ' + p.start + ' ' + p.end + ' netmask ' + p.mask);
    for (const r of d.nat.rules || []) result.push('ip nat inside source list ' + r.acl + ' pool ' + r.pool + (r.overload ? ' overload' : ''));
    result.push('end'); return result.join('\n');
  };
});

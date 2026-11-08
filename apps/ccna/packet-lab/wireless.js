(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.CcnaLabWireless = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E) {
  'use strict';
  const P = E.Network.prototype;
  const old = Object.fromEntries(['interfaces', 'status', 'connect', 'send', 'changed'].map(k => [k, P[k]]));
  P.linksAt = function (id, port) { return this.state.links.filter(l => l.a.device === id && l.a.port === port || l.b.device === id && l.b.port === port); };
  P.interfaces = function (d, family = 4) {
    if (family === 4 && ['ap', 'wlc'].includes(d.type)) {
      const name = Object.keys(d.ports).find(p => d.ports[p].kind === 'ethernet');
      return d.ip ? [{ name, ip: d.ip, mask: d.mask, prefix: E.prefix(d.mask), up: this.portUp(d, name) }] : [];
    }
    return old.interfaces.call(this, d, family);
  };
  P.configureManagement = function (id, values) {
    const d = this.device(id);
    if (!['ap', 'wlc'].includes(d.type) || !E.validAddress(values.ip, values.mask)) throw new Error("Podaj poprawny adres i subnet mask interface zarządzania.");
    if (values.gateway && (!E.validAddress(values.gateway, values.mask) || !E.sameSubnet(values.ip, values.gateway, values.mask))) throw new Error("Gateway musi należeć do podsieci zarządzania.");
    if (values.controller && E.ipv4(values.controller) === null) throw new Error('Nieprawidłowy adres kontrolera.');
    if (d.type === 'wlc' && (!Number.isInteger(Number(values.vlan || 0)) || Number(values.vlan || 0) < 0 || Number(values.vlan || 0) > 4094)) throw new Error('VLAN: 0–4094.');
    if (this.state.devices.some(x => x.id !== id && this.interfaces(x).some(i => i.ip === values.ip))) throw new Error("IP address jest już używany.");
    Object.assign(d, { ip: values.ip, mask: values.mask, gateway: values.gateway || '' });
    if (d.type === 'ap') d.wireless.controller = values.controller || '';
    else d.controller.managementVlan = Number(values.vlan || 0);
    this.changed();
  };
  P.configureWlcInterface = function (id, values) {
    const d = this.device(id), vlan = Number(values.vlan);
    if (d.type !== 'wlc' || !/^[A-Za-z][\w-]{0,31}$/.test(values.name) || values.name === 'management') throw new Error("Nazwa interface: litera, cyfry i myślniki; management jest zarezerwowany.");
    if (!Number.isInteger(vlan) || vlan < 1 || vlan > 4094) throw new Error('VLAN: 1–4094.');
    if (!E.validAddress(values.ip, values.mask)) throw new Error("Nieprawidłowa adresacja interface.");
    for (const key of ['gateway', 'dhcp']) if (values[key] && E.ipv4(values[key]) === null) throw new Error('Nieprawidłowy adres ' + key + '.');
    if (values.gateway && !E.sameSubnet(values.ip, values.gateway, values.mask)) throw new Error("Gateway spoza podsieci interface.");
    d.controller.interfaces[values.name] = { name: values.name, vlan, ip: values.ip, mask: values.mask, gateway: values.gateway || '', dhcp: values.dhcp || '' };
    this.changed();
  };
  P.configureWlan = function (id, values) {
    const d = this.device(id), wlanId = Number(values.id);
    if (d.type !== 'wlc' || !Number.isInteger(wlanId) || wlanId < 1 || wlanId > 16) throw new Error('WLAN ID: 1–16.');
    if (!values.ssid?.trim() || values.ssid.length > 32 || !values.name?.trim()) throw new Error('Podaj nazwę profilu i SSID (do 32 znaków).');
    if (Object.values(d.controller.wlans).some(w => w.id !== wlanId && w.ssid === values.ssid)) throw new Error('SSID jest już używany przez inny WLAN.');
    if (!d.controller.interfaces[values.interface]) throw new Error("Najpierw utwórz interface przypisany do VLAN.");
    if (!['open', 'wpa2'].includes(values.security) || values.security === 'wpa2' && (values.key.length < 8 || values.key.length > 63)) throw new Error('WPA2-PSK: klucz ma mieć 8–63 znaki.');
    if (!['platinum', 'gold', 'silver', 'bronze'].includes(values.qos)) throw new Error('Nieprawidłowy profil QoS.');
    d.controller.wlans[wlanId] = { id: wlanId, name: values.name, ssid: values.ssid, enabled: !!values.enabled, interface: values.interface, security: values.security, key: values.key, qos: values.qos, switching: 'local', authentication: 'local' };
    this.changed();
  };
  P.apState = function (ap) {
    if (!E.get(ap.model)?.lightweight) return { state: 'Autonomous', profiles: [{ ...ap.wireless, enabled: true, vlan: ap.wireless.vlan || 1 }] };
    if (!ap.power) return { state: 'Down', profiles: [] };
    this._apStates ||= new Map(); if (this._apStates.has(ap.id)) return this._apStates.get(ap.id);
    if (this._joiningAp) return { state: 'Discovering', profiles: ap.wireless.cachedWlans || [] };
    this._joiningAp = true;
    let controller;
    try {
      controller = this.state.devices.find(d => d.type === 'wlc' && d.power && d.ip && (!ap.wireless.controller || ap.wireless.controller === d.ip) && this.udpExchange(ap.id, d.ip, { protocol: 'udp', srcPort: 5246, dstPort: 5246 }));
    } finally { this._joiningAp = false; }
    if (controller) {
      ap.wireless.cachedWlans = Object.values(controller.controller.wlans).filter(w => w.enabled).map(w => ({ ...E.clone(w), vlan: controller.controller.interfaces[w.interface]?.vlan }));
      ap.wireless.joinedController = controller.id;
    }
    const state = { state: controller ? 'Joined' : ap.wireless.cachedWlans ? 'Standalone' : 'Discovering', controller: controller?.id || ap.wireless.joinedController || '', profiles: ap.wireless.cachedWlans || [] };
    this._apStates.set(ap.id, state); return state;
  };
  P.wirelessProfile = function (ap, client) { return this.apState(ap).profiles.find(w => w.enabled && w.ssid === client.wireless.ssid); };
  P.status = function (link) {
    if (link.type !== 'wireless') return old.status.call(this, link);
    const a = this.device(link.a.device), b = this.device(link.b.device), ap = a?.type === 'ap' ? a : b, client = a?.type === 'ap' ? b : a;
    if (!a?.power || !b?.power || !a.ports[link.a.port]?.enabled || !b.ports[link.b.port]?.enabled) return { up: false, reason: 'WLAN: urządzenie lub radio wyłączone' };
    if (ap.type !== 'ap' || !E.isHost(client)) return { up: false, reason: "WLAN wymaga klienta i access point (AP)" };
    const profile = this.wirelessProfile(ap, client);
    const ok = profile && profile.security === client.wireless.security && (profile.security === 'open' || profile.key === client.wireless.key);
    return { up: !!ok, reason: ok ? 'WLAN associated · VLAN ' + profile.vlan + ' · ' + this.apState(ap).state : !profile ? 'WLAN: SSID wyłączony, brak profilu lub AP nie dołączył do WLC' : 'WLAN: niezgodna metoda WPA2 lub klucz' };
  };
  P.connect = function (a, ap, b, bp, type = 'straight') {
    if (type !== 'wireless') return old.connect.call(this, a, ap, b, bp, type);
    const da = this.device(a), db = this.device(b);
    if (!da || !db || a === b || da.ports[ap]?.kind !== 'wireless' || db.ports[bp]?.kind !== 'wireless' || (da.type === 'ap') === (db.type === 'ap')) throw new Error('Połącz radio klienta z radiem AP.');
    if (this.state.links.length >= 128 || this.linkAt(da.type === 'ap' ? b : a, da.type === 'ap' ? bp : ap)) throw new Error('Radio klienta jest zajęte lub osiągnięto limit połączeń.');
    const link = { id: 'L' + ++this.serial, a: { device: a, port: ap }, b: { device: b, port: bp }, type };
    this.state.links.push(link); this.changed(); return link;
  };
  P.send = function (id, port, frame) {
    const ap = this.device(id);
    if (ap.type !== 'ap' || ap.ports[port]?.kind !== 'wireless') return old.send.call(this, id, port, frame);
    let sent = false;
    for (const link of this.linksAt(id, port)) {
      const end = link.a.device === id ? link.b : link.a, client = this.device(end.device), profile = this.wirelessProfile(ap, client);
      if (!this.status(link).up || client.mac === frame.srcMac || (frame.vlan || 1) !== profile?.vlan || frame.dstMac !== E.BROADCAST && frame.dstMac !== client.mac) continue;
      ap.ports[port].stats.output++;
      this.queue.push({ from: id, outPort: port, to: end.device, inPort: end.port, link: link.id, frame: { ...frame, vlan: null, hops: (frame.hops || 0) + 1 } }); sent = true;
    }
    return sent;
  };
  P.bridgeAP = function (ap, hop, frame, event) {
    if (ap.ip && frame.dstIP === ap.ip || ap.ip && frame.dstMac === ap.mac && !frame.vlan) { this.receiveIP(ap, hop, frame, event); return; }
    const wireless = ap.ports[hop.inPort].kind === 'wireless', client = wireless && this.device(hop.from), profile = wireless && this.wirelessProfile(ap, client);
    const vlan = wireless ? profile?.vlan : frame.vlan || ap.wireless.nativeVlan || 1;
    if (!vlan) { event.result = 'Dropped'; event.detail = 'Brak aktywnego profilu WLAN.'; return; }
    let sent = 0;
    for (const [name, p] of Object.entries(ap.ports)) {
      if (name === hop.inPort && p.kind !== 'wireless') continue;
      if (p.kind === 'ethernet' && wireless) { if (this.send(ap.id, name, { ...frame, vlan: vlan === (ap.wireless.nativeVlan || 1) ? null : vlan })) sent++; }
      if (p.kind === 'wireless') { if (this.send(ap.id, name, { ...frame, vlan })) sent++; }
    }
    event.result = sent ? 'Forward' : 'Filtered'; event.detail = 'AP: lokalne przełączanie WLAN, VLAN ' + vlan + '.';
  };

  // A VLAN-aware path is also used by OSPF, DHCP, RA and controller discovery.
  // Reaching the physical trunk alone does not make another VLAN reachable.
  P.layer2Path = function (from, port, to, targetPort) {
    const source = this.device(from), initial = source?.ports[port]; if (!initial || !source.power || !initial.enabled) return null;
    let vlan = initial.kind === 'subinterface' ? initial.nativeTag ? null : initial.tag : initial.kind === 'svi' ? Number(port.slice(4)) : source.type === 'wlc' ? source.controller.managementVlan || null : null;
    const todo = [{ id: from, port, vlan, path: [] }], seen = new Set();
    while (todo.length) {
      const x = todo.shift(), key = x.id + '|' + x.port + '|' + x.vlan; if (seen.has(key)) continue; seen.add(key);
      const d = this.device(x.id), v = d.ports[x.port];
      if (v.kind === 'svi') {
        const n = Number(x.port.slice(4));
        for (const [p, pp] of Object.entries(d.ports)) if (E.dataPort(pp) && this.allows(d, p, n) && this.spanning(n)[d.id]?.ports[p]?.forwarding) todo.push({ ...x, port: p, vlan: this.activeMode(d, p) === 'trunk' && n !== pp.native ? n : null });
        continue;
      }
      const base = v.kind === 'subinterface' ? x.port.split('.')[0] : x.port;
      for (const link of this.linksAt(x.id, base)) {
        if (link.type === 'console' || !this.status(link).up) continue;
        const end = link.a.device === x.id ? link.b : link.a, dst = this.device(end.device), dp = dst.ports[end.port];
        let ingress = dst.type === 'switch' ? this.vlanAt(dst, end.port, { vlan: x.vlan }) : x.vlan;
        if (dst.type === 'switch' && (!this.allows(dst, end.port, ingress) || !this.spanning(ingress)[dst.id]?.ports[end.port]?.forwarding)) continue;
        if (dst.type === 'ap' && dp.kind === 'wireless') ingress = this.wirelessProfile(dst, d)?.vlan;
        if (dst.type === 'ap' && dp.kind === 'ethernet') ingress = x.vlan || dst.wireless.nativeVlan || 1;
        const path = [...x.path, { from: x.id, outPort: base, to: dst.id, inPort: end.port, link: link.id, vlan: ingress || 1 }];
        if (dst.id === to) {
          const target = dst.ports[targetPort];
          const match = target?.enabled && (target.kind === 'svi' ? ingress === Number(targetPort.slice(4)) : target.kind === 'subinterface' ? targetPort.startsWith(end.port + '.') && (target.nativeTag ? !x.vlan : x.vlan === target.tag) : end.port === targetPort && (dst.type === 'switch' || dst.type === 'wlc' ? (x.vlan || 0) === (dst.controller?.managementVlan || 0) : dst.type === 'ap' ? ingress === (dst.wireless.nativeVlan || 1) : !x.vlan));
          if (match) return path;
        }
        if (dst.type === 'switch') {
          for (const [p, pp] of Object.entries(dst.ports)) if (p !== end.port && E.dataPort(pp) && this.allows(dst, p, ingress) && this.spanning(ingress)[dst.id]?.ports[p]?.forwarding) todo.push({ id: dst.id, port: p, vlan: this.activeMode(dst, p) === 'trunk' && ingress !== pp.native ? ingress : null, path });
        } else if (dst.type === 'hub') {
          for (const [p, pp] of Object.entries(dst.ports)) if (p !== end.port && E.dataPort(pp) && pp.enabled) todo.push({ id: dst.id, port: p, vlan: x.vlan, path });
        } else if (dst.type === 'ap') {
          for (const [p, pp] of Object.entries(dst.ports)) {
            if (p === end.port && pp.kind !== 'wireless' || !pp.enabled) continue;
            if (pp.kind === 'ethernet' && dp.kind === 'wireless') todo.push({ id: dst.id, port: p, vlan: ingress === (dst.wireless.nativeVlan || 1) ? null : ingress, path });
            if (pp.kind === 'wireless') {
              for (const wl of this.linksAt(dst.id, p)) {
                const clientEnd = wl.a.device === dst.id ? wl.b : wl.a, client = this.device(clientEnd.device);
                if (client.id !== x.id && client.id === to && clientEnd.port === targetPort && this.status(wl).up && this.wirelessProfile(dst, client)?.vlan === ingress) return [...path, { from: dst.id, outPort: p, to: client.id, inPort: clientEnd.port, link: wl.id, vlan: ingress }];
              }
            }
          }
        }
      }
    }
    return null;
  };
  P.changed = function () { this._apStates = null; old.changed.call(this); };
});

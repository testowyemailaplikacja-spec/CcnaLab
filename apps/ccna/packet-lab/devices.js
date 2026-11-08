(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CcnaLabDevices = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const range = (prefix, start, count) => Array.from({ length: count }, (_, i) => prefix + (start + i));
  // These are explicit simulation profiles, not interchangeable firmware images.
  const profiles = [
    ['2960-24TT', 'switch', [...range('FastEthernet0/', 1, 24), ...range('GigabitEthernet0/', 1, 2)]],
    ['2950-24', 'switch', range('FastEthernet0/', 1, 24)],
    ['2950T-24', 'switch', [...range('FastEthernet0/', 1, 24), ...range('GigabitEthernet0/', 1, 2)]],
    ['3560-24PS', 'switch', [...range('FastEthernet0/', 1, 24), ...range('GigabitEthernet0/', 1, 2)], { multilayer: true }],
    ['3650-24PS', 'switch', [...range('GigabitEthernet1/0/', 1, 24), ...range('GigabitEthernet1/1/', 1, 4)], { multilayer: true }],
    ['Switch-PT', 'switch', range('FastEthernet0/', 1, 10)],
    ['1841', 'router', range('FastEthernet0/', 0, 2), { module: 'WIC-2T' }],
    ['2621XM', 'router', range('FastEthernet0/', 0, 2), { module: 'WIC-2T' }],
    ['2811', 'router', range('FastEthernet0/', 0, 2), { module: 'WIC-2T' }],
    ['1941', 'router', range('GigabitEthernet0/', 0, 2), { module: 'HWIC-2T' }],
    ['2901', 'router', range('GigabitEthernet0/', 0, 2), { module: 'HWIC-2T' }],
    ['2911', 'router', range('GigabitEthernet0/', 0, 3), { module: 'HWIC-2T' }],
    ['4321', 'router', range('GigabitEthernet0/0/', 0, 2)],
    ['4331', 'router', range('GigabitEthernet0/0/', 0, 3)],
    ['Router-PT', 'router', [...range('FastEthernet0/', 0, 2), ...range('Serial0/0/', 0, 2)]],
    ['PC-PT', 'pc', ['FastEthernet0', 'RS232']],
    ['Laptop-PT', 'pc', ['FastEthernet0', 'RS232', 'Wireless0']],
    ['Server-PT', 'server', ['FastEthernet0']],
    ['Hub-PT', 'hub', range('FastEthernet', 0, 6)],
    ['AccessPoint-PT', 'ap', ['Port0', 'Wireless0']],
    ['3702i', 'ap', ['GigabitEthernet0', 'Wireless0'], { lightweight: true }],
    ['WLC-2504', 'wlc', range('GigabitEthernet', 1, 4)]
  ].map(([id, type, ports, extra = {}]) => ({ id, type, ports, ...extra }));
  const defaults = { switch: '2960-24TT', router: '2911', pc: 'PC-PT', server: 'Server-PT', hub: 'Hub-PT', ap: 'AccessPoint-PT', wlc: 'WLC-2504' };
  const get = id => profiles.find(p => p.id === (defaults[id] || id));
  const isHost = d => !!d && ['pc', 'server'].includes(d.type);
  const isIOS = d => !!d && ['switch', 'router'].includes(d.type);
  function port(name, type) {
    const kind = /^(Console|RS232)/.test(name) ? 'console' : /^Serial/.test(name) ? 'serial' : /^Wireless/.test(name) ? 'wireless' : /^Loopback/.test(name) ? 'loopback' : /^Vlan/.test(name) ? 'svi' : name.includes('.') ? 'subinterface' : 'ethernet';
    return { kind, enabled: type !== 'router', vlan: 1, mode: type === 'switch' ? 'dynamic auto' : 'routed', native: 1, allowed: 'all', autoMdix: type === 'switch', speed: 'auto', duplex: 'auto', description: '', ip: '', mask: '', ipv6: '', cost: 0, portPriority: 128, mtu: 1500, bandwidth: /^Gigabit/.test(name) ? 1000000 : 100000, security: { enabled: false, maximum: 1, violation: 'shutdown', sticky: false, macs: [] }, stats: { input: 0, output: 0, drops: 0, errors: 0 }, aclIn: '', aclOut: '' };
  }
  function makeDevice(model, id, x = 640, y = 270) {
    const profile = get(model); if (!profile) throw new Error('Nieobsługiwany model urządzenia.');
    const { type } = profile, num = Number(id.replace(/\D/g, '')) || 1;
    const family = { pc: 0, switch: 100, router: 200, server: 300, hub: 400, ap: 500, wlc: 600 }[type];
    const ports = Object.fromEntries(profile.ports.map(p => [p, port(p, type)]));
    if (isIOS({ type })) ports.Console = { ...port('Console', type), enabled: true };
    if (type === 'switch') ports.Vlan1 = { ...port('Vlan1', type), enabled: false };
    return { id, type, model: profile.id, hostname: id, x, y, power: true, ports,
      mac: '00d0.ba00.' + (family + num).toString(16).padStart(4, '0'), ip: '', mask: '255.255.255.0', gateway: '', dns: '', addressMethod: 'static', dhcpLease: null, ipv6: '', ipv6Gateway: '', ipv6Method: 'static', slaac: null,
      arp: {}, macTable: {}, startup: null, modules: [], routing: type === 'router', ipv6Routing: false, routes: [], routes6: [],
      vlans: { 1: { name: 'default' } }, stp: { mode: 'pvst', priority: {} }, vtp: { mode: 'server', domain: '', password: '', version: 2, revision: 0 },
      cdp: true, lldp: false, domain: '', domainLookup: true, hosts: {}, users: {}, enablePassword: '', enableSecret: '', passwordEncryption: false,
      lines: { console: {}, vty: {} }, banner: '', acls: {}, protocols: {}, pools: {}, excluded: [], bindings: {}, snooping: [], inspection: [],
      nat: { mappings: [], overload: null, pools: {}, rules: [], translations: [] }, ntp: { servers: [], master: false }, logging: [], logs: [], snmp: {},
      classMaps: {}, policies: {}, services: { dns: false, records: {}, http: false, tftp: false, files: {}, dhcp: false, syslog: false, ntp: false, ftp: false },
      controller: { managementVlan: 0, interfaces: {}, wlans: {} },
      wireless: { ssid: type === 'ap' ? 'CCNA' : '', security: 'open', key: '', channel: 1, associated: '', controller: '', nativeVlan: 1 } };
  }
  return { profiles, get, isHost, isIOS, port, makeDevice };
});

const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('./engine.js');
const S=require('./scenarios.js');
const run=S.run;
const ping=(n,id,target)=>{const t=n.startPing(id,target,1);n.run();return t.replies;};
function cli(n,id,lines){const t=new E.Terminal(n,id);for(const c of lines){const out=t.execute(c);assert.ok(!(typeof out==='string'&&/^%/.test(out)),`${id}: ${c}: ${out}`);}return t;}
function routes(n){run(n,'R1',['ip route 10.0.20.0 255.255.255.0 10.0.12.2']);run(n,'R2',['ip route 10.0.10.0 255.255.255.0 10.0.12.1']);}

test('contextual abbreviations, help, completion, ambiguity, privilege and no-op enable',()=>{
  const n=S.seed(),t=new E.Terminal(n,'SW1');assert.match(t.execute('e'),/Ambiguous/);assert.match(t.execute('conf t'),/Invalid/);
  t.execute('en');assert.equal(t.mode,'privileged');assert.equal(t.execute('en'),'');assert.match(t.execute('con'),/Incomplete/);
  assert.equal(t.complete('sh ip int b'),'show ip interface brief ');assert.match(t.help('sh ip '),/route/);assert.doesNotMatch(t.help('sh ip '),/configure/);
  t.execute('conf t');assert.match(t.execute('en'),/Ambiguous/);t.execute('int ran fa0/1 - 3');assert.equal(t.interfaces.length,3);t.execute('shut');assert.equal(n.device('SW1').ports['FastEthernet0/2'].enabled,false);t.execute('no sh');assert.match(t.execute('do sh ip int br'),/FastEthernet0\/1/);t.execute('end');assert.match(t.execute('sh run | include hostname'),/^hostname SW1$/);
  assert.match(t.execute('configure banana'),/Invalid/);assert.equal(t.mode,'privileged');
});
test('password challenge, console modes and reload retain only saved configuration',()=>{
  const n=S.seed(),t=cli(n,'SW1',['en','conf t','hostname ACCESS1','enable secret ccna','line console 0','password console','login','exit','service password-encryption','end','wr']);
  t.execute('disable');t.execute('en');assert.equal(t.secretInput,true);assert.equal(t.execute('wrong'),'% Access denied');t.execute('en');t.execute('ccna');assert.equal(t.mode,'privileged');assert.ok(!t.history.includes('ccna'));
  t.execute('conf t');t.execute('hostname TEMP');t.execute('end');t.execute('reload');t.execute('');assert.equal(n.device('SW1').hostname,'ACCESS1');assert.equal(t.mode,'user');assert.ok(!t.config().includes('password console'));
});
test('all models instantiate, preserve their interfaces and roundtrip JSON',()=>{
  const n=new E.Network();n.state.devices=[];for(const profile of E.profiles)n.add(profile.id,300,200);assert.equal(n.state.devices.length,22);const restored=new E.Network(n.snapshot());assert.equal(restored.state.devices.length,22);for(const d of restored.state.devices)for(const port of E.get(d.model).ports)assert.ok(d.ports[port]);
  assert.equal(restored.state.devices.filter(d=>d.type==='router').length,9);
});
test('static routes, reverse route, LPM, TTL and per-hop Ethernet headers',()=>{
  const n=S.seed('route');assert.equal(ping(n,'PC1','10.0.20.12'),0);run(n,'R1',['ip route 10.0.20.0 255.255.255.0 10.0.12.2']);assert.equal(ping(n,'PC1','10.0.20.12'),0);run(n,'R2',['ip route 10.0.10.0 255.255.255.0 10.0.12.1']);assert.equal(ping(n,'PC1','10.0.20.12'),1);
  const hops=n.events.filter(e=>e.frame.type==='ICMP Echo Request'&&e.result==='Route');assert.deepEqual(hops.slice(-2).map(e=>e.frame.ttl),[128,127]);const received=n.events.filter(e=>e.to==='PC2'&&e.frame.type==='ICMP Echo Request').at(-1);assert.equal(received.frame.ttl,126);assert.equal(received.frame.srcIP,'10.0.10.11');assert.notEqual(received.frame.srcMac,n.device('PC1').mac);
  run(n,'R1',['ip route 10.0.20.12 255.255.255.255 Null0']);assert.equal(ping(n,'PC1','10.0.20.12'),0);
});
test('floating route activates on physical primary failure and reconverges',()=>{
  const n=S.seed('floating');routes(n);run(n,'R1',['ip route 10.0.20.0 255.255.255.0 10.0.13.2 200']);run(n,'R2',['ip route 10.0.10.0 255.255.255.0 10.0.13.1 200']);assert.equal(n.route(n.device('R1'),'10.0.20.12').ad,1);n.setPort('R1','GigabitEthernet0/1',{enabled:false});assert.equal(n.route(n.device('R1'),'10.0.20.12').ad,200);assert.equal(ping(n,'PC1','10.0.20.12'),1);n.setPort('R1','GigabitEthernet0/1',{enabled:true});assert.equal(n.route(n.device('R1'),'10.0.20.12').ad,1);
});
test('VLAN trunks carry allowed tags and isolate disallowed VLANs',()=>{
  const n=S.seed();for(const id of ['SW1','SW2'])run(n,id,['vlan 10','name USERS','exit','int fa0/1','switchport mode access','switchport access vlan 10','exit','int gi0/1','switchport mode trunk','switchport trunk allowed vlan 10']);assert.equal(ping(n,'PC1','10.0.10.12'),1);assert.ok(n.events.some(e=>e.frame.vlan===10));run(n,'SW2',['int gi0/1','switchport trunk allowed vlan 20']);assert.equal(ping(n,'PC1','10.0.10.12'),0);
});
test('DTP desirable/auto negotiates; auto/auto does not; VTP propagates only with correct domain',()=>{
  const n=S.seed();assert.equal(n.activeMode(n.device('SW1'),'GigabitEthernet0/1'),'access');run(n,'SW1',['vtp domain CCNA','int gi0/1','switchport mode dynamic desirable']);run(n,'SW2',['vtp domain CCNA','vtp mode client']);assert.equal(n.activeMode(n.device('SW2'),'GigabitEthernet0/1'),'trunk');run(n,'SW1',['vlan 30','name ENGINEERING']);assert.equal(n.device('SW2').vlans[30].name,'ENGINEERING');assert.match(new E.Terminal(n,'SW2').execute('vlan 40'),/Invalid/);run(n,'SW2',['vtp domain OTHER']);run(n,'SW1',['vlan 40']);assert.equal(n.device('SW2').vlans[40],undefined);
});
test('router-on-a-stick rewrites 802.1Q tags and routes between VLANs',()=>{
  const n=S.seed('intervlan');for(const id of ['SW1','SW2'])run(n,id,['vlan 10,20','exit','int gi0/1','switchport mode trunk','exit','int fa0/1','switchport mode access','switchport access vlan '+(id==='SW1'?10:20)]);run(n,'SW1',['int fa0/24','switchport mode trunk']);run(n,'R1',['int gi0/0','no ip address','exit','int gi0/0.10','encapsulation dot1q 10','ip address 10.0.10.1 255.255.255.0','exit','int gi0/0.20','encapsulation dot1q 20','ip address 10.0.20.1 255.255.255.0']);assert.equal(ping(n,'PC1','10.0.20.12'),1);
});
test('multilayer SVI requires active VLAN and ip routing',()=>{
  const n=S.seed('multilayer');for(const id of ['SW1','SW2'])run(n,id,['vlan 10,20','exit','int gi0/1','switchport mode trunk','exit','int fa0/1','switchport mode access','switchport access vlan '+(id==='SW1'?10:20)]);run(n,'SW1',['interface vlan 10','ip address 10.0.10.1 255.255.255.0','no shut','exit','interface vlan 20','ip address 10.0.20.1 255.255.255.0','no shut']);assert.equal(ping(n,'PC1','10.0.20.12'),0);run(n,'SW1',['ip routing']);assert.equal(ping(n,'PC1','10.0.20.12'),1);
});
test('STP elects root, blocks loop and recovers from failed uplink; BPDU guard disables edge port',()=>{
  const n=S.seed('stp');run(n,'SW2',['spanning-tree vlan 1 priority 4096']);assert.equal(n.spanning(1).SW1.root,'SW2');assert.ok(Object.values(n.spanning(1)).some(s=>Object.values(s.ports).some(p=>p.state==='BLK')));assert.equal(ping(n,'PC1','10.0.10.12'),1);n.setPort('SW1','GigabitEthernet0/1',{enabled:false});assert.equal(ping(n,'PC1','10.0.10.12'),1);run(n,'SW1',['int gi0/2','spanning-tree bpduguard enable']);assert.equal(n.status(n.linkAt('SW1','GigabitEthernet0/2')).up,false);
});
test('LACP and PAgP must have compatible peers, bundle both members, survive one-member failure',()=>{
  for(const [a,b]of[['active','passive'],['desirable','auto'],['on','on']]){const n=S.seed('channel');run(n,'SW1',['int range gi0/1 - 2','switchport mode trunk','channel-group 1 mode '+a]);run(n,'SW2',['int range gi0/1 - 2','switchport mode trunk','channel-group 1 mode '+b]);assert.ok(n.channel(n.device('SW1'),'GigabitEthernet0/1'));assert.equal(ping(n,'PC1','10.0.10.12'),1);n.setPort('SW1','GigabitEthernet0/1',{enabled:false});assert.equal(ping(n,'PC1','10.0.10.12'),1);}
  const n=S.seed('channel');for(const id of ['SW1','SW2'])run(n,id,['int range gi0/1 - 2','channel-group 1 mode passive']);assert.equal(n.channel(n.device('SW1'),'GigabitEthernet0/1'),null);
});
test('OSPF and RIP derive real connected networks, honor passive links and withdraw routes',()=>{
  for(const proto of ['ospf','rip']){const n=S.seed('ospf');for(const id of ['R1','R2'])run(n,id,proto==='ospf'?['router ospf 1','network 10.0.0.0 0.0.255.255 area 0']:['router rip','version 2','no auto-summary','network 10.0.0.0']);assert.equal(ping(n,'PC1','10.0.20.12'),1);assert.ok(n.routingTable(n.device('R1')).some(r=>r.code===(proto==='ospf'?'O':'R')));run(n,'R1',[proto==='ospf'?'router ospf 1':'router rip','passive-interface gi0/1']);assert.equal(ping(n,'PC1','10.0.20.12'),0);}
});
test('static IPv6 uses NDP, forwards with decremented Hop Limit and requires reverse route',()=>{
  const n=S.seed('ipv6');run(n,'R1',['ipv6 unicast-routing','ipv6 route 2001:db8:20::/64 2001:db8:12::2']);run(n,'R2',['ipv6 unicast-routing','ipv6 route 2001:db8:10::/64 2001:db8:12::1']);assert.equal(ping(n,'PC1','2001:db8:20::12'),1);assert.ok(n.events.some(e=>e.protocol==='NDP'));assert.equal(n.events.filter(e=>e.to==='PC2'&&e.frame.type==='ICMP Echo Request').at(-1).frame.ttl,126);
});
test('DHCP excludes reserved IPs, creates snooping binding, and untrusted uplink blocks offer',()=>{
  const n=S.seed('services');run(n,'R1',['ip dhcp excluded-address 10.0.10.1 10.0.10.99','ip dhcp pool USERS','network 10.0.10.0 255.255.255.0','default-router 10.0.10.1','dns-server 10.0.10.53']);run(n,'SW1',['ip dhcp snooping','ip dhcp snooping vlan 1']);assert.throws(()=>n.dhcp('PC1'),/timeout/);run(n,'SW1',['int fa0/24','ip dhcp snooping trust']);assert.match(n.dhcp('PC1'),/10.0.10.100/);assert.ok(n.device('SW1').bindings[n.device('PC1').mac]);assert.equal(n.device('PC1').dns,'10.0.10.53');assert.equal(ping(n,'PC1','10.0.10.1'),1);
});
test('named extended ACL denies matched traffic, counts hits and permits after removal',()=>{
  const n=S.seed('route-ready');run(n,'R1',['ip access-list extended BLOCK','deny icmp host 10.0.10.11 host 10.0.20.12','permit ip any any','exit','int gi0/0','ip access-group BLOCK in']);assert.equal(ping(n,'PC1','10.0.20.12'),0);assert.ok(n.device('R1').acls.BLOCK.rules[0].hits>0);run(n,'R1',['int gi0/0','no ip access-group BLOCK in']);assert.equal(ping(n,'PC1','10.0.20.12'),1);
});
test('PAT translates actual outgoing ICMP and reverses replies',()=>{
  const n=S.seed('nat');run(n,'R1',['int gi0/0','ip nat inside','exit','int gi0/1','ip nat outside','exit','access-list 1 permit 10.0.10.0 0.0.0.255','ip nat inside source list 1 interface gi0/1 overload']);assert.equal(ping(n,'PC1','10.0.20.12'),1);assert.equal(n.device('R1').nat.translations[0].local,'10.0.10.11');assert.ok(n.events.some(e=>e.to==='R2'&&e.frame.type==='ICMP Echo Request'&&e.frame.srcIP==='10.0.12.1'));
});
test('port-security sticky MAC blocks an additional host and supports shutdown/no shutdown recovery',()=>{
  const n=S.seed();run(n,'SW1',['int fa0/1','switchport mode access','switchport port-security','switchport port-security mac-address sticky']);assert.equal(ping(n,'PC1','10.0.10.12'),1);const d=n.device('PC1'),mac=d.mac;d.mac='0001.0002.0003';d.arp={};assert.equal(ping(n,'PC1','10.0.10.12'),0);assert.equal(n.device('SW1').ports['FastEthernet0/1'].errDisabled,true);d.mac=mac;run(n,'SW1',['int fa0/1','shut','no shut']);assert.equal(ping(n,'PC1','10.0.10.12'),1);
});
test('HSRP VIP follows the available active router and uses virtual MAC',()=>{
  const n=S.seed('hsrp');for(const id of ['R1','R2'])run(n,id,['int gi0/0','standby 1 ip 10.0.10.254']);run(n,'R1',['int gi0/0','standby 1 priority 110']);assert.equal(ping(n,'PC1','10.0.10.254'),1);assert.equal(n.device('PC1').arp['10.0.10.254'].mac,'0000.0c07.ac01');n.power('R1',false);assert.equal(n.hsrpState(n.device('R2'),'GigabitEthernet0/0',1).active,'R2');assert.equal(ping(n,'PC1','10.0.10.254'),1);
});
test('QoS policy changes actual frame DSCP and counters',()=>{
  const n=S.seed('qos');run(n,'R1',['policy-map MARK','class class-default','set dscp ef','exit','exit','int gi0/1','service-policy output MARK']);assert.equal(ping(n,'PC1','10.0.20.12'),1);assert.ok(n.events.some(e=>e.from==='R1'&&e.frame.dscp===46));assert.ok(n.device('R1').policies.MARK['class-default'].packets>0);
});
test('DNS, HTTP, TFTP, SNMP and Syslog require reachable and enabled services',()=>{
  const n=S.seed('management'),server=n.device('SRV1'),pc=new E.Terminal(n,'PC1');server.services.dns=true;server.services.records['lab.ccna']='10.0.10.53';n.device('PC1').dns='10.0.10.53';assert.match(pc.execute('nslookup lab.ccna'),/10.0.10.53/);assert.match(pc.execute('http lab.ccna'),/200 OK/);server.services.http=false;assert.match(pc.execute('http lab.ccna'),/wyłączona/);server.services.tftp=true;server.services.syslog=true;run(n,'R1',['hostname EDGE','snmp-server community public ro','logging host 10.0.10.53']);assert.match(pc.execute('snmpget 10.0.10.1 public sysName.0'),/EDGE/);const t=cli(n,'R1',['en','copy run tftp:','10.0.10.53','backup.cfg']);assert.ok(server.services.files['backup.cfg'].includes('hostname EDGE'));assert.match(t.execute('send log TEST'),/Delivered to 1/);assert.ok(server.logs.some(l=>l.includes('TEST')));
});
test('SSH credentials and transport gating protect the remote CLI',()=>{
  const n=S.seed('ssh');run(n,'R1',['ip domain-name ccna.lab','username admin secret ccna','crypto key generate rsa modulus 1024','ip ssh version 2','line vty 0 4','login local','transport input ssh']);const pc=new E.Terminal(n,'PC1');assert.match(pc.execute('telnet 10.0.10.1'),/not permitted/);pc.execute('ssh -l admin 10.0.10.1');assert.equal(pc.secretInput,true);assert.match(pc.execute('bad'),/failed/);pc.execute('ssh -l admin 10.0.10.1');pc.execute('ccna');assert.equal(pc.prompt(),'R1>');pc.execute('en');assert.match(pc.execute('sh ip int br'),/10.0.10.1/);pc.execute('exit');pc.execute('exit');assert.equal(pc.remote,null);
});
test('wireless association fails for mismatched security and succeeds with matching profile',()=>{
  const n=S.seed('wireless');assert.equal(ping(n,'PC1','10.0.10.12'),0);for(const id of ['PC1','AP1'])Object.assign(n.device(id).wireless,{ssid:'CCNA-LAB',security:'wpa2',key:'ccna2026'});n.changed();assert.equal(ping(n,'PC1','10.0.10.12'),1);n.device('PC1').wireless.key='incorrect';n.changed();assert.equal(ping(n,'PC1','10.0.10.12'),0);
});
test('serial DCE clock and matching encapsulation are required; modules survive power on',()=>{
  const n=S.seed('wan');routes(n);assert.equal(ping(n,'PC1','10.0.20.12'),0);run(n,'R1',['int s0/0/0','clock rate 64000','encapsulation ppp']);run(n,'R2',['int s0/0/0','encapsulation ppp']);assert.equal(ping(n,'PC1','10.0.20.12'),1);const d=n.add('1941',100,100);assert.throws(()=>n.addModule(d.id),/Wyłącz/);n.power(d.id,false);n.addModule(d.id);n.power(d.id,true);assert.ok(d.ports['Serial0/0/0']);
});
test('REST validates authentication, paths and writable fields; PATCH changes forwarding state',()=>{
  const n=S.seed();assert.equal(S.rest(n,'GET','/devices',null,'wrong').status,401);assert.equal(S.rest(n,'GET','/devices',null,'ccna-lab-token').status,200);assert.equal(S.rest(n,'PATCH','/devices/SW1/interfaces/FastEthernet0%2F1',{enabled:false},'ccna-lab-token').status,200);assert.equal(ping(n,'PC1','10.0.10.12'),0);assert.equal(S.rest(n,'PATCH','/devices/SW1/interfaces/FastEthernet0%2F1',{power:0},'ccna-lab-token').status,400);assert.equal(S.rest(n,'GET','/devices/NO',null,'ccna-lab-token').status,404);
});
test('all 50 sections and 127 topics have buildable scenarios and independent keys',()=>{
  assert.equal(S.curriculum.length,50);let count=0;const keys=[];for(const section of S.curriculum)for(const sub of section.subsections){const scenario=S.resolve(section.id,sub.id),n=scenario.create();if(!scenario.original)n.scenario=scenario;assert.ok(n.checks().length>0);new E.Network(n.snapshot());keys.push(scenario.id);count++;}assert.equal(count,127);assert.ok(new Set(keys).size>=125);
});
test('compact saves preserve startup-config and migrate a version-1 Ethernet lab',()=>{
  const n=S.seed('route-ready');run(n,'R1',['hostname EDGE']);n.saveConfig(n.device('R1'));const saved=n.snapshot();assert.equal(saved.compact,true);assert.ok(JSON.stringify(saved).length<10000);const r=new E.Network(saved);r.power('R1',false);r.power('R1',true);assert.equal(r.device('R1').hostname,'EDGE');assert.equal(ping(r,'PC1','10.0.20.12'),1);
  const B=require('./ethernet.js'),legacy=new B.Network();for(const[a,ap,b,bp]of E.REQUIRED)legacy.connect(a,ap,b,bp,a.startsWith('SW')&&b.startsWith('SW')?'cross':'straight');for(let i=1;i<=4;i++)legacy.configurePC('PC'+i,'192.168.1.'+i,'255.255.255.0');legacy.device('SW1').startup={hostname:'OLD',ports:JSON.parse(JSON.stringify(legacy.device('SW1').ports))};const migrated=new E.Network(legacy.snapshot());migrated.power('SW1',false);migrated.power('SW1',true);assert.equal(migrated.device('SW1').hostname,'OLD');assert.equal(ping(migrated,'PC1','192.168.1.3'),1);
});
test('protocol ACL can permit ICMP and deny TCP without confusing service reachability',()=>{
  const n=S.seed('route-ready');const server=n.device('PC2');server.services.http=true;run(n,'R1',['ip access-list extended WEB','deny tcp any any eq www','permit ip any any','exit','int gi0/0','ip access-group WEB in']);assert.equal(ping(n,'PC1','10.0.20.12'),1);assert.throws(()=>n.serviceRequest('PC1','10.0.20.12','http'),/Brak połączenia/);run(n,'R1',['int gi0/0','no ip access-group WEB in']);assert.equal(n.serviceRequest('PC1','10.0.20.12','http'),server);
});
test('DHCP-backed DAI drops spoofed ARP requests and permits the valid binding',()=>{
  const n=S.seed('services');run(n,'R1',['ip dhcp excluded-address 10.0.10.1 10.0.10.99','ip dhcp pool USERS','network 10.0.10.0 255.255.255.0','default-router 10.0.10.1']);run(n,'SW1',['ip dhcp snooping','ip dhcp snooping vlan 1','int fa0/24','ip dhcp snooping trust','ip arp inspection trust','exit','ip arp inspection vlan 1']);n.dhcp('PC1');assert.equal(ping(n,'PC1','10.0.10.1'),1);n.device('PC1').ip='10.0.10.200';n.changed();assert.equal(ping(n,'PC1','10.0.10.1'),0);assert.ok(n.events.some(e=>e.detail.startsWith('DAI:')));
});
test('console login actually challenges credentials on reconnect and after reload',()=>{
  const n=S.seed();run(n,'SW1',['line console 0','password cable','login']);n.saveConfig(n.device('SW1'));const t=new E.Terminal(n,'SW1');assert.equal(t.prompt(),'Password: ');assert.match(t.execute('wrong'),/Authentication failed/);t.execute('cable');assert.equal(t.prompt(),'SW1>');t.execute('en');t.execute('reload');t.execute('');assert.equal(t.prompt(),'Password: ');t.execute('cable');assert.equal(t.prompt(),'SW1>');
});
test('submode navigation accepts global interface commands and enum keyword abbreviations',()=>{
  const n=S.seed('channel'),t=cli(n,'SW1',['en','conf t','int gi0/1','switchport mode tr','channel-group 1 mode act','interface gi0/2','channel-group 1 mode pas','duplex f','speed a','end']);assert.equal(n.device('SW1').ports['GigabitEthernet0/1'].channelMode,'active');assert.equal(n.device('SW1').ports['GigabitEthernet0/2'].duplex,'full');t.execute('conf t');t.execute('int gi0/2');assert.match(t.execute('channel-group 1 mode a'),/Ambiguous/);
});
test('VLSM lab uses /26, /27 and /30 routes and can meet its grading criteria',()=>{
  const scenario=S.resolve('ccna-subnetting','lab-vlsm-day15'),n=scenario.create();n.scenario=scenario;run(n,'R1',['ip route 192.168.10.64 255.255.255.224 192.168.10.98']);run(n,'R2',['ip route 192.168.10.0 255.255.255.192 192.168.10.97']);assert.equal(ping(n,'PC1','192.168.10.70'),1);cli(n,'R1',['en','sh ip ro']);assert.ok(n.checks().every(c=>c.ok));
});

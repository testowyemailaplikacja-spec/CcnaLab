// CCNA-C01-20261031-D02-LAB | AUTHOR: ChatGPT / GPT-6
const test=require('node:test');
const assert=require('node:assert/strict');
const S=require('../apps/ccna/packet-lab/scenarios.js');
const curriculum=require('../apps/ccna/packet-lab/curriculum.js');
const catalog=require('../apps/ccna/data/jitl-labs.js');
const SID='interfejsy-sieciowe-i-okablowanie';
const LAB='topologia-laboratorium';
const expected=[
 ['PC1','FastEthernet0','SW3','FastEthernet0/1','straight'],
 ['PC2','FastEthernet0','SW4','FastEthernet0/1','straight'],
 ['PC3','FastEthernet0','SW7','FastEthernet0/1','straight'],
 ['SRV1','FastEthernet0','SW8','FastEthernet0/1','straight'],
 ['SW3','FastEthernet0/2','SW1','FastEthernet0/2','cross'],
 ['SW1','FastEthernet0/3','SW2','FastEthernet0/3','cross'],
 ['SW4','FastEthernet0/2','SW2','FastEthernet0/2','cross'],
 ['SW7','FastEthernet0/2','SW5','FastEthernet0/2','cross'],
 ['SW5','FastEthernet0/3','SW6','FastEthernet0/3','cross'],
 ['SW8','FastEthernet0/2','SW6','FastEthernet0/2','cross'],
 ['SW1','GigabitEthernet0/1','R2','GigabitEthernet0/1','straight'],
 ['SW2','GigabitEthernet0/1','R2','GigabitEthernet0/2','straight'],
 ['SW5','GigabitEthernet0/1','R4','GigabitEthernet0/1','straight'],
 ['SW6','GigabitEthernet0/1','R4','GigabitEthernet0/2','straight'],
 ['R1','GigabitEthernet0/0','R2','GigabitEthernet0/0','cross'],
 ['R1','GigabitEthernet0/1','R3','GigabitEthernet0/0','fiber'],
 ['R3','GigabitEthernet0/1','R4','GigabitEthernet0/0','fiber']
];
function lab(){return S.resolve(SID,LAB);}
function filled(){const scenario=lab(),net=scenario.create();for(const [a,ap,b,bp,type] of expected)net.connect(a,ap,b,bp,type);return{scenario,net};}
test('Day 02 standalone topology has 16 prepositioned devices, 17 empty links and disabled Auto MDI-X',()=>{
 const scenario=lab();assert.ok(scenario);
 const n=scenario.create();
 assert.equal(n.state.devices.length,16);
 assert.equal(n.state.links.length,0);
 assert.deepEqual(new Set(n.state.devices.map(x=>x.id)),new Set(['R1','R2','R3','R4','SW1','SW2','SW3','SW4','SW5','SW6','SW7','SW8','PC1','PC2','PC3','SRV1']));
 assert.ok(n.state.devices.every(d=>Object.values(d.ports).filter(p=>p.kind==='ethernet').every(p=>p.enabled&&!p.autoMdix)));
 assert.equal(scenario.checks(n).filter(c=>c.ok).length,0);
});
test('Every cable from video connects and all 18 grading requirements pass',()=>{
 const{scenario,net}=filled();
 assert.equal(net.state.links.length,17);
 assert.ok(net.state.links.every(link=>net.status(link).up), 'Connections must be actually operational');
 assert.equal(scenario.checks(net).length,18);
 assert.deepEqual(scenario.checks(net).filter(c=>!c.ok),[]);
 assert.equal(net.state.links.filter(l=>l.type==='fiber').length,2);
});
test('Wrong cable, missing cable and extra cable never give a pass',()=>{
 const s=lab(),wrong=s.create();
 wrong.connect('PC1','FastEthernet0','SW3','FastEthernet0/1','cross');
 assert.equal(wrong.status(wrong.state.links[0]).up,false);
 assert.ok(s.checks(wrong).some(c=>!c.ok));
 const missing=s.create();
 for(const [a,ap,b,bp,t] of expected.slice(0,-1))missing.connect(a,ap,b,bp,t);
 assert.ok(s.checks(missing).some(c=>!c.ok));
 const{net}=filled();
 net.connect('R1','GigabitEthernet0/2','SW3','GigabitEthernet0/1','straight');
 const result=s.checks(net);
 assert.equal(result.slice(0,17).filter(x=>x.ok).length,17);
 assert.equal(result[17].ok,false,'Additional cable must fail the completeness check');
});
test('Day 02 lab added only once at end of section 1 with notes and real Packet Tracer download',()=>{
 const topics=['ethernet-standardy-i-predkosc','skretka-utp-i-przewody','auto-mdix','swiatlowod-i-transceivery','zasady-doboru-polaczen','dobor-medium-do-odleglosci'];
 const section={id:SID,subsections:[...topics.map(id=>({id,type:'learning-subsection',questions:[]})),{id:'exam',type:'section-exam'}]};
 const data={sections:[{sections:[section]}]};
 const before=section.subsections.slice(0,6);
 const state=catalog.apply(data);
 const actual=section.subsections[6];
 assert.equal(actual.id,LAB);
 assert.equal(section.subsections[7].id,'exam');
 assert.ok(before.every((item,index)=>section.subsections[index]===item));
 assert.equal(actual.questions.length,0,'Lab must not silently alter the 138 theoretical cards');
 assert.match(actual.note,/Komendy Cisco IOS CLI: brak/);
 assert.match(actual.note,/R1–R3, 3 km/);
 assert.match(actual.note,/R3–R4, 250 m/);
 assert.match(actual.note,/Day%2002%20Lab%20-%20Connecting%20Devices\.pkt/);
 assert.equal(actual.labAuditKey,'connecting-devices');
 assert.equal(actual.lab.downloadUrl,'https://raw.githubusercontent.com/AlexG900/Packet-Tracer-Labs/main/Day%2002%20Lab%20-%20Connecting%20Devices.pkt');
 assert.ok(state.deferred.includes('packet-tracer-intro'));
 catalog.apply(data);
 assert.equal(section.subsections.filter(x=>x.id===LAB).length,1);
 assert.equal(curriculum.find(x=>x.id===SID).subsections.at(-1).id,LAB);
});

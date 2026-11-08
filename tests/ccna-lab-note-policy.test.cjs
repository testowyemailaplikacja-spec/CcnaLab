// CCNA-C01-20261031-LAB-NOTE-RULE | AUTHOR: ChatGPT / GPT-6
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const fromRoot=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('Future CCNA labs must document every source-used command with mode, device, explanation and verification',()=>{
 const policy=fromRoot('docs/CCNA_CONTENT_FROM_VIDEO_WORKFLOW.md');
 const start=policy.indexOf('## Stała zasada opracowywania KAŻDEGO laboratorium CCNA');
 const end=policy.indexOf('## Przykład: Day 02',start);
 assert.ok(start>=0&&end>start,'Mandatory lab policy must be preserved in the canonical workflow');
 const rule=policy.slice(start,end);
 for(const phrase of [
  'każdą', 'Cisco IOS CLI', 'tryb CLI', 'do czego służy',
  'Instrukcja zaliczenia krok po kroku','kryteria zaliczenia',
  'Na samym dole notatki','Packet Tracer','Komendy Cisco IOS CLI: brak',
  'Nie dopisuj komend', 'nie występują żadne komendy'
 ])assert.ok(rule.toLocaleLowerCase('pl').includes(phrase.toLocaleLowerCase('pl')),'Missing future-lab rule: '+phrase);
 assert.match(rule,/\.pkt/);
 assert.match(rule,/\.pka/);
});
test('Canonical CCNA documentation points to the same future-lab command procedure',()=>{
 const ccna=fromRoot('docs/CCNA.md');
 const plan=fromRoot('docs/CCNA_CONTENT_PLAN.md');
 const module=fromRoot('apps/ccna/packet-lab/README.md');
 for(const content of [ccna,plan,module]) {
   assert.match(content,/CCNA_CONTENT_FROM_VIDEO_WORKFLOW\.md/);
   assert.match(content,/Komendy Cisco IOS CLI: brak/);
   assert.match(content,/\.pkt/);
   assert.match(content,/kryteri\w* zaliczenia|warunk\w* zaliczenia|sposób wykonania zadania/);
 }
});

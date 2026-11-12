'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {inspect,gitBlobSha,extractCurriculum}=require('./check-legacy-ids.cjs');
const ROOT=path.resolve(__dirname,'..');
function fixture(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ccna-lock-'));
  const write=(rel,s)=>{const f=path.join(root,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s);};
  const legacy='<script>const ADMIN_DATA={id:"ccna",sections:[{id:"s1",subsections:[{id:"u1",questions:[{id:"q1"}]}]}]};</script>';
  const cur='(function(root){\n const topics = [{"id":"s1","subsections":[{"id":"u1","lab":false}]}];\n  if (typeof module === "object" && module.exports) module.exports = topics;\n})(this);\n';
  const sourceLiteralIds=['ccna','q1','s1','u1'];
  const b={schema:'ccnalab-legacy-identity-lock-v1',status:'fixture',lockedFiles:{
    'apps/ccna/legacy.html':gitBlobSha(legacy),
    'apps/ccna/packet-lab/curriculum.js':gitBlobSha(cur)
  },sourceLiteralOccurrences:4,sourceLiteralIds,
  sections:extractCurriculum(cur),
  totals:{sourceLiteralIds:4,sections:1,subsections:1,markedLabs:0}};
  write('apps/ccna/legacy.html',legacy);write('apps/ccna/packet-lab/curriculum.js',cur);
  write('data/mapping/legacy-ids.json',JSON.stringify(b));
  return {root,write,dispose:()=>fs.rmSync(root,{recursive:true,force:true})};
}
test('current CCNAlab source identity inventory equals locked baseline',()=>{
  const r=inspect(ROOT);
  assert.equal(r.valid,true,r.issues.join('\n'));
  assert.ok(r.totals.sourceLiteralIds>1000);
  assert.ok(r.totals.sections>0&&r.totals.subsections>r.totals.sections);
});
test('an unchanged fixture passes identity lock',()=>{
  const f=fixture();try{assert.equal(inspect(f.root).valid,true)}finally{f.dispose()}
});
test('removing any historic question ID triggers review, never silent migration',()=>{
  const f=fixture();try{
    f.write('apps/ccna/legacy.html','<script>const ADMIN_DATA={id:"ccna",sections:[{id:"s1",subsections:[{id:"u1",questions:[]}]}]};</script>');
    const r=inspect(f.root);
    assert.equal(r.valid,false);
    assert.ok(r.issues.some(s=>s.includes('Historical literal ID set changed')));
  }finally{f.dispose()}
});
test('editing source without changing an ID still requires source review',()=>{
  const f=fixture();try{
    f.write('apps/ccna/legacy.html','<script>const ADMIN_DATA={id:"ccna",sections:[{id:"s1",subsections:[{id:"u1",questions:[{id:"q1",answer:"yes"}]}]}]};</script>');
    const r=inspect(f.root);assert.equal(r.valid,false);
    assert.ok(r.issues.some(s=>s.includes('Source blob changed')));
  }finally{f.dispose()}
});
test('adding an unexpected new Packet Lab subsection is not a silent change',()=>{
  const f=fixture();try{
    f.write('apps/ccna/packet-lab/curriculum.js','(function(root){\n const topics = [{"id":"s1","subsections":[{"id":"u1"},{"id":"u2"}]}];\n  if (typeof module === "object" && module.exports) module.exports = topics;\n})(this);');
    const r=inspect(f.root);
    assert.equal(r.valid,false);assert.ok(r.issues.some(s=>s.includes('Packet Lab section')));
  }finally{f.dispose()}
});
test('Git blob SHA is computed with the Git blob header',()=>{
  assert.equal(gitBlobSha('test content\n'),'d670460b4b4aece5915caf5c68d12f560a9fe3e4');
});

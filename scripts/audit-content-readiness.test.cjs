'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const {analyze}=require('./audit-content-readiness.cjs');
const root=path.resolve(__dirname,'..');
function mockRoot(){
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ccna-readiness-'));
  return {
    tmp,
    write(file,content='test'){
      const target=path.join(tmp,file);fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.writeFileSync(target,content);
    },
    cleanup(){fs.rmSync(tmp,{recursive:true,force:true});}
  };
}
test('real repository distinguishes existing mechanics from unpublished content pipeline',()=>{
  const report=analyze(root);
  assert.equal(report.decisions.manualDraft,'GO_WITH_REVIEW');
  assert.equal(report.decisions.mechanicsDevelopment,'GO_ISOLATED_BETA');
  assert.equal(report.decisions.productionRelease,'NOT_ASSESSED_NOT_AUTHORIZED');
  assert.equal(typeof report.decisions.automatedPublication,'string');
  assert.ok(report.evidence.coreFilesPresent);
  assert.ok(report.evidence.verifyContains.content);
  assert.ok(report.evidence.verifyContains.packetLab);
  assert.ok(report.evidence.verifyContains.beta);
});
test('a missing ingestion / publisher is BLOCKED and cannot be disguised as PASS',()=>{
  const r=mockRoot();try{
    const report=analyze(r.tmp);
    assert.equal(report.decisions.automaticIngestion,'BLOCKED');
    assert.equal(report.decisions.automatedPublication,'BLOCKED');
    assert.ok(report.blockers.some(x=>x.id==='G01-INGEST'));
    assert.ok(report.blockers.some(x=>x.id==='G04-PUBLISH'));
  }finally{r.cleanup();}
});
test('fresh zero-trust root needs actual publisher, runtime hook, identity snapshot and review',()=>{
  const r=mockRoot();try{
    const workflow=['AGENTS.md','docs/CONTENT_PIPELINE.md','data/content-workflow-template.json','scripts/validate-content.mjs'];
    for(const name of workflow)r.write(name);
    const source=['scripts/ingest-video.mjs','scripts/map-anki.mjs','scripts/build-section.mjs',
      'scripts/build-lab.mjs','data/mapping/legacy-ids.json','scripts/publish-content.mjs',
      'apps/ccna/renderer/lesson-view.js','apps/ccna/renderer/quiz-view.js',
      'apps/ccna/renderer/lab-view.js','scripts/validate-coverage.mjs',
      'data/coverage/200-301-v1.1.json','data/coverage/200-301-v2.0.json'];
    for(const name of source)r.write(name);
    r.write('apps/ccna/router.js','const published="data/published/sections";');
    r.write('apps/ccna/packet-lab/curriculum.js','(function(root){\n  const topics = [{"id":"demo","subsections":[{"id":"lab-demo","lab":true}]}];\n  if (typeof module === "object" && module.exports) module.exports = topics;\n})(this);');
    for(const name of ['apps/ccna/packet-lab/engine.js','apps/ccna/packet-lab/engine.test.cjs',
      '.github/workflows/beta-quality.yml'])r.write(name);
    r.write('package.json',JSON.stringify({scripts:{verify:'npm run test:content && npm run test:packet-lab && npm run test:beta'}}));
    r.write('data/packs/one.json','{"id":1}');
    r.write('data/published/sections/one.json','{"id":1}');
    const report=analyze(r.tmp);
    assert.equal(report.decisions.manualDraft,'GO_WITH_REVIEW');
    assert.equal(report.decisions.mechanicsDevelopment,'GO_ISOLATED_BETA');
    assert.equal(report.decisions.automatedPublication,'READY_FOR_END_TO_END_ACCEPTANCE');
    assert.deepEqual(report.blockers,[]);
  }finally{r.cleanup();}
});
test('a runtime without published-data loader is not ready even with a publisher file',()=>{
  const r=mockRoot();try{
    r.write('scripts/publish-content.mjs','export {}');
    for(const file of ['apps/ccna/renderer/lesson-view.js','apps/ccna/renderer/quiz-view.js',
      'apps/ccna/renderer/lab-view.js','apps/ccna/router.js'])r.write(file);
    const report=analyze(r.tmp);
    assert.equal(report.evidence.runtimePublishedContentHook,false);
    assert.ok(report.blockers.some(x=>x.id==='G04-PUBLISH'));
  }finally{r.cleanup();}
});
test('real Packet Lab curriculum is reported without claiming that every topic is a dedicated lab',()=>{
  const report=analyze(root),c=report.evidence.curriculum;
  assert.equal(c.parsed,true,c.parseError||'');
  assert.ok(c.sections>0&&c.subsections>=c.sections);
  assert.ok(c.markedLabs<=c.subsections);
  assert.ok(Array.isArray(c.multipleLabSections));
  assert.ok(Array.isArray(c.labNotAtEndSections));
});
test('JSON audit output is machine-readable while strict publish gate refuses false readiness',()=>{
  const script=path.join(__dirname,'audit-content-readiness.cjs');
  const output=cp.spawnSync(process.execPath,[script,'--json'],{cwd:root,encoding:'utf8'});
  assert.equal(output.status,0,output.stderr);
  const parsed=JSON.parse(output.stdout);
  assert.equal(parsed.project,'CcnaLab');
  assert.ok(parsed.decisions.automatedPublication);
  if(parsed.decisions.automatedPublication==='BLOCKED'){
    const strict=cp.spawnSync(process.execPath,[script,'--require-publish-ready'],{cwd:root,encoding:'utf8'});
    assert.equal(strict.status,1,'Strict mode must reject unsupported mass publishing');
  }
});

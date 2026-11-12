#!/usr/bin/env node
/**
 * Non-destructive, evidence-based CCNAlab content readiness audit.
 * A green npm verify means existing behavior passes its own tests;
 * it DOES NOT mean that automatic publication of new content is ready.
 *
 * Usage:
 *   node scripts/audit-content-readiness.cjs --json
 *   node scripts/audit-content-readiness.cjs --require-publish-ready
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');

function analyze(root=ROOT) {
  const has=rel=>fs.existsSync(path.join(root,rel));
  const read=rel=>has(rel)?fs.readFileSync(path.join(root,rel),'utf8'):'';
  const list=rel=>has(rel)&&fs.statSync(path.join(root,rel)).isDirectory()?
    fs.readdirSync(path.join(root,rel)).filter(x=>x.endsWith('.json')):[];
  const required={
    workflow:['AGENTS.md','docs/CONTENT_PIPELINE.md','data/content-workflow-template.json','scripts/validate-content.mjs'],
    newTheory:['scripts/ingest-video.mjs','scripts/map-anki.mjs','scripts/build-section.mjs'],
    newLab:['scripts/build-lab.mjs'],
    immutableIds:['data/mapping/legacy-ids.json'],
    publish:['scripts/publish-content.mjs','apps/ccna/renderer/lesson-view.js','apps/ccna/renderer/quiz-view.js','apps/ccna/renderer/lab-view.js'],
    coverage:['scripts/validate-coverage.mjs','data/coverage/200-301-v1.1.json','data/coverage/200-301-v2.0.json']
  };
  const missing=Object.fromEntries(Object.entries(required).map(([k,v])=>[k,v.filter(x=>!has(x))]));
  const pkg=(()=>{try{return JSON.parse(read('package.json'))}catch{return{}}})();
  const verify=pkg.scripts?.verify||'';
  const currentChecks={
    content:verify.includes('test:content'),
    packetLab:verify.includes('test:packet-lab'),
    beta:verify.includes('test:beta'),
    workflowCi:has('.github/workflows/beta-quality.yml')
  };
  const packs=list('data/packs');
  const publishedSections=list('data/published/sections');
  const publishedLabs=list('data/published/labs');
  const runtimeRefs=['apps/ccna/index.html','apps/ccna/router.js','apps/ccna/study-adapter.js']
    .filter(has).map(read);
  const runtimeHook=runtimeRefs.some(text=>
    /data\/published\/sections|ccnalab-content-v1|renderer\/lesson-view\.js/.test(text));
  let curriculum={parsed:false,sections:null,subsections:null,markedLabs:null,
    multipleLabSections:[],labNotAtEndSections:[],parseError:null};
  if(has('apps/ccna/packet-lab/curriculum.js')){
    try{
      const source=read('apps/ccna/packet-lab/curriculum.js');
      const begin=source.indexOf('const topics = '),end=source.indexOf(';\n  if (typeof module',begin);
      if(begin===-1||end===-1)throw Error('curriculum JSON assignment not found');
      const data=JSON.parse(source.slice(begin+'const topics = '.length,end));
      if(!Array.isArray(data))throw Error('curriculum not an array');
      curriculum={parsed:true,sections:data.length,
        subsections:data.reduce((n,x)=>n+(x.subsections||[]).length,0),
        markedLabs:data.reduce((n,x)=>n+(x.subsections||[]).filter(y=>y.lab===true).length,0),
        multipleLabSections:data.filter(x=>(x.subsections||[]).filter(y=>y.lab===true).length>1).map(x=>x.id),
        labNotAtEndSections:data.filter(x=>(x.subsections||[]).some((y,i)=>y.lab===true&&i!==x.subsections.length-1)).map(x=>x.id),
        parseError:null};
    }catch(error){curriculum.parseError=error.message}
  }else curriculum.parseError='missing curriculum';
  const validator=read('scripts/validate-content.mjs');
  // Text metadata and self-declared PASS fields are necessary but NOT proof
  // that source files, claims, licensed decks or simulator tests exist.
  const evidenceOnlyStrings=validator.includes('sourceEvidence.transcriptRef')||
    (validator.includes("sourceEvidence.'+k")&&validator.includes('manualFactCheck===true'));
  const blocked=[];
  const gate=(name,ok,reason)=>{if(!ok)blocked.push({id:name,reason});};
  gate('G01-INGEST',missing.newTheory.length===0,'Missing ingestion, authorized Anki mapping or section builder');
  gate('G02-LAB-BUILDER',missing.newLab.length===0,'No reviewed lab bundle builder');
  // A source-level ID lock is useful but is not a verified snapshot of
  // runtime-generated IDs, questions and saved progress. Do NOT mark G03 DONE
  // merely because data/mapping/legacy-ids.json exists.
  let fullIdentityMap=false;
  try{
    const lock=JSON.parse(read('data/mapping/legacy-ids.json'));
    fullIdentityMap=lock.status==='FULL_VERIFIED_RUNTIME_SNAPSHOT'&&
      lock.runtimeInventory?.verified===true&&
      ['sectionIds','subsectionIds','questionIds','flashcardIds','labIds']
        .every(key=>Array.isArray(lock.runtimeInventory[key])&&lock.runtimeInventory[key].length>0);
  }catch{}
  gate('G03-PROGRESS-IDS',fullIdentityMap,
    'Source ID lock is partial; verify all runtime card/question/lab IDs and progress migration');
  gate('G04-PUBLISH',missing.publish.length===0&&runtimeHook,
    'No complete content publisher plus runtime published-section loader');
  gate('G05-REAL-RELEASE',packs.length>0&&publishedSections.length>0,
    'No real content pack and published section artifact for a round-trip test');
  gate('G06-CISCO-COVERAGE',missing.coverage.length===0,'No machine-checkable exam topic mapping for v1.1 and v2.0');
  gate('G07-EVIDENCE',!evidenceOnlyStrings,
    'Validator accepts self-declared review/rights/refs without independent source-file verification');
  gate('G08-LAB-RULE',curriculum.parsed&&curriculum.multipleLabSections.length===0,
    'Multiple legacy labs conflict with single-last-lab publication policy; explicit versioned exceptions required');
  gate('G09-REGRESSION',Object.values(currentChecks).every(Boolean),
    'Verification suite or CI gate missing');
  const readyForManualDraft=missing.workflow.length===0;
  const readyForIsolatedMechanics=Object.values(currentChecks).every(Boolean)&&
    has('apps/ccna/packet-lab/engine.js')&&has('apps/ccna/packet-lab/engine.test.cjs');
  return {
    version:1,
    project:'CcnaLab',
    decisions:{
      manualDraft:readyForManualDraft?'GO_WITH_REVIEW':'BLOCKED',
      mechanicsDevelopment:readyForIsolatedMechanics?'GO_ISOLATED_BETA':'BLOCKED',
      automaticIngestion:missing.newTheory.length===0?'PENDING_REAL_PIPELINE_E2E':'BLOCKED',
      automatedPublication:blocked.length===0?'READY_FOR_END_TO_END_ACCEPTANCE':'BLOCKED',
      productionRelease:'NOT_ASSESSED_NOT_AUTHORIZED'
    },
    evidence:{
      coreFilesPresent:['apps/ccna/index.html','apps/ccna/router.js','apps/ccna/legacy.html',
        'apps/ccna/packet-lab/engine.js','apps/ccna/packet-lab/scenarios.js'].every(has),
      missing,packCount:packs.length,publishedSectionCount:publishedSections.length,
      publishedLabCount:publishedLabs.length,runtimePublishedContentHook:runtimeHook,
      validatorUsesSelfDeclaredEvidence:evidenceOnlyStrings,verifyContains:currentChecks,curriculum,
      stalePacketLabReadmeReference:read('apps/ccna/packet-lab/README.md')
        .includes('docs/CCNA_CONTENT_FROM_VIDEO_WORKFLOW.md')&&
          !has('docs/CCNA_CONTENT_FROM_VIDEO_WORKFLOW.md')
    },
    blockers:blocked,
    disclaimer:'Checks repo structure and declared gates, not legal rights, factual correctness or real browser/physical-device behavior.'
  };
}
function runCli(){
  const result=analyze();
  if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));
  else {
    console.log('CCNAlab content/mechanics readiness');
    for(const [key,value] of Object.entries(result.decisions))console.log('  '+key+': '+value);
    console.log('  BLOCKERS: '+result.blockers.length);
    for(const x of result.blockers)console.log('  '+x.id+': '+x.reason);
    console.log('  Curriculum: '+JSON.stringify(result.evidence.curriculum));
  }
  if(process.argv.includes('--require-publish-ready')&&
    result.decisions.automatedPublication!=='READY_FOR_END_TO_END_ACCEPTANCE')process.exitCode=1;
}
if(require.main===module)runCli();
module.exports={analyze};

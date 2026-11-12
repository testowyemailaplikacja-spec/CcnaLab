import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {stage} from './stage-content-pack.mjs';
const ROOT=path.resolve(import.meta.dirname,'..');
function fixture(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ccnalab-evidence-'));
  const evidence=path.join(root,'evidence');
  const output=path.join(ROOT,'build','staged-test-'+process.pid+'-'+path.basename(root));
  const write=(rel,txt='private authorized example data')=>{
    const target=path.join(evidence,rel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,txt);
  };
  for(const file of ['transcript.txt','notes.txt','reference.json','deck-jitl.json',
    'deck-ocg.json','quiz.txt'])write(file);
  const options=n=>Array.from({length:n},(_,i)=>({
    pl:'Opcja PL '+i,en:'Option EN '+i,correct:i===0,
    whyWrong:i?'Technicznie nie pasuje':'',
    sameCategoryReason:i?'Alternatywa z tej samej kategorii':''
  }));
  const pack={
    schema:'ccnalab-content-v1',kind:'theory',contentId:'example-lesson',sectionId:'interfaces',
    examVersion:'200-301-v1.1',
    video:{url:'https://www.youtube.com/watch?v=ieTH5lVhNaY',title:'Example',transcriptMode:'authorized_notes',
      rights:'Author notes',quizCount:1},
    sourceEvidence:{transcriptRef:'transcript.txt',rawNoteRef:'notes.txt',checkedAt:'2026-11-12'},
    officialSources:[{url:'https://www.cisco.com/',topic:'interfaces',checkedAt:'2026-11-12'}],
    internalReference:{path:'reference.json',factCount:1},
    subsections:[{id:'cables',titleEn:'Cables',noteVisible:'Autorska notatka o kablach.',
      anchors:['pairs'],visuals:[]}],
    decks:[{id:'JITL',sourceRef:'deck-jitl.json',rights:'authorized',matchedCount:1},
      {id:'OCG',sourceRef:'deck-ocg.json',rights:'authorized',matchedCount:0,
        noMatchesReason:'Example scope without matches'}],
    cards:[{id:'c1',deckId:'JITL',sourceId:'card-from-source',subsectionId:'cables',noteAnchor:'pairs',
      pl:{front:'Pytanie',back:'Odpowiedź'},en:{front:'Question',back:'Answer'}}],
    questions:[{id:'q1',mode:'ab',subsectionId:'cables',noteAnchor:'pairs',
      stemPl:'Jak?',stemEn:'How?',explanationPl:'Tak',explanationEn:'Yes',options:options(2)},
      {id:'q2',mode:'abcd',subsectionId:'cables',noteAnchor:'pairs',
      stemPl:'Co?',stemEn:'What?',explanationPl:'Sieć',explanationEn:'Network',options:options(4)}],
    quizItems:[{id:'quiz-1',sourceTime:'31:20',questionRef:'quiz.txt',visualRequired:false}],
    lab:null,sectionAggregate:{
      flashcardIds:['c1'],abIds:['q1'],abcdIds:['q2'],videoQuizIds:['quiz-1']},
    review:{status:'PASS',reviewer:'fixture-only',evidence:'synthetic review fixture',
      manualFactCheck:true,manualDistractorCheck:true,bilingualUiChecked:true,
      regression:'PASS',browser:'PASS'}
  };
  const file=path.join(root,'pack.json');
  const save=()=>fs.writeFileSync(file,JSON.stringify(pack));
  save();
  const approve=()=>{
    const raw=fs.readFileSync(file);
    const obj={schema:'ccnalab-stage-approval-v1',contentId:pack.contentId,
      contentSha256:crypto.createHash('sha256').update(raw).digest('hex'),
      reviewer:'fixture reviewer',approvedAt:'2026-11-12',
      checks:{sourceRights:true,technical:true,bilingual:true,quiz:true,regression:true}};
    const f=path.join(root,'approval.json');fs.writeFileSync(f,JSON.stringify(obj));return f;
  };
  const dispose=()=>{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(output,{recursive:true,force:true})};
  return {pack,root,evidence,file,output,save,approve,dispose,write};
}
test('structurally valid private pack can be checked without output or publishing',()=>{
  const f=fixture();try{
    const r=stage({file:f.file,evidenceRoot:f.evidence,outputRoot:f.output});
    assert.equal(r.status,'STAGED_ONLY_NOT_RELEASED');
    assert.equal(r.evidenceFilesVerified,6);
    assert.equal(r.withheld.videoQuizItems,1);
    assert.equal(fs.existsSync(f.output),false);
  }finally{f.dispose()}
});
test('explicit approval stages an idempotent, source-free learner artifact',()=>{
  const f=fixture();try{
    const approvalFile=f.approve();
    const p={file:f.file,evidenceRoot:f.evidence,approvalFile,write:true,outputRoot:f.output};
    const one=stage(p),two=stage(p);
    assert.equal(one.idempotent,false);assert.equal(two.idempotent,true);
    const text=fs.readFileSync(one.stagedFile,'utf8');
    const o=JSON.parse(text);
    assert.equal(o.publicationStatus,'NOT_PUBLISHED');
    assert.equal(o.questions.length,2);assert.equal(o.cards.length,1);
    assert.equal(o.withheld.videoQuizItems,1);
    for(const forbidden of ['sourceEvidence','internalReference','sourceId','deck-jitl.json',
      'quiz.txt','www.youtube.com','fixture reviewer','reference.json'])
      assert.ok(!text.includes(forbidden),'leaked '+forbidden);
  }finally{f.dispose()}
});
test('missing evidence or unsafe paths block staging even when pack says PASS',()=>{
  const f=fixture();try{
    fs.rmSync(path.join(f.evidence,'deck-jitl.json'));
    assert.throws(()=>stage({file:f.file,evidenceRoot:f.evidence}),/ENOENT/);
    f.pack.decks[0].sourceRef='../private-notes.txt';f.save();
    assert.throws(()=>stage({file:f.file,evidenceRoot:f.evidence}),/Unsafe evidence reference/);
  }finally{f.dispose()}
});
test('modified pack cannot reuse earlier approval',()=>{
  const f=fixture();try{
    const approvalFile=f.approve();
    f.pack.subsections[0].noteVisible+=' Zmieniona autorska wersja.';f.save();
    assert.throws(()=>stage({file:f.file,evidenceRoot:f.evidence,approvalFile,
      write:true,outputRoot:f.output}),/External approval does not match/);
  }finally{f.dispose()}
});
test('inline executable HTML is blocked before any staging write',()=>{
  const f=fixture();try{
    f.pack.subsections[0].noteVisible+='<img src=x onerror="alert(1)">';
    f.save();
    assert.throws(()=>stage({file:f.file,evidenceRoot:f.evidence}),/Unsafe markup/);
    assert.equal(fs.existsSync(f.output),false);
  }finally{f.dispose()}
});
test('duplicate Anki source deck and source ID are rejected',()=>{
  const f=fixture();try{
    f.pack.cards.push({...f.pack.cards[0],id:'c2'});
    f.pack.decks[0].matchedCount=2;
    f.pack.sectionAggregate.flashcardIds.push('c2');
    f.save();
    assert.throws(()=>stage({file:f.file,evidenceRoot:f.evidence}),/Duplicate source card/);
  }finally{f.dispose()}
});
test('write without an independent approval file must fail closed',()=>{
  const f=fixture();try{
    assert.throws(()=>stage({file:f.file,evidenceRoot:f.evidence,write:true,outputRoot:f.output}),/approval/);
    assert.equal(fs.existsSync(f.output),false);
  }finally{f.dispose()}
});
test('write location outside ignored build folder is rejected',()=>{
  const f=fixture();try{
    const approvalFile=f.approve();
    assert.throws(()=>stage({file:f.file,evidenceRoot:f.evidence,approvalFile,
      write:true,outputRoot:path.join(ROOT,'data','published')}),/private build/);
  }finally{f.dispose()}
});

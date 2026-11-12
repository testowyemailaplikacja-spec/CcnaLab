#!/usr/bin/env node
/**
 * READY-02/04 prototype: offline-only, fail-closed staging of an approved
 * author-owned pack. NO YouTube download, no Anki download, no published UI,
 * no GitHub commit and no account sync. Never copy raw source evidence.
 *
 * CLI:
 * node scripts/stage-content-pack.mjs --file /private/lesson.json --evidence-root /private/evidence
 * node scripts/stage-content-pack.mjs --file /private/lesson.json --evidence-root /private/evidence \
 *   --approval /private/approval.json --write
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validatePack} from './validate-content.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const MAX_EVIDENCE=10*1024*1024;
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
const safeId=id=>typeof id==='string'&&/^[a-z0-9][a-z0-9-]{0,95}$/.test(id);
function referencedFile(root,relative) {
  if(typeof relative!=='string'||!relative.trim()||path.isAbsolute(relative)||
      relative.includes('\0')||relative.split(/[\\/]/).includes('..')||
      relative.includes('\\')||relative.startsWith('.'))
    throw Error('Unsafe evidence reference');
  const resolved=fs.realpathSync(path.resolve(root,relative));
  const inside=path.relative(root,resolved);
  if(inside.startsWith('..')||path.isAbsolute(inside)||inside==='')
    throw Error('Evidence reference escapes evidence directory');
  const stat=fs.statSync(resolved);
  if(!stat.isFile()||stat.size===0||stat.size>MAX_EVIDENCE)throw Error('Evidence file invalid or oversized');
  return {sha256:digest(fs.readFileSync(resolved)),bytes:stat.size};
}
const unsafeMarkup=/<\s*\/?\s*(?:script|iframe|object|embed|style|form|input|meta|link|base|svg|math)\b|on[a-z]+\s*=|javascript\s*:|data\s*:\s*text\/html|<[^>]+\b(?:srcdoc)\s*=/i;
function publicFields(p) {
  const notes=p.subsections.map(s=>{
    if(unsafeMarkup.test(s.noteVisible))throw Error('Unsafe markup in visible note '+s.id);
    if(!safeId(s.id))throw Error('Unsafe subsection ID');
    return {id:s.id,titleEn:s.titleEn,noteVisible:s.noteVisible,anchors:[...s.anchors],
      visuals:(s.visuals||[]).map(v=>({alt:v.alt,assetStatus:'NOT_ATTACHED'}))};
  });
  const cards=p.cards.map(c=>({
    id:c.id,subsectionId:c.subsectionId,noteAnchor:c.noteAnchor,
    pl:{front:c.pl.front,back:c.pl.back},en:{front:c.en.front,back:c.en.back}
  }));
  const questions=p.questions.map(q=>({
    id:q.id,subsectionId:q.subsectionId,noteAnchor:q.noteAnchor,mode:q.mode,
    stemPl:q.stemPl,stemEn:q.stemEn,explanationPl:q.explanationPl,
    explanationEn:q.explanationEn,
    options:q.options.map(o=>({pl:o.pl,en:o.en,correct:o.correct===true}))
  }));
  // Do not export source URL, copyrighted quiz bodies, original question refs,
  // rights evidence, Anki source IDs or private instructor reference data.
  // Only learner-authored content can enter this artifact; provenance lives only
  // in separate private evidence and should never appear as editorial meta text.
  const learnerText=[...notes.flatMap(x=>[x.titleEn,x.noteVisible]),
    ...cards.flatMap(c=>[c.pl.front,c.pl.back,c.en.front,c.en.back]),
    ...questions.flatMap(q=>[q.stemPl,q.stemEn,q.explanationPl,q.explanationEn,
      ...q.options.flatMap(o=>[o.pl,o.en])])].join('\n');
  if(/\b(?:Jeremy(?:'s)?|JITL|OCG|sourceEvidence|transcriptRef|rawNoteRef)\b/i.test(learnerText))
    throw Error('Editorial/source metadata inside visible learner content');
  return {
    schema:'ccnalab-staged-learner-v1',publicationStatus:'NOT_PUBLISHED',
    id:p.contentId,sectionId:p.sectionId,kind:p.kind,examVersion:p.examVersion,
    subsections:notes,cards,questions,
    lab:p.kind==='lab'?{
      subsectionId:p.lab.subsectionId,scenarioId:p.lab.simulatorScenarioId,
      steps:p.lab.steps,commands:p.lab.commands.map(x=>({id:x.id,syntax:x.syntax,device:x.device,mode:x.mode,expected:x.expected}))
    }:null,
    sectionAggregate:{
      flashcardIds:[...p.sectionAggregate.flashcardIds],
      abIds:[...p.sectionAggregate.abIds],
      abcdIds:[...p.sectionAggregate.abcdIds]
    },
    withheld:{
      videoQuizItems:p.quizItems.length,
      visualsAwaitingLicensedAssets:notes.reduce((sum,x)=>sum+x.visuals.length,0)
    }
  };
}
function stage({file,evidenceRoot,approvalFile=null,write=false,outputRoot=path.join(ROOT,'build','staged')}){
  if(!file||!evidenceRoot)throw Error('Both --file and --evidence-root are required');
  const root=fs.realpathSync(evidenceRoot);
  const raw=fs.readFileSync(file);
  if(raw.length>5*1024*1024)throw Error('Pack exceeds 5 MB');
  const p=JSON.parse(raw.toString('utf8'));
  const validation=validatePack(p);
  if(!validation.valid)throw Error('Content pack fails structural gate: '+validation.errors.join(' | '));
  if(!safeId(p.contentId)||!safeId(p.sectionId))throw Error('Unsafe contentId/sectionId');
  const refs=[p.sourceEvidence.transcriptRef,p.sourceEvidence.rawNoteRef,
    p.internalReference.path,...(p.decks||[]).map(d=>d.sourceRef),
    ...(p.quizItems||[]).map(q=>q.questionRef),
    ...(p.subsections||[]).flatMap(s=>(s.visuals||[]).map(v=>v.evidenceRef).filter(Boolean))];
  const evidences=refs.map(ref=>referencedFile(root,ref));
  const seen=new Set();
  for(const c of p.cards) {
    const ref=p.decks.find(d=>d.id===c.deckId)?.id+':'+c.sourceId;
    if(seen.has(ref))throw Error('Duplicate source card: '+ref);
    seen.add(ref);
  }
  const artifact=publicFields(p);
  const rawArtifact=JSON.stringify(artifact,null,2)+'\n';
  const summary={
    status:'STAGED_ONLY_NOT_RELEASED',id:p.contentId,kind:p.kind,
    evidenceFilesVerified:evidences.length,contentSha256:digest(raw),
    artifactSha256:digest(rawArtifact),questions:artifact.questions.length,
    flashcards:artifact.cards.length,withheld:artifact.withheld
  };
  if(!write)return summary;
  if(!approvalFile)throw Error('Explicit external approval JSON required for --write');
  const approval=JSON.parse(fs.readFileSync(approvalFile,'utf8'));
  if(approval.schema!=='ccnalab-stage-approval-v1'||approval.contentId!==p.contentId||
      approval.contentSha256!==summary.contentSha256||
      typeof approval.reviewer!=='string'||approval.reviewer.trim().length<3||
      !approval.approvedAt||!approval.checks||
      !['sourceRights','technical','bilingual','quiz','regression'].every(key=>approval.checks[key]===true))
    throw Error('External approval does not match pack or required checks');
  // Never use this output as a public course. The only accepted writer path
  // is an explicit staging area, which is gitignored and not part of Netlify.
  const output=path.resolve(outputRoot);
  const rel=path.relative(ROOT,output);
  if(rel.startsWith('..')||path.isAbsolute(rel)||!rel.startsWith('build'+path.sep))
    throw Error('Output outside private build/ is prohibited');
  const evidenceInside=path.relative(ROOT,root);
  if(!evidenceInside.startsWith('..')&&!path.isAbsolute(evidenceInside)&&
     !evidenceInside.startsWith('build'+path.sep))
    throw Error('Source evidence must be outside the public repository or under ignored build/');
  fs.mkdirSync(output,{recursive:true});
  const realOutput=fs.realpathSync(output);
  const realBuild=fs.realpathSync(path.join(ROOT,'build'));
  if(realOutput!==realBuild&&!realOutput.startsWith(realBuild+path.sep))
    throw Error('Staging directory escapes private build/ through a symlink');
  const target=path.join(output,p.contentId+'.json');
  if(fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())
    throw Error('Refusing to follow staged artifact symlink');
  if(fs.existsSync(target)){
    if(fs.readFileSync(target,'utf8')!==rawArtifact)
      throw Error('Staged contentId collision; never overwrite an existing revision');
    return {...summary,idempotent:true,stagedFile:target};
  }
  fs.writeFileSync(target,rawArtifact,{encoding:'utf8',flag:'wx',mode:0o600});
  return {...summary,idempotent:false,stagedFile:target};
}
function cli(){
  const args=process.argv.slice(2);
  const get=key=>{const i=args.indexOf(key);return i>=0?args[i+1]:undefined};
  try{
    const res=stage({
      file:get('--file'),evidenceRoot:get('--evidence-root'),
      approvalFile:get('--approval'),write:args.includes('--write')
    });
    console.log(JSON.stringify(res,null,2));
  }catch(error){console.error('CCNAlab STAGE BLOCKED: '+error.message);process.exitCode=1;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))cli();
export {stage,publicFields,referencedFile};

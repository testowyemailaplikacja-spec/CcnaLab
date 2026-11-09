#!/usr/bin/env node
// CCNALAB-PIPELINE-20261109 | AUTHOR: ChatGPT / GPT-6
import fs from 'node:fs';
import path from 'node:path';

const OFFICIAL = /(^|\.)((cisco\.com)|(netacad\.com)|(ietf\.org)|(rfc-editor\.org)|(ieee\.org))$/i;
const isText = v => typeof v === 'string' && v.trim().length > 0;
const norm = s => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const validUrl = s => {
  try { const u = new URL(s); return u.protocol === 'https:' && !!u.hostname; }
  catch { return false; }
};
const same = (a,b) => a.length === b.length && a.every((v,i) => v === b[i]);
const uniq = a => [...new Set(a)].sort();
const ids = a => a.map(x => x.id);
function validatePack(p) {
  const errors=[];
  const add=(ok, msg)=>{if(!ok) errors.push(msg);};
  const arr=(v,label)=>{add(Array.isArray(v), label+' must be array');return Array.isArray(v)?v:[];};
  add(p && p.schema === 'ccnalab-content-v1','schema must be ccnalab-content-v1');
  if (!p || typeof p !== 'object') return {valid:false,errors};
  const kind=p.kind;
  add(kind==='theory'||kind==='lab','kind must be theory or lab');
  for(const k of ['contentId','sectionId']) add(isText(p[k])&&!String(p[k]).startsWith('REPLACE_'), k+' required');
  add(['200-301-v1.1','200-301-v2.0'].includes(p.examVersion),'supported examVersion required');
  const video=p.video||{};
  add(validUrl(video.url)&&/^(www\.)?(youtube\.com|youtu\.be)$/i.test(new URL(validUrl(video.url)?video.url:'https://example.invalid').hostname),'YouTube video URL required');
  add(isText(video.title),'video.title required');
  add(['authorized_notes','verified_caption','manual_verified'].includes(video.transcriptMode),'verified/authorized transcript required');
  add(isText(video.rights),'video rights required');
  const source=p.sourceEvidence||{};
  for(const k of ['transcriptRef','rawNoteRef','checkedAt']) add(isText(source[k]),'sourceEvidence.'+k+' required');
  const official=arr(p.officialSources,'officialSources');
  add(official.length>0,'at least one official source required');
  official.forEach((x,i)=>{add(validUrl(x.url),'officialSources['+i+'].url invalid');if(validUrl(x.url))add(OFFICIAL.test(new URL(x.url).hostname),'officialSources['+i+'] not primary/official');add(isText(x.topic)&&isText(x.checkedAt),'officialSources['+i+'] topic/date required');});
  add(isText(p.internalReference?.path)&&Number(p.internalReference?.factCount)>0,'internal reference required');
  const sub=arr(p.subsections,'subsections');
  add(sub.length>0,'at least one subsection required');
  const subIds=new Set();
  const anchorsBySection=new Map();
  const banned=/(?:jeremy(?:'s)?|jitl|official cert guide|day\s*0?\d+|z (?:tego )?filmu|w filmie|na nagraniu|źródł[oa] (?:główne|dodatkowe)|uzupełnienie spoza filmu)/i;
  sub.forEach((s,i)=>{
    add(isText(s.id)&&!subIds.has(s.id),'unique subsection id: '+i);
    subIds.add(s.id);
    add(isText(s.titleEn),'subsection '+i+' English title required');
    add(isText(s.noteVisible),'subsection '+i+' noteVisible required');
    add(!banned.test(s.noteVisible??''),'subsection '+i+' contains source/process metadata');
    const anchors=arr(s.anchors,'subsections['+i+'].anchors');
    add(anchors.length>0&&anchors.every(isText),'subsection '+i+' note anchors missing');
    add(uniq(anchors).length===anchors.length,'subsection '+i+' anchor duplicates');
    anchorsBySection.set(s.id,new Set(anchors));
    const visuals=arr(s.visuals,'subsections['+i+'].visuals');
    visuals.forEach((v,j)=>add(isText(v.alt)&&isText(v.rights)&&(v.original===true||v.licensed===true),'visuals '+i+'/'+j+' require alt and rights'));
  });
  const cards=arr(p.cards,'cards'),qs=arr(p.questions,'questions'),quiz=arr(p.quizItems,'quizItems');
  const allIds=[...ids(cards),...ids(qs),...ids(quiz)];
  add(allIds.every(isText)&&uniq(allIds).length===allIds.length,'all card/question/quiz IDs must be nonempty and globally unique');
  const belongs=(x,label)=>{
    add(subIds.has(x.subsectionId),label+' subsection not found: '+x.id);
    add(isText(x.noteAnchor)&&anchorsBySection.get(x.subsectionId)?.has(x.noteAnchor),label+' note anchor not covered: '+x.id);
  };
  qs.forEach(q=>{
    belongs(q,'question');
    add(q.mode==='ab'||q.mode==='abcd','question mode invalid: '+q.id);
    add(isText(q.stemPl)&&isText(q.stemEn),'bilingual stems missing: '+q.id);
    const opts=arr(q.options,'options:'+q.id);
    add(opts.length===(q.mode==='ab'?2:4),'wrong number of options: '+q.id);
    add(opts.filter(x=>x.correct===true).length===1,'exactly one correct answer: '+q.id);
    add(uniq(opts.map(x=>norm(x.pl))).length===opts.length,'duplicate Polish answers: '+q.id);
    add(uniq(opts.map(x=>norm(x.en))).length===opts.length,'duplicate English answers: '+q.id);
    opts.forEach((o,i)=>{add(isText(o.pl)&&isText(o.en),'option not bilingual: '+q.id+'/'+i);if(o.correct!==true)add(isText(o.whyWrong)&&isText(o.sameCategoryReason),'distractor audit missing: '+q.id+'/'+i);});
  });
  quiz.forEach(q=>{add(isText(q.id)&&isText(q.sourceTime)&&isText(q.questionRef),'quiz item missing evidence');if(q.visualRequired===true)add(isText(q.visualRef),'quiz visualization reference required: '+q.id);});
  const aggregate=p.sectionAggregate||{};
  const checkAgg=(key,values)=>{
    const got=arr(aggregate[key],'aggregate.'+key);
    add(got.every(isText)&&same(uniq(got),uniq(values)),'aggregate '+key+' differs from exact source IDs');
  };
  checkAgg('abIds',qs.filter(q=>q.mode==='ab').map(q=>q.id));
  checkAgg('abcdIds',qs.filter(q=>q.mode==='abcd').map(q=>q.id));
  checkAgg('videoQuizIds',ids(quiz));
  if(kind==='theory') {
    const decks=arr(p.decks,'decks');
    add(['JITL','OCG'].every(id=>decks.some(d=>d.id===id && isText(d.sourceRef)&&isText(d.rights)&&d.expectedCount>0)),'both authorized Anki decks (JITL, OCG) required');
    const deckIds=new Set(decks.map(x=>x.id));
    cards.forEach(c=>{belongs(c,'card');add(deckIds.has(c.deckId)&&isText(c.sourceId),'deck provenance missing: '+c.id);add(isText(c.pl?.front)&&isText(c.pl?.back)&&isText(c.en?.front)&&isText(c.en?.back),'card PL/EN missing: '+c.id)});
    add(cards.length>0,'at least one imported card required');
    add(qs.some(q=>q.mode==='ab')&&qs.some(q=>q.mode==='abcd'),'A/B and A/B/C/D questions required');
    add(quiz.length===video.quizCount,'film quiz count mismatch');
    checkAgg('flashcardIds',ids(cards));
    add(p.lab == null,'theory pack must not embed a laboratory');
  }
  if(kind==='lab') {
    add(cards.length===0,'lab cannot have flashcards');
    checkAgg('flashcardIds',[]);
    const lab=p.lab||{};
    add(isText(lab.subsectionId)&&subIds.has(lab.subsectionId)&&lab.isLast===true&&sub.at(-1)?.id===lab.subsectionId,'lab must be the final dedicated subsection');
    add(isText(lab.simulatorScenarioId),'Packet Lab scenarioId required');
    add(lab.simulatorVerified===true&&lab.negativeCaseVerified===true,'positive/negative simulator checks required');
    add(Array.isArray(lab.steps)&&lab.steps.length>0,'lab steps required');
    add(Array.isArray(lab.diagram)&&lab.diagram.length>0,'lab diagram required');
    const commands=arr(lab.commands,'lab.commands');
    if(commands.length===0)add(lab.explicitNoCli===true,'missing explicit no-CLI confirmation');
    commands.forEach(c=>{
      add(isText(c.id)&&isText(c.syntax)&&isText(c.device)&&isText(c.mode)&&isText(c.expected),'command entry incomplete');
      for(const mode of ['ab','abcd'])add(qs.some(q=>q.mode===mode&&Array.isArray(q.commandIds)&&q.commandIds.includes(c.id)),'command '+c.id+' missing '+mode+' question');
    });
    add(lab.download?.available===false || (validUrl(lab.download?.url)&&isText(lab.download?.rights)),'lab download rights or explicit unavailable required');
    add(quiz.length===video.quizCount,'film quiz count mismatch');
  }
  const rev=p.review||{};
  add(rev.status==='PASS'&&isText(rev.reviewer)&&isText(rev.evidence),'human review PASS with evidence required');
  add(rev.manualFactCheck===true&&rev.manualDistractorCheck===true&&rev.bilingualUiChecked===true,'manual factual/distractor/language checks required');
  add(rev.regression==='PASS'&&rev.browser==='PASS','regression and browser test PASS required');
  return {valid:errors.length===0,errors};
}
function runCli(){
  const i=process.argv.indexOf('--file');
  if(i<0||!process.argv[i+1]) {console.error('Usage: node scripts/validate-content.mjs --file data/packs/ID.json');process.exitCode=2;return;}
  const input=path.resolve(process.argv[i+1]);
  try {const p=JSON.parse(fs.readFileSync(input,'utf8'));const res=validatePack(p);
    if(!res.valid){console.error('CCNALAB CONTENT GATE: FAIL ('+res.errors.length+')\n'+res.errors.map(x=>'- '+x).join('\n'));process.exitCode=1;}
    else console.log('CCNALAB CONTENT GATE: PASS (structure, links, coverage; manual evidence still separately required)');
  }catch(e){console.error('CCNALAB CONTENT GATE: ERROR '+e.message);process.exitCode=2;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)) runCli();
export {validatePack};

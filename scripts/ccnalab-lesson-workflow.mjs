/**
 * Checkpointed editorial workflow for new CCNA lesson authors.
 * Separate from the current learner-facing runtime and legacy engine.
 * Never infers PASS from the presence of generated text.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateLesson } from './validate-ccna-lesson.mjs';

export const STEP_ORDER = Object.freeze([
  'verified_source',
  'source_note',
  'technical_review',
  'expanded_note',
  'topic_map',
  'cards',
  'dedicated_lab',
  'structural_tests',
  'runtime_tests',
  'final_acceptance'
]);
const STATUS = new Set(['NOT_STARTED','IN_PROGRESS','PASS','FAIL','BLOCKED','NOT_RUN']);
const isText = value => typeof value === 'string' && !!value.trim();
const deepCopy = obj => JSON.parse(JSON.stringify(obj));

export function newWorkflow(lessonId) {
  if(!isText(lessonId)) throw new Error('Wymagany lessonId');
  return {schemaVersion:1,lessonId,overall:'IN_PROGRESS',steps:STEP_ORDER.map(id=>({id,status:'NOT_STARTED',evidence:[]})),completedAt:null};
}
export function validateWorkflow(state) {
  const errors=[];
  if(!state || state.schemaVersion!==1 || !isText(state.lessonId)) errors.push('Niepoprawna wersja workflow lub ID');
  if(!Array.isArray(state?.steps) || state.steps.length!==STEP_ORDER.length) return [...errors,'Brak kompletu dziesięciu etapów'];
  state.steps.forEach((step,i)=>{
    if(step.id!==STEP_ORDER[i])errors.push('Błędna kolejność etapów: '+i);
    if(!STATUS.has(step.status))errors.push('Nieznany status: '+step.id);
    if(step.status==='PASS' && (!Array.isArray(step.evidence)||!step.evidence.length||step.evidence.some(x=>!isText(x))))errors.push('Etap PASS bez dowodów: '+step.id);
    if(step.status==='PASS' && i>0 && state.steps[i-1].status!=='PASS')errors.push('Pominięto bramkę poprzedniego etapu: '+step.id);
  });
  if(state.overall==='COMPLETED' && (state.steps.some(s=>s.status!=='PASS')||!isText(state.completedAt)))errors.push('Fałszywy status COMPLETED');
  return errors;
}
export function recordStep(state,id,status,evidence=[]) {
  const issues=validateWorkflow(state);
  if(issues.length)throw new Error('Niepoprawny workflow: '+issues.join('; '));
  if(!STEP_ORDER.includes(id))throw new Error('Nieznany etap: '+id);
  if(!STATUS.has(status) || status==='NOT_STARTED')throw new Error('Niepoprawny nowy status: '+status);
  const index=STEP_ORDER.indexOf(id);
  if(index>0 && state.steps[index-1].status!=='PASS')throw new Error('Poprzedni etap nie ma PASS: '+STEP_ORDER[index-1]);
  if(state.steps.slice(index+1).some(s=>s.status==='PASS'))throw new Error('Nie można zmienić etapu po zatwierdzeniu następnego');
  if(status==='PASS' && (!Array.isArray(evidence) || evidence.length===0 || evidence.some(x=>!isText(x))))throw new Error('PASS wymaga dowodu źródłowego/testowego');
  const next=deepCopy(state);
  next.steps[index].status=status;
  next.steps[index].evidence=Array.isArray(evidence)?evidence:[];
  next.overall='IN_PROGRESS';next.completedAt=null;
  return next;
}
/** Formal completion is only a recorded gate; real test artifacts must be checked by reviewer. */
export function completeWorkflow(state,lesson,{nodeEvidence,browserEvidence,labEvidence,reviewer}={}) {
  const issues=validateWorkflow(state);
  if(issues.length)throw new Error('Niepoprawny workflow: '+issues.join('; '));
  const problems=validateLesson(lesson);
  if(problems.length)throw new Error('Niepoprawne dane lekcji: '+problems.join('; '));
  if(state.steps.some(s=>s.status!=='PASS'))throw new Error('Nie wszystkie etapy mają PASS');
  if(!isText(nodeEvidence)||!isText(browserEvidence)||!isText(labEvidence)||!isText(reviewer))throw new Error('Brak dowodów Node, browser, lab lub recenzenta');
  const next=deepCopy(state);next.overall='COMPLETED';next.completedAt=new Date().toISOString();
  next.acceptance={nodeEvidence,browserEvidence,labEvidence,reviewer};
  return next;
}
async function main() {
 const [cmd,file,...args]=process.argv.slice(2);
 if(cmd==='init' && isText(file)) {
   if(fs.existsSync(file))throw new Error('Plik już istnieje: '+file);
   const state=newWorkflow(args[0]);
   fs.mkdirSync(path.dirname(file),{recursive:true});
   fs.writeFileSync(file,JSON.stringify(state,null,2)+'\n',{flag:'wx'});
   console.log('Zapisano workflow: '+file);
 } else if(cmd==='check' && isText(file)) {
   const state=JSON.parse(fs.readFileSync(file,'utf8'));
   const problems=validateWorkflow(state);
   console.log(JSON.stringify({status:problems.length?'FAIL':'VALID_STRUCTURE',overall:state.overall,problems},null,2));
   if(problems.length)process.exitCode=1;
 } else {console.log('Użycie: node scripts/ccnalab-lesson-workflow.mjs init path.json lesson-id | check path.json');process.exitCode=2;}
}
if(process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url) await main();

/**
 * Read-only inventory of the entire CCNA legacy runtime.
 * Extracts stable IDs and fingerprints for gradual, verified migration.
 * No lesson is auto-approved, no legacy HTML is overwritten.
 *
 * node scripts/ccnalab-legacy-inventory.mjs > reports/inventory.json
 * node scripts/ccnalab-legacy-inventory.mjs --extract section-id subsection-id
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {JSDOM}=require('jsdom');
const vocabulary=require('../apps/ccna/data/terminology.js');
const labs=require('../apps/ccna/data/jitl-labs.js');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=text=>crypto.createHash('sha256').update(String(text??'')).digest('hex');

export function readLegacyCourse() {
 const html=fs.readFileSync(path.join(ROOT,'apps/ccna/legacy.html'),'utf8');
 const dom=new JSDOM(html,{
   url:'http://localhost/apps/ccna/legacy.html',runScripts:'dangerously',
   beforeParse(w){
     w.CcnaVocabulary=vocabulary;w.CcnaLabs=labs;
     w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});
     w.scrollTo=()=>{};
   }
 });
 try{return JSON.parse(dom.window.eval('JSON.stringify(ADMIN_DATA)'));}
 finally{dom.window.close();}
}
export function makeInventory(data){
 const sections=data.sections.filter(x=>x.type==='part').flatMap(p=>(p.sections||[]).filter(x=>x.type==='learning-section'));
 const topics=sections.flatMap(s=>(s.subsections||[]).filter(x=>x.type==='learning-subsection').map(t=>({section:s.id,subsection:t.id,title:t.title,questionCount:(t.questions||[]).length,noteHash:hash(t.note),questionsHash:hash(JSON.stringify(t.questions||[])),hasLab:!!t.lab,sourceStatus:'UNVERIFIED_FOR_MIGRATION'})));
 const seen=new Set(),duplicateSubsectionPaths=[];
 topics.forEach(x=>{const key=x.section+'/'+x.subsection;if(seen.has(key))duplicateSubsectionPaths.push(key);seen.add(key)});
 return {schemaVersion:1,engine:'legacy.html (read-only JSDOM)',parts:data.sections.filter(x=>x.type==='part').length,learningSections:sections.length,learningSubsections:topics.length,learningCards:topics.reduce((n,x)=>n+x.questionCount,0),distinctLearningPaths:seen.size,duplicateSubsectionPaths,subsections:topics};
}
function main(){
 const argv=process.argv.slice(2),data=readLegacyCourse();
 if(argv[0]==='--extract'){
   const [sectionId,subsectionId]=argv.slice(1);
   if(!sectionId||!subsectionId)throw new Error('Use --extract sectionId subsectionId');
   const section=data.sections.filter(x=>x.type==='part').flatMap(x=>x.sections||[]).find(x=>x.id===sectionId);
   const subsection=section?.subsections?.find(x=>x.id===subsectionId);
   if(!subsection)throw new Error('No such CCNA subsection');
   console.log(JSON.stringify({schemaVersion:1,sectionId,subsectionId,source:'legacy-runtime-only; verify original film and remove generated supplements before use',sourceVerified:false,content:subsection},null,2));
 }else if(argv.length===0||argv[0]==='--json'){
   const report=makeInventory(data);console.log(JSON.stringify(report,null,2));
   if(report.duplicateSubsectionPaths.length||report.learningCards<3000||report.learningSubsections<170)process.exitCode=1;
 }else throw Error('Unknown inventory arguments');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main();}catch(e){console.error(e.stack||String(e));process.exitCode=1;}
}

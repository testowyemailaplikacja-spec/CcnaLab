#!/usr/bin/env node
/* READY-01: inspect existing course identities without running app JavaScript.
 * Never changes existing files, status, account progress or beta runtime.
 * Git blob hashes guard accidental edits even where identifiers are computed.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const ID_RE=/(?:["']id["']|\bid)\s*:\s*["']([a-zA-Z0-9_-]+)["']/g;
function gitBlobSha(bytes){
  const data=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);
  return crypto.createHash('sha1').update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex');
}
function extractCurriculum(text) {
  const start=text.indexOf('const topics = ');
  const end=text.indexOf(';\n  if (typeof module',start);
  if(start<0||end<=start)throw Error('Cannot parse Packet Lab curriculum source; manual migration review required');
  const value=JSON.parse(text.slice(start+'const topics = '.length,end));
  if(!Array.isArray(value)||!value.every(x=>x&&typeof x.id==='string'&&Array.isArray(x.subsections)))
    throw Error('Invalid curriculum structure');
  return value.map(section=>({id:section.id,subsections:section.subsections.map(s=>({id:s.id,lab:s.lab===true}))}));
}
function inspect(root=ROOT){
  const file=rel=>fs.readFileSync(path.join(root,rel));
  const baseline=JSON.parse(file('data/mapping/legacy-ids.json').toString('utf8'));
  const legacy=file('apps/ccna/legacy.html');
  const curriculum=file('apps/ccna/packet-lab/curriculum.js');
  const sourceLiteralOccurrences=[...legacy.toString('utf8').matchAll(ID_RE)].length;
  const sourceLiteralIds=[...new Set([...legacy.toString('utf8').matchAll(ID_RE)].map(m=>m[1]))].sort();
  const sections=extractCurriculum(curriculum.toString('utf8'));
  const totals={
    sourceLiteralIds:sourceLiteralIds.length,
    sections:sections.length,
    subsections:sections.reduce((n,x)=>n+x.subsections.length,0),
    markedLabs:sections.reduce((n,x)=>n+x.subsections.filter(s=>s.lab).length,0)
  };
  const observed={'apps/ccna/legacy.html':gitBlobSha(legacy),'apps/ccna/packet-lab/curriculum.js':gitBlobSha(curriculum)};
  const issues=[];
  const mismatch=(ok,message)=>{if(!ok)issues.push(message);};
  mismatch(baseline.schema==='ccnalab-legacy-identity-lock-v1','Unsupported baseline schema');
  for(const name of Object.keys(observed))mismatch(baseline.lockedFiles?.[name]===observed[name],'Source blob changed: '+name);
  mismatch(JSON.stringify(sourceLiteralIds)===JSON.stringify(baseline.sourceLiteralIds),'Historical literal ID set changed');
  mismatch(sourceLiteralOccurrences===baseline.sourceLiteralOccurrences,'Historical literal ID occurrence count changed');
  mismatch(JSON.stringify(sections)===JSON.stringify(baseline.sections),'Packet Lab section/subsection identity or order changed');
  mismatch(JSON.stringify(totals)===JSON.stringify(baseline.totals),'Baseline totals mismatch');
  return {valid:issues.length===0,status:issues.length?'IDENTITY_REVIEW_REQUIRED':'SOURCE_IDS_LOCKED',issues,totals,observed,baselineStatus:baseline.status};
}
function cli(){
  try{
    const v=inspect();
    if(process.argv.includes('--json'))console.log(JSON.stringify(v,null,2));
    else console.log('CCNAlab legacy ID lock: '+v.status+'\n'+
      JSON.stringify(v.totals)+'\n'+v.issues.join('\n'));
    if(!v.valid)process.exitCode=1;
  }catch(error){console.error('CCNAlab legacy ID lock ERROR: '+error.message);process.exitCode=2;}
}
if(require.main===module)cli();
module.exports={gitBlobSha,extractCurriculum,inspect};

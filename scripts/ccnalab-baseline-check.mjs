/**
 * Structural file-preservation guard. SHA-1 matches Git's blob format,
 * not a runtime functionality/regression proof.
 *
 * Intentionally changing existing CCNA code requires reviewed manifest update,
 * functional tests and a migration/rollback note.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function gitBlobSha(bytes) {
 const data=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);
 return crypto.createHash('sha1').update(Buffer.from(`blob ${data.length}\0`)).update(data).digest('hex');
}
export function checkPreservation(root=ROOT) {
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/CCNALAB_PROTECTED_ORIGINAL_FILES.json'),'utf8'));
 const problems=[];
 const reviewPath=path.join(root,'docs/CCNALAB_REVIEWED_CORE_CHANGES.json');
 const reviewed=fs.existsSync(reviewPath)?JSON.parse(fs.readFileSync(reviewPath,'utf8')):{changes:[]};
 const approved=new Map((reviewed.changes||[]).map(change=>[change.path,change]));
 for(const file of manifest.files){
   const absolute=path.resolve(root,file.path);
   if(!absolute.startsWith(root+path.sep)) {problems.push(file.path+': unsafe path');continue;}
   if(!fs.existsSync(absolute)){problems.push(file.path+': missing');continue;}
   const data=fs.readFileSync(absolute);
   const actual=gitBlobSha(data),decision=approved.get(file.path);
   if(actual===file.sha)continue;
   if(!decision||decision.originalSha!==file.sha||decision.approvedSha!==actual)problems.push(file.path+': unreviewed SHA drift');

 }
 return {status:problems.length?'FAIL_PROTECTED_FILE_DRIFT':'PASS_UNMODIFIED_BASELINE',checked:manifest.files.length,problems};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=checkPreservation();console.log(JSON.stringify(report,null,2));if(report.problems.length)process.exitCode=1;
}

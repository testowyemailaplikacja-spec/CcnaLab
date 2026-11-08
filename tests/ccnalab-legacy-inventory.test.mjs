import test from 'node:test';
import assert from 'node:assert/strict';
import {readLegacyCourse,makeInventory} from '../scripts/ccnalab-legacy-inventory.mjs';
let cached;
function inventory(){return cached??=makeInventory(readLegacyCourse());}
test('full legacy inventory retains at least 170 learning topics and over 3400 questions',()=>{
 const r=inventory();
 assert.ok(r.learningSubsections>=170,r.learningSubsections);
 assert.ok(r.learningCards>=3403,r.learningCards);
 assert.equal(r.distinctLearningPaths,r.learningSubsections);
 assert.deepEqual(r.duplicateSubsectionPaths,[]);
});
test('Day03 TCP/IP five layer note and 8 source card IDs appear in the inventory',()=>{
 const data=readLegacyCourse();
 const sec=data.sections.flatMap(p=>p.sections||[]).find(x=>x.id==='model-tcp-ip');
 const sub=sec.subsections.find(x=>x.id==='piec-warstw-tcp-ip');
 assert.ok(sub.note.length>1500);
 for(const id of ['tcp-07','tcp-08','tcp-09','tcp-10','tcp-11','tcp-12','tcp-13','tcp-14'])
   assert.ok(sub.questions.some(q=>q.id===id),id);
});

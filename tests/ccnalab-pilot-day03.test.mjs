import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validateLesson,deriveAB} from '../scripts/validate-ccna-lesson.mjs';
const lesson=JSON.parse(fs.readFileSync(new URL('../content/lessons/jitl-day03-five-layers.json',import.meta.url),'utf8'));
const source=fs.readFileSync(new URL('../apps/ccna/data/modules/day03-tcpip.js',import.meta.url),'utf8');
const context={window:{}};vm.runInNewContext(source,context);
const original=JSON.parse(JSON.stringify(context.window.CCNALabLessonModules[0].data.questions));
test('Day 03 lesson passes source, mapping, card and lab structural gates',()=>{
 assert.deepEqual(validateLesson(lesson),[]);
 assert.equal(lesson.cards.length,original.length);
 assert.equal(lesson.laboratory.noCli,true);
 assert.equal(lesson.laboratory.packetTracerLink,null);
});
test('all authored Day 03 cards retain original IDs, prompts and correct options',()=>{
 for(let i=0;i<original.length;i++){
  const card=lesson.cards[i],src=original[i];
  assert.equal(card.id,src.id);assert.equal(card.question,src.question);
  assert.deepEqual(card.options,src.answers);assert.equal(card.options[card.correctIndex],src.answer);
  for(let j=0;j<3;j++){const ab=deriveAB(card,j);assert.equal(ab.cardId,src.id);assert.equal(ab.options[0],src.answer);}
 }
});
test('every objective has a tested card and a source/expanded note',()=>{
 for(const obj of lesson.objectives)assert.ok(lesson.cards.some(q=>q.objectiveId===obj.id),obj.id);
 assert.ok(lesson.sourceNote.blocks.every(b=>b.start<b.end));
});

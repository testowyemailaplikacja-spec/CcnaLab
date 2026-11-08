import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLessonPack } from '../scripts/build-ccna-lesson-pack.mjs';

const example=()=>({
 schemaVersion:1,id:'synthetic',sectionId:'sec-test',titleEn:'Synthetic lesson',
 source:{url:'https://example.invalid/test',title:'Synthetic source — not real footage',verified:true,rightsReviewed:true},
 sourceNote:{blocks:[{id:'s',start:'00:01',end:'00:10',text:'Synthetic source note.'}]},
 expandedNote:{blocks:[{id:'n',headingEn:'Gateway',markdown:'A gateway forwards packets outside the subnet.'}]},
 objectives:[{id:'o',statement:'Understand the default gateway role',sourceBlockIds:['s'],noteBlockIds:['n']}],
 cards:[{id:'historical-card-id',objectiveId:'o',noteBlockId:'n',question:'What is the role of a default gateway?',options:['Forward to other networks','Provide DNS resolution','Create switch VLANs','Assign hostname'],correctIndex:0,explanation:'A router forwards packets outside the subnet.'}],
 laboratory:{id:'dedicated-lab',titleEn:'Synthetic scenario',sourceUrl:'https://example.invalid/lab',noCli:true,commands:[],steps:['Create the model topology','Check which network receives the packet'],positiveChecks:['Traffic reaches next-hop'],negativeChecks:['Gateway down prevents forwarding'],packetTracerLink:null}
});
test('pack derives all three study modes from single source bank',()=>{
 const pack=buildLessonPack(example());
 assert.equal(pack.items.length,1);
 const item=pack.items[0];
 assert.equal(item.id,'historical-card-id');
 assert.equal(item.flashcard.id,'historical-card-id');
 assert.equal(item.flashcard.answer,item.abcd.options[item.abcd.correctIndex]);
 assert.equal(item.abVariants.length,3);
 for(const variant of item.abVariants) {
  assert.equal(variant.cardId,'historical-card-id');
  assert.equal(variant.options[0],item.flashcard.answer);
  assert.ok(item.abcd.options.includes(variant.options[1]));
  assert.notEqual(variant.options[0],variant.options[1]);
 }
});
test('pack preserves dedicated lab, objective and lesson ID',()=>{
 const pack=buildLessonPack(example());
 assert.equal(pack.laboratory.id,'dedicated-lab');
 assert.equal(pack.items[0].objectiveId,'o');
 assert.equal(pack.items[0].noteBlockId,'n');
 assert.equal(pack.sectionId,'sec-test');
});
test('archived cards never enter active pack',()=>{
 const lesson=example();
 lesson.cards.push({...lesson.cards[0],id:'archived-id',status:'archived'});
 const pack=buildLessonPack(lesson);
 assert.deepEqual(pack.items.map(x=>x.id),['historical-card-id']);
});
test('invalid source prevents a pack from being published',()=>{
 const lesson=example();lesson.source.verified=false;
 assert.throws(()=>buildLessonPack(lesson),/Niepoprawny materiał/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLesson, deriveAB, normalizeOption } from '../scripts/validate-ccna-lesson.mjs';

const example=() => ({
  schemaVersion:1,id:'synthetic-test-lesson',sectionId:'synthetic-section',titleEn:'Synthetic test lesson',
  source:{url:'https://example.invalid/only-test',title:'Synthetic fixture; not a real CCNA source',verified:true,rightsReviewed:true},
  sourceNote:{blocks:[{id:'s1',start:'00:10',end:'00:40',text:'Synthetic fixture text about default gateway routing.'}]},
  expandedNote:{blocks:[{id:'n1',headingEn:'Default gateway',markdown:'The default gateway is the next hop for off-subnet packets.'}]},
  objectives:[{id:'o1',statement:'Explain the function of a default gateway',sourceBlockIds:['s1'],noteBlockIds:['n1']}],
  cards:[{id:'c1',objectiveId:'o1',noteBlockId:'n1',question:'What does the default gateway do?',options:['Routes packets to other networks','Assigns IPv4 via DHCP','Resolves domain names','Converts IP to MAC'],correctIndex:0,explanation:'It forwards off-subnet traffic to a router.'}],
  laboratory:{id:'lab-test',titleEn:'Synthetic test lab',sourceUrl:'https://example.invalid/lab',noCli:true,commands:[],steps:['Build a test topology','Check the route of an off-subnet packet'],positiveChecks:['Correct route via next hop'],negativeChecks:['Disconnected gateway must fail'],packetTracerLink:null}
});
const mutate = callback => {const item=example();callback(item);return validateLesson(item);};

test('synthetic complete structured lesson passes',()=>assert.deepEqual(validateLesson(example()),[]));
test('missing verified source blocks publication',()=>assert.match(mutate(x=>x.source.verified=false).join(' '),/source.verified/));
test('missing source rights check blocks publication',()=>assert.match(mutate(x=>x.source.rightsReviewed=false).join(' '),/rightsReviewed/));
test('missing explanation mapping fails',()=>assert.match(mutate(x=>x.cards[0].noteBlockId='missing').join(' '),/blok/));
test('wrong objective source reference fails',()=>assert.match(mutate(x=>x.objectives[0].sourceBlockIds=['bad']).join(' '),/nieznany blok źródłowy/));
test('wrong answer index fails',()=>assert.match(mutate(x=>x.cards[0].correctIndex=4).join(' '),/correctIndex/));
test('duplicate choices including parentheses and punctuation fail',()=>assert.match(mutate(x=>x.cards[0].options=['SFP','(SFP)','other 1','other 2']).join(' '),/warianty/));
test('video-dependent student prompt fails',()=>assert.match(mutate(x=>x.cards[0].question='What was shown w filmie about SFP?').join(' '),/zależne od filmu/));
test('missing negative lab check fails',()=>assert.match(mutate(x=>x.laboratory.negativeChecks=[]).join(' '),/negativeChecks/));
test('laboratory cannot omit noCli when commands list is empty',()=>assert.match(mutate(x=>delete x.laboratory.noCli).join(' '),/noCli/));
test('AB wrong variant always comes from SAME card',()=>{
 const x=example(); for(let i=0;i<3;i++){const ab=deriveAB(x.cards[0],i);assert.equal(ab.options[0],x.cards[0].options[0]);assert.equal(ab.options[1],x.cards[0].options[i+1]);assert.equal(ab.cardId,'c1');}
});
test('bad option normalization blocks ambiguous AB',()=>{const x=example();x.cards[0].options=['SFP','(SFP)','different','other'];assert.throws(()=>deriveAB(x.cards[0]),/Niejednoznaczne/);});
test('normalization retains different numeric values',()=>assert.notEqual(normalizeOption('12,5'),normalizeOption('1,25')));

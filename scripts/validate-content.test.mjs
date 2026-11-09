// CCNALAB-PIPELINE-20261109 | AUTHOR: ChatGPT / GPT-6
import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePack} from './validate-content.mjs';
function fixture(){
 const options=(n)=>Array.from({length:n},(_,i)=>({pl:'PL'+i,en:'EN'+i,correct:i===0,whyWrong:i?'W tym kontekście nie':'',sameCategoryReason:i?'Podobne protokoły':''}));
 return {schema:'ccnalab-content-v1',kind:'theory',contentId:'day02',sectionId:'interfaces',examVersion:'200-301-v1.1',
 video:{url:'https://www.youtube.com/watch?v=ieTH5lVhNaY',title:'Interfaces',transcriptMode:'authorized_notes',rights:'Autorskie opracowanie',quizCount:1},
 sourceEvidence:{transcriptRef:'evidence/transcript',rawNoteRef:'evidence/note',checkedAt:'2026-11-09'},
 officialSources:[{url:'https://www.cisco.com/',topic:'networking',checkedAt:'2026-11-09'}],
 internalReference:{path:'data/internal/day02.json',factCount:2},
 subsections:[{id:'cables',titleEn:'Copper Cabling',noteVisible:'100BASE-TX wykorzystuje dwie pary skrętki.',anchors:['pairs'],visuals:[]}],
 decks:[{id:'JITL',sourceRef:'verified JITL set',rights:'authorized',matchedCount:1},{id:'OCG',sourceRef:'verified OCG set',rights:'authorized',matchedCount:0,noMatchesReason:'No relevant cards for this small test fixture'}],
 cards:[{id:'c1',deckId:'JITL',sourceId:'source-c1',subsectionId:'cables',noteAnchor:'pairs',pl:{front:'Pytanie',back:'Odpowiedź'},en:{front:'Question',back:'Answer'}}],
 questions:[{id:'q1',mode:'ab',subsectionId:'cables',noteAnchor:'pairs',stemPl:'Ile par?',stemEn:'How many?',explanationPl:'Dwie pary',explanationEn:'Two pairs',options:options(2)},
 {id:'q2',mode:'abcd',subsectionId:'cables',noteAnchor:'pairs',stemPl:'Co wykorzystuje?',stemEn:'What is used?',explanationPl:'Standard Ethernet',explanationEn:'Ethernet standard',options:options(4)}],
 quizItems:[{id:'v1',sourceTime:'31:20',questionRef:'internal/quiz-1',visualRequired:false}],
 lab:null,sectionAggregate:{flashcardIds:['c1'],abIds:['q1'],abcdIds:['q2'],videoQuizIds:['v1']},
 review:{status:'PASS',reviewer:'human-verified-fixture',evidence:'test fixture only',manualFactCheck:true,manualDistractorCheck:true,bilingualUiChecked:true,regression:'PASS',browser:'PASS'}};
}
test('valid structural theory fixture',()=>assert.equal(validatePack(fixture()).valid,true));
test('rejects missing second Anki deck',()=>{const x=fixture();x.decks.pop();assert.match(validatePack(x).errors.join(' '),/both authorized Anki decks/)});
test('rejects question not explained by same subsection',()=>{const x=fixture();x.cards[0].noteAnchor='not-in-note';assert.match(validatePack(x).errors.join(' '),/note anchor not covered/)});
test('rejects weak/unaudited distractor',()=>{const x=fixture();x.questions[1].options[2].sameCategoryReason='';assert.match(validatePack(x).errors.join(' '),/distractor audit missing/)});
test('rejects wrong parent aggregation',()=>{const x=fixture();x.sectionAggregate.abIds=[];assert.match(validatePack(x).errors.join(' '),/aggregate abIds/)});
test('rejects meta process language in visible notes',()=>{const x=fixture();x.subsections[0].noteVisible='Jeremy in filmie pokazał';assert.match(validatePack(x).errors.join(' '),/source\/process metadata/)});
test('rejects missing browser/real review',()=>{const x=fixture();x.review.browser='NOT_RUN';assert.match(validatePack(x).errors.join(' '),/browser test PASS/)});
test('rejects command not tested in both modes',()=>{const x=fixture();x.kind='lab';x.cards=[];x.decks=[];x.sectionAggregate.flashcardIds=[];x.lab={subsectionId:'cables',isLast:true,simulatorScenarioId:'demo',simulatorVerified:true,negativeCaseVerified:true,steps:['step'],noteParts:['topology','steps','commands'],diagram:['diagram'],commands:[{id:'cmd1',syntax:'show interfaces',device:'sw1',mode:'privileged exec',expected:'interfaces list'}],download:{available:false}};assert.match(validatePack(x).errors.join(' '),/missing ab question/)});

test('rejects lab without both question types',()=>{const x=fixture();x.kind='lab';x.cards=[];x.decks=[];x.sectionAggregate.flashcardIds=[];x.lab={subsectionId:'cables',isLast:true,simulatorScenarioId:'demo',simulatorVerified:true,negativeCaseVerified:true,steps:['step'],noteParts:['steps','commands'],diagram:['diagram'],commands:[],explicitNoCli:true,download:{available:false}};x.questions=x.questions.filter(q=>q.mode==='ab');x.sectionAggregate.abcdIds=[];assert.match(validatePack(x).errors.join(' '),/lab must have A\/B and A\/B\/C\/D questions/)})

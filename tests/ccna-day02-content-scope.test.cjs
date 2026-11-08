// WIEDORA-CHANGE: WD-20261101-WIE-005-NATIVE-REGRESSION-11 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
// CCNA-CONTENT-20261031-D02-12 | AUTHOR: ChatGPT / GPT-6 | independent of masterplan
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const vocabulary = require('../apps/ccna/data/terminology.js');
const labs = require('../apps/ccna/data/jitl-labs.js');

const html = fs.readFileSync(path.join(__dirname, '../apps/ccna/legacy.html'), 'utf8');
const SECTION = 'interfejsy-sieciowe-i-okablowanie';
const ETHERNET = 'ethernet-standardy-i-predkosc';
const UTP = 'skretka-utp-i-przewody';
const MDIX='auto-mdix';
const FIBER='swiatlowod-i-transceivery';
const CONNECTIONS='zasady-doboru-polaczen';
const MEDIA='dobor-medium-do-odleglosci';
const ARCHIVE=require('../apps/ccna/data/archived/day02-topology-and-out-of-scope-questions.json');

function inspectCourse(source = html) {
  const dom = new JSDOM(source, {
    url: 'http://localhost/apps/ccna/legacy.html',
    runScripts: 'dangerously',
    beforeParse(window) {
      window.CcnaVocabulary = vocabulary;
      window.CcnaLabs = labs;
      window.matchMedia = () => ({ matches: false, addListener() {}, addEventListener() {} });
      window.scrollTo = () => {};
    }
  });
  try {
    const data = JSON.parse(dom.window.eval('JSON.stringify(ADMIN_DATA)'));
    const audit = JSON.parse(dom.window.eval('JSON.stringify(window.CCNA_DAY02_SCOPE_AUDIT)'));
    const noteAudit = JSON.parse(dom.window.eval('JSON.stringify(window.CCNA_DAY02_11_NOTE_AUDIT)'));
    const noteAudit12 = JSON.parse(dom.window.eval('JSON.stringify(window.CCNA_DAY02_12_NOTE_AUDIT)'));
    const noteAudit13 = JSON.parse(dom.window.eval('JSON.stringify(window.CCNA_DAY02_13_NOTE_AUDIT)'));
    const noteQualityAudit = JSON.parse(dom.window.eval('JSON.stringify(window.CCNA_DAY02_11_13_DISPLAY_AUDIT)'));
    const noteAudit14 = JSON.parse(dom.window.eval('JSON.stringify(window.CCNA_DAY02_14_NOTE_AUDIT)'));
    const noteAudit15 = JSON.parse(dom.window.eval('JSON.stringify(window.CCNA_DAY02_15_NOTE_AUDIT)'));
    const noteAudit16 = JSON.parse(dom.window.eval('JSON.stringify(window.CCNA_DAY02_16_NOTE_AUDIT)'));
    const finalQuizAudit = JSON.parse(dom.window.eval('JSON.stringify(window.CCNA_DAY02_FINAL_QUIZ_AUDIT)'));
    const examOnly = JSON.parse(dom.window.eval('JSON.stringify(getSectionExamOnlyQuestions(getSection("interfejsy-sieciowe-i-okablowanie")))'));
    const sectionPool = JSON.parse(dom.window.eval('JSON.stringify(getSectionExamPool(getSection("interfejsy-sieciowe-i-okablowanie")))'));
    const studyPool = JSON.parse(dom.window.eval('JSON.stringify(getSectionQuestions(getSection("interfejsy-sieciowe-i-okablowanie")))'));
    const displayAudit14 = JSON.parse(dom.window.eval('JSON.stringify(window.CCNA_DAY02_14_DISPLAY_AUDIT)'));
    const section = data.sections.flatMap(part => part.sections || []).find(s => s.id === SECTION);
    assert.ok(section, 'CCNA section exists');
    return { data, section, audit, noteAudit, noteAudit12, noteAudit13, noteAudit14, noteAudit15, noteAudit16, displayAudit14, noteQualityAudit, finalQuizAudit, examOnly, sectionPool, studyPool };
  } finally {
    dom.window.close();
  }
}
function topic(section, id) {
  const item = section.subsections.find(sub => sub.id === id);
  assert.ok(item, 'Missing topic ' + id);
  return item;
}
test('1.1 and 1.2 keep separate scope, correct English UTP title, and no lab tab', () => {
  const { section, audit } = inspectCourse();
  const first = topic(section, ETHERNET);
  const second = topic(section, UTP);
  assert.equal(section.title, 'Interfaces, Cabling and Device Connections');
  assert.equal(second.title, 'UTP Twisted-Pair Cabling, Pinouts and Cable Types');
  assert.equal(first.questions.length, 33);
  assert.equal(second.questions.length, 41);
  assert.equal(first.lab, undefined);
  assert.equal(second.lab, undefined);
  assert.equal(audit.importedInScope, 22);
  assert.equal(audit.utpImportedInScope, 26);
  assert.equal(audit.cards, 33);
  assert.equal(audit.utpCards, 41);
  assert.equal(audit.noLaboratory, true);
  assert.equal(audit.noUtpLaboratory, true);
  const ids = [...first.questions, ...second.questions].map(q => q.id);
  assert.equal(new Set(ids).size, ids.length, '1.1 and 1.2 cannot share progress IDs');
  for (const id of ['io-08', 'io-09', 'io-10', 'io-11']) {
    assert.ok(second.questions.some(q => q.id === id), 'Preserve historical UTP progress ' + id);
  }
  for (const id of ['io-ethernet-08', 'io-ethernet-09', 'io-ethernet-10', 'io-ethernet-11']) {
    assert.ok(first.questions.some(q => q.id === id), 'New Ethernet question gets unique ID ' + id);
  }
});
test('UTP notes cover every requested teaching block and four new questions', () => {
  const { section } = inspectCourse();
  const second = topic(section, UTP);
  const required = [
    'Unshielded Twisted Pair', 'Electromagnetic Interference', 'Crosstalk',
    '1–2, 3–6, 4–5, 7–8', 'PC / Server', 'Router', 'Firewall',
    'Switch', 'Tx', 'Rx', 'Full-Duplex', 'Half-Duplex',
    'CSMA/CD', 'Straight-Through Cable', 'Crossover Cable',
    '1000BASE-T', '10GBASE-T', 'Gigabit Crossover'
  ];
  for (const word of required) assert.ok(second.note.includes(word), 'Missing explained topic: ' + word);
  for (const id of ['utp-day02-01','utp-day02-02','utp-day02-03','utp-day02-04']) {
    const question = second.questions.find(q => q.id === id);
    assert.ok(question, 'New question present: ' + id);
    assert.ok(question.answers.includes(question.answer), 'Correct answer among choices: ' + id);
  }
  assert.ok(second.note.includes('Official Cert Guide'), 'Facts beyond the video are labeled as OCG supplements');
});
test('Questions outside the UTP scope are in their actual subjects, not 1.2', () => {
  const { data, section } = inspectCourse();
  const utp = topic(section, UTP);
  const current = new Set(utp.questions.map(q => q.id));
  const outside = [
    'anki-interfaces-cables-ocg-1013', // LAN vs WAN
    'anki-interfaces-cables-ocg-1014', // wireless IEEE 802.11
    'anki-interfaces-cables-ocg-4004', // hub layer 1
    'anki-interfaces-cables-ocg-4005'  // switch OSI layer 2
  ];
  const targets = data.sections.flatMap(part => part.sections || []).flatMap(s => s.subsections || []);
  for (const id of outside) {
    assert.equal(current.has(id), false, 'Misplaced 1.2 question: ' + id);
    assert.equal(targets.filter(item => (item.questions||[]).some(q => q.id === id)).length, 1,
      'Moved question must be preserved exactly once: ' + id);
  }
  const belongsToUTP = [
    'anki-interfaces-cables-ocg-3017', // four-pair crossover
    'anki-interfaces-cables-ocg-5005' // CSMA/CD supplement
  ];
  for (const id of belongsToUTP) assert.ok(current.has(id), 'Missing relevant UTP card: '+id);
});

test('Auto MDI-X note and questions use a single subject scope with no lab', () => {
  const {section,audit}=inspectCourse();
  const mdix=topic(section,MDIX), utp=topic(section,UTP), connections=topic(section,CONNECTIONS);
  assert.equal(mdix.title,'Auto MDI-X');
  assert.equal(mdix.questions.length,12);
  assert.equal(mdix.lab,undefined);
  assert.equal(audit.autoMdixImportedInScope,4);
  assert.equal(audit.autoMdixCards,12);
  assert.equal(audit.noAutoMdixLaboratory,true);
  for(const term of ['Medium-Dependent Interface','Tx','Rx','Straight-Through','Crossover','link down','100 m','speed auto'])
    assert.ok(mdix.note.includes(term), 'Missing Auto MDI-X explanation '+term);
  assert.ok(mdix.note.includes('uzupełnienie Cisco'));
  const ids=new Set(mdix.questions.map(q=>q.id));
  const related=['anki-interfaces-cables-jitl-1571561771477','anki-interfaces-cables-jitl-1571561828565',
    'anki-interfaces-cables-jitl-1571561884827','anki-interfaces-cables-ocg-2016'];
  for(const id of [...related,'lu-01','io-19','io-20','io-21','io-22','mdix-day02-01','mdix-day02-02','mdix-day02-03']) {
    assert.ok(ids.has(id), 'Auto MDI-X card missing '+id);
    assert.ok(!utp.questions.some(q=>q.id===id), 'Auto MDI-X card left in 1.2 '+id);
  }
  assert.ok(!connections.questions.some(q=>q.id==='lu-01'), 'MDIX assumption left in 1.5');
});
test('All 88 imported Day 02 cards preserved with unique source IDs and correct options', () => {
  const {data,section}=inspectCourse();
  const records=data.sections.flatMap(part=>part.sections||[])
    .flatMap(s=>s.subsections||[]).flatMap(sub=>sub.questions||[])
    .filter(q=>q.id.startsWith('anki-interfaces-cables-'));
  assert.equal(records.length,88);
  assert.equal(new Set(records.map(q=>q.id)).size,88);
  for(const q of records) {
    assert.ok(q.answers.includes(q.answer), 'Incorrect options '+q.id);
  }
  assert.equal(topic(section,UTP).questions.length,41);
});

test('Day 02 fiber 1.4 covers the video, source-marked ranges, and nine new focused cards', () => {
  const { section } = inspectCourse();
  const fiber=topic(section,FIBER);
  const locals=(fiber.questions||[]).filter(q=>!q.id.startsWith('anki-'));
  assert.equal(locals.length,14,'Three video quiz medium questions now belong in 1.6');
  assert.equal(new Set(fiber.questions.map(q=>q.id)).size,fiber.questions.length,'No duplicate card IDs');
  for(const id of ['io-23','io-24','io-25','io-26','io-27','io-28','io-29','io-30']){
    assert.ok(fiber.questions.some(q=>q.id===id),'Keep historical progress '+id);
  }
  for(const i of [1,2,3,7,8,9]){
    const id='fiber-day02-'+String(i).padStart(2,'0');
    const q=fiber.questions.find(q=>q.id===id);
    assert.ok(q,'Missing new fiber card '+id);
    assert.ok(q.answers.includes(q.answer),'Missing correct answer among choices: '+id);
    assert.equal(q.answers.length,4,'Each new ABCD question has four choices: '+id);
  }
  for(const term of ['Small Form-Factor Pluggable','Tx A → Rx B','Core','Cladding','Protective Buffer',
    'Outer Jacket','Multimode Fiber (MMF)','Single-Mode Fiber (SMF)',
    '1000BASE-LX','802.3z','10GBASE-SR','10GBASE-LR','10GBASE-ER','802.3ae',
    'Copper UTP','EMI','150 m','3 km','30 km']){
    assert.ok(fiber.note.includes(term),'Missing video teaching block '+term);
  }
  assert.ok(/wartości zasięgów[^<]*przykładami z filmu/.test(fiber.note),
    'Avoid presenting video distances as universal transceiver guarantees');
  assert.ok(fiber.note.includes('nie zapewnia automatycznie szyfrowania'),
    'Optical resistance to EMI is not automatic encryption');
});

test('Day 02 cable selection 1.5 is theory-only, keeps old progress and moves only relevant Anki questions', () => {
  const {section,audit}=inspectCourse();
  const connections=topic(section,CONNECTIONS);
  const utp=topic(section,UTP);
  const media=topic(section,MEDIA);
  assert.equal(connections.title,'Choosing Cables Between Network Devices');
  assert.equal(connections.questions.length,12,'6 legacy + 4 teaching cards + 2 imports; final-film quiz moved to section exam');
  assert.equal(connections.lab,undefined,'Cable selection must not contain an embedded laboratory');
  assert.equal(connections.labAuditKey,undefined);
  assert.equal(media.lab,undefined,'Media selection stays theory-only');
  assert.equal(section.subsections.at(-2).id,'topologia-laboratorium','Standalone Day 02 cabling lab placed before section exam');
  assert.equal(section.subsections.some(q=>q.id==='jitl-day-01-packet-tracer'),false,'Day 01 lab also stays outside theory');
  assert.equal(audit.cableSelectionSubsectionId,CONNECTIONS);
  assert.equal(audit.cableSelectionImportedInScope,2);
  assert.equal(audit.cableSelectionCards,12);
  assert.equal(audit.noCableSelectionLaboratory,true);
  for(const id of ['lu-02','lu-03','lu-04','lu-05','lu-06','lu-07']) {
    assert.ok(connections.questions.some(q=>q.id===id),'Historical progress retained '+id);
  }
  for(let i=1;i<=4;i++) {
    const id='cables-day02-'+String(i).padStart(2,'0');
    const q=connections.questions.find(q=>q.id===id);
    assert.ok(q,'Day 02 source question missing '+id);
    assert.equal(q.answers.length,4,'Each new question has four choices: '+id);
    assert.ok(q.answers.includes(q.answer),'Correct answer not in choices '+id);
  }
  for(const id of ['anki-interfaces-cables-ocg-2013','anki-interfaces-cables-ocg-2015']) {
    assert.ok(connections.questions.some(q=>q.id===id),'Cable-choice import moved to 1.5 '+id);
    assert.ok(!utp.questions.some(q=>q.id===id),'Cable-choice import is not left in 1.2 '+id);
  }
  assert.equal(new Set(connections.questions.map(q=>q.id)).size,connections.questions.length);
  for(const term of ['Copper Straight-Through Cable','Copper Crossover Cable','MDI','MDI-X',
    'Auto MDI-X OFF','PC ↔ PC','PC ↔ Router','Router ↔ Router','Firewall ↔ Switch',
    'Switch ↔ Switch','1→3','2→6','14:08–18:08','28:02–35:10']) {
    assert.ok(connections.note.includes(term),'Cable selection note omits '+term);
  }
});

// CCNA-C01-20261031-D02-16 | AUTHOR: ChatGPT / GPT-6 | 1.6 and complete first-section regression
test('Day 02 1.6 manually grounds all six teaching questions in five authored teaching blocks', () => {
  const {section,noteAudit16}=inspectCourse();
  const lesson=topic(section,MEDIA);
  const blocks=['media-utp','media-fiber-emi','media-criteria','media-mmf-150','media-smf-3km'];
  assert.deepEqual([...lesson.note.matchAll(/data-ccna-topic="([^"]+)"/g)].map(match=>match[1]),blocks);
  assert.equal(noteAudit16.cards,6);
  assert.equal(noteAudit16.topicSections,5);
  assert.equal(noteAudit16.auditedQuestionIds,6);
  assert.deepEqual(noteAudit16.uncoveredIds,[],'No card relies on a generated answer supplement');
  assert.deepEqual(noteAudit16.staleIds,[],'Do not retain mappings for moved/deleted questions');
  assert.deepEqual(noteAudit16.duplicateIds,[],'Do not duplicate progress IDs');
  assert.ok(!lesson.note.includes('ccna-question-note-supplement'));
  assert.ok(!lesson.note.includes('data-question-note='));
  assert.equal(lesson.lab,undefined);
  assert.equal(lesson.labAuditKey,undefined);
  assert.equal(lesson.questions.length,6);
  for(const card of lesson.questions){
    assert.equal(card.answers.length,4,'Four choices: '+card.id);
    assert.ok(card.answers.includes(card.answer),'Correct answer: '+card.id);
    assert.equal(new Set(card.answers.map(answer=>String(answer).trim().toLocaleLowerCase('pl'))).size,4,'Unique choices: '+card.id);
  }
  for(const phrase of ['100 m','150 m','3 km','Multimode Fiber (MMF)',
    'Single-Mode Fiber (SMF)','Copper UTP','SFP Transceiver',
    'Electromagnetic Interference','28:02–35:10','zgodność','koszt']){
    assert.ok(lesson.note.includes(phrase),'Source-grounded explanation missing: '+phrase);
  }
  assert.ok(lesson.note.includes('SMF może obsłużyć 150 m'),'Do not imply 150 m excludes SMF');
  assert.ok(lesson.note.includes('nie jest gwarantowane przez dowolną wkładkę SFP'),'Never guarantee 3 km for every module');
  assert.ok(!lesson.note.includes('250 m'),'Keep unsupported Packet Tracer case outside Day 02');
});

test('First CCNA section keeps 138 teaching cards and five film-quiz questions isolated to section exam', () => {
  const {section,noteAudit,noteAudit12,noteAudit13,noteAudit14,noteAudit15,noteAudit16}=inspectCourse();
  const topics=[ETHERNET,UTP,MDIX,FIBER,CONNECTIONS,MEDIA];
  const expectedCounts=[33,41,12,34,12,6];
  const expectedBlocks=[9,12,5,6,5,5];
  const audits=[noteAudit,noteAudit12,noteAudit13,noteAudit14,noteAudit15,noteAudit16];
  const records=[];
  topics.forEach((id,index)=>{
    const lesson=topic(section,id);
    assert.equal(lesson.questions.length,expectedCounts[index],id);
    assert.equal(audits[index].cards,expectedCounts[index],id+' audit');
    assert.equal(audits[index].topicSections,expectedBlocks[index],id+' teaching blocks');
    assert.deepEqual(audits[index].uncoveredIds,[],id+' missing authored note');
    if(audits[index].staleIds)assert.deepEqual(audits[index].staleIds,[],id+' stale mapping');
    assert.equal(lesson.lab,undefined,'No theoretical lab '+id);
    assert.equal(lesson.labAuditKey,undefined,'No theoretical lab audit '+id);
    assert.ok(!lesson.note.includes('ccna-question-note-supplement'),id+' has generated supplement');
    records.push(...lesson.questions);
  });
  assert.equal(records.length,138);
  assert.equal(new Set(records.map(q=>q.id)).size,138,'Stable teaching IDs unique within first CCNA section');
  const quiz=section.subsections.find(sub=>sub.type==='section-exam').questions;
  assert.equal(quiz.length,5);
  assert.equal(new Set([...records,...quiz].map(q=>q.id)).size,143,'No reused/duplicated IDs after moving final quiz');
  assert.deepEqual(section.subsections.filter(sub=>sub.type==='learning-subsection').map(sub=>sub.id),[...topics,'topologia-laboratorium']);
  for(const card of records){
    assert.ok(card.answers.includes(card.answer),'Correct answer among alternatives '+card.id);
  }
});

// CCNA-C01-20261031-D02-QUIZ01 | AUTHOR: ChatGPT / GPT-6
test('Five final-video Day 02 cards are section-exam-only and tagged as examination questions', () => {
  const {section,finalQuizAudit,examOnly,sectionPool,studyPool}=inspectCourse();
  const expected=['cables-day02-05','fiber-day02-04','fiber-day02-05','day02-quiz-final-04','fiber-day02-06'];
  const normalCards=section.subsections.filter(sub=>sub.type==='learning-subsection').flatMap(sub=>sub.questions);
  const exam=section.subsections.find(sub=>sub.type==='section-exam');
  assert.ok(exam,'First section must have a collective exam');
  assert.deepEqual(exam.questions.map(q=>q.id),expected);
  assert.equal(finalQuizAudit.expected,5);
  assert.equal(finalQuizAudit.actual,5);
  assert.deepEqual(finalQuizAudit.sourceNumbers,[1,2,3,4,5]);
  assert.deepEqual(finalQuizAudit.examOnly,expected);
  assert.deepEqual(finalQuizAudit.misplaced,[]);
  assert.equal(finalQuizAudit.sectionPool,143);
  assert.equal(normalCards.length,138,'Teaching pool excludes final-video exam cards');
  assert.equal(studyPool.length,normalCards.filter(q=>q.examQuestion!==true).length,'No exam-only cards in section flashcards');
  assert.ok(studyPool.every(q=>q.examQuestion!==true),'Certification questions are excluded from study');
  assert.equal(sectionPool.length,143,'Only section exam includes five extra film cards');
  assert.equal(examOnly.length,5);
  for(const card of examOnly){
    assert.ok(card.examQuestion,'Display existing "Pytanie egzaminacyjne" badge');
    assert.equal(card.videoQuiz,true);
    assert.ok(card.origin.includes('Jeremy'),'Preserve source provenance');
    assert.equal(card.answers.length,4);
    assert.equal(card.correct,0);
    assert.equal(card.answers[0],card.answer);
    assert.equal(new Set(card.answers).size,4);
    assert.ok(!normalCards.some(q=>q.id===card.id),'No quiz card in subsection '+card.id);
    assert.ok(!studyPool.some(q=>q.id===card.id),'No quiz card in section study '+card.id);
  }
  for(const id of expected.filter(id=>id!=='day02-quiz-final-04')){
    assert.ok(exam.questions.find(q=>q.id===id)?.progressKey?.endsWith('::'+id),'Retain progress key '+id);
  }
  assert.ok(exam.questions[3].question.includes('Auto MDI-X'));
});

test('Twenty-five question section exam always includes all five film quiz cards', () => {
  const dom=new JSDOM(html,{
    url:'http://localhost/apps/ccna/legacy.html',
    runScripts:'dangerously',
    beforeParse(window){
      window.CcnaVocabulary=vocabulary;
      window.CcnaLabs=labs;
      window.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});
      window.scrollTo=()=>{};
    }
  });
  try{
    const code='(function(){const section=getSection("interfejsy-sieciowe-i-okablowanie");'+
      'startExam(getSectionExamPool(section),25,"Day 02 section test",'+
      '{type:"section-qualification",sectionId:section.id,requiredPercent:80},getSectionExamOnlyQuestions(section));'+
      'return JSON.stringify(testState.questions.map(q=>({id:q.id,examQuestion:!!q.examQuestion})));})()';
    const selected=JSON.parse(dom.window.eval(code));
    assert.equal(selected.length,25);
    assert.equal(new Set(selected.map(q=>q.id)).size,25);
    const mandatory=['cables-day02-05','fiber-day02-04','fiber-day02-05','day02-quiz-final-04','fiber-day02-06'];
    for(const id of mandatory)assert.ok(selected.some(q=>q.id===id&&q.examQuestion),'Must include source quiz: '+id);
  }finally{dom.window.close();}
});

test('Day 02 1.6 uses the video note, moves quiz questions and excludes Packet Tracer practice', () => {
  const {section,data}=inspectCourse();
  const media=topic(section,MEDIA);
  assert.equal(media.title,'Selecting Transmission Media by Distance');
  assert.equal(media.questions.length,6,'1 historic + 5 source-aligned teaching cards; three final quiz cards in section exam');
  assert.equal(media.lab,undefined);
  assert.equal(media.labAuditKey,undefined);
  assert.equal(section.subsections.at(-2).id,'topologia-laboratorium','Day 02 Packet Tracer exercise is separate from theoretical 1.6');
  assert.equal(section.subsections.some(s=>s.id==='jitl-day-01-packet-tracer'),false);
  assert.ok(!section.subsections.some(s=>s.title==='Topologia z laboratorium Packet Tracer'));
  const ids=media.questions.map(q=>q.id);
  assert.equal(ids[0],'lu-17','Keep source-based historical 3 km question with its ID');
  for(const id of ['fiber-day02-04','fiber-day02-05','fiber-day02-06']) {
    assert.ok(!ids.includes(id),'Final-film quiz removed from 1.6 '+id);
    assert.ok(section.subsections.find(s=>s.type==='section-exam').questions.some(q=>q.id===id),'Moved quiz preserved in section exam '+id);
    assert.ok(!topic(section,FIBER).questions.some(q=>q.id===id),'Moved card not duplicated '+id);
  }
  for(let i=1;i<=5;i++) {
    const id='medium-day02-'+String(i).padStart(2,'0');
    const q=media.questions.find(q=>q.id===id);
    assert.ok(q,'Missing source-derived question '+id);
    assert.equal(q.answers.length,4);
    assert.ok(q.answers.includes(q.answer));
  }
  for(const term of ['Copper UTP','Multimode Fiber (MMF)','Single-Mode Fiber (SMF)','100 m',
    '150 m','3 km','EMI','End Hosts','RJ-45','SFP Transceiver','26:28–28:02','28:02–35:10']) {
    assert.ok(media.note.includes(term),'Video note missing '+term);
  }
  assert.equal(new Set(ids).size,6);
  assert.ok(!media.note.includes('R1–R2'),'Lab-specific topology cannot be presented as film notes');
  assert.ok(!media.note.includes('250 m'),'Lab-specific 250 m example cannot be presented as Day 02 film content');
  const allIds=data.sections.flatMap(p=>p.sections||[]).flatMap(s=>s.subsections||[])
    .flatMap(s=>s.questions||[]).map(q=>q.id);
  assert.equal(new Set(allIds).size,allIds.length,'No duplicated progress IDs after topic moves');
});

// CCNA-C01-20261031-D02-LAB | AUTHOR: ChatGPT / GPT-6
// Historical archive remains inert; only a new standalone lab record is reintroduced.
test('Archived historical topology and out-of-scope questions remain recoverable without reimporting cards', () => {
  assert.equal(ARCHIVE.status,'DEFERRED_NOT_LOADED_IN_APP');
  const lab=ARCHIVE.removedSubsection.originalFullRecord;
  assert.equal(lab.id,'topologia-laboratorium');
  assert.equal(lab.questions.length,6);
  assert.ok(lab.lab,'Standalone Packet Tracer task is fully archived');
  assert.equal(ARCHIVE.removedQuestionsFromMedia.items.length,6);
  const archivedIds=[
    ...lab.questions.map(q=>q.id),
    ...ARCHIVE.removedQuestionsFromMedia.items.map(entry=>entry.originalRecord.id)
  ];
  assert.deepEqual(new Set(archivedIds).size,12);
  const {data,section}=inspectCourse();
  const liveIds=new Set(data.sections.flatMap(p=>p.sections||[]).flatMap(s=>s.subsections||[])
    .flatMap(s=>s.questions||[]).map(q=>q.id));
  for(const id of archivedIds)assert.equal(liveIds.has(id),false,'Archived card still present in app: '+id);
  assert.equal(topic(section,MEDIA).questions.length,6);
});


test('Day 02 1.1 has authored topic explanations for all 33 cards, with no generated answer appendices', () => {
  const {section, noteAudit}=inspectCourse();
  const lesson=topic(section,ETHERNET);
  const topicNodes=[...lesson.note.matchAll(/data-ccna-topic="([^"]+)"/g)].map(match=>match[1]);
  const expectedTopics=['interface-rj45','ethernet-ieee','speed-bps','bit-byte','decimal-prefixes','conversion','copper-standards','ethernet-name','copper-reach'];
  assert.deepEqual(topicNodes,expectedTopics,'Exactly one authored narrative block per subject');
  assert.equal(noteAudit.cards,33);
  assert.equal(noteAudit.topicSections,9);
  assert.equal(noteAudit.auditedQuestionIds,33);
  assert.deepEqual(noteAudit.uncoveredIds,[],'Every current question assigned to an authored explanation');
  assert.equal(lesson.questions.length,33);
  assert.equal(new Set(lesson.questions.map(q=>q.id)).size,33,'Preserve unique question IDs');
  for(const card of lesson.questions) {
    assert.ok(card.answers.includes(card.answer),'Correct choice exists for '+card.id);
  }
  assert.ok(!lesson.note.includes('ccna-question-note-supplement'),'Do not append a generated per-question glossary');
  assert.ok(!lesson.note.includes('data-question-note='),'No question-by-question answer appendix');
  for(const required of ['Registered Jack','8 pozycji styków','IEEE 802.3','1983 rok',
     'bits per second','64 bity to 8 bajtów','1 MB = 8 Mb','1 000 000 000 000','12,5 MB/s',
     '802.3i','802.3u','802.3ab','802.3an','Baseband signaling','Twisted Pair','100 metrów']) {
    assert.ok(lesson.note.includes(required),'A meaningful narrative explanation must include '+required);
  }
  assert.ok(!lesson.lab,'No laboratory in theory');
});


test('Day 02 1.2 provides one authored explanation for each subject across all 41 existing cards', () => {
  const {section, noteAudit12}=inspectCourse();
  const lesson=topic(section,UTP);
  const expectedTopics=['utp-structure','emi-twisting','crosstalk','utp-leakage',
    'ten-hundred-pairs','gigabit-pairs','tx-rx-classic','full-duplex','half-duplex-csma',
    'straight-through','crossover','gigabit-crossover'];
  const authoredTopics=[...lesson.note.matchAll(/data-ccna-topic="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(authoredTopics,expectedTopics,'One meaningful narrative block per concept, with no answer-only appendices');
  assert.equal(noteAudit12.cards,41);
  assert.equal(noteAudit12.topicSections,12);
  assert.equal(noteAudit12.auditedQuestionIds,41);
  assert.deepEqual(noteAudit12.uncoveredIds,[],'Every active 1.2 question must have an authored topic');
  assert.deepEqual(noteAudit12.staleIds,[],'No stale concept mappings after question reassignment');
  assert.equal(lesson.questions.length,41,'Do not silently deduplicate cards');
  assert.equal(new Set(lesson.questions.map(q=>q.id)).size,41,'Keep stable question and progress IDs');
  for(const card of lesson.questions)assert.ok(card.answers.includes(card.answer),'Correct choice exists: '+card.id);
  assert.ok(!lesson.note.includes('ccna-question-note-supplement'),'No automatic expandable answer supplement');
  assert.ok(!lesson.note.includes('data-question-note='),'No question-by-question answer-only list');
  for(const phrase of ['Unshielded Twisted Pair','4 twisted pairs','8 wires',
     'Electromagnetic Interference','Crosstalk','słaba emisja elektromagnetyczna',
     '1–2 oraz 3–6','4–5','7–8','bidirectional',
     'Firewall Tx 1–2','Switch Tx 3–6','Full-Duplex',
     'Half-Duplex','Carrier Sense Multiple Access with Collision Detection',
     '1→1','2→2','1→3','2→6','4–5 ↔ 7–8']) {
    assert.ok(lesson.note.includes(phrase),'Missing teaching explanation: '+phrase);
  }
  for(const phrase of ['[uzupełnienie: Official Cert Guide]','26:28–28:02','19:16–20:24']){
    assert.ok(lesson.note.includes(phrase),'Unmarked or ungrounded source scope: '+phrase);
  }
  assert.equal(lesson.lab,undefined);
});


test('Day 02 1.3 Auto MDI-X notes explain all 12 questions across five concepts', () => {
  const {section,noteAudit13}=inspectCourse();
  const lesson=topic(section,MDIX);
  const topics=['mdix-roles','mdix-function','mdix-off','mdix-one-end','mdix-limits'];
  assert.deepEqual([...lesson.note.matchAll(/data-ccna-topic="([^"]+)"/g)].map(match=>match[1]),topics);
  assert.equal(lesson.questions.length,12);
  assert.equal(noteAudit13.cards,12);
  assert.equal(noteAudit13.topicSections,5);
  assert.equal(noteAudit13.auditedQuestionIds,12);
  assert.deepEqual(noteAudit13.uncoveredIds,[]);
  assert.deepEqual(noteAudit13.staleIds,[]);
  assert.equal(new Set(lesson.questions.map(q=>q.id)).size,12,'No ID loss or duplication');
  for(const question of lesson.questions)assert.ok(question.answers.includes(question.answer),'Wrong answer '+question.id);
  assert.ok(!lesson.note.includes('ccna-question-note-supplement'),'Do not generate an answer-only appendix');
  const noteText=JSDOM.fragment(lesson.note).textContent.replace(/\s+/g,' ');
  for(const part of ['Medium-Dependent Interface','Tx','Rx','1–2','3–6',
    'Automatic Medium-Dependent Interface Crossover','przewód prosty (straight-through)',
    'przewód krosowany (crossover)','Router–Switch = Straight-Through','Switch–Switch = Crossover','jednym końcu łącza',
    'mdix auto','no mdix auto','100 m'])assert.ok(noteText.includes(part),'No substantive explanation for '+part);
  assert.ok(lesson.note.includes('uzupełnienie z dokumentacji Cisco'));
  assert.ok(lesson.note.includes('18:08–19:16'));
  assert.equal(lesson.lab,undefined,'No laboratory attached to theory');
});


// CCNA-C01-20261031-QG-01 | AUTHOR: ChatGPT / GPT-6 | independent CCNA-C01 source-based quality test
test('Day 02: 1.1-1.5 keep all 132 teaching cards linked to authored notes and valid choices', () => {
  const { section, noteAudit, noteAudit12, noteAudit13, noteAudit14, noteAudit15, noteQualityAudit } = inspectCourse();
  const ids=[ETHERNET,UTP,MDIX,FIBER,CONNECTIONS];
  const cards=ids.flatMap(id=>topic(section,id).questions);
  assert.equal(cards.length,132,'One final-video card moved to section exam with stable ID');
  assert.equal(new Set(cards.map(card=>card.id)).size,132);
  for(const [audit,expected] of [[noteAudit,33],[noteAudit12,41],[noteAudit13,12],[noteAudit14,34],[noteAudit15,12]]) {
    assert.equal(audit.cards,expected);
    assert.deepEqual(audit.uncoveredIds,[],'Every question must point to an authored teaching block');
    if('staleIds' in audit)assert.deepEqual(audit.staleIds,[],'No dangling question-to-note mappings');
  }
  for(const id of ids){
    const subsection=topic(section,id);
    assert.ok(!subsection.note.includes('ccna-question-note-supplement'),'No generated answer-only supplements in '+id);
    assert.equal(subsection.lab,undefined,'No lab embedded in the theoretical topic '+id);
    for(const card of subsection.questions){
      assert.ok(card.answers.includes(card.answer),'Correct option missing for '+card.id);
      assert.equal(card.answers.length,4,'Four choices required for '+card.id);
      assert.equal(new Set(card.answers.map(value=>String(value).trim().toLocaleLowerCase('pl'))).size,4,
        'Choices must be distinct for '+card.id);
    }
  }
  assert.equal(noteQualityAudit.expected,52);
  assert.equal(noteQualityAudit.applied,52);
  assert.deepEqual(noteQualityAudit.counts,{
    [ETHERNET]:22,[UTP]:26,[MDIX]:4
  });
  assert.deepEqual(noteQualityAudit.missing,[]);
  assert.deepEqual(noteQualityAudit.problems,[]);
});

test('Day 02: original Anki provenance survives 1.1-1.3 revisions, and 1.3 no longer has a wrong cloze answer', () => {
  const { section }=inspectCourse();
  const imports=[ETHERNET,UTP,MDIX].flatMap(id=>topic(section,id).questions)
    .filter(card=>card.id.startsWith('anki-interfaces-cables-'));
  assert.equal(imports.length,52);
  for(const card of imports){
    assert.ok(card.questionEn,'Keep original English source on '+card.id);
    assert.ok(card.questionPl && card.question===card.questionPl,'Display a reviewed Polish question on '+card.id);
    assert.equal(card.correct,0,'Reviewed correct option index must be zero on '+card.id);
    assert.equal(card.answers[0],card.answer,'Correct answer and first option must match on '+card.id);
  }
  const mdix=topic(section,MDIX);
  const find=id=>mdix.questions.find(q=>q.id==='anki-interfaces-cables-'+id);
  const cloze=find('ocg-2016');
  assert.ok(cloze.questionEn.includes('{{c1::Auto-mdix::}}'));
  assert.equal(cloze.answer,'Auto MDI-X');
  assert.ok(cloze.question.startsWith('Jak nazywa się funkcja'));
  assert.equal(cloze.answers.includes('Autonegotiation'),true);
  assert.ok(!cloze.answers.some(answer=>answer.startsWith('Cisco switches have a feature')));
  const mdixName=find('jitl-1571561884827');
  assert.equal(mdixName.answer,'Auto MDI-X');
  assert.ok(mdixName.question.startsWith('Jak nazywa się funkcja'));
  for(const id of ['jitl-1571561771477','jitl-1571561828565']){
    const question=find(id);
    assert.ok(question.question.includes('Auto MDI-X jest wyłączone'));
    assert.ok(question.answers.includes('rollover cable'));
  }
  const assumption=mdix.questions.find(q=>q.id==='lu-01');
  assert.ok(assumption.question.includes('wyraźnie podaje'));
  assert.ok(assumption.question.includes('obu portach'));
  assert.ok(assumption.answer.includes('MDI/MDI-X'));
  assert.ok(assumption.answers.includes(assumption.answer));
  for(const id of [UTP]){
    const q=topic(section,id).questions.find(q=>q.id==='anki-interfaces-cables-ocg-1017');
    assert.equal(q.answer,'Crosstalk');
    const four=topic(section,id).questions.find(q=>q.id==='anki-interfaces-cables-ocg-3016');
    assert.equal(four.answer,'4');
  }
});


// CCNA-CONTENT-20261031-D02-14 | AUTHOR: ChatGPT / GPT-6 | CCNA-C01 independent course plan
test('Day 02 1.4 has 34 stable questions mapped to six authored notes, without generated answer appendix', () => {
  const {section,noteAudit14,displayAudit14}=inspectCourse();
  const lesson=topic(section,FIBER);
  const topics=['fiber-intro','fiber-optics-extra','fiber-structure','fiber-modes','fiber-standards','fiber-emi'];
  assert.equal(lesson.id,'swiatlowod-i-transceivery','Do not alter stored progress route');
  assert.equal(lesson.title,'Fiber-Optic Cabling, SFP, MMF and SMF');
  assert.deepEqual([...lesson.note.matchAll(/data-ccna-topic="([^"]+)"/g)].map(m=>m[1]),topics);
  assert.equal(lesson.questions.length,34);
  assert.equal(noteAudit14.cards,34);
  assert.equal(noteAudit14.topicSections,6);
  assert.equal(noteAudit14.auditedQuestionIds,34);
  assert.deepEqual(noteAudit14.uncoveredIds,[],'Each question must be assigned to an authored note');
  assert.deepEqual(noteAudit14.staleIds,[],'No stale question IDs');
  assert.equal(displayAudit14.expected,20);
  assert.equal(displayAudit14.applied,20);
  assert.deepEqual(displayAudit14.missing,[]);
  assert.equal(new Set(lesson.questions.map(q=>q.id)).size,34);
  for(const card of lesson.questions) {
    assert.ok(card.answers.includes(card.answer),'Invalid correct answer '+card.id);
    assert.equal(card.answers.length,4,'Every ABCD card must have four variants '+card.id);
  }
  assert.ok(!lesson.note.includes('ccna-question-note-supplement'),'The authored note must replace automatic answers');
  assert.ok(!lesson.note.includes('data-question-note='),'No per-question answer appendix');
  assert.equal(lesson.lab,undefined);
  assert.equal(lesson.labAuditKey,undefined);
});

test('Day 02 1.4 fixes SFP/GBIC answers, contextual distances and relevant distractors while retaining source IDs', () => {
  const {section}=inspectCourse();
  const lesson=topic(section,FIBER);
  const byId=new Map(lesson.questions.map(q=>[q.id,q]));
  const sfp=byId.get('anki-interfaces-cables-ocg-2010');
  assert.ok(sfp);
  assert.equal(sfp.answer,'Small Form-Factor Pluggable (SFP)');
  assert.equal(sfp.answers[0],sfp.answer);
  assert.equal(sfp.questionEn,'SFP','Original English source preserved');
  const gbic=byId.get('anki-interfaces-cables-ocg-2009');
  assert.ok(gbic);
  assert.equal(gbic.answer,'Gigabit Interface Converter (GBIC)');
  assert.equal(gbic.questionEn,'GBIC');
  const plus=byId.get('anki-interfaces-cables-ocg-3010');
  assert.ok(plus);
  assert.ok(lesson.note.includes('SFP+'));
  assert.ok(lesson.note.includes('Gigabit Interface Converter'));
  assert.ok(plus.question.includes('SFP+'));
  const er=byId.get('anki-interfaces-cables-jitl-1571562296950');
  assert.ok(er);
  assert.equal(er.answer,'30 kilometers','Preserve source value from Jeremy\'s Day 02');
  assert.ok(er.question.includes('według filmu')||er.question.includes('tabela Day 02'));
  assert.ok(lesson.note.includes('40 km po SMF'),'Cisco specification distinguished from lesson table');
  assert.equal(er.questionEn,'10GBASE-ER maximum cable length:','Do not rewrite source provenance');
  for(const suffix of ['1571562255863','1571562281919','1571562290766','1571562296950']) {
    const q=byId.get('anki-interfaces-cables-jitl-'+suffix);
    assert.ok(q);
    assert.ok(q.question.includes('Day 02'),'Limit question explicitly scoped to video');
    assert.ok(q.answers.every(answer=>/\b(?:m|meter|meters|km|kilometer|kilometers)\b/i.test(answer)),
      'Alternatives must all be distance values: '+q.id);
  }
  const laser=byId.get('anki-interfaces-cables-ocg-23');
  assert.ok(laser.answers[1].includes('LED'),'Similar optical-source distractor expected');
  const sfpQuestion=byId.get('anki-interfaces-cables-jitl-1571562000954');
  assert.ok(!sfpQuestion.answers.some(answer=>answer.includes('OUI')),'No unrelated MAC terminology in SFP question');
});


// WIEDORA-CHANGE: WD-20261104-WIE-161-SFP-QUESTION-01 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
test('Day 02 SFP flashcard asks about connecting fiber, not terminating the cable', () => {
  const { section } = inspectCourse();
  const fiber = topic(section, FIBER);
  const card = fiber.questions.find(q => q.id === 'anki-interfaces-cables-jitl-1571562000954');
  assert.ok(card, 'Preserve existing flashcard ID and reviews');
  assert.equal(card.question, 'Jaki wymienny moduł nadawczo-odbiorczy umożliwia podłączenie kabla światłowodowego do kompatybilnego Switcha lub Routera?');
  assert.equal(card.answer, 'SFP (Small Form-Factor Pluggable)');
  assert.equal(card.questionEn, 'Fiber-Optic cables are connected to [...] transceivers in a router or switch.');
  assert.equal(card.correct, 0);
  assert.equal(card.answers.length, 4);
  assert.equal(new Set(card.answers).size, 4);
  assert.ok(card.answers.includes(card.answer));
});

// CCNA-CONTENT-20261031-D02-15-TEST | AUTHOR: ChatGPT / GPT-6
test('Day 02 1.5 maps all 12 teaching questions to five authored note blocks', () => {
  const {section,noteAudit15}=inspectCourse();
  const lesson=topic(section,CONNECTIONS);
  const expected=['cables-roles','cables-wiring','cables-devices','cables-auto-mdix','cables-quiz'];
  assert.deepEqual([...lesson.note.matchAll(/data-ccna-topic="([^"]+)"/g)].map(m=>m[1]),expected);
  assert.equal(lesson.questions.length,12);
  assert.equal(noteAudit15.cards,12);
  assert.equal(noteAudit15.topicSections,5);
  assert.equal(noteAudit15.auditedQuestionIds,12);
  assert.deepEqual(noteAudit15.uncoveredIds,[]);
  assert.deepEqual(noteAudit15.staleIds,[]);
  assert.equal(new Set(lesson.questions.map(q=>q.id)).size,12);
  for(const q of lesson.questions) {
    assert.ok(q.answers.includes(q.answer),'Answer missing among options: '+q.id);
    assert.equal(q.answers.length,4,'Four options required: '+q.id);
    assert.equal(new Set(q.answers).size,4,'No duplicated options: '+q.id);
  }
  assert.ok(!lesson.note.includes('ccna-question-note-supplement'));
  assert.ok(!lesson.note.includes('data-question-note='));
  assert.equal(lesson.lab,undefined);
  assert.equal(lesson.labAuditKey,undefined);
});

test('Day 02 1.5 keeps historic and imported IDs while showing accurate cable selection questions', () => {
  const {section}=inspectCourse();
  const lesson=topic(section,CONNECTIONS);
  const byId=new Map(lesson.questions.map(q=>[q.id,q]));
  const crossover=byId.get('anki-interfaces-cables-ocg-2013');
  const straight=byId.get('anki-interfaces-cables-ocg-2015');
  assert.ok(crossover&&straight,'Both relevant source imports preserved');
  assert.equal(crossover.questionEn,'When should you use a crossover cable?');
  assert.equal(straight.questionEn,'When should you use straight-through cables?');
  assert.ok(crossover.question.startsWith('Kiedy zastosować Copper Crossover'));
  assert.ok(straight.question.startsWith('Kiedy zastosować Copper Straight-Through'));
  assert.ok(crossover.answer.includes('same pin pairs'));
  assert.ok(straight.answer.includes('different pin pairs'));
  assert.ok(!crossover.answers.some(a=>a==='10 Mbps'||a==='1 Gbps'));
  assert.ok(!straight.answers.some(a=>a.includes('Organizationally Unique Identifier')));
  const legacy=byId.get('lu-07');
  assert.ok(legacy);
  assert.ok(legacy.answer.includes('Tx na 3–6'));
  assert.ok(legacy.question.includes('Auto MDI-X'));
  for(const id of ['lu-02','lu-03','lu-04','lu-05','lu-06','lu-07'])assert.ok(byId.has(id));
  for(let i=1;i<=4;i++)assert.ok(byId.has('cables-day02-'+String(i).padStart(2,'0')));
  assert.ok(!byId.has('cables-day02-05'),'Original film quiz reserved for section exam only');
  for(const x of ['PC ↔ Switch','Server ↔ Switch','Router ↔ Switch','Firewall ↔ Switch',
    'PC ↔ PC','PC ↔ Router','Router ↔ Router','Switch ↔ Switch'])assert.ok(lesson.note.includes(x));
  assert.ok(lesson.note.includes('Uzupełnienie Cisco'));
  assert.ok(lesson.note.includes('14:08–18:08'));
});

// WIEDORA-CHANGE: WD-20261031-WIE-005-NATIVE-REGRESSION-09 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
test('reviewed Day 02 cleanup exception cannot preserve unrelated contextual cards or a reused ID elsewhere', () => {
  const injection = `
    (() => {
      const section=ADMIN_DATA.sections.flatMap(p=>p.sections||[]).find(s=>s.id==='model-tcp-ip');
      const sub=section.subsections.find(s=>s.type==='learning-subsection');
      for(const id of ['cleanup-unreviewed-probe','lu-01'])sub.questions.push({id,question:'Co pokazano w wykładzie?',answer:'probe',answers:['probe','other'],correct:0});
    })();
  `;
  const anchor='    // CCNA v1.12.3 —';
  assert.ok(html.includes(anchor));
  const {data,section}=inspectCourse(html.replace(anchor,injection+anchor));
  const elsewhere=data.sections.flatMap(p=>p.sections||[]).filter(s=>s.id!==SECTION)
    .flatMap(s=>s.subsections||[]).flatMap(s=>s.questions||[]);
  assert.ok(!elsewhere.some(q=>['cleanup-unreviewed-probe','lu-01'].includes(q.id)));
  assert.ok(topic(section,MDIX).questions.some(q=>q.id==='lu-01'));
  for(const id of ['fiber-day02-03','fiber-day02-07','fiber-day02-08'])
    assert.ok(topic(section,FIBER).questions.some(q=>q.id===id));
  assert.ok(topic(section,MEDIA).questions.some(q=>q.id==='medium-day02-01'));
});

// WIEDORA-CHANGE: WD-20261031-WIE-161-EXAM-POOL-01 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
test('OCG four-pair crossover: original ID and answer, clear prompt, pin diagram, exam-only route', () => {
  const {section,studyPool,sectionPool}=inspectCourse();
  const id='anki-interfaces-cables-ocg-3017';
  const original=topic(section,UTP).questions.find(q=>q.id===id);
  assert.ok(original);
  assert.equal(original.examQuestion,true);
  assert.equal(original.source,'ocg');
  assert.equal(original.questionEn,'How are the wires crossed in a Gigabit Ethernet crossover cable?');
  assert.ok(!original.question.includes('we wskazanym przykładzie'));
  assert.ok(original.question.includes('czteroparowym'));
  assert.ok(!studyPool.some(q=>q.id===id));
  assert.ok(!html.includes('renderDay02SourceQuizPreview'),'No out-of-exam video quiz preview');
  assert.ok(!html.includes('day02SourceQuizPreview'),'Video quiz cannot be opened outside exam');
  assert.equal(sectionPool.filter(q=>q.id===id).length,1);
  for(const mapping of ['1→3','2→6','3→1','6→2','4→7','5→8','7→4','8→5'])
    assert.ok(topic(section,UTP).note.includes(mapping),'Missing pin '+mapping);
});

test('CCNA tagged exam bank does not leak to any study pool and keeps previous card reviews', () => {
  const dom=new JSDOM(html,{
    url:'http://localhost/apps/ccna/legacy.html',runScripts:'dangerously',
    beforeParse(window){
      window.CcnaVocabulary=vocabulary;window.CcnaLabs=labs;
      window.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});
      window.scrollTo=()=>{};
    }
  });
  try{
    const state=JSON.parse(dom.window.eval(`(function(){
      const section=getSection("interfejsy-sieciowe-i-okablowanie");
      const q=getRawSubsectionQuestions(section,"skretka-utp-i-przewody")
        .find(item=>item.id==="anki-interfaces-cables-ocg-3017");
      const key=cardKey(q);
      const saved=validateReview({schema:1,cards:{[key]:{...defaultCard(),reviews:7,updatedAt:1}},orders:{}});
      const study=getSectionQuestions(section),exam=getSectionExamPool(section);
      const fake={id:"cert-only",title:"Cert",type:"learning-section",subsections:[
        {id:"import",title:"Import",type:"learning-subsection",
         questions:[{id:"source-only",examQuestion:true,question:"Q",answer:"A",answers:["A","B","C","D"],correct:0}]},
        {id:"exam",title:"Egzamin",type:"section-exam"}]};
      return JSON.stringify({
        stored:saved.cards[key]?.reviews,
        subsection:getSubsectionQuestions(section,"skretka-utp-i-przewody").some(item=>item.id===q.id),
        section:study.some(item=>item.id===q.id),course:getAllAdministrativeQuestions().some(item=>item.id===q.id),
        exam:exam.filter(item=>item.id===q.id).length,
        other:study.filter(item=>item.examQuestion===true).length,
        count:exam.length,quiz:getSectionExamOnlyQuestions(section).length,
        fakeStudy:getSectionQuestions(fake).length,fakeExam:getSectionExamPool(fake).length,
        fakeGate:isSectionReady(fake)
      });
    })()`));
    assert.equal(state.stored,7,'Previously rated flashcard remains preserved');
    assert.equal(state.subsection,false);
    assert.equal(state.section,false);
    assert.equal(state.course,false);
    assert.equal(state.exam,1);
    assert.equal(state.other,0);
    assert.equal(state.count,143);
    assert.equal(state.quiz,5);
    assert.equal(state.fakeStudy,0);
    assert.equal(state.fakeExam,1);
    assert.equal(state.fakeGate,true,'Certification-only section cannot be locked by empty flashcards');
  }finally{dom.window.close();}
});

// WIEDORA-CHANGE: WD-20261104-WIE-161-DUPLEX-QUESTION-01 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
test('Duplex Fiber Link question works without a referenced video', () => {
  const { section } = inspectCourse();
  const fiber = topic(section, FIBER);
  const card = fiber.questions.find(q => q.id === 'fiber-day02-03');
  assert.ok(card, 'Existing flashcard ID must remain stable for saved progress');
  assert.match(card.question, /dwuwłóknowym łączu światłowodowym/);
  assert.match(card.question, /Tx i Rx urządzeń A i B/);
  assert.doesNotMatch(card.question, /film|nagrani|pokazan/i);
  assert.equal(card.answer, 'Tx A → Rx B oraz Tx B → Rx A.');
  assert.equal(card.answers.filter(a => a === card.answer).length, 1);
  assert.match(fiber.note, /W typowym <strong>Duplex Fiber Link<\/strong>/);
  assert.doesNotMatch(fiber.note, /Film pokazuje typowy/);
});

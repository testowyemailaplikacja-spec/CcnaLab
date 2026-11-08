// WIEDORA-CHANGE: WD-20261101-WIE-161-CCNA-GATING-01 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '../apps/ccna/legacy.html'), 'utf8');
function sourceBetween(begin, end) {
  const start = html.indexOf(begin), stop = html.indexOf(end, start);
  assert.ok(start !== -1 && stop > start, 'Expected CCNA code to exist: ' + begin);
  return html.slice(start, stop);
}
const eligibilityCode = sourceBetween('    function flashcardsClearedForToday(', '    function questionsDoneKey(');
const advanceCode = sourceBetween('    function canAdvanceTest(', '    function renderTest()');

function eligibility(cards, dayEnd) {
  return new Function('getSubsectionQuestions', 'getCard', 'endOfToday',
    eligibilityCode + '\nreturn flashcardsClearedForToday;')(
      section => section.questions, question => cards[question.id], () => dayEnd);
}
const canAdvance = new Function(advanceCode + '\nreturn canAdvanceTest;')();

test('one manually disabled question never blocks completed mandatory CCNA flashcards', () => {
  const questions = Array.from({length: 12}, (_, index) => ({id: index}));
  const cards = Object.fromEntries(questions.map(q => [q.id, {status:'active', reviews:1, due:2000}]));
  cards[11] = {status:'manual', reviews:0, due:0};
  assert.equal(eligibility(cards, 1000)({questions}, {}), true);
});

test('active new or due cards still block the mandatory stage', () => {
  const questions = [{id:1}, {id:2}];
  const cards = {1:{status:'manual',reviews:0,due:0},2:{status:'active',reviews:0,due:0}};
  assert.equal(eligibility(cards, 1000)({questions}, {}), false);
  cards[2] = {status:'active',reviews:1,due:1000};
  assert.equal(eligibility(cards, 1000)({questions}, {}), false);
});

test('disabling every question cannot bypass the mandatory flashcard stage', () => {
  const questions = [{id:1}];
  assert.equal(eligibility({1:{status:'manual',reviews:0,due:0}},1000)({questions},{}), false);
  assert.equal(eligibility({},1000)({questions:[]},{}), true);
});

test('mastered cards remain complete while manual exclusions stay distinct', () => {
  const questions = [{id:1},{id:2}];
  const cards = {1:{status:'mastered',reviews:2,due:0},2:{status:'active',reviews:1,due:2000}};
  assert.equal(eligibility(cards,1000)({questions},{}), true);
});

test('Next question is disabled and guarded until a real answer is selected', () => {
  assert.equal(canAdvance({index:0,answers:[null]}), false);
  assert.equal(canAdvance({index:0,answers:[undefined]}), false);
  assert.equal(canAdvance({index:0,answers:[0]}), true);
  assert.equal(canAdvance({index:0,answers:[3]}), true);
  assert.match(html, /id="nextQuestion" type="button" \$\{canAdvanceTest\(testState\)\?"":"disabled"\}/);
  assert.match(html, /onclick=\(\)=>\{if\(!canAdvanceTest\(testState\)\)return;/);
});

test('fixed Polish question wording preserves the original source question bank', () => {
  assert.match(html, /Jakiego przewodu używa się klasycznie między dwoma przełącznikami/);
  assert.match(html, /Jaki mechanizm wykrywania kolizji stosowano w klasycznym Ethernecie half-duplex/);
  assert.match(html, /Które pary styków łączy klasyczny przewód krosowany/);
});

test('optional section flashcards use an independent scope and do not inherit subsection review flags', () => {
  const adapter = fs.readFileSync(path.join(__dirname, '../apps/ccna/study-adapter.js'), 'utf8');
  assert.match(adapter, /view\?\.type === 'section-flashcards' \? `section-flashcards:\$\{view\.sectionId\}`/);
  assert.match(adapter, /source\.studyOnly \|\| returnView\?\.type === 'section-flashcards' \|\| returnView\?\.type === 'section-learning'/);
  assert.match(adapter, /\? `section-flashcards:\$\{returnView\.sectionId\}::\$\{sourceId\}`/);
  assert.match(adapter, /\? `section-learning:\$\{returnView\.sectionId\}::\$\{sourceId\}`/);
  assert.match(html, /renderStudyHome\(getSectionQuestions\(section\),.*type:"section-flashcards",sectionId/);
  assert.match(html, /view\.type === "section-study" \|\| view\.type === "section-flashcards"/);
});

test('iframe and PWA refresh both the legacy code and the section review adapter', () => {
  const index = fs.readFileSync(path.join(__dirname, '../apps/ccna/index.html'), 'utf8');
  const serviceWorker = fs.readFileSync(path.join(__dirname, '../apps/ccna/sw.js'), 'utf8');
  assert.match(index, /legacy\.html\?v=20261101-ccna-qualification-1/);
  assert.match(serviceWorker, /legacy\.html\?v=20261101-ccna-qualification-1/);
  assert.match(index, /study-frame\.js\?v=20261102-section-review-3/);
  assert.match(serviceWorker, /study-frame\.js\?v=20261102-section-review-3/);
  assert.match(serviceWorker, /study-adapter\.js\?v=20261102-section-review-3/);
});

test('section flashcards use independently namespaced IDs at the actual shared-mode mount', () => {
  const adapter = fs.readFileSync(path.join(__dirname, '../apps/ccna/study-adapter.js'), 'utf8');
  const calls = [];
  const fakeWindow = {
    parent:{location:{href:'https://example.test/apps/ccna/'},history:{state:null,replaceState() {}}},
    PortalStudyMode:{mount(target, options) { calls.push(options); return {}; }},
    renderLatinSection() {}
  };
  const fakeUrl = class {
    constructor() { this.pathname = '/apps/ccna/'; this.search = ''; this.searchParams = {set(){},delete(){},get(){return null;}}; }
  };
  new Function('window','stopTimer','moduleTitle','moduleContent','cardKey',
    'displayQuestionText','correctAnswer','getCard','returnToView','URL',
    'testState','reviewSession', adapter)(
    fakeWindow,()=>{},{},{},q=>q.id,q=>q.question,q=>q.answer,
    ()=>({status:'manual'}),()=>{},fakeUrl,null,null
  );
  const question = [{id:'q-1', question:'Pytanie', answer:'Odpowiedź', answers:['Odpowiedź','Błędna']}];
  fakeWindow.startReview(question,'Fiszki',{type:'section-flashcards',sectionId:'section-1'});
  fakeWindow.startReview(question,'Tryb nauki',{type:'section-learning',sectionId:'section-1'});
  assert.equal(calls[0].scope, 'section-flashcards:section-1');
  assert.equal(calls[0].questions[0].id, 'section-flashcards:section-1::q-1');
  assert.equal(calls[1].questions[0].id, 'section-learning:section-1::q-1');
  assert.equal(calls[1].scope, 'section-learning:section-1');
  assert.equal(calls[1].fixedMode, 'choice');
  assert.equal(calls[0].fixedMode, undefined);
  assert.equal(calls[0].seedCard(calls[0].questions[0]).enabled, true);
  assert.equal(calls[1].seedCard(calls[1].questions[0]).enabled, true);
});

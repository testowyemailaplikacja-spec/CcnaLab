// WIEDORA-CHANGE: WD-20261101-WIE-005-NATIVE-REGRESSION-11 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
// CCNA-C01-20261101-QUESTION-POOL | AUTHOR: ChatGPT / GPT-6
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { restoreQuestionPools } = require('../apps/ccna/question-pool-visibility.js');
const vocabulary = require('../apps/ccna/data/terminology.js');
const labs = require('../apps/ccna/data/jitl-labs.js');

test('every imported CCNA card enters learning pools, without changing IDs or question objects', () => {
  const html = fs.readFileSync(path.join(__dirname, '../apps/ccna/legacy.html'), 'utf8');
  const dom = new JSDOM(html, {
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
    const w = dom.window;
    const sections = w.getLearningSections();
    const first = w.getSection('interfejsy-sieciowe-i-okablowanie');
    assert.ok(first, 'Day 02 section exists');
    const beforeSection = w.getSectionQuestions(first);
    const rawTeaching = first.subsections.filter(sub => sub.type === 'learning-subsection')
      .flatMap(sub => w.getRawSubsectionQuestions(first, sub.id));
    assert.equal(rawTeaching.length, 138, 'Day 02 raw teaching bank is still present');
    assert.ok(beforeSection.length < rawTeaching.length, 'Regression fixture confirms import filter existed');
    const saved = rawTeaching.map(q => ({ id:q.id, progressKey:q.progressKey, question:q.question, answer:q.answer, answers:[...q.answers] }));
    assert.equal(restoreQuestionPools(w), true);
    assert.equal(restoreQuestionPools(w), true, 'Reapplying the adapter is safe');
    assert.equal(w.getSectionQuestions(first).length, 138, 'All Day 02 teaching questions restored');
    assert.equal(w.getSectionExamPool(first).length, 143, 'Section exam retains 138 + 5 mandatory cards');
    assert.equal(w.getContentSubsections(first).length, 7, 'All six theory topics and lab remain in course navigation');
    assert.ok(w.CCNA_QUESTION_POOL_VISIBILITY.totalLearningQuestions >= 3000,
      'Whole-course study bank is no longer capped at filtered questions');
    for (const section of sections) {
      for (const subsection of section.subsections || []) {
        if (subsection.type !== 'learning-subsection') continue;
        const raw = w.getRawSubsectionQuestions(section, subsection.id).filter(q => !q.videoQuiz);
        const actual = w.getSubsectionQuestions(section, subsection.id);
        assert.deepEqual(actual.map(q => q.id), raw.map(q => q.id), subsection.id + ' study card IDs');
      }
    }
    for (const item of saved) {
      const live = w.getSubsectionQuestions(first,
        first.subsections.find(sub => sub.questions?.some(q => q.id === item.id)).id)
        .find(q => q.id === item.id);
      assert.equal(live.question, item.question, 'Preserve original question ' + item.id);
      assert.equal(live.answer, item.answer, 'Preserve correct answer ' + item.id);
      assert.deepEqual(Array.from(live.answers), item.answers, 'Preserve answer options ' + item.id);
      assert.equal(live.progressKey, item.progressKey, 'Preserve progress ' + item.id);
    }
  } finally { dom.window.close(); }
});

test('five video quiz questions remain exclusive to Day 02 section exam, with authored note grounding', () => {
  const html = fs.readFileSync(path.join(__dirname, '../apps/ccna/legacy.html'), 'utf8');
  const dom = new JSDOM(html, {
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
    const w = dom.window;
    const section = w.getSection('interfejsy-sieciowe-i-okablowanie');
    const quiz = section.subsections.find(sub => sub.type === 'section-exam').questions;
    assert.equal(quiz.length, 5);
    assert.deepEqual(Array.from(quiz, q => q.id), [
      'cables-day02-05', 'fiber-day02-04', 'fiber-day02-05',
      'day02-quiz-final-04', 'fiber-day02-06'
    ]);
    assert.ok(quiz.every(q => q.videoQuiz && q.examQuestion));
    assert.equal(restoreQuestionPools(w), true);
    const quizIds = new Set(quiz.map(q => q.id));
    assert.equal(w.getSectionExamPool(section).filter(q => quizIds.has(q.id)).length, 5);
    assert.equal(w.getSectionQuestions(section).filter(q => quizIds.has(q.id)).length, 0);
    assert.equal(w.getAllAdministrativeQuestions().filter(q => quizIds.has(q.id)).length, 0);
    for (const sub of section.subsections.filter(sub => sub.type === 'learning-subsection')) {
      assert.equal(w.getSubsectionQuestions(section, sub.id).filter(q => quizIds.has(q.id)).length, 0);
    }

    const audits = ['11','12','13','14','15','16'].map(n => w['CCNA_DAY02_' + n + '_NOTE_AUDIT']);
    assert.deepEqual(audits.map(a => a.cards), [33,41,12,34,12,6]);
    assert.ok(audits.every(a => a.uncoveredIds.length === 0 && (!a.staleIds || a.staleIds.length === 0)),
      'Each of 138 teaching questions maps to an authored note section');
    const finalAudit = w.CCNA_DAY02_FINAL_QUIZ_AUDIT;
    assert.equal(finalAudit.actual, 5);
    assert.deepEqual(Array.from(finalAudit.misplaced), []);
  } finally { dom.window.close(); }
});

test('CCNA parent loads visibility correction before router, with updated offline asset', () => {
  const index = fs.readFileSync(path.join(__dirname, '../apps/ccna/index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(__dirname, '../apps/ccna/sw.js'), 'utf8');
  const asset = './question-pool-visibility.js?v=20261101-question-pool-restore-1';
  assert.ok(index.includes(asset));
  assert.ok(sw.includes(asset.replace('./', '"./').slice(1)) || sw.includes(asset));
  assert.ok(index.indexOf(asset) < index.indexOf('./router.js?v='));
  const generation=sw.match(/const CACHE_NAME=([^;]+);/)?.[1];
  assert.ok(generation,'offline cache has a named generation');
  assert.match(require('node:vm').runInNewContext(generation,{APP_ID:'ccna'}),/^portal-offline-ccna-\d{8}-[a-z0-9-]+$/);
  const cacheDate=require('node:vm').runInNewContext(generation,{APP_ID:'ccna'}).match(/-(\d{8})-/)[1];
  assert.ok(cacheDate>=asset.match(/\?v=(\d{8})/)[1],'cache generation must cover the restored visibility asset');
});

test('parent iframe adapter restores pools and repaints only the already visible landing', () => {
  const source = fs.readFileSync(path.join(__dirname, '../apps/ccna/question-pool-visibility.js'), 'utf8');
  for (const showingHome of [true, false]) {
    let renders = 0;
    const section = { type:'learning-section', subsections:[
      { id:'content', type:'learning-subsection', questions:[{ id:'ordinary' },{ id:'import', examQuestion:true }] },
      { id:'exam', type:'section-exam', questions:[{ id:'quiz', videoQuiz:true, examQuestion:true }] }
    ] };
    const courseDocument = { getElementById: id => showingHome && id === 'adminSectionGrid' ? {} : null };
    const courseWindow = {
      document:courseDocument,
      getLearningSections:() => [section],
      getRawSubsectionQuestions:(_,id) => section.subsections.find(sub=>sub.id===id).questions.map(q=>({...q})),
      getSubsectionQuestions:(_,id) => section.subsections.find(sub=>sub.id===id).questions.filter(q=>!q.examQuestion),
      getContentSubsections:() => [],
      isExamOnlySubsection:() => true,
      renderAdministrativeHome:() => {renders++;}
    };
    const frame = { contentWindow:courseWindow, contentDocument:{readyState:'complete'}, addEventListener:()=>{} };
    new Function('document', source)({getElementById: id=>id==='appFrame'?frame:null});
    assert.equal(courseWindow.getSubsectionQuestions(section,'content').length,2);
    assert.equal(courseWindow.CCNA_QUESTION_POOL_VISIBILITY.videoQuizCount,1);
    assert.equal(renders,showingHome ? 1 : 0,'Refresh only the current homepage');
  }
});

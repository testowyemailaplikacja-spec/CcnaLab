// WIEDORA-CHANGE: WD-20261106-WIE-161-SECTION1-ANSWER-QUALITY-01 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const quality = require('../apps/ccna/answer-quality.js');
const pools = require('../apps/ccna/question-pool-visibility.js');
const vocabulary = require('../apps/ccna/data/terminology.js');
const labs = require('../apps/ccna/data/jitl-labs.js');

function boot() {
  const html = fs.readFileSync(path.join(__dirname, '../apps/ccna/legacy.html'), 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://example.test/apps/ccna/legacy.html',
    runScripts: 'dangerously',
    beforeParse(win) {
      win.CcnaVocabulary = vocabulary;
      win.CcnaLabs = labs;
      win.matchMedia = () => ({ matches: false, addListener() {}, addEventListener() {} });
      win.scrollTo = () => {};
    }
  });
  const w = dom.window;
  assert.ok(w.getSection(quality.SECTION_ID), 'section 1 is present');
  assert.equal(pools.restoreQuestionPools(w), true, 'original pool patch is installed first');
  assert.equal(quality.install(w), true);
  return { dom, w, section: w.getSection(quality.SECTION_ID) };
}

test('section 1: all A/B and ABCD questions have distinct, graded choices', () => {
  const { dom, w, section } = boot();
  try {
    const report = quality.audit(section);
    const archiveApplied = w.CCNA_DAY02_QUALITY_AUDIT?.applied === true;
    assert.equal(report.total, archiveApplied ? 135 : 143, 'the original bank or the separately reviewed PR #124 archive');
    assert.deepEqual([...report.badChoices], [], 'every ABCD card has 4 meaningfully distinct options');
    assert.deepEqual([...report.invalidGrading], [], 'ABCD expected index matches the original correct answer');
    assert.deepEqual([...report.duplicatedIds], [], 'IDs are unique across the entire first section');

    const teaching = section.subsections.filter(sub => sub.type === 'learning-subsection');
    assert.equal(teaching.length, 6);
    const studyCards = teaching.flatMap(sub => sub.questions || []);
    assert.equal(studyCards.length, archiveApplied ? 130 : 138);

    for (const q of studyCards) {
      const correct = quality.correctAnswer(q);
      const original = q.answers || q.options || [];
      for (const random of [0, .15, .35, .51, .7, .99]) {
        const ab = quality.makeTwoChoices(q, () => random);
        assert.ok(ab, q.id + ' has a usable same-question distractor');
        assert.equal(ab.answers.length, 2, q.id);
        assert.equal(ab.answers[ab.correct], correct, q.id);
        const wrong = ab.answers[1 - ab.correct];
        assert.ok(original.includes(wrong), q.id + ' wrong option belongs to the same card');
        assert.notEqual(quality.meaningKey(correct), quality.meaningKey(wrong), q.id + ' has no equivalent A/B answers');
        assert.equal(ab.id, q.id, q.id + ' preserves its identity');
        assert.equal(ab.answer, q.answer, q.id + ' preserves scoring text');
      }
    }

    assert.equal(w.CCNA_SECTION1_ANSWER_AUDIT?.installed, true);
    assert.equal(w.CCNA_SECTION1_ANSWER_AUDIT?.revised.length, Object.keys(quality.PROMPTS).length);
    // Answer content (not only prompts) must be independent of video/quiz context.
    assert.deepEqual([...w.CCNA_SECTION1_ANSWER_AUDIT?.revisedAnswers].sort(),
      ['fiber-day02-05', 'fiber-day02-07', 'lu-17', 'medium-day02-01', 'medium-day02-03']);
    for (const card of quality.relatedCards(section)) {
      for (const option of card.answers || []) {
        assert.doesNotMatch(option, /\bDay\s*0?2\b|\bfilm(?:ie|u|em)\b|\bquiz(?:ie|u|u)\b|\bz\s+tabeli\s+lekcji\b/i,
          card.id + ' no film or quiz context in answer alternatives');
      }
    }
  } finally { dom.window.close(); }
});

test('SFP, IEEE, connector spellings and suffix punctuation are equivalent for A/B', () => {
  const key = quality.meaningKey;
  assert.equal(key('Small Form-Factor Pluggable.'), key('Small Form-Factor Pluggable (SFP)'));
  assert.equal(key('IEEE 802.3.'), key('802.3'));
  assert.equal(key('IEEE 802.3z.'), key('802.3z'));
  assert.equal(key('RJ-45'), key('RJ45'));
  assert.equal(key('Gigabit Interface Converter (GBIC)'), key('Gigabit Interface Converter'));
  assert.notEqual(key('12,5 MB/s.'), key('1,25 MB/s.'), 'decimal values must stay distinct');
  assert.notEqual(key('1–2'), key('12'), 'pin ranges must not equal a number');
  const q = {
    id: 'sfp-regression', answer: 'Small Form-Factor Pluggable.',
    answers: ['Small Form-Factor Pluggable.', 'Small Form-Factor Pluggable (SFP)',
      'Single Fiber Protocol.', 'Switch Fabric Port.'], correct: 0
  };
  for (const random of [0, .25, .5, .75, .99]) {
    const ab = quality.makeTwoChoices(q, () => random);
    assert.ok(ab);
    assert.equal(ab.answers.length, 2);
    assert.ok(!ab.answers.includes('Small Form-Factor Pluggable (SFP)'));
  }
});

test('edits remove references to the lecture without changing scoring, IDs or progress', () => {
  const { dom, w, section } = boot();
  try {
    const questions = quality.relatedCards(section);
    const audit = quality.audit(section);
    // Cards already marked for archive by PR #124 remain until that PR is accepted.
    const scheduledForArchival = new Set([
      'fiber-day02-07', 'fiber-day02-08',
      'anki-interfaces-cables-jitl-1571562236759',
      'anki-interfaces-cables-jitl-1571562296950'
    ]);
    assert.ok(audit.sourceReferences.every(id => scheduledForArchival.has(id)),
      'source references remain only in cards archived by PR #124: ' + audit.sourceReferences.join(', '));
    for (const [id, prompt] of Object.entries(quality.PROMPTS)) {
      const card = questions.find(q => q.id === id);
      assert.ok(card, id + ' exists');
      assert.equal(card.question, prompt);
      assert.equal(card.questionPl, prompt);
    }
    assert.equal(quality.audit(section).total, questions.length);
    assert.ok(!quality.PROMPTS['anki-interfaces-cables-ocg-2010'],
      'SFP abbreviation card is not overwritten or duplicated');
  } finally { dom.window.close(); }
});

test('six notes retain CCNA topic content without learner-facing Day labels', () => {
  const { dom, section } = boot();
  try {
    const notes = section.subsections.filter(sub => sub.type === 'learning-subsection');
    assert.equal(notes.length, 6);
    for (const sub of notes) {
      const html = String(sub.note || '');
      assert.ok(html.includes('data-ccna-topic='), sub.id + ' still maps technical explanations');
      assert.doesNotMatch(html, /\bDay\s*0?2\b|\bz dnia\s*0?2\b/i, sub.id + ' no Day labels');
      assert.ok(html.includes('<strong>') && html.includes('</strong>'), sub.id + ' preserves markup');
    }
  } finally { dom.window.close(); }
});

test('offline and HTML asset versions agree', () => {
  const index = fs.readFileSync(path.join(__dirname, '../apps/ccna/index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(__dirname, '../apps/ccna/sw.js'), 'utf8');
  const asset = './answer-quality.js?v=20261106-section1-answer-quality-1';
  assert.ok(index.includes(asset));
  assert.ok(sw.includes(asset));
  assert.match(sw, /CACHE_NAME=.*20261108-ccna-modules-day02-quality-2/);
});

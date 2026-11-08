// WIEDORA-CHANGE: WD-20261031-WIE-005-NATIVE-REGRESSION-09 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const vocabulary = require('../apps/ccna/data/terminology.js');
const html = fs.readFileSync(path.join(__dirname, '../apps/ccna/legacy.html'), 'utf8');
function load(language, includeImport = false) {
  const source = includeImport ? html.replace('// CCNA v1.17.0 —',
    'window.__ccnaBeforeMerge = JSON.parse(JSON.stringify(ADMIN_DATA));\n    // CCNA v1.17.0 —') : html;
  const dom = new JSDOM(source, {
    url: 'http://localhost/apps/ccna/legacy.html', runScripts: 'dangerously',
    beforeParse(window) {
      window.CcnaVocabulary = language;
      window.matchMedia = () => ({ matches: false, addListener() {}, addEventListener() {} });
      window.scrollTo = () => {};
    }
  });
  try {
    const data = JSON.parse(dom.window.eval('JSON.stringify(ADMIN_DATA)'));
    return includeImport ? {
      data,
      beforeMerge: JSON.parse(JSON.stringify(dom.window.__ccnaBeforeMerge)),
      aliases: JSON.parse(dom.window.eval('JSON.stringify(QUESTION_KEY_ALIASES)')),
      imported: JSON.parse(dom.window.eval('JSON.stringify(IMPORTED_ANKI_SECTIONS)')).flatMap(group => group.questions)
    } : data;
  }
  finally { dom.window.close(); }
}
const protectedFields = new Set(['id', 'type', 'source', 'sourceDeck', 'questionEn', 'answerEn', 'correct', 'correctIndex', 'videoId', 'chapter', 'examQuestion', 'certificationSource', 'trainer', 'courseTrainer', 'ipv4Trainer']);
function metadata(value, location = '', result = []) {
  if (!value || typeof value !== 'object') return result;
  for (const [key, child] of Object.entries(value)) {
    const at = location + '/' + key;
    if (protectedFields.has(key)) result.push([at, child]);
    else if (child && typeof child === 'object') metadata(child, at, result);
  }
  return result;
}
const topics = data => data.sections.flatMap(part => part.sections || []).flatMap(section => section.subsections || []);
function answerIssues(data) {
  const duplicateChoices = new Set();
  for (const topic of topics(data)) for (const question of topic.questions || []) {
    const options = question.answers || question.options || [];
    if (!options.length) continue;
    const correct = question.correct ?? question.correctIndex ?? options.indexOf(question.answer);
    assert.equal(options[correct], question.answer, 'Correct answer: ' + question.id);
    if (new Set(options).size !== options.length) duplicateChoices.add(question.id);
  }
  return duplicateChoices;
}
test('CCNA vocabulary preserves course structure, question placement, English originals and answer validity', () => {
  const before = load({ course() {} });
  const after = load(vocabulary);
  assert.deepEqual(metadata(after), metadata(before));
  assert.equal(topics(after).length, topics(before).length);
  const archived = require('../apps/ccna/data/archived/day02-topology-and-out-of-scope-questions.json');
  assert.equal(archived.removedSubsection.originalFullRecord.id, 'topologia-laboratorium');
  assert.ok(!topics(after).some(topic => topic.id === 'topologia-laboratorium'));
  assert.ok(topics(after).length + 1 >= 171, 'Historical inventory includes the explicitly archived subsection');
  assert.ok(topics(after).reduce((n, topic) => n + (topic.questions?.length || 0), 0) >= 3403);
  const oldDuplicates = answerIssues(before);
  for (const id of answerIssues(after)) assert.ok(oldDuplicates.has(id), 'New duplicate answer choices: ' + id);
  const once = JSON.stringify(after);
  vocabulary.course(after);
  assert.equal(JSON.stringify(after), once, 'Applying terminology again must not change the course');
  // Exam qualification must remain metadata, not part of the question title.
  const examQuestions = topics(after).flatMap(topic => topic.questions || []).filter(q => q.examQuestion);
  assert.ok(examQuestions.length > 2000, 'Imported exam questions are present across CCNA: found '+examQuestions.length);
  for (const question of examQuestions) {
    assert.ok(!/^Pytanie egzaminacyjne\s*[•—:-]/i.test(question.question),
      'Exam label leaked into question text: ' + question.id);
    assert.ok(!/^[A-Z0-9/-]{2,18}$/.test(question.question),
      'Bare keyword rather than full prompt: ' + question.id);
    assert.ok(question.question.trim().length >= 10, 'Empty exam prompt: ' + question.id);
  }
  const gbic = examQuestions.find(q => q.id === 'anki-interfaces-cables-ocg-2009');
  assert.ok(gbic, 'GBIC question exists');
  assert.equal(gbic.question, 'Rozwiń skrót GBIC.');
  assert.equal(gbic.answer, 'Gigabit Interface Converter (GBIC)');
  assert.equal((gbic.answers || [])[gbic.correct], gbic.answer);
});

test('CCNA imported cards are complete prompts; technical source wording is preserved', () => {
  const examples = [
    ['GBIC', 'Rozwiń skrót GBIC.'],
    ['What does LAN stand for?', 'Rozwiń skrót LAN.'],
    ['Class A range', 'Jaki jest zakres adresów IPv4 klasy A?'],
    ['1000BASE-LX maximum cable length:', 'Jaka jest maksymalna długość łącza 1000BASE-LX?'],
    ['802.11ax max data rate:', 'Jaka jest maksymalna szybkość transmisji w standardzie 802.11ax?'],
    ['The messages sent by STP switches are called:', 'Jak nazywają się komunikaty wysyłane przez switche STP?']
  ];
  for (const [original, expected] of examples) {
    assert.equal(vocabulary.examPrompt(original), expected, original);
  }
  assert.equal(vocabulary.examPrompt('EoMPLS', 'Ethernet over MPLS (EoMPLS)'), 'Rozwiń skrót EoMPLS.');
  assert.equal(vocabulary.examPrompt('What is the purpose of an SVI?'), 'What is the purpose of an SVI?');
});

test('every imported CCNA card has exam metadata, including standalone topics and curated lessons', () => {
  const data = load(vocabulary);
  for (const question of topics(data).flatMap(topic => topic.questions || [])) {
    if (question.source !== 'jitl' && question.source !== 'ocg') continue;
    assert.equal(question.examQuestion, true, 'Unmarked imported exam card: ' + question.id);
    assert.equal(question.certificationSource, question.source === 'ocg' ? 'Official Cert Guide' : "Jeremy's IT Lab");
  }
});

test('CCNA consolidation preserves distinct cards, original prompts, answer indices and explicit historical aliases', () => {
  const { data, beforeMerge, imported, aliases } = load(vocabulary, true);
  assert.equal(imported.length, 2926, 'Protected source import changed');
  const questions = new Map(topics(data).flatMap(topic => topic.questions || []).map(question => [question.id, question]));
  const previous = new Map(topics(beforeMerge).flatMap(topic => topic.questions || []).map(question => [question.id, question]));
  for (const original of imported) {
    if (questions.has(original.id)) continue;
    const alias = Object.entries(aliases).find(([key]) => key.endsWith('::' + original.id));
    assert.ok(alias, 'Source card was lost without an explicit progress alias: ' + original.id);
    assert.ok(questions.has(alias[1].split('::').at(-1)), 'Historical alias target is missing: ' + original.id);
  }
  assert.equal(imported.filter(question => !previous.has(question.id)).length, 120,
    'Only the existing, explicitly aliased Day 19–24 duplicates may be absent');
  for (const original of previous.values()) {
    const question = questions.get(original.id);
    assert.ok(question, 'Distinct course card was lost during merging: ' + original.id);
    assert.equal(question.questionEn, original.questionEn, 'Original English prompt: ' + original.id);
    assert.equal(question.correct, original.correct, 'Original answer index: ' + original.id);
    assert.equal(question.progressKey, original.progressKey, 'Explicit progress key: ' + original.id);
  }
});

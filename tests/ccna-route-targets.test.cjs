// WIEDORA-CHANGE: WD-20261030-WIE-008-TARGETS-01 | TASK: WIE-008 | AUTHOR: Codex / GPT-6 (full version unknown)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(path.join(__dirname, '../apps/ccna/router.js'), 'utf8');

function boot(route, { ready = true } = {}) {
  const dom = new JSDOM('<meta name="robots"><link rel="canonical"><meta property="og:url"><iframe id="appFrame"></iframe>', {
    url: 'https://develop--constant-app.netlify.app/apps/ccna/' + route,
    runScripts: 'outside-only'
  });
  const frame = dom.window.document.getElementById('appFrame'), w = frame.contentWindow, calls = [];
  const section = { id: 'section-1', type: 'learning-section', subsections: [
    { id: 'topic-1', type: 'learning-subsection' }, { id: 'exam-1', type: 'section-exam' }
  ] };
  const part = { id: 'part-1', type: 'part', sections: [section] };
  const other = { id: 'section-2', type: 'learning-section', subsections: [{ id: 'topic-2', type: 'learning-subsection' }] };
  const api = {
    getPart: id => id === part.id ? part : undefined,
    getSection: id => [part, section, other].find(item => item.id === id),
    getSubsection: (s, id) => s?.subsections?.find(item => item.id === id)
  };
  if (ready) Object.assign(w, api);
  w.document.body.innerHTML = '<div id="homePage"></div><div id="modulePage" hidden></div>';
  for (const name of ['showHome', 'renderPart', 'renderLearningSection', 'renderSubsection', 'renderSectionStudy', 'renderSectionLearningMode']) {
    w[name] = (...args) => { calls.push([name, ...args]); };
  }
  dom.window.localStorage.setItem('ccna-progress-v1', '{"keep":true}');
  dom.window.eval(source);
  frame.dispatchEvent(new dom.window.Event('load'));
  return { dom, w, frame, calls, ready: () => Object.assign(w, api), close: () => dom.window.close() };
}

for (const route of [
  'czesc/missing/?tryb=study', 'sekcja/missing/', 'sekcja/part-1/',
  'sekcja/section-1/temat/missing/', 'sekcja/section-1/temat/topic-2/',
  'sekcja/section-1/temat/exam-1/', 'czesc/part-1/extra/', 'czesc/%ZZ/'
]) {
  test(`unknown CCNA target returns to catalogue without retaining phantom URL: ${route}`, () => {
    const r = boot(route);
    try {
      assert.deepEqual(r.calls, [['showHome']]);
      assert.equal(r.dom.window.location.pathname, '/apps/ccna/');
      assert.equal(r.dom.window.location.search, '');
      assert.equal(r.dom.window.document.querySelector('link[rel="canonical"]').href, 'https://constant-app.netlify.app/apps/ccna/');
      assert.equal(r.dom.window.document.title, 'Akademia cyberbezpieczeństwa — CCNA');
      assert.equal(r.dom.window.localStorage.getItem('ccna-progress-v1'), '{"keep":true}');
    } finally { r.close(); }
  });
}

for (const [route, expected] of [
  ['czesc/part-1/', ['renderPart', 'part-1']],
  ['sekcja/section-1/', ['renderLearningSection', 'section-1']],
  ['sekcja/section-1/?tryb=flashcards', ['renderSectionStudy', 'section-1']],
  ['sekcja/section-1/temat/topic-1/?tryb=flashcards&study=1', ['renderSubsection', 'section-1', 'topic-1', 'study']]
]) {
  test(`valid CCNA bookmark keeps its target and study mode: ${route}`, () => {
    const r = boot(route);
    try {
      assert.deepEqual(r.calls, [expected]);
      assert.equal(r.dom.window.location.pathname + r.dom.window.location.search, '/apps/ccna/' + route);
    } finally { r.close(); }
  });
}

test('CCNA does not discard a valid bookmark while iframe data API is not ready', () => {
  const r = boot('czesc/part-1/', { ready: false });
  try {
    assert.deepEqual(r.calls, []);
    assert.equal(r.dom.window.location.pathname, '/apps/ccna/czesc/part-1/');
    r.ready();
    r.dom.window.dispatchEvent(new r.dom.window.Event('portal-study-ready'));
    assert.deepEqual(r.calls, [['renderPart', 'part-1']]);
  } finally { r.close(); }
});

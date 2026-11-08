// WIEDORA-CHANGE: WD-20261031-WIE-161-CCNA-SOURCE-CLEANUP-01 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const bugfix = fs.readFileSync(path.join(root, 'apps/ccna/bug-fixes.js'), 'utf8');
const shell = fs.readFileSync(path.join(root, 'apps/ccna/index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'apps/ccna/sw.js'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20261031185500_auto_delete_verified_bug_reports.sql'), 'utf8');
const start = bugfix.indexOf('  function hideEmptyQuestionBadges(');
const end = bugfix.indexOf('  function addLaboratoriesLink(', start);
assert.ok(start >= 0 && end > start, 'source helpers exist');
const helpers = new Function(bugfix.slice(start, end) + '\nreturn {hideEmptyQuestionBadges, cleanLearnerNote, separateTheoryFromLaboratories, hideObsoleteLandingFooter, clarifyTheorySectionPath, refreshInitialTheoryRoute};')();

test('CCNA removes only zero-question chips from subsection cards', () => {
  const chips = ['0 pytań', '15 pytań', '0 aktywnych pytań'].map(textContent => ({
    textContent, removed: false, remove() { this.removed = true; }
  }));
  helpers.hideEmptyQuestionBadges({
    getElementById(id) { return id === 'subsectionGrid' ? {querySelectorAll: () => chips} : null; }
  });
  assert.deepEqual(chips.map(x => x.removed), [true, false, false]);
});

test('CCNA preserves actual lesson text while hiding source metadata and timecodes', () => {
  const provenance = { textContent: 'Podstawa: notatka z filmu', removed: false, remove() { this.removed = true; } };
  const lead = {innerHTML: '<strong>Cel:</strong> Opis standardu. Materiał: Jeremy\'s IT Lab, <em>Day 2</em> (00:00–09:11)'};
  const textNode = {nodeValue:'Piny przewodu [09:11–10:35] i kable (20:00–21:00).'};
  const note = {querySelectorAll(selector) {
    return selector === 'p, li, .note-source' ? [provenance] : selector === '.note-lead' ? [lead] : [];
  }};
  const doc = {
    getElementById(id) { return id === 'noteText' ? note : null; },
    createTreeWalker() { let given = false; return {nextNode() { if (given) return null; given = true; return textNode; }}; }
  };
  helpers.cleanLearnerNote(doc);
  assert.equal(provenance.removed, true);
  assert.match(lead.innerHTML, /Opis standardu/);
  assert.doesNotMatch(lead.innerHTML, /Materiał/);
  assert.equal(textNode.nodeValue, 'Piny przewodu i kable.');
});


test('CCNA hides main-source metadata in all notes while keeping learning content', () => {
  const mk = textContent => ({textContent, removed:false, remove(){this.removed=true;}});
  const main = mk("Źródło główne: Jeremy's IT Lab — Interfaces and Cables, Day 2.");
  const supplement = mk("Uzupełnienia spoza filmu: Official Cert Guide, oznaczone przy odpowiednich zagadnieniach.");
  const alternative = mk("Źródła główne: dokumentacja Cisco.");
  const english = mk("Main source: Jeremy's IT Lab.");
  const actualNote = mk("Full-Duplex pozwala jednocześnie nadawać i odbierać dane.");
  const lead = {innerHTML: '<strong>Cel:</strong> Poznać interfejsy. Źródło główne: <a href="https://example.test">Jeremy</a>'};
  const note = {querySelectorAll(selector) {
    return selector === 'p, li, .note-source'
      ? [main, supplement, alternative, english, actualNote]
      : selector === '.note-lead' ? [lead] : [];
  }};
  helpers.cleanLearnerNote({
    getElementById: id => id === 'noteText' ? note : null,
    createTreeWalker: () => ({nextNode: () => null})
  });
  assert.deepEqual([main.removed, supplement.removed, alternative.removed, english.removed], [true, true, true, true]);
  assert.equal(actualNote.removed, false);
  assert.match(lead.innerHTML, /Poznać interfejsy/);
  assert.doesNotMatch(lead.innerHTML, /Źródło główne|Jeremy/);
});

test('CCNA shell and offline cache load the same updated correction', () => {
  const match = shell.match(/bug-fixes\.js\?v=([a-zA-Z0-9-]+)/);
  assert.ok(match);
  assert.ok(sw.includes('bug-fixes.js?v=' + match[1]));
});

test('SQL trigger archives before deleting; requires status=fixed and full Git SHA', () => {
  assert.match(migration, /new\.status\s*=\s*'fixed'/i);
  assert.match(migration, /new\.fix_reference\s*~\s*'\^\[0-9a-f\]\{40\}\$'/);
  assert.ok(migration.indexOf('insert into public.agent_report_archive_memory') < migration.indexOf('delete from public.bug_reports'));
  assert.match(migration, /after update of status, fix_reference on public\.bug_reports/i);
});


// WIEDORA-CHANGE: WD-20261031-WIE-161-CCNA-REPORTS-02 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
test('CCNA dedicated laboratories are the only owners of lab metadata', () => {
  const theory = {id:'skretka-utp-i-przewody',title:'UTP Twisted-Pair Cabling',type:'learning-subsection',lab:{downloadUrl:'test.pkt'},labAuditKey:'test'};
  const lab = {id:'laboratorium-sieciowe',title:'Laboratorium — Packet Tracer',type:'learning-subsection',lab:{downloadUrl:'keep.pkt'}};
  const exam = {id:'exam',type:'section-exam',lab:{keep:true}};
  helpers.separateTheoryFromLaboratories({getLearningSections:() => [{subsections:[theory,lab,exam]}]});
  assert.equal('lab' in theory,false);
  assert.equal('labAuditKey' in theory,false);
  assert.equal(lab.lab.downloadUrl,'keep.pkt');
  assert.equal(exam.lab.keep,true);
});

test('CCNA footer is removed only when it matches the obsolete version label', () => {
  const footer = {textContent:'Jednoplikowa aplikacja do nauki cyberbezpieczeństwa i CCNA • wersja 1.18.0.',removed:false,remove(){this.removed=true;}};
  helpers.hideObsoleteLandingFooter({querySelector:selector => selector==='body > footer'?footer:null});
  assert.equal(footer.removed,true);
  const other = {textContent:'Copyright — informacja dostępności',removed:false,remove(){this.removed=true;}};
  helpers.hideObsoleteLandingFooter({querySelector:()=>other});
  assert.equal(other.removed,false);
});

test('CCNA theory section describes its independent laboratory subsections', () => {
  const intro={textContent:'Wybierz podsekcję. Ścieżka prowadzi od notatki przez fiszki do laboratorium.'};
  helpers.clarifyTheorySectionPath({querySelector:()=>intro});
  assert.match(intro.textContent,/Laboratoria są dostępne w osobnych podsekcjach/);
  assert.doesNotMatch(intro.textContent,/do laboratorium \(jeśli występuje\)/);
});

test('CCNA hides trailing source reference in a learning objective without deleting its goal', () => {
  const lead={innerHTML:"<strong>Cel podsekcji:</strong> Poznać skrętkę UTP. Źródło: Jeremy's IT Lab — Day 2 (09:11–20:24)."};
  const note={querySelectorAll: selector => selector==='p, li, .note-source'?[]:selector==='.note-lead'?[lead]:[]};
  helpers.cleanLearnerNote({
    getElementById: id => id==='noteText'?note:null,
    createTreeWalker:()=>({nextNode:()=>null})
  });
  assert.match(lead.innerHTML,/Poznać skrętkę UTP/);
  assert.doesNotMatch(lead.innerHTML,/Źródło:|Jeremy|09:11/);
});


test('CCNA fixes initial deep-linked theory view restored before adapter load', () => {
  const theory = {id:'skretka-utp-i-przewody',title:'UTP',type:'learning-subsection',lab:{downloadUrl:'old'}};
  const changed = helpers.separateTheoryFromLaboratories({getLearningSections:() => [{id:'interfejsy-sieciowe-i-okablowanie',subsections:[theory]}]});
  const renders=[];
  const doc={querySelector(selector) {
    if(selector==='#subsectionModeContent')return {};
    if(selector==='.section-mode-tabs [data-sub-mode].active')return {dataset:{subMode:'lab'}};
    return null;
  }};
  const frame={document:doc,renderSubsection(...args){renders.push(args)}};
  const route='/apps/ccna/sekcja/interfejsy-sieciowe-i-okablowanie/temat/skretka-utp-i-przewody/';
  helpers.refreshInitialTheoryRoute(frame,changed,route);
  assert.deepEqual(renders,[['interfejsy-sieciowe-i-okablowanie','skretka-utp-i-przewody','note']]);
  helpers.refreshInitialTheoryRoute(frame,changed,'/apps/ccna/sekcja/inny/temat/inny/');
  assert.equal(renders.length,1);
});


// WIEDORA-CHANGE: WD-20261031-WIE-161-CCNA-PROVENANCE-03 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
test('CCNA removes supplemental source labels and lecture references but keeps network facts', () => {
  const provenance={textContent:'Źródło dodatkowe: karta Official Cert Guide o Crosstalk',removed:false,remove(){this.removed=true;}};
  const educational={textContent:'Crosstalk to zakłócenia między parami w tym samym kablu',removed:false,remove(){this.removed=true;}};
  const noteNodes=[
    {nodeValue:'3. Crosstalk [uzupełnienie: Official Cert Guide] — zakłócenia między parami'},
    {nodeValue:'Typowy kabel UTP pokazany w lekcji składa się z 4 twisted pairs.'},
    {nodeValue:'Pytanie OCG o nazwę interferencji sprawdza rozumienie pojęcia.'}
  ];
  const note={querySelectorAll(selector){
    return selector==='p, li, .note-source'?[provenance,educational]:[];
  }};
  let cursor=0;
  helpers.cleanLearnerNote({
    getElementById:id=>id==='noteText'?note:null,
    createTreeWalker:()=>({nextNode:()=>noteNodes[cursor++]||null})
  });
  assert.equal(provenance.removed,true);
  assert.equal(educational.removed,false);
  assert.equal(noteNodes[0].nodeValue,'3. Crosstalk — zakłócenia między parami');
  assert.equal(noteNodes[1].nodeValue,'Typowy kabel UTP składa się z 4 twisted pairs.');
  assert.equal(noteNodes[2].nodeValue,'Pytanie o nazwę interferencji sprawdza rozumienie pojęcia.');
});


// WIEDORA-CHANGE: WD-20261031-WIE-161-CCNA-PROVENANCE-04 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
test('CCNA strips linked sources from note leads and text about this lesson', () => {
  const lead={innerHTML:'<strong>Cel:</strong> Ustalić pinouty. Materiał: <a href="https://example.test/video">film źródłowy</a> (00:00–09:11)'};
  const node={nodeValue:'Różne urządzenia w tej lekcji działają na L2.'};
  const note={querySelectorAll:selector=>selector==='p, li, .note-source'?[]:selector==='.note-lead'?[lead]:[]};
  let passed=false;
  helpers.cleanLearnerNote({
    getElementById:id=>id==='noteText'?note:null,
    createTreeWalker:()=>({nextNode:()=>{if(passed)return null;passed=true;return node;}})
  });
  assert.match(lead.innerHTML,/Ustalić pinouty/);
  assert.doesNotMatch(lead.innerHTML,/Materiał:|example\.test|film źródłowy/);
  assert.equal(node.nodeValue,'Różne urządzenia w tym zagadnieniu działają na L2.');
});

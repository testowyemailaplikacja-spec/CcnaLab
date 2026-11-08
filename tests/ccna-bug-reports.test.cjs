// WIEDORA-CHANGE: WD-20261101-WIE-005-NATIVE-REGRESSION-11 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
// WIEDORA-CHANGE: WD-20261031-WIE-005-NATIVE-REGRESSION-09 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const legacy = fs.readFileSync(path.join(__dirname, '../apps/ccna/legacy.html'), 'utf8');
const theme = fs.readFileSync(path.join(__dirname, '../apps/shared/portal-nav.css'), 'utf8');
const router = fs.readFileSync(path.join(__dirname, '../apps/ccna/router.js'), 'utf8');
const studyAdapter = fs.readFileSync(path.join(__dirname, '../apps/ccna/study-adapter.js'), 'utf8');
const shell = fs.readFileSync(path.join(__dirname, '../apps/ccna/index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(__dirname, '../apps/ccna/sw.js'), 'utf8');
const studyFrame = fs.readFileSync(path.join(__dirname, '../apps/shared/study-frame.js'), 'utf8');

function mount() {
  return new JSDOM(legacy, {
    url: 'http://localhost/apps/ccna/legacy.html',
    runScripts: 'dangerously',
    beforeParse(win) {
      win.CcnaVocabulary = require('../apps/ccna/data/terminology.js');
      win.matchMedia = () => ({matches:false,addListener(){},addEventListener(){}});
      win.scrollTo = () => {};
    }
  });
}
test('CCNA sections and subsections are visibly numbered', () => {
  const dom = mount();
  try {
    const {window:w} = dom, d = w.document;
    const data = JSON.parse(w.eval('JSON.stringify(ADMIN_DATA)'));
    const part = data.sections.find(section => section.type === 'part');
    assert.ok(part);
    w.renderPart(part.id);
    const headings = [...d.querySelectorAll('#partSectionGrid > article > h3')].map(el => el.textContent);
    assert.equal(headings.length, part.sections.length);
    headings.forEach((title, index) => assert.equal(title, String(index + 1) + '. ' + part.sections[index].title));
    const section = part.sections.find(item => item.type === 'learning-section');
    const sectionNumber = part.sections.indexOf(section) + 1;
    w.renderLearningSection(section.id);
    const ordinary = section.subsections.filter(item => item.type !== 'section-exam');
    const subheadings = [...d.querySelectorAll('#subsectionGrid > article > h3')].slice(0, ordinary.length).map(el => el.textContent);
    ordinary.forEach((sub, index) => assert.equal(subheadings[index], String(sectionNumber) + '.' + (index + 1) + '. ' + sub.title));
  } finally { dom.window.close(); }
});
test('CCNA laboratory catalogue opens existing original lesson', () => {
  const dom = mount();
  try {
    const {window:w} = dom, d = w.document;
    w.renderAdministrativeHome();
    const button = [...d.querySelectorAll('#adminSectionGrid button')].find(el => el.textContent.includes('Przeglądaj laboratoria'));
    assert.ok(button, 'Entry to labs exists');
    button.click();
    assert.equal(d.getElementById('moduleTitle').textContent, 'Laboratorium');
    const cards = [...d.querySelectorAll('#labCatalog .lab-catalog-group .lab-section-card')];
    assert.ok(cards.length >= 10);
    const labels = cards.map(card => card.querySelector('.lab-chip').textContent);
    assert.equal(new Set(labels).size, labels.length);
    cards[0].querySelector('button').click();
    assert.ok(d.querySelector('.view-head'), 'Original subsection view rendered');
    assert.match(router, /renderLaboratories.*laboratoria/);
    assert.match(router, /seg\[0\]==="laboratoria"/);
  } finally { dom.window.close(); }
});
test('CCNA tables pair background/foreground and gray theme differs from white', () => {
  assert.match(theme, /data-portal-theme="gray"\]\[data-portal-app="ccna"\]/);
  assert.match(theme, /data-portal-app="ccna"\] \.note-table td\{/);
  assert.match(theme, /data-portal-app="ccna"\] \.note-table th\{/);
  assert.match(theme, /\.note-table td\{[^}]*background:var\(--portal-surface\)!important;color:var\(--portal-ink\)!important/s);
  assert.match(theme, /\.note-table th\{[^}]*background:var\(--portal-action\)!important;color:#fff!important/s);
});


test('CCNA qualification path requires note, flashcards, two-choice questions, optional lab and ABCD exam', () => {
  assert.doesNotMatch(legacy, /od notatki przez tryb nauki i fiszki/);
  assert.match(legacy, /od notatki przez fiszki i pytania z dwiema odpowiedziami do laboratorium \(jeśli występuje\), a następnie do egzaminu ABCD/);
  const dom = mount();
  try {
    const {window:w} = dom, d = w.document;
    w.renderSubsection('interfejsy-sieciowe-i-okablowanie', 'ethernet-standardy-i-predkosc', 'note');
    const tabs = [...d.querySelectorAll('[data-sub-mode]')];
    assert.deepEqual(
      tabs.map(button => button.textContent.trim()),
      ['Notatka', 'Fiszki', 'Pytania', 'Egzamin', 'Tryb nauki']
    );
    assert.equal(d.querySelector('[data-sub-mode="study"]').disabled, false, 'Study Mode is always available');
    assert.equal(d.querySelector('[data-sub-mode="flashcards"]').disabled, true, 'Flashcards wait for the note');
    assert.equal(d.querySelector('[data-sub-mode="questions"]').disabled, true, 'Two-choice questions wait for flashcards');

    d.getElementById('completeAndContinue').click();

    assert.equal(d.querySelector('[data-sub-mode].active').dataset.subMode, 'flashcards');
    assert.match(d.getElementById('subsectionModeContent').textContent, /Fiszki/);
  } finally { dom.window.close(); }
});

test('CCNA completion gate does not count optional Study Mode and adapter keeps Fiszki distinct', () => {
  assert.match(legacy, /const completedNow = noteRead && flashcardsDone && questionsDone && labDone;/);
  assert.doesNotMatch(legacy, /const completedNow = noteRead && studyDone && flashcardsDone && questionsDone && labDone;/);
  assert.doesNotMatch(studyAdapter, /data-sub-mode=["']flashcards["'][\s\S]{0,300}textContent\s*=\s*["']Tryb nauki["']/);
  assert.doesNotMatch(studyAdapter, /onGrade|onUndo|reviewState\.cards/, 'Study Mode must not complete mandatory flashcards');
  assert.match(legacy, /function renderSectionStudy[\s\S]{0,700}renderStudyHome[^;]+type:"section-flashcards"/);
  assert.match(legacy, /function renderSectionLearningMode[\s\S]{0,700}renderStudyHome/);
  assert.match(legacy, /function renderAllStudy[\s\S]{0,700}renderQualificationFlashcardsHome/);
  assert.match(legacy, /function renderAllLearningMode[\s\S]{0,700}renderStudyHome/);
  assert.match(router, /renderSectionLearningMode/);
  assert.match(router, /renderAllLearningMode/);
});

test('CCNA failed-card recovery uses local calendar days and requires today plus tomorrow', () => {
  const dom=mount();
  try{
    const {window:w}=dom;
    const today=new Date(2026,9,24,20,30,0,0).getTime();
    const tomorrow=new Date(2026,9,25,11,0,0,0).getTime();
    const failed=JSON.parse(w.eval(`JSON.stringify(scheduledCard(defaultCard(),"again",${today}))`));
    assert.equal(failed.recoveryStage,'same-day');
    assert.equal(failed.recoveryDay,'2026-10-24');
    const recoveredToday=JSON.parse(w.eval(`JSON.stringify(scheduledCard(${JSON.stringify(failed)},"good",${today+60000}))`));
    assert.equal(recoveredToday.recoveryStage,'tomorrow');
    assert.equal(recoveredToday.repeatToday,true);
    assert.equal(recoveredToday.due,new Date(2026,9,25,0,0,0,0).getTime());
    const recoveredTomorrow=JSON.parse(w.eval(`JSON.stringify(scheduledCard(${JSON.stringify(recoveredToday)},"good",${tomorrow}))`));
    assert.equal(recoveredTomorrow.recoveryStage,'');
    assert.equal(recoveredTomorrow.repeatToday,false);
    assert.equal(recoveredTomorrow.due,new Date(2026,9,27,0,0,0,0).getTime());
    assert.equal(w.eval(`dueLabel(${JSON.stringify(recoveredToday)},${today+60000})`),'Powtórka: jutro');
    const failedYesterday={...failed,recoveryDay:'2026-10-23'};
    const lateRecovery=JSON.parse(w.eval(`JSON.stringify(scheduledCard(${JSON.stringify(failedYesterday)},"good",${today}))`));
    assert.equal(lateRecovery.recoveryDay,'2026-10-24');
    assert.equal(lateRecovery.recoveryStage,'tomorrow');
    assert.equal(lateRecovery.repeatToday,true);
  } finally { dom.window.close(); }
});

test('CCNA two-choice qualification uses one correct and one same-subsection distractor',()=>{
  const dom=mount();
  try{
    const {window:w}=dom;
    const result=JSON.parse(w.eval(`(()=>{const section=getSection("interfejsy-sieciowe-i-okablowanie"),sub=getSubsection(section,"ethernet-standardy-i-predkosc"),pool=getSubsectionQuestions(section,sub.id),item=twoChoiceQuestion(pool[0],pool);return JSON.stringify({options:item.answers,correct:item.correct,expected:correctAnswer(pool[0])})})()`));
    assert.equal(result.options.length,2);
    assert.equal(new Set(result.options).size,2);
    assert.equal(result.options[result.correct],result.expected);
  } finally { dom.window.close(); }
});

test('all two-choice CCNA questions exclude case and sentence-period aliases',()=>{
 const dom=mount();try{
  // WIEDORA-CHANGE: WD-20261101-WIE-005-CURRENT-POOL-01 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
  // Check the complete bank rather than a filtered legacy learning view,
  // including the five section-only Day 02 quiz questions.
  const result=JSON.parse(dom.window.eval(`JSON.stringify(getLearningSections().flatMap(section=>{
   const pool=getSectionExamPool(section);return pool.map(question=>({id:question.id,answers:twoChoiceQuestion(question,pool).answers}));
  }))`));
  const key=text=>String(text).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim().replace(/([\p{L}\p{N}])\.+$/u,'$1');
  assert.equal(result.length,3452);
  for(const question of result)assert.notEqual(key(question.answers[0]),key(question.answers[1]),question.id+': equivalent choices');
  const symbolic=JSON.parse(dom.window.eval(`JSON.stringify(twoChoiceQuestion({question:'Prompt?',answer:'Router>',answers:['Router>','Router#'],correct:0},[]))`));
  assert.deepEqual(new Set(symbolic.answers),new Set(['Router>','Router#']));
 }finally{dom.window.close();}
});

test('legacy negative cards from today or yesterday enter recovery across the DST boundary',()=>{
 const previousTZ=process.env.TZ;process.env.TZ='Europe/Warsaw';const dom=mount();try{
  const w=dom.window,now=new Date(2026,9,25,12).getTime();
  for(const lastGrade of ['again','hard'])for(const updatedAt of [new Date(2026,9,24,22).getTime(),new Date(2026,9,25,8).getTime()]){
   const old={status:'active',due:0,intervalDays:0,ease:2.5,reviews:3,lapses:1,updatedAt,lastGrade};
   const next=JSON.parse(w.eval(`JSON.stringify(scheduledCard(${JSON.stringify(old)},'easy',${now}))`));
   assert.equal(next.repeatToday,true);assert.equal(next.recoveryStage,'tomorrow');
   assert.equal(next.due,new Date(2026,9,26,0).getTime());
  }
 }finally{dom.window.close();if(previousTZ===undefined)delete process.env.TZ;else process.env.TZ=previousTZ;}
});

test('passing two-choice questions offers the next required CCNA stage directly',()=>{
  const dom=mount();
  try{
    const {window:w}=dom,d=w.document;
    w.eval(`(()=>{
      const section=getSection("interfejsy-sieciowe-i-okablowanie"),subsection=getSubsection(section,"ethernet-standardy-i-predkosc"),pool=getSubsectionQuestions(section,subsection.id);
      markNoteRead(subsection.id);
      const due=addLocalDays(Date.now(),1);for(const question of pool)reviewState.cards[cardKey(question)]={...defaultCard(),reviews:1,lastGrade:"good",due,intervalDays:1,updatedAt:Date.now()};saveReview();
      const one=twoChoiceQuestion(pool[0],pool);startTest([one],"Etap pytań",false,{type:"question-qualification",sectionId:section.id,subsectionId:subsection.id,mode:"questions"});
      testState.answers[0]=testState.questions[0].correct;finishTest(false,false);
    })()`);
    const next=d.getElementById('continueAfterQuestions');assert.ok(next);assert.match(next.textContent,/egzamin ABCD/i);
    next.click();
    assert.equal(d.querySelector('[data-sub-mode].active').dataset.subMode,'exam');
    assert.match(d.getElementById('subsectionModeContent').textContent,/Egzamin zaliczeniowy/);
  } finally { dom.window.close(); }
});

test('CCNA complete question inventory is coupled to a non-empty note',()=>{
  const dom=mount();
  try{
    const {window:w}=dom,audit=JSON.parse(w.eval('JSON.stringify(window.CCNA_CONTENT_AUDIT)'));
    assert.equal(audit.questions,3447);
    assert.equal(audit.uncovered,0);
    assert.equal(audit.blankNotes,0);
    assert.deepEqual(audit.duplicateQuestionIds,[]);
    assert.deepEqual(audit.invalidAnswers,[]);
    assert.deepEqual(audit.relocations.map(item=>item.questionId).sort(),[
      'anki-ethernet-switching-jitl-1573966833960',
      'anki-ethernet-switching-jitl-1573966864992',
      'anki-interfaces-cables-ocg-5998',
      'anki-qos-ocg-1074'
    ]);
    assert.ok(audit.supplements>0,'Previously empty or incomplete notes receive supplements');
  } finally { dom.window.close(); }
});

test('questions with an existing exact topic note are moved to that subsection',()=>{
  const dom=mount();
  try{
    const placements=JSON.parse(dom.window.eval(`JSON.stringify((()=>{
      const ids=new Set(["anki-interfaces-cables-ocg-5998","anki-ethernet-switching-jitl-1573966833960","anki-ethernet-switching-jitl-1573966864992","anki-qos-ocg-1074"]),result={};
      for(const section of getLearningSections())for(const subsection of getContentSubsections(section))for(const question of subsection.questions||[])if(ids.has(question.id))result[question.id]=subsection.id;
      return result;
    })())`));
    assert.deepEqual(placements,{
      'anki-interfaces-cables-ocg-5998':'ramka-ethernet-i-jej-pola',
      'anki-ethernet-switching-jitl-1573966833960':'arp-mapowanie-ip-na-mac',
      'anki-ethernet-switching-jitl-1573966864992':'arp-mapowanie-ip-na-mac',
      'anki-qos-ocg-1074':'iphead-dscp-ecn'
    });
  } finally { dom.window.close(); }
});

test('reported Ethernet header card has a factual question and answer',()=>{
  const dom=mount();
  try{
    // WIEDORA-CHANGE: WD-20261101-WIE-005-CURRENT-POOL-01 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
    const q=JSON.parse(dom.window.eval(`JSON.stringify(getLearningSections().flatMap(getSectionExamPool).find(item=>item.id==="anki-interfaces-cables-ocg-6999"))`));
    assert.equal(q.examQuestion,true);
    assert.equal(q.question,'Jakie pola zawiera nagłówek ramki Ethernet II?');
    assert.equal(q.answer,'Docelowy adres MAC, źródłowy adres MAC i pole EtherType.');
    assert.equal(q.answers[q.correct],q.answer);
    assert.equal(new Set(q.answers).size,4);
  } finally { dom.window.close(); }
});

test('official CCNA exams reveal correct and wrong answers immediately',()=>{
  const dom=mount();
  try{
    const {window:w}=dom,d=w.document;
    w.eval(`startTest([{id:"feedback-1",question:"Test?",answers:["Dobrze","Źle","Inna","Jeszcze inna"],correct:0}],"Egzamin",false,{type:"qualification",sectionId:"interfejsy-sieciowe-i-okablowanie",subsectionId:"ethernet-standardy-i-predkosc"})`);
    let expected=w.eval('testState.questions[0].correct');
    let wrong=expected===0?1:0;
    d.querySelector(`[data-answer-index="${wrong}"]`).click();
    assert.ok(d.querySelector(`[data-answer-index="${wrong}"]`).classList.contains('exam-wrong'));
    assert.ok(d.querySelector(`[data-answer-index="${expected}"]`).classList.contains('exam-correct-muted'));
    w.eval(`startTest([{id:"feedback-2",question:"Test?",answers:["Dobrze","Źle","Inna","Jeszcze inna"],correct:0}],"Egzamin",false,{type:"qualification",sectionId:"interfejsy-sieciowe-i-okablowanie",subsectionId:"ethernet-standardy-i-predkosc"})`);
    expected=w.eval('testState.questions[0].correct');
    d.querySelector(`[data-answer-index="${expected}"]`).click();
    assert.ok(d.querySelector(`[data-answer-index="${expected}"]`).classList.contains('exam-correct'));
  } finally { dom.window.close(); }
});

test('dark theme keeps result messages readable and visibly highlights passed subsection tiles',()=>{
  assert.match(theme,/\.result-box,\.status-message,\.exam-summary/);
  assert.match(theme,/\.answer-option\.exam-correct-muted\{background:var\(--portal-correct-muted-bg\)!important/);
  assert.match(theme,/\.admin-section-card\.completed-subsection-card\{background:var\(--portal-success-bg\)!important/);
  const dom=mount();
  try{
    const {window:w}=dom,d=w.document;
    w.eval('markCompleted("ethernet-standardy-i-predkosc")');
    w.renderLearningSection('interfejsy-sieciowe-i-okablowanie');
    const card=[...d.querySelectorAll('#subsectionGrid .admin-section-card')].find(node=>node.querySelector('h3')?.textContent.includes('Ethernet, standardy'));
    assert.ok(card?.classList.contains('completed-subsection-card'));
    assert.match(card.textContent,/Zaliczona egzaminem/);
  } finally { dom.window.close(); }
});

test('CCNA learning-flow release bypasses stale shell and Study Mode adapter caches', () => {
  // WIEDORA-CHANGE: WD-20261101-WIE-161-CCNA-SECTION-FLASHCARDS-02 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
  // WIEDORA-CHANGE: WD-20261102-WIE-005-NATIVE-REGRESSION-13 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
  const release = '20261102-section-review-3';
  for (const asset of ['legacy.html']) {
    assert.ok(shell.includes(`${asset}?v=20261101-ccna-qualification-1`), `${asset} is versioned in the shell`);
    assert.ok(serviceWorker.includes(`./${asset}?v=20261101-ccna-qualification-1`), `${asset} is versioned offline`);
  }
  // WIEDORA-CHANGE: WD-20261030-WIE-008-CANONICAL | TASK: WIE-008 | AUTHOR: Codex / GPT-6
  const routerAsset = shell.match(/src="(\.\/router\.js\?v=[^"]+)"/)?.[1];
  assert.ok(routerAsset, 'router has an explicit release version');
  assert.ok(serviceWorker.includes(routerAsset), 'offline package uses the exact shell router');
  assert.ok(shell.includes(`study-frame.js?v=${release}`));
  assert.ok(serviceWorker.includes(`../shared/study-frame.js?v=${release}`));
  assert.ok(serviceWorker.includes(`./study-adapter.js?v=${release}`));
  // WIEDORA-CHANGE: WD-20261029-WIE-005-REGRESSION-CODEX5 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
  assert.match(serviceWorker, /const CACHE_NAME="portal-offline-"\+APP_ID\+"-[^"]+";/);
  // WIEDORA-CHANGE: WD-20261030-WIE-195-KEYBOARD | TASK: WIE-195 | AUTHOR: Codex / GPT-6
  const integration=fs.readFileSync(path.join(__dirname,'../apps/ccna/packet-lab/integration.js'),'utf8');
  const labRelease=integration.match(/const LAB_RELEASE = '([^']+)'/)?.[1];
  assert.ok(labRelease,'Packet Lab declares its current code release');
  assert.ok(serviceWorker.includes(`./packet-lab/lab.js?v=${labRelease}`));
  const integrationAsset=shell.match(/src="(\.\/packet-lab\/integration\.js\?v=[^"]+)"/)?.[1];
  assert.ok(integrationAsset);assert.ok(serviceWorker.includes(integrationAsset));
  assert.match(studyFrame, /document\.currentScript[\s\S]{0,300}searchParams\.get\(['"]v['"]\)/);
  assert.match(studyFrame, /study-adapter\.js`\)\)/);
});

test('CCNA wide tables get an accessible mobile scroll region and versioned assets', () => {
  const fix = fs.readFileSync(path.join(__dirname, '../apps/ccna/bug-fixes.js'), 'utf8');
  assert.match(fix, /function makeTablesScrollable\(doc\)/);
  assert.match(fix, /table\.closest\("\.ccna-table-scroll"\)/);
  assert.match(fix, /overflow-x: auto/);
  assert.match(fix, /min-width: max\(100%, 34rem\)/);
  assert.match(fix, /MutationObserver/);
  const activeVersion=shell.match(/bug-fixes\.js\?v=([^\"]+)/)?.[1];
  assert.ok(activeVersion,'CCNA bug fixes must be versioned');
  assert.ok(serviceWorker.includes('./bug-fixes.js?v='+activeVersion),'offline cache matches CCNA bug fixes');
});

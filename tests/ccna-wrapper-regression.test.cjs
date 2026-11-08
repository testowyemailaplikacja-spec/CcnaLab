const test = require('node:test');
const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');

test('CCNA wrapper preserves one existing laboratory entry', () => {
  const dom = new JSDOM('<iframe id="appFrame"></iframe>', {url:'https://portal.test/apps/ccna/',runScripts:'outside-only'});
  try {
    const frame = dom.window.document.getElementById('appFrame');
    const w = frame.contentWindow;
    w.document.body.innerHTML = '<div id="moduleContent"><div id="adminSectionGrid"><article data-lab-catalog-entry><h3>Laboratorium</h3><button data-open-lab-catalog>Przeglądaj laboratoria</button></article></div></div>';
    w.renderAdministrativeHome = () => {};
    let opened = 0;
    w.renderLaboratories = () => {opened++;};
    w.document.querySelector('[data-open-lab-catalog]').addEventListener('click', () => w.renderLaboratories());
    dom.window.eval(fs.readFileSync(path.join(__dirname,'../apps/ccna/bug-fixes.js'),'utf8'));
    frame.dispatchEvent(new dom.window.Event('load'));
    w.renderAdministrativeHome();
    const wrongAnswerStyle=w.document.getElementById('ccna-wrong-answer-style');
    assert.ok(wrongAnswerStyle, 'wrong-answer red feedback style must be installed');
    assert.match(wrongAnswerStyle.textContent, /\.answer-option\.exam-wrong/);
    assert.match(wrongAnswerStyle.textContent, /#fecaca/);
    assert.equal(w.document.querySelectorAll('.ccna-laboratory-link').length,0,'do not append a second laboratory link');
    w.document.querySelector('[data-open-lab-catalog]').click();
    assert.equal(opened,1);
  } finally {dom.window.close();}
});

test('CCNA note has no injected browser-lab advertisement but keeps the lab tab', () => {
  const source=fs.readFileSync(path.join(__dirname,'../apps/ccna/packet-lab/integration.js'),'utf8');
  const index=fs.readFileSync(path.join(__dirname,'../apps/ccna/index.html'),'utf8');
  const sw=fs.readFileSync(path.join(__dirname,'../apps/ccna/sw.js'),'utf8');
  assert.doesNotMatch(source,/Wykonaj laboratorium w przeglądarce/);
  const js=index.match(/src="(\.\/packet-lab\/integration\.js\?v=[^"]+)"/);
  const frame=index.match(/src="(\.\/legacy\.html\?v=[^"]+)"/);
  assert.ok(js,'integration script must be explicitly versioned');
  assert.ok(frame,'iframe document must be explicitly versioned');
  assert.ok(sw.includes(js[1]),'offline cache must contain exact integration script version');
  assert.ok(sw.includes(frame[1]),'offline cache must contain exact iframe version');

  const dom=new JSDOM('<iframe id="appFrame"></iframe>',{url:'https://portal.test/apps/ccna/',runScripts:'outside-only'});
  try {
    const iframe=dom.window.document.getElementById('appFrame'),w=iframe.contentWindow;
    let flashcardsDone=false;
    w.getSection=()=>({id:'test'});
    w.getSubsection=()=>({id:'topic'});
    w.qualificationPathStatus=()=>({flashcardsDone});
    w.renderSubsection=()=> {
      w.document.body.innerHTML='<div class="section-mode-tabs"><button data-sub-mode="note">Notatka</button><button data-sub-mode="questions">Pytania</button><button data-sub-mode="flashcards">Fiszki</button><button data-sub-mode="exam">Egzamin</button><button data-sub-mode="study">Tryb nauki</button></div><div id="subsectionModeContent"><p>Treść notatki</p></div>';
    };
    dom.window.eval(source);
    iframe.dispatchEvent(new dom.window.Event('load'));
    w.renderSubsection('test','topic','note');
    assert.equal(w.document.querySelectorAll('[data-sub-mode="packet-lab"]').length,1);
    assert.deepEqual(
      [...w.document.querySelectorAll('[data-sub-mode]')].map(button=>button.dataset.subMode),
      ['note','questions','flashcards','packet-lab','exam','study']
    );
    assert.equal(w.document.querySelector('[data-sub-mode="packet-lab"]').disabled,true,'lab waits for required flashcards');
    w.renderSubsection('test','topic','packet-lab');
    assert.equal(w.document.getElementById('subsectionModeContent').textContent,'Treść notatki','direct lab route falls back to the note while locked');
    assert.equal(w.document.querySelector('[data-sub-mode="packet-lab"]').classList.contains('active'),false);
    flashcardsDone=true;
    w.renderSubsection('test','topic','note');
    assert.equal(w.document.querySelector('[data-sub-mode="packet-lab"]').disabled,false);
    assert.equal(w.document.querySelectorAll('.exam-summary').length,0);
    assert.equal(w.document.getElementById('subsectionModeContent').textContent,'Treść notatki');
  } finally {dom.window.close();}
});

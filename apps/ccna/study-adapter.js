(() => {
  'use strict';
  const storageKey = 'ccna-unified-study-v1';
  // WIEDORA-CHANGE: WD-20261101-WIE-161-CCNA-SECTION-FLASHCARDS-02 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
  // Optional whole-section flashcards have their own scope, not subsection qualification state.
  // WIEDORA-CHANGE: WD-20261102-WIE-161-CCNA-SECTION-AB-03 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
  // Section flashcards and section A/B practice must never share subsection grades.
  const scopeOf = view => view?.type === 'subsection' ? `subsection:${view.sectionId}:${view.subsectionId}` : view?.type === 'latin' ? 'english' : view?.type === 'section-flashcards' ? `section-flashcards:${view.sectionId}` : view?.type === 'section-learning' ? `section-learning:${view.sectionId}` : view?.sectionId ? `section:${view.sectionId}` : 'all';
  window.startReview = (pool, title, returnView) => {
    stopTimer(); testState = null; reviewSession = null;
    const sources = new Map();
    const questions = pool.map(q => {
      // WIEDORA-CHANGE: WD-20261101-WIE-161-CCNA-SECTION-FLASHCARDS-02 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
      // StudyModel stores grades by question ID globally; namespace both IDs and sessions
      // so whole-section flashcards never inherit marks from other study scopes.
      const sourceId = cardKey(q);
      const id = returnView?.type === 'section-flashcards'
        ? `section-flashcards:${returnView.sectionId}::${sourceId}`
        : returnView?.type === 'section-learning'
          ? `section-learning:${returnView.sectionId}::${sourceId}`
          : sourceId;
      sources.set(id, q);
      return {id, prompt: displayQuestionText(q), answer: correctAnswer(q), choices: q.answers || q.options || [], explanation: q.explanation || '', meta: q.examQuestion ? {pl:'Pytanie egzaminacyjne',en:'Exam question'} : '', images: q.image ? [q.image] : []};
    });
    moduleTitle.textContent = returnView?.type === 'section-flashcards' ? 'Fiszki z całej sekcji' : 'Tryb nauki';
    const url = new URL(window.parent.location.href); url.searchParams.set('study', '1');
    window.parent.history.replaceState(window.parent.history.state, '', url.pathname + url.search);
    return window.PortalStudyMode.mount(moduleContent, {
      storageKey, scope: scopeOf(returnView), title, questions,
      fixedMode: returnView?.type === 'section-learning' ? 'choice' : undefined,
      onEnd() { const url = new URL(window.parent.location.href); url.searchParams.delete('study'); window.parent.history.replaceState(window.parent.history.state, '', url.pathname + url.search); returnToView(returnView); },
      seedCard(q) { const source = sources.get(q.id); if(source.studyOnly || returnView?.type === 'section-flashcards' || returnView?.type === 'section-learning')return {enabled:true}; return {enabled: getCard(source).status === 'active'}; }
    });
  };
  window.renderStudyHome = (pool, title, target, returnView) => {
    stopTimer();
    const isSectionFlashcards = returnView?.type === 'section-flashcards';
    const isSectionLearning = returnView?.type === 'section-learning';
    // WIEDORA-CHANGE: WD-20261102-WIE-161-CCNA-SECTION-AB-03 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
    // Whole-section A/B must not display the mandatory subsection flashcard statistics.
    const intro = isSectionLearning
      ? 'Odpowiadaj na pytania, wybierając A lub B. Błędne odpowiedzi wracają do powtórki.'
      : 'Przypomnij odpowiedź samodzielnie lub ćwicz z dwiema odpowiedziami. Powtórki na dziś mają pierwszeństwo przed nowymi pytaniami.';
    const sectionNote = isSectionFlashcards
      ? '<p class="muted">Fiszki całej sekcji mają oddzielną kolejkę i oceny; nie zastępują obowiązkowych fiszek podsekcji ani nie blokują egzaminów.</p>'
      : isSectionLearning
        ? '<p class="muted">Pytania A/B całej sekcji mają własny postęp, niezależny od fiszek i nauki w podsekcjach oraz od fiszek całej sekcji.</p>'
        : statsHtml(pool);
    target.innerHTML = `<section class="exam-summary"><span class="badge">${isSectionFlashcards?'Fiszki • opcjonalne':'Tryb nauki'}</span><h3>${escapeHtml(title)}</h3><p>${intro}</p>${sectionNote}<div class="study-toolbar"><button class="action-button primary" id="startReview" type="button">Rozpocznij ${isSectionFlashcards?'fiszki':'naukę A/B'}</button></div><p class="muted">Sesja, oceny i terminy powtórek zapisują się automatycznie. Możesz cofnąć ostatnią ocenę. Nauka nie zalicza egzaminu i nie usuwa pytań.</p></section>`;
    target.querySelector('#startReview').onclick = () => startReview(pool, title, returnView);
    if (new URL(window.parent.location.href).searchParams.get('study') === '1') queueMicrotask(() => { if(target.isConnected)startReview(pool, title, returnView); });
  };
  const originalEnglish = window.renderLatinSection;
  window.renderLatinSection = (...args) => {
    const result=originalEnglish(...args); const head=moduleContent.querySelector('.view-head');
    if(!head || !moduleContent.querySelector('#latinList'))return result;
    const pool=(getLatinSection()?.entries || []).map(q => ({progressKey:`english::${q.english}`,question:q.english,answer:q.translation,explanation:q.context || '',studyOnly:true}));
    const button=document.createElement('button'); button.id='startEnglishStudy';button.type='button';button.className='action-button primary';button.textContent='Tryb nauki';button.onclick=()=>startReview(pool,'Język angielski',{type:'latin'});head.append(button);
    if(new URL(window.parent.location.href).searchParams.get('study')==='1')queueMicrotask(()=>{if(head.isConnected)startReview(pool,'Język angielski',{type:'latin'});});
    return result;
  };
})();

(function (global) {
  'use strict';
  const DAY = 86400000;
  const copy = value => JSON.parse(JSON.stringify(value));
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const number = (value, fallback = 0) => Number.isFinite(value) && value >= 0 ? value : fallback;
  const timestamp = value => number(value) <= 8640000000000000 ? number(value) : 0;
  const intervalFor = (previous, grade) => grade === 'good' ? Math.min(180, Math.max(1, Math.round(previous.intervalDays * 2))) : grade === 'easy' ? Math.min(180, Math.max(3, Math.round(previous.intervalDays * 3))) : 0;
  const today = now => { const d = new Date(now); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const shuffle = (items, random) => {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) { const j = Math.min(i, Math.floor(random() * (i + 1))); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  };
  function card(value) {
    const c = record(value) ? value : {};
    return {dueAt: timestamp(c.dueAt), intervalDays: Math.min(180, number(c.intervalDays)), reviews: Math.floor(number(c.reviews)), lapses: Math.floor(number(c.lapses)), lastGrade: ['again', 'hard', 'good', 'easy'].includes(c.lastGrade) ? c.lastGrade : '', enabled: c.enabled !== false, updatedAt: timestamp(c.updatedAt)};
  }
  function choicesFor(question, random = Math.random) {
    const answer = String(question.answer || '').trim();
    const wrong = [...new Set((question.choices || []).map(String).map(x => x.trim()))].filter(x => x && x.toLocaleLowerCase() !== answer.toLocaleLowerCase());
    if (!answer || !wrong.length) return [];
    return shuffle([{text: answer, correct: true}, {text: wrong[Math.min(wrong.length - 1, Math.floor(random() * wrong.length))], correct: false}], random);
  }
  class StudyModel {
    // WIEDORA-CHANGE: WD-20261102-WIE-161-CCNA-SECTION-AB-03 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
    // fixedMode is opt-in: only the CCNA whole-section A/B course uses it.
    constructor(questions, state, scope, options = {}) {
      this.options = {...options}; this.random = options.random || Math.random;
      this.now = options.now ?? Date.now(); this.scope = String(scope);
      this.questions = new Map();
      for (const q of questions || []) {
        if (q && q.id != null && String(q.prompt || '').trim() && String(q.answer || '').trim()) this.questions.set(String(q.id), {...q, id: String(q.id)});
      }
      this.state = record(state) ? state : {};
      this.state.version = 1;
      if (!record(this.state.cards)) this.state.cards = {};
      if (!record(this.state.sessions)) this.state.sessions = {};
      for (const q of this.questions.values()) {
        if (this.state.cards[q.id]) {
          const current = card(this.state.cards[q.id]);
          if (options.seedCard) { const seed = card(options.seedCard(q)); if (seed.updatedAt > current.updatedAt) this.state.cards[q.id] = seed; else this.state.cards[q.id] = {...current, enabled: seed.enabled}; }
          else this.state.cards[q.id] = current;
        } else if (options.seedCard) {
          const seed = card(options.seedCard(q));
          if (seed.reviews || seed.dueAt || !seed.enabled) this.state.cards[q.id] = seed;
        }
      }
      const saved = this.state.sessions[this.scope];
      if (record(saved) && saved.day === today(this.now) && Array.isArray(saved.queue) && ['due', 'new', 'hard', 'all'].includes(saved.filter) && saved.limit > 0) {
        this.session = saved;
        saved.queue = [...new Set(saved.queue.map(String))].filter(id => this.questions.has(id) && this.getCard(id).enabled);
        saved.learned = [...new Set((Array.isArray(saved.learned) ? saved.learned : []).map(String))].filter(id => this.questions.has(id));
        saved.answered = Math.floor(number(saved.answered)); saved.repeats = Math.floor(number(saved.repeats));
        saved.total = Math.max(saved.queue.length + saved.learned.length, Math.floor(number(saved.total)));
        saved.mode = this.options.fixedMode === 'choice' ? 'choice' : saved.mode === 'choice' ? 'choice' : 'recall';
        saved.revealed = false; saved.chosen = null;
      } else this.restart(options);
    }
    getCard(id) { return card(this.state.cards[String(id)]); }
    current() { return this.questions.get(this.session.queue[0]) || null; }
    restart(options = {}) {
      this.now = options.now ?? Date.now();
      const filter = ['due', 'new', 'hard', 'all'].includes(options.filter) ? options.filter : 'due';
      const limit = Number.isInteger(Number(options.limit)) && Number(options.limit) > 0 ? Math.min(10000, Number(options.limit)) : 20;
      const eligible = [...this.questions.values()].filter(q => {
        const c = this.getCard(q.id);
        return c.enabled && (filter === 'all' || (c.dueAt <= this.now && (filter === 'due' || (filter === 'new' ? !c.reviews : ['again', 'hard'].includes(c.lastGrade)))));
      });
      const due = eligible.filter(q => this.getCard(q.id).reviews).sort((a, b) => this.getCard(a.id).dueAt - this.getCard(b.id).dueAt);
      const fresh = shuffle(eligible.filter(q => !this.getCard(q.id).reviews), this.random);
      const queue = [...due, ...fresh].slice(0, limit).map(q => q.id);
      this.session = {day: today(this.now), filter, limit, mode: this.options.fixedMode === 'choice' ? 'choice' : options.mode === 'choice' ? 'choice' : 'recall', queue, total: queue.length, learned: [], answered: 0, repeats: 0, revealed: false, chosen: null, undo: null};
      this.state.sessions[this.scope] = this.session;
      const keys = Object.keys(this.state.sessions);
      if (keys.length > 30) for (const key of keys.slice(0, keys.length - 30)) if (key !== this.scope) delete this.state.sessions[key];
      return this.session;
    }
    reveal() { if (!this.current() || this.session.revealed) return false; this.session.revealed = true; return true; }
    choose(text) {
      const q = this.current(); if (!q || this.session.revealed) return null;
      const choices = choicesFor(q, this.random);
      // Only a supplied answer can be selected; no distractors are invented from other topics.
      if (!String(text).trim() || ![q.answer, ...(q.choices || [])].map(String).map(x => x.trim()).includes(String(text).trim()) || !choices.length) return null;
      this.session.chosen = String(text).trim(); this.session.revealed = true;
      return {correct: this.session.chosen === String(q.answer).trim(), answer: String(q.answer)};
    }
    grade(grade, now = Date.now()) {
      const q = this.current(); if (!q || !this.session.revealed || !['again', 'hard', 'good', 'easy'].includes(grade)) return false;
      if (this.session.chosen !== null) grade = this.session.chosen === String(q.answer).trim() ? (grade === 'easy' ? 'good' : grade) : 'again';
      const previous = this.getCard(q.id);
      const snapshot = copy({...this.session, undo: null, revealed: false, chosen: null});
      const next = {...previous, reviews: previous.reviews + 1, lastGrade: grade, updatedAt: now, enabled: true};
      if (grade === 'again' || grade === 'hard') { next.intervalDays = 0; next.dueAt = 0; next.lapses += grade === 'again' ? 1 : 0; }
      else { next.intervalDays = intervalFor(previous, grade); next.dueAt = now + next.intervalDays * DAY; }
      this.state.cards[q.id] = next;
      this.session.queue.shift(); this.session.answered++;
      if (grade === 'again' || grade === 'hard') {
        this.session.queue.splice(Math.min(grade === 'again' ? 1 : 4, this.session.queue.length), 0, q.id); this.session.repeats++;
      } else if (!this.session.learned.includes(q.id)) this.session.learned.push(q.id);
      this.session.revealed = false; this.session.chosen = null;
      this.session.undo = {id: q.id, card: previous, session: snapshot, adapter: null};
      return true;
    }
    undo() {
      const last = this.session.undo;
      if (!record(last) || !this.questions.has(String(last.id)) || !record(last.session) || !Array.isArray(last.session.queue)) return false;
      this.state.cards[last.id] = card(last.card);
      this.session = copy(last.session); this.session.undo = null; this.session.revealed = false; this.session.chosen = null;
      this.state.sessions[this.scope] = this.session;
      return true;
    }
  }

  const TEXT = {
    pl: {title:'Tryb nauki', recall:'Przypomnij samodzielnie', choice:'Dwie odpowiedzi', filter:'Pula pytań', due:'Na dziś', new:'Nowe', hard:'Trudne', all:'Wszystkie', limit:'Długość sesji', complete:'Sesja ukończona', empty:'Brak pytań w tej puli', hint:'Najpierw spróbuj odpowiedzieć w pamięci. Potem sprawdź odpowiedź i oceń, jak dobrze ją znasz.', show:'Pokaż odpowiedź', answer:'Poprawna odpowiedź', again:'Nie znam', hardGrade:'Słabo', good:'Dobrze', easy:'Bardzo dobrze', againTime:'po 1 innym pytaniu', hardTime:'po 4 innych pytaniach', goodTime:'co najmniej jutro', easyTime:'za co najmniej 3 dni', undo:'Cofnij ostatnią ocenę', end:'Zakończ naukę', restart:'Nowa sesja', learned:'Utrwalone w sesji', left:'Pozostało', answered:'Oceniono', correct:'Poprawnie. Sprawdź odpowiedź przed przejściem dalej.', wrong:'Niepoprawnie. Przeczytaj odpowiedź — pytanie wróci po krótkiej przerwie.', next:'Następne pytanie', noChoices:'Do tego pytania nie ma gotowej pary odpowiedzi. Przypomnij ją samodzielnie.', saveError:'Nie udało się zapisać sesji na urządzeniu. Pozostań na tej stronie, aby nie stracić miejsca.', rest:'Możesz teraz zrobić przerwę. Odpowiedzi ocenione pozytywnie wrócą w kolejnych dniach.', noDue:'Wybierz „Nowe”, „Trudne” lub „Wszystkie”, aby zmienić pulę.', keyboard:'Spacja: pokaż odpowiedź · 1–4: ocena · Ctrl+Z: cofnij', plan:'Plan powtórek', planCopy:'Błędy wracają w tej sesji; poprawne odpowiedzi wrócą w kolejnych dniach. Terminy rosną wraz z kolejnymi przypomnieniami. Ocena nie zalicza egzaminu i nie usuwa pytań.', shortPool:'Jeśli zabraknie innych pytań, powtórka pojawi się wcześniej.', note:'Wyjaśnienie', reviewAt:'Najbliższa powtórka', allSize:'Cała pula', goal:'Cel sesji'},
    en: {title:'Study mode', recall:'Recall the answer', choice:'Two answers', filter:'Question pool', due:'Due today', new:'New', hard:'Difficult', all:'All', limit:'Session length', complete:'Session complete', empty:'No questions in this pool', hint:'Try to recall the answer first. Then reveal it and assess how well you know it.', show:'Show answer', answer:'Correct answer', again:'Again', hardGrade:'Hard', good:'Good', easy:'Easy', againTime:'after 1 other question', hardTime:'after 4 other questions', goodTime:'at least tomorrow', easyTime:'in at least 3 days', undo:'Undo last rating', end:'End study', restart:'New session', learned:'Learned this session', left:'Remaining', answered:'Rated', correct:'Correct. Check the answer before continuing.', wrong:'Incorrect. Read the answer — this question will return after a short gap.', next:'Next question', noChoices:'This question has no supplied answer pair. Recall the answer yourself.', saveError:'Could not save this session on your device. Keep this page open to retain your place.', rest:'You can take a break. Positively rated answers will return in the coming days.', noDue:'Choose New, Difficult or All to change the pool.', keyboard:'Space: reveal · 1–4: rate · Ctrl+Z: undo', plan:'Review schedule', planCopy:'Mistakes return within this session; correct answers return in the coming days. Intervals increase with subsequent recall. Ratings do not pass exams or remove questions.', shortPool:'With fewer questions, a repeat may appear sooner.', note:'Explanation', reviewAt:'Next review', allSize:'Entire pool', goal:'Session goal'}
  };
  function mount(target, options) {
    if (!target) return null;
    target.__studyController?.destroy();
    const win = target.ownerDocument.defaultView;
    let saved = {};
    try { saved = JSON.parse(win.localStorage.getItem(options.storageKey) || '{}'); } catch {}
    const model = new StudyModel(options.questions, saved, options.scope, {seedCard: options.seedCard, fixedMode: options.fixedMode});
    const root = target.ownerDocument.createElement('section'); root.className = 'study-mode'; root.dataset.noTranslate = ''; root.dataset.studyScope = options.scope;
    target.replaceChildren(root);
    let choiceCache = [], choiceId = '', warning = false;
    const lang = () => win.PortalPreferences?.getLanguage?.() || win.parent?.PortalPreferences?.getLanguage?.() || target.ownerDocument.documentElement.lang || 'pl';
    const save = () => { try { win.localStorage.setItem(options.storageKey, JSON.stringify(model.state)); warning = false; } catch { warning = true; } };
    const el = (tag, value, cls) => { const node = target.ownerDocument.createElement(tag); if (value != null) node.textContent = String(value); if (cls) node.className = cls; return node; };
    const button = (text, action, cls, disabled = false) => { const node = el('button', text, 'study-button ' + (cls || '')); node.type = 'button'; node.disabled = disabled; node.addEventListener('click', action); return node; };
    const rate = grade => {
      const q = model.current(); if (!q || !model.grade(grade)) return;
      const undo = model.session.undo;
      try { undo.adapter = options.onGrade?.(q, model.getCard(q.id).lastGrade, model.getCard(q.id)); }
      catch { model.undo(); warning = true; render(); return; }
      choiceId = ''; save(); render();
    };
    const undo = () => {
      const previous = model.session.undo;
      if (!model.undo()) return;
      options.onUndo?.(previous.id, previous.adapter); choiceId = ''; save(); render();
    };
    const reveal = () => { if (model.reveal()) { save(); render(); } };
    const choose = text => { if (model.choose(text)) { save(); render(); } };
    function render() {
      const t = TEXT[String(lang()).startsWith('en') ? 'en' : 'pl']; root.replaceChildren();
      const head = el('div', null, 'study-head'); head.append(el('span', t.title, 'study-kicker'), el('h3', options.title || t.title)); root.append(head);
      if (options.isGuest?.() || target.ownerDocument.documentElement.dataset.portalAuth === 'guest' || win.parent?.document.documentElement.dataset.portalAuth === 'guest') {
        const english = String(lang()).startsWith('en');
        const notice = el('p', english ? 'Guest mode: you can practise in this session. Refreshing clears your progress. Sign in to keep your session and review dates.' : 'Tryb gościa: możesz ćwiczyć w tej sesji. Odświeżenie czyści postęp. Zaloguj się, aby zachować sesję i terminy powtórek.', 'study-guest');
        const login = el('a', english ? 'Sign in' : 'Zaloguj się');
        const location = win.parent.location;
        login.href = '/?konto=login&return=' + encodeURIComponent(location.pathname + location.search + location.hash); login.target = '_top';
        notice.append(login); root.append(notice);
      }
      const controls = el('div', null, 'study-controls');
      const modes = el('div', null, 'study-modes'); modes.setAttribute('role', 'group'); modes.setAttribute('aria-label', t.title);
      for (const [mode, name] of [['recall', t.recall], ['choice', t.choice]]) {
        const b = button(name, () => { model.session.mode = mode; model.session.revealed = false; model.session.chosen = null; save(); render(); }); b.dataset.studyMode = mode; b.setAttribute('aria-pressed', String(model.session.mode === mode)); modes.append(b);
      }
      if (!options.fixedMode) controls.append(modes);
      for (const [field, name, entries] of [['filter', t.filter, [['due', t.due], ['new', t.new], ['hard', t.hard], ['all', t.all]]], ['limit', t.limit, [[10, '10'], [20, '20'], [50, '50'], [10000, t.allSize]]]]) {
        const label = el('label', name); const select = el('select'); select.dataset.studySetting = field;
        for (const [value, text] of entries) { const op = el('option', text); op.value = String(value); op.selected = String(model.session[field]) === String(value); select.append(op); }
        select.addEventListener('change', () => { model.restart({...model.session, [field]: select.value}); choiceId = ''; save(); render(); }); label.append(select); controls.append(label);
      }
      root.append(controls);
      const stats = el('div', null, 'study-stats');
      for (const [name, value] of [[t.learned, `${model.session.learned.length}/${model.session.total}`], [t.left, model.session.queue.length], [t.answered, model.session.answered]]) { const node = el('div'); node.append(el('strong', value), el('span', name)); stats.append(node); }
      root.append(stats);
      const progress = el('progress'); progress.max = Math.max(1, model.session.total); progress.value = model.session.learned.length; progress.setAttribute('aria-label', t.goal); root.append(progress);
      if (warning) { const node = el('p', t.saveError, 'study-warning'); node.setAttribute('role', 'status'); root.append(node); }
      const q = model.current(); const panel = el('article', null, 'study-card'); panel.setAttribute('aria-live', 'polite'); root.append(panel);
      if (!q) {
        panel.append(el('h4', model.session.answered ? t.complete : t.empty), el('p', model.session.answered ? t.rest : t.noDue));
        const future = [...model.questions.values()].map(q => model.getCard(q.id)).filter(c => c.enabled && c.dueAt > Date.now()).sort((a, b) => a.dueAt - b.dueAt)[0];
        if (future) panel.append(el('p', `${t.reviewAt}: ${new Date(future.dueAt).toLocaleDateString(String(lang()).startsWith('en') ? 'en-GB' : 'pl-PL')}`));
        panel.append(button(t.restart, () => { model.restart({...model.session}); choiceId = ''; save(); render(); }, 'primary'));
      } else {
        if (q.meta) panel.append(el('span', record(q.meta) ? q.meta[String(lang()).startsWith('en') ? 'en' : 'pl'] || q.meta.pl : q.meta, 'study-meta'));
        panel.append(el('h4', q.prompt, 'study-prompt')); panel.append(el('p', t.hint, 'study-hint'));
        for (const url of q.images || []) {
          if (typeof url !== 'string' || !(/^(data:image\/(png|jpeg|webp);base64,|\/)/.test(url))) continue;
          const img = el('img'); img.src = url; img.alt = q.prompt; img.loading = 'lazy'; panel.append(img);
        }
        if (model.session.mode === 'choice' && !model.session.revealed) {
          if (choiceId !== q.id) { choiceCache = choicesFor(q); choiceId = q.id; }
          if (choiceCache.length) { const grid = el('div', null, 'study-choices'); choiceCache.forEach((item, i) => {
              // WIEDORA-CHANGE: WD-20261102-WIE-161-CCNA-SECTION-AB-03 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
              const label = options.fixedMode === 'choice' ? `${String.fromCharCode(65 + i)}. ${item.text}` : item.text;
              const b = button(label, () => choose(item.text)); b.dataset.studyChoice = String(i); grid.append(b);
            }); panel.append(grid); }
          else { panel.append(el('p', t.noChoices)); panel.append(button(t.show, reveal, 'primary')); }
        } else if (!model.session.revealed) panel.append(button(t.show, reveal, 'primary'));
        if (model.session.revealed) {
          const answer = el('div', null, 'study-answer'); answer.append(el('strong', t.answer), el('p', q.answer)); panel.append(answer);
          if ((q.explanation && q.explanation !== q.answer) || q.legalBasis) {
            const explanation = el('details'); explanation.append(el('summary', t.note));
            if(q.explanation && q.explanation !== q.answer)explanation.append(el('p',q.explanation));
            if(q.legalBasis){const basis=el('div',null,'legal-basis');basis.append(el('strong',String(lang()).startsWith('en')?'Legal basis: ':'Podstawa prawna: '),target.ownerDocument.createTextNode(q.legalBasis));explanation.append(basis);}
            panel.append(explanation);
          }
          for (const url of q.answerImages || []) {
            if (typeof url !== 'string' || !(/^(data:image\/(png|jpeg|webp);base64,|\/)/.test(url))) continue;
            const img = el('img'); img.src = url; img.alt = t.answer; img.loading = 'lazy'; panel.append(img);
          }
          if (model.session.chosen !== null) {
            const correct = model.session.chosen === String(q.answer).trim(); const feedback = el('p', correct ? t.correct : t.wrong, correct ? 'study-correct' : 'study-wrong'); feedback.setAttribute('role', 'status'); panel.append(feedback);
            if(!correct)feedback.append(el('span', `${String(lang()).startsWith('en')?'Your answer':'Twoja odpowiedź'}: ${model.session.chosen}`, 'study-selected-answer'));
            panel.append(button(t.next, () => rate(correct ? 'good' : 'again'), 'primary'));
          } else {
            const grades = el('div', null, 'study-grades');
            const dateFor = grade => new Date(Date.now() + intervalFor(model.getCard(q.id), grade) * DAY).toLocaleDateString(String(lang()).startsWith('en') ? 'en-GB' : 'pl-PL', {day:'numeric',month:'short'});
            for (const [grade, text, when] of [['again', t.again, t.againTime], ['hard', t.hardGrade, t.hardTime], ['good', t.good, dateFor('good')], ['easy', t.easy, dateFor('easy')]]) { const b = button('', () => rate(grade)); b.dataset.studyGrade = grade; b.append(el('strong', text), el('small', when)); grades.append(b); } panel.append(grades);
          }
        }
      }
      const foot = el('div', null, 'study-footer');
      foot.append(button(t.undo, undo, '', !model.session.undo)); foot.lastChild.dataset.studyUndo = '';
      foot.append(button(t.end, () => { save(); options.onEnd?.(); })); root.append(foot);
      const help = el('details', null, 'study-help'); help.append(el('summary', t.plan), el('p', t.planCopy), el('p', t.shortPool), el('p', t.keyboard)); root.append(help);
    }
    const keyboard = event => {
      if (!root.isConnected || !root.getClientRects().length || event.repeat || event.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName) || event.target?.isContentEditable) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && model.session.undo) { event.preventDefault(); undo(); return; }
      if (event.ctrlKey || event.metaKey) return;
      if (event.code === 'Space' && !model.session.revealed) { event.preventDefault(); if (model.session.mode !== 'choice' || !choicesFor(model.current() || {}).length) reveal(); }
      const n = Number(event.key);
      if (n >= 1 && n <= 4 && model.current()) {
        if (model.session.revealed && model.session.chosen === null) { event.preventDefault(); rate(['again', 'hard', 'good', 'easy'][n - 1]); }
        else if (!model.session.revealed && model.session.mode === 'choice' && choiceCache[n - 1]) { event.preventDefault(); choose(choiceCache[n - 1].text); }
      }
    };
    win.addEventListener('keydown', keyboard);
    const observer = new win.MutationObserver(() => { if (!root.isConnected) controller.destroy(); else render(); });
    observer.observe(target.ownerDocument.documentElement, {attributes: true, attributeFilter: ['lang', 'data-portal-language', 'data-portal-auth']});
    if (win.parent.document !== target.ownerDocument) observer.observe(win.parent.document.documentElement, {attributes:true, attributeFilter:['data-portal-auth']});
    const removal = new win.MutationObserver(() => { if (!root.isConnected) controller.destroy(); });
    removal.observe(target.ownerDocument.body, {childList: true, subtree: true});
    const controller = {model, root, destroy() { win.removeEventListener('keydown', keyboard); observer.disconnect(); removal.disconnect(); win.removeEventListener('pagehide', controller.destroy); }};
    win.addEventListener('pagehide', controller.destroy);
    target.__studyController = controller; save(); render(); return controller;
  }
  const api = {StudyModel, choicesFor, mount};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else global.PortalStudyMode = api;
})(typeof window !== 'undefined' ? window : globalThis);

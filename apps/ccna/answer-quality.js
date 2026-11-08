/* WIEDORA-CHANGE: WD-20261106-WIE-161-SECTION1-ANSWER-QUALITY-01 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
 * First-section answer quality: the A/B false option comes from the same reviewed
 * ABCD card, never from a different card's correct answer. All changes are scoped
 * to Interfaces, Cabling and Device Connections; original IDs/progress are kept.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof document !== 'undefined') {
    const frame = document.getElementById('appFrame');
    let installedDocument = null;
    const install = () => {
      const w = frame && frame.contentWindow;
      if (!w || installedDocument === w.document) return;
      if (api.install(w)) installedDocument = w.document;
    };
    if (frame) frame.addEventListener('load', install);
    if (frame && frame.contentDocument && frame.contentDocument.readyState === 'complete') install();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const SECTION_ID = 'interfejsy-sieciowe-i-okablowanie';

  // Exact question IDs only. The film, source and its timestamps stay in the
  // internal docs, not the learner-facing question. The nine low-value cards
  // awaiting archival in PR #124 are deliberately not rewritten here.
  const PROMPTS = Object.freeze({
    'medium-day02-01': 'Dlaczego zwykły przewód Copper UTP nie wystarcza do połączenia dwóch Switchy oddalonych o 150 m?',
    'medium-day02-03': 'Dlaczego przy łączu 150 m można wybrać Multimode Fiber (MMF) zamiast Single-Mode Fiber (SMF), jeśli oba zapewniają wymaganą przepustowość i zasięg?',
    'cables-day02-05': 'Dwa starsze Routery z wyłączonym Auto MDI-X nie nawiązują połączenia przez Straight-Through Cable. Co należy sprawdzić?',
    'fiber-day02-04': 'Dwa Switche znajdują się 150 m od siebie. Który rodzaj światłowodu zwykle umożliwia tańszą optykę na takim dystansie?',
    'fiber-day02-05': 'Jaki typ światłowodu zwykle wybiera się do połączenia dwóch biur oddalonych o około 3 km?',
    'day02-quiz-final-04': 'Dwa Switche obsługujące Auto MDI-X połączono przewodem Straight-Through Cable. Jak powinny zachować się porty?',
    'fiber-day02-06': 'Które medium jest zwykle ekonomicznym wyborem do podłączenia wielu komputerów PC do Switcha na jednym piętrze?',
    'anki-interfaces-cables-jitl-1571561374442': 'Jaka jest typowa maksymalna długość pojedynczego łącza miedzianego Ethernet UTP?',
    'anki-interfaces-cables-jitl-1571562043865': 'Jakie dwa podstawowe rodzaje światłowodów są używane w sieciach Ethernet?',
    'anki-interfaces-cables-jitl-1571562146920': 'Który rodzaj optyki często jest tańszy na krótkich łączach światłowodowych?',
    'anki-interfaces-cables-ocg-1021': 'Jakie źródło światła może być wykorzystywane w łączu Multimode Fiber (MMF)?',
    'anki-interfaces-cables-jitl-1571562255863': 'Która para przykładowych zasięgów 1000BASE-LX dla MMF i SMF pokazuje różnicę między tymi typami włókna? Rzeczywisty dystans zależy od optyki.',
    'anki-interfaces-cables-jitl-1571562281919': 'Który przykładowy zasięg odpowiada łączu 10GBASE-SR na MMF w zestawieniu typowych wartości? Rzeczywisty dystans zależy od klasy włókna i modułu.',
    'anki-interfaces-cables-jitl-1571562290766': 'Jaki jest typowy maksymalny zasięg łącza 10GBASE-LR po Single-Mode Fiber (SMF)?'
  });

  // WIEDORA-CHANGE: WD-20261106-WIE-161-SECTION1-ANSWER-QUALITY-01 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
  // Rewrite source-facing phrases in the displayed ABCD data while retaining
  // the exact correct index, historical ID, score, and pre-existing answer order.
  const ANSWER_REVISIONS = Object.freeze({
    'lu-17': [
      ['Ponieważ MMF jest w tym quizie znacznie tańszy od UTP na 3 km.',
       'Ponieważ MMF jest zawsze znacznie tańszy od UTP na 3 km.'],
      ['Ponieważ w standardach filmu MMF ma zawsze większy zasięg niż SMF.',
       'Ponieważ MMF zawsze ma większy zasięg niż SMF.']
    ],
    'medium-day02-01': [
      ['150 m przekracza podany w lekcji limit 100 m dla odcinka Copper UTP.',
       '150 m przekracza standardowy limit 100 m dla pojedynczego odcinka Copper UTP.'],
      ['Ponieważ 150 m jest krótsze niż limit 100 m dla UTP z filmu.',
       'Ponieważ 150 m jest krótsze niż standardowy limit 100 m dla Copper UTP.']
    ],
    'medium-day02-03': [
      ['MMF zapewnia wymagany zasięg przy korzystniejszym koszcie optyki w założeniach quizu.',
       'MMF spełnia wymagania łącza i w przyjętym scenariuszu pozwala użyć tańszej optyki.'],
      ['Ponieważ rodzaj światłowodu nie ma znaczenia dla kosztu optyki w quizie.',
       'Ponieważ koszt optyki nie zależy od rodzaju światłowodu.']
    ],
    'fiber-day02-05': [
      ['Multimode Fiber (MMF) z modułami o krótszym zasięgu z tabeli lekcji.',
       'Multimode Fiber (MMF) z modułami, których zasięg jest krótszy niż wymagane 3 km.']
    ],
    'fiber-day02-07': [
      ['30 km w przykładzie filmu.',
       '30 km w przyjętym przykładzie.']
    ]
  });

  function sanitizeLearnerNote(note) {
    // Preserve factual explanations, commands and topic mappings. Provenance
    // belongs in the curriculum docs rather than learner-facing Day 02 notes.
    return String(note || '')
      .replace(/<p(?:\s+[^>]*)?>\s*(?:Źródł(?:o|a)(?: główne| dodatkowe)?(?:, niezależne od filmu)?|Podstawa|Uzupełnienia spoza filmu):[\s\S]*?<\/p>/gi, '')
      .replace(/Uzupełnienie pochodzące z talii Jeremy['’]s IT Lab \(nie z przekazanej notatki filmu\)/gi, 'Kontekst historyczny')
      .replace(/Uzupełnienie Cisco \/ OCG: GBIC i SFP\+ \(poza filmem Day\s*0?2\)/gi, 'GBIC i SFP+ — formaty i kompatybilność')
      .replace(/Trzy scenariusze z quizu Day\s*0?2/gi, 'Trzy przykłady doboru medium')
      .replace(/Przykład z quizu końcowego filmu/gi, 'Przykład doboru przewodu')
      .replace(/Quiz Day\s*0?2\s*—/gi, 'Przykład —')
      .replace(/liczby z tabeli filmu Jeremy['’]s IT Lab Day\s*0?2/gi, 'przykładowe wartości z zestawienia')
      .replace(/Nie dodawaj topologii R1–R4 ani poleceń Packet Tracer, których nie ma w filmie Day\s*0?2\./gi, '')
      .replace(/To przykład rachunkowy wyprowadzony z definicji bitu i bajtu w filmie\./gi, 'Wynik wynika z przeliczenia bitów na bajty.')
      .replace(/Jest to informacja historyczna z pytania źródłowego, a nie dodatkowy temat filmu\./gi, '')
      .replace(/; rok 1983 został osobno oznaczony jako informacja z talii JITL, nie z notatki filmowej\./gi, '.')
      .replace(/Tu uczymy się wyboru <strong>Transmission Medium<\/strong> z filmu Jeremy['’]s IT Lab\./gi, 'Tu uczymy się wyboru <strong>Transmission Medium</strong> w praktycznych sytuacjach.')
      .replace(/W tabeli standardów z filmu/gi, 'W zestawieniu standardów')
      .replace(/w tabeli filmu/gi, 'w zestawieniu')
      .replace(/z tabeli filmu/gi, 'z zestawienia')
      .replace(/30 km w przykładzie filmu/gi, '30 km (przykładowo)')
      .replace(/Przykładowo film wymienia/gi, 'Przykładowo w zestawieniu podano')
      .replace(/Film pokazuje/gi, 'Schemat pokazuje')
      .replace(/w założeniach filmu/gi, 'w przyjętym scenariuszu')
      .replace(/Przy założeniach filmu/gi, 'Przy przyjętych założeniach')
      .replace(/w założeniach quizu/gi, 'w założeniach scenariusza')
      .replace(/W quizie dla dystansu/gi, 'Dla dystansu')
      .replace(/W założeniach filmu/gi, 'Przy przyjętych założeniach')
      .replace(/W tym quizie/gi, 'W tym scenariuszu')
      .replace(/w quizie/gi, 'w scenariuszu')
      .replace(/z quizu/gi, 'z przykładu')
      .replace(/z końcowego quizu/gi, '')
      .replace(/w filmie/gi, 'w przykładzie')
      .replace(/z filmu/gi, 'z przykładu')
      .replace(/konkretne scenariusze filmu/gi, 'przyjęte scenariusze')
      .replace(/CCNA\s+Day\s*0?2\s*—/gi, 'CCNA —')
      .replace(/—\s*Day\s*0?2\b/gi, '')
      .replace(/\bDay\s*0?2\b/gi, '')
      .replace(/\bz dnia\s*0?2\b/gi, '');
  }

  function meaningKey(value) {
    let t = String(value == null ? '' : value)
      .normalize('NFKC').toLocaleLowerCase('pl').trim()
      .replace(/[.!?]+$/g, '').replace(/^ieee\s+(?=802\.)/i, '');
    const bracket = t.match(/^(.*?)\s*\(([a-z0-9+]{2,8})\)$/i);
    if (bracket) {
      const initials = bracket[1].split(/\s+/).filter(Boolean).map(word => word.charAt(0)).join('').toLowerCase();
      const expansions = {
        sfp: 'small form factor pluggable', gbic: 'gigabit interface converter',
        mmf: 'multimode fiber', smf: 'single mode fiber', utp: 'unshielded twisted pair'
      };
      const expansion = bracket[1].replace(/[^a-z0-9]+/gi, ' ').trim();
      const suffix = bracket[2].toLowerCase();
      if (initials === suffix || expansions[suffix] === expansion) t = bracket[1];
    }
    // Numeric decimals and pin ranges are meaningful: 12,5 != 1,25 MB/s,
    // 1-2 != 12. Preserve them before dropping ordinary punctuation.
    return t.replace(/(\d)[.,](\d{1,2})(?!\d)/g, '$1@decimal@$2')
      .replace(/(\d)[-–—](\d)/g, '$1@range@$2')
      .replace(/[^a-z0-9@]+/gi, '');
  }

  function correctAnswer(question) {
    const choices = question.answers || question.options || [];
    const index = Number.isInteger(question.correct) ? question.correct : question.correctIndex;
    if (Number.isInteger(index) && choices[index] != null) return String(choices[index]);
    return String(question.answer == null ? '' : question.answer);
  }

  function relatedCards(section) {
    return (section.subsections || [])
      .filter(sub => sub.type === 'learning-subsection' || sub.type === 'section-exam')
      .flatMap(sub => sub.questions || []);
  }

  function audit(section) {
    const cards = relatedCards(section), ids = new Set(), duplicatedIds = [];
    const badChoices = [], invalidGrading = [], sourceReferences = [];
    for (const q of cards) {
      if (ids.has(q.id)) duplicatedIds.push(q.id);
      ids.add(q.id);
      const options = q.answers || q.options || [];
      const keys = options.map(meaningKey);
      if (options.length !== 4 || keys.some((key, i) => !key || keys.indexOf(key) !== i))
        badChoices.push(q.id);
      const expected = Number.isInteger(q.correct) ? q.correct
        : Number.isInteger(q.correctIndex) ? q.correctIndex : options.indexOf(q.answer);
      if (expected < 0 || expected >= options.length || String(options[expected]) !== String(q.answer))
        invalidGrading.push(q.id);
      if (/\bday\s*0?\d+\b|w (?:tym )?filmie|według quizu|w quizie|według tabeli/i.test(String(q.question || '')))
        sourceReferences.push(q.id);
    }
    return Object.freeze({
      total: cards.length,
      badChoices: Object.freeze(badChoices),
      invalidGrading: Object.freeze(invalidGrading),
      duplicatedIds: Object.freeze(duplicatedIds),
      sourceReferences: Object.freeze(sourceReferences)
    });
  }

  function makeTwoChoices(question, random = Math.random) {
    const answer = correctAnswer(question);
    const originalOptions = question.answers || question.options || [];
    const correctKey = meaningKey(answer);
    const wrongs = originalOptions.map(String)
      .filter(value => meaningKey(value) !== correctKey)
      .filter((value, index, arr) => arr.findIndex(other => meaningKey(other) === meaningKey(value)) === index);
    if (originalOptions.length !== 4 || !correctKey || wrongs.length < 1) return null;

    // Do not use another card's correct answer: that was the SFP/802.3/8-bits bug.
    const wrong = wrongs[Math.floor(Math.max(0, Math.min(.999999, Number(random()) || 0)) * wrongs.length)];
    const answers = (Number(random()) || 0) < .5 ? [answer, wrong] : [wrong, answer];
    return { ...question, answers, correct: answers.indexOf(answer), answer, twoChoice: true };
  }

  function install(w) {
    if (!w || typeof w.getSection !== 'function' || typeof w.twoChoiceQuestion !== 'function') return false;
    if (w.__ccnaSection1AnswerQualityInstalled) return true;
    const section = w.getSection(SECTION_ID);
    if (!section) return false;
    const cards = relatedCards(section);
    for (const sub of section.subsections || []) {
      if (sub.type === 'learning-subsection' && typeof sub.note === 'string')
        sub.note = sanitizeLearnerNote(sub.note);
    }
    const ids = new Set(cards.map(question => question.id));
    const revised = [];
    const revisedAnswers = [];
    for (const card of cards) {
      const replacements = ANSWER_REVISIONS[card.id] || [];
      let answerChanged = false;
      for (const [oldText, newText] of replacements) {
        if (!(card.answers || []).includes(oldText)) continue;
        card.answers = card.answers.map(value => value === oldText ? newText : value);
        if (card.answer === oldText) card.answer = newText;
        answerChanged = true;
      }
      if (answerChanged) revisedAnswers.push(card.id);
      if (!Object.prototype.hasOwnProperty.call(PROMPTS, card.id)) continue;
      const newPrompt = PROMPTS[card.id];
      card.question = newPrompt;
      card.questionPl = newPrompt;
      revised.push(card.id);
    }

    const previous = w.twoChoiceQuestion;
    w.twoChoiceQuestion = function(question, pool) {
      if (!question || !(question.sectionId === SECTION_ID || ids.has(question.id)))
        return previous.call(this, question, pool);
      const safe = makeTwoChoices(question);
      return safe || previous.call(this, question, pool);
    };
    w.CCNA_SECTION1_ANSWER_AUDIT = Object.freeze({
      installed: true,
      revised: Object.freeze(revised),
      revisedAnswers: Object.freeze(revisedAnswers),
      ...audit(section)
    });
    w.__ccnaSection1AnswerQualityInstalled = true;
    return true;
  }

  return Object.freeze({ SECTION_ID, PROMPTS, ANSWER_REVISIONS, sanitizeLearnerNote, meaningKey, correctAnswer, relatedCards, makeTwoChoices, audit, install });
});

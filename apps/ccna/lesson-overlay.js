/* Load independent lesson notes into existing renderer without new UI or progress IDs.
 * Safety: equality guards prevent an old module from overwriting later edits.
 * Existing questions (including certification imports) are NEVER replaced here.
 */
(() => {
  'use strict';
  const frame = document.getElementById('appFrame');
  const status = [];
  let lastDocument = null;
  const current = () => status.map(item=>({...item}));
  window.CCNALabModuleBridge = Object.freeze({status:current});
  if (!frame) return;
  function apply() {
    const doc = frame.contentDocument;
    const w = frame.contentWindow;
    if (!doc || !w || doc === lastDocument || typeof w.getLearningSections !== 'function') return;
    lastDocument = doc;
    status.length = 0;
    for (const module of window.CCNALabLessonModules || []) {
      const section = w.getLearningSections().find(s=>s.id===module.sectionId);
      const subsection = section?.subsections?.find(s=>s.id===module.subsectionId);
      if (!subsection) {
        status.push({subsectionId:module.subsectionId,result:'MISSING_TARGET'});
        continue;
      }
      // Legacy applies the existing terminology adapter to notes before the
      // iframe finishes loading. Apply the same adapter to an isolated clone
      // of the external module before checking byte-for-byte parity.
      const candidate=JSON.parse(JSON.stringify(module.data));
      if(typeof w.CcnaVocabulary?.course==='function'){
        const isolated={sections:[{type:'part',sections:[{type:'learning-section',subsections:[candidate]}]}]};
        w.CcnaVocabulary.course(isolated);
      }
      // The original late-stage certification audit appends a details element
      // to otherwise unchanged notes AFTER terminology normalization. Preserve
      // that runtime-added supplement byte-for-byte rather than erasing it.
      const originalNote=String(subsection.note || '');
      const suffix=originalNote.startsWith(candidate.note)
        ? originalNote.slice(candidate.note.length) : null;
      const expectedSupplement=typeof suffix==='string' && (suffix==='' ||
        suffix.startsWith('<details class="ccna-question-note-supplement">'));
      if(subsection.title!==candidate.title || !expectedSupplement){
        status.push({subsectionId:module.subsectionId,result:'CONFLICT_NO_OVERRIDE'});
        continue;
      }
      // The inline legacy question consolidation may add card metadata and cards.
      // Never mutate it. Only check the original source IDs are still present.
      const ids = new Set((subsection.questions || []).map(q=>q.id));
      if ((module.data.questions || []).some(q=>!ids.has(q.id))) {
        status.push({subsectionId:module.subsectionId,result:'QUESTION_ID_CONFLICT_NO_OVERRIDE'});
        continue;
      }
      subsection.note=candidate.note+suffix; // preserve late-added certification explanations
      status.push({subsectionId:module.subsectionId,result:'ACTIVE',questionCount:(subsection.questions||[]).length});
    }
    window.dispatchEvent(new CustomEvent('ccnalab-lesson-modules-ready',{detail:current()}));
  }
  frame.addEventListener('load',apply);
  if(frame.contentDocument?.readyState==='complete')apply();
})();

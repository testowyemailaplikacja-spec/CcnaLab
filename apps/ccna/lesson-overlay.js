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
      if(subsection.title!==module.data.title || subsection.note!==module.data.note){
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
      subsection.note=module.data.note; // source is the external module, content is byte-identical
      status.push({subsectionId:module.subsectionId,result:'ACTIVE',questionCount:(subsection.questions||[]).length});
    }
    window.dispatchEvent(new CustomEvent('ccnalab-lesson-modules-ready',{detail:current()}));
  }
  frame.addEventListener('load',apply);
  if(frame.contentDocument?.readyState==='complete')apply();
})();

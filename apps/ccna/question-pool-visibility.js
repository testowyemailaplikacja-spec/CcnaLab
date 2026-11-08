// CCNA-C01: restore certification imports to existing learning pools.
// The five Day 02 video-quiz cards remain exclusive to their section exam.
(function () {
  'use strict';

  function restoreQuestionPools(courseWindow) {
    const w = courseWindow;
    if (!w || typeof w.getLearningSections !== 'function' ||
        typeof w.getRawSubsectionQuestions !== 'function' ||
        typeof w.getSubsectionQuestions !== 'function' ||
        typeof w.getContentSubsections !== 'function' ||
        typeof w.isExamOnlySubsection !== 'function') return false;
    if (w.__ccnaQuestionPoolsRestored) return true;

    const sections = w.getLearningSections();
    const videoQuizIds = new Set(sections.flatMap(section =>
      (section.subsections || []).filter(sub => sub.type === 'section-exam')
        .flatMap(sub => (sub.questions || []).filter(q => q.videoQuiz === true).map(q => q.id))
    ));
    const rawQuestions = w.getRawSubsectionQuestions;

    // Restore regular and imported examQuestion cards to flashcards, two-choice
    // practice, optional study, subsection exams and course-wide pools. Preserve
    // each original object, ID, correct answer, source and progress key.
    w.getSubsectionQuestions = function (section, subsectionId) {
      return rawQuestions.call(w, section, subsectionId).filter(question =>
        question.videoQuiz !== true && !videoQuizIds.has(question.id));
    };

    // Imported-only subsections must not disappear from the course or from
    // required learning stages just because all their cards have examQuestion.
    w.isExamOnlySubsection = function () { return false; };
    w.getContentSubsections = function (section) {
      return (section?.subsections || []).filter(sub => sub.type === 'learning-subsection');
    };

    w.CCNA_QUESTION_POOL_VISIBILITY = Object.freeze({
      restored: true,
      videoQuizCount: videoQuizIds.size,
      totalLearningQuestions: sections.reduce((count, section) =>
        count + w.getContentSubsections(section).reduce((subtotal, sub) =>
          subtotal + w.getSubsectionQuestions(section, sub.id).length, 0), 0)
    });
    w.__ccnaQuestionPoolsRestored = true;
    return true;
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { restoreQuestionPools };
  }
  if (typeof document === 'undefined') return;
  const frame = document.getElementById('appFrame');
  let installedDocument = null;
  function install() {
    const w = frame?.contentWindow;
    if (!w || installedDocument === w.document) return;
    if (restoreQuestionPools(w)) {
      installedDocument = w.document;
      // The legacy frame may have painted its landing counters before its
      // parent received the load event. Refresh only the landing view; the
      // router (registered later) owns all other deep-linked views.
      if (w.document.getElementById('adminSectionGrid') &&
          typeof w.renderAdministrativeHome === 'function') {
        w.renderAdministrativeHome();
      } else if (w.document.getElementById('sectionGrid') &&
                 typeof w.showHome === 'function') {
        w.showHome();
      }
    }
  }
  // Loaded before the CCNA router to patch pools before deep-link rendering.
  frame?.addEventListener('load', install);
  if (frame?.contentDocument?.readyState === 'complete') install();
})();

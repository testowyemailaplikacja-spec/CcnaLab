// WIEDORA-CHANGE: WD-20261029-WIE-005-REGRESSION-CODEX4 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
// Packet Lab browser tests exercise the simulator with a learner who completed the prerequisite path.
'use strict';

async function seedCompletedLearning(page, subsectionIds) {
  await page.addInitScript(ids => {
    // WIEDORA-CHANGE: WD-20261031-WIE-005-LEARNER-BOOTSTRAP-03 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (full version unknown)
    // Seed before the parent wrapper's first storage read as well as before
    // the iframe starts, so both contexts see the same prepared learner.
    if (!/^\/apps\/ccna(?:\/|$)/.test(location.pathname)) return;
    const key = 'ccna-learning-progress-v1';
    const progress = JSON.parse(localStorage.getItem(key) || '{}');
    for (const id of ids) progress['path-complete:' + id] = true;
    localStorage.setItem(key, JSON.stringify(progress));
  }, subsectionIds);
}

module.exports = { seedCompletedLearning };

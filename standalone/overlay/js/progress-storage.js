(() => {
  "use strict";

  const KEYS = Object.freeze({
    prawo: Object.freeze([
      "aplikacja-prawnicza-progress-v1",
      "aplikacja-prawnicza-study-v1",
      "aplikacja-prawnicza-binary-study-v1",
      "aplikacja-prawnicza-activity-v1",
      "aplikacja-prawnicza-unified-study-v1"
    ]),
    ccna: Object.freeze([
      "ccna-learning-progress-v1",
      "ccna-spaced-review-v1",
      "ccna-packet-labs-v1",
      "ccna-unified-study-v1"
    ]),
    fitplan: Object.freeze([
      "planer-treningowy-progress-v1.6",
      "fitplan.calendar.entries.v2",
      "fitplan.dashboard.profile.v1"
    ]),
    oficerska: Object.freeze([
      "egzaminOficerskiProgressV3",
      "egzaminOficerskiHistoriaV1",
      "egzaminOficerskiMetodykaV1",
      "egzaminOficerskiBronV1",
      "officer_exam_weapon_colloquium_study_long_v1",
      "officer_exam_oral_second_v2",
      "officer_exam_ihl_oral_v2",
      "officer_exam_collective_v2",
      "officer_exam_methodical_colloquium_v2",
      "officer_exam_methodical_colloquium_v1",
      "officer-grot-entry-v1",
      "officer_exam_lesson_concepts_v1",
      "officer_exam_instructor_concept_v1",
      "officer_exam_basic_weapon_concept_v1",
      "officer_exam_intro_concept_v1",
      "officer_exam_main_concept_v1",
      "officer_exam_final_concept_v1",
      "officer_exam_directive_concept_v1",
      "officer_exam_final_second_mphkz_v1",
      "officer_exam_final_second_szymoniak_v1",
      "officer_exam_regulations_v1",
      "officer_exam_steciuk_final_v1",
      "officer-unified-study-v1"
    ])
  });

  const ALL_KEYS = Object.freeze(Array.from(new Set(Object.values(KEYS).flat())));

  function appIdFromPath(pathname = location.pathname) {
    const match = String(pathname || "").match(/^\/apps\/([^/]+)/);
    const id = match && match[1];
    return Object.prototype.hasOwnProperty.call(KEYS, id) ? id : null;
  }

  function keysFor(appId) {
    // WIEDORA-CHANGE: WD-20261031-WIE-002-OWN-KEY-GUARD-02 | TASK: WIE-002 | AUTHOR: ChatGPT / GPT-6
    // Never read a storage key list inherited from a polluted object prototype.
    return Object.prototype.hasOwnProperty.call(KEYS, appId) ? Array.from(KEYS[appId]) : [];
  }

  function snapshot(appId) {
    const result = {};
    keysFor(appId).forEach(key => {
      try {
        const value = localStorage.getItem(key);
        result[key] = value === null ? null : value;
      } catch {
        result[key] = null;
      }
    });
    return result;
  }

  function applySnapshot(appId, storage) {
    // WIEDORA-CHANGE: WD-20261031-WIE-002-SNAPSHOT-TYPE-GUARD-03 | TASK: WIE-002 | AUTHOR: ChatGPT / GPT-6
    // A snapshot holds raw localStorage strings or null. Do not coerce objects
    // into "[object Object]" or partly restore a malformed cloud/import copy.
    // Keep the legacy null/undefined clearing behavior unchanged.
    const keys = keysFor(appId);
    if (storage !== null && typeof storage !== "undefined") {
      if (typeof storage !== "object" || Array.isArray(storage)) {
        throw new TypeError("Invalid progress snapshot");
      }
      keys.forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(storage, key)) return;
        const value = storage[key];
        if (value !== null && typeof value !== "string") {
          throw new TypeError("Invalid progress value for " + key);
        }
      });
    }
    keys.forEach(key => {
      // Older FitPlan snapshots did not contain the calendar at all.
      // An explicit null in a current snapshot still means an empty calendar.
      if (appId === "fitplan" && key === "fitplan.calendar.entries.v2" && !Object.prototype.hasOwnProperty.call(storage || {}, key)) return;
      const value = Object.prototype.hasOwnProperty.call(storage || {}, key) ? storage[key] : null;
      try {
        if (value === null || typeof value === "undefined") localStorage.removeItem(key);
        else localStorage.setItem(key, String(value));
      } catch {}
    });
  }

  function hasData(appId) {
    return keysFor(appId).some(key => {
      try { return localStorage.getItem(key) !== null; }
      catch { return false; }
    });
  }

  function clearApp(appId) {
    keysFor(appId).forEach(key => {
      try { localStorage.removeItem(key); } catch {}
    });
  }

  function clearAllTracked() {
    ALL_KEYS.forEach(key => {
      try { localStorage.removeItem(key); } catch {}
    });
  }

  function parse(value) {
    if (typeof value !== "string" || !value) return null;
    try { return JSON.parse(value); } catch { return null; }
  }

  function countTrueDeep(value, seen = new Set()) {
    if (value === true) return 1;
    if (!value || typeof value !== "object") return 0;
    if (seen.has(value)) return 0;
    seen.add(value);
    if (Array.isArray(value)) return value.reduce((sum, item) => sum + countTrueDeep(item, seen), 0);
    return Object.values(value).reduce((sum, item) => sum + countTrueDeep(item, seen), 0);
  }

  function genericSummary(appId, storage = snapshot(appId)) {
    let completedSignals = 0;
    let storedKeys = 0;
    Object.values(storage || {}).forEach(value => {
      if (value === null) return;
      storedKeys += 1;
      completedSignals += countTrueDeep(parse(value));
    });
    return {
      appId,
      storedKeys,
      completedSignals,
      percent: null,
      completed: completedSignals,
      total: null
    };
  }

  window.PortalProgressStorage = Object.freeze({
    keys: KEYS,
    allKeys: ALL_KEYS,
    appIdFromPath,
    keysFor,
    snapshot,
    applySnapshot,
    hasData,
    clearApp,
    clearAllTracked,
    parse,
    countTrueDeep,
    genericSummary
  });
})();

(() => {
  "use strict";

  const dictionaries = new Map();
  const missing = new Map();
  const missingListeners = new Set();

  const normalize = value => String(value ?? "").normalize("NFC").replace(/\s+/gu, " ").trim();
  const keyOf = value => normalize(value).toLocaleLowerCase("pl");

  function registerDictionary(namespace, entries) {
    const name = String(namespace || "shared");
    const current = dictionaries.get(name) || new Map();
    Object.entries(entries || {}).forEach(([source, target]) => {
      if (!source || typeof target !== "string") return;
      current.set(keyOf(source), target);
    });
    dictionaries.set(name, current);
    return current.size;
  }

  function lookup(value, namespace) {
    const key = keyOf(value);
    if (!key) return undefined;
    if (namespace && dictionaries.get(namespace)?.has(key)) return dictionaries.get(namespace).get(key);
    for (const dictionary of dictionaries.values()) {
      if (dictionary.has(key)) return dictionary.get(key);
    }
    return undefined;
  }

  function reportMissing(value, context = "ui") {
    const text = normalize(value);
    if (!text || text.length > 180 || !/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/u.test(text)) return;
    const key = context + "::" + text;
    const item = missing.get(key) || { text, context, count: 0 };
    item.count += 1;
    missing.set(key, item);
    missingListeners.forEach(listener => { try { listener({ ...item }); } catch {} });
  }

  function getMissing() {
    return Array.from(missing.values()).sort((a, b) => b.count - a.count || a.text.localeCompare(b.text, "pl"));
  }

  function clearMissing() { missing.clear(); }

  function onMissing(listener) {
    if (typeof listener !== "function") return () => {};
    missingListeners.add(listener);
    return () => missingListeners.delete(listener);
  }

  window.PortalI18n = Object.freeze({
    normalize,
    registerDictionary,
    lookup,
    reportMissing,
    getMissing,
    clearMissing,
    onMissing
  });
})();
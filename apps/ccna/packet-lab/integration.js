(() => {
  'use strict';
  const frame = document.getElementById('appFrame');
  const STORAGE_KEY = 'ccna-packet-labs-v1';
  // CCNA-C01-20261031-D02-LAB-GUEST | AUTHOR: ChatGPT / GPT-6
  // Guest Day 02 progress is device-local, never written to another account or synced.
  const GUEST_DAY02_KEY = 'ccna-day02-connecting-devices-guest-v1';
  const isGuestDay02 = (sectionId, subsectionId) => sectionId === 'interfejsy-sieciowe-i-okablowanie' && subsectionId === 'topologia-laboratorium';
  // WIEDORA-CHANGE: WD-20261030-WIE-195-KEYBOARD | TASK: WIE-195 | AUTHOR: Codex / GPT-6
  // WIEDORA-CHANGE: WD-20261031-WIE-195-POSTDRAG-KEYBOARD-01 | TASK: WIE-195 | AUTHOR: Codex / GPT-6 (full version unknown)
  const LAB_RELEASE = '20261031-postdrag-keyboard-1';
  const PACKET_RELEASE = '20261024-bugfix-1';
  const sessions = new Map();
  const style = document.createElement('style');
  style.textContent = 'html.ccna-lab-active .portal-home-link,html.ccna-lab-active .portal-preferences,html.ccna-lab-active .offline-control,html.ccna-lab-active .offline-toast{display:none!important}';
  document.head.appendChild(style);
  const client = window.AppSupabase;
  let sessionUserId = null;
  const identityReady = client ? client.auth.getSession().then(({data}) => { sessionUserId = data?.session?.user?.id || null; }).catch(() => {}) : Promise.resolve();
  client?.auth.onAuthStateChange((_event, session) => { sessionUserId = session?.user?.id || null; });
  const owner = () => document.documentElement.dataset.portalAuth === 'user' ? sessionUserId : null;
  let loading;
  let installedDocument;
  function authReady() {
    if (document.documentElement.dataset.portalAuth) return Promise.resolve();
    return new Promise(resolve => {
      const finish = () => { observer.disconnect(); clearTimeout(timeout); resolve(); };
      const observer = new MutationObserver(() => { if (document.documentElement.dataset.portalAuth) finish(); });
      const timeout = setTimeout(finish, 10000);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-portal-auth'] });
    });
  }
  function readAll() {
    const id = owner();
    if (!id) return {};
    try { const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); return data?.version === 1 && data.owner === id ? data.labs || {} : {}; } catch { return {}; }
  }
  function save(key, state) {
    const id = owner();
    if (!id) return false;
    sessions.set(id + ':' + key, state);
    const labs = readAll(); labs[key] = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, owner: id, labs }));
    window.dispatchEvent(new CustomEvent('portal-sync-request', { detail: { appId: 'ccna' } }));
    return true;
  }
  function read(key) {
    const id = owner();
    return id ? sessions.get(id + ':' + key) || readAll()[key] || null : null;
  }
  function readGuestDay02(key) {
    try { const data = JSON.parse(localStorage.getItem(GUEST_DAY02_KEY) || 'null'); return data?.version === 1 && data.lab === key ? data.state || null : null; }
    catch { return null; }
  }
  function saveGuestDay02(key, state) {
    try { localStorage.setItem(GUEST_DAY02_KEY, JSON.stringify({ version: 1, lab: key, state })); return true; }
    catch { return false; }
  }
  function loadAssets(w) {
    if (w.CcnaPacketLabUI) return Promise.resolve();
    if (loading) return loading;
    const doc = w.document;
    const link = doc.createElement('link'); link.rel = 'stylesheet'; link.href = '/apps/ccna/packet-lab/lab.css?v=' + PACKET_RELEASE; doc.head.appendChild(link);
    // WIEDORA-CHANGE: WD-20261030-WIE-195-KEYBOARD | TASK: WIE-195 | AUTHOR: Codex / GPT-6
    const loadScript = name => new Promise((resolve, reject) => { const s = doc.createElement('script'); s.src = '/apps/ccna/packet-lab/' + name + '?v=' + (name === 'lab.js' ? LAB_RELEASE : PACKET_RELEASE); s.onload = resolve; s.onerror = () => { s.remove(); reject(new Error('Nie udało się wczytać laboratorium. Sprawdź połączenie i spróbuj ponownie.')); }; doc.body.appendChild(s); });
    loading = ['devices.js','ethernet.js','protocols.js','wireless.js','protocol-cli.js','cli.js','engine.js','curriculum.js','scenario-extensions.js','scenarios.js','wlc-ui.js','lab.js'].reduce((promise, name) => promise.then(() => loadScript(name)), Promise.resolve()).catch(error => { loading = null; throw error; });
    return loading;
  }
  function install() {
    const w = frame.contentWindow, original = w.renderSubsection;
    if (typeof original !== 'function' || installedDocument === w.document) return;
    installedDocument = w.document;
    loading = null;
    w.renderSubsection = function(sectionId, subsectionId, mode = 'note') {
      const networkMode = mode === 'packet-lab' || mode.startsWith('packet-lab:') || mode === 'simulator';
      const result = original.call(this, sectionId, subsectionId, networkMode ? 'note' : mode);
      const doc = w.document, tabs = doc.querySelector('.section-mode-tabs'), host = doc.getElementById('subsectionModeContent');
      if (!tabs || !host) return result;
      let flashcardsDone = false;
      try {
        const section = typeof w.getSection === 'function' ? w.getSection(sectionId) : null;
        const subsection = section && typeof w.getSubsection === 'function' ? w.getSubsection(section, subsectionId) : null;
        const path = subsection && typeof w.qualificationPathStatus === 'function' ? w.qualificationPathStatus(section, subsection) : null;
        flashcardsDone = path?.flashcardsDone === true;
      } catch {}
      // CCNA-C01-20261031-D02-LAB | AUTHOR: ChatGPT / GPT-6
      // The standalone Day 02 cabling exercise has no flashcard prerequisite of its own.
      const labLocked = subsectionId !== 'topologia-laboratorium' && !flashcardsDone;
      const activeNetworkMode = networkMode && !labLocked;
      const button = doc.createElement('button'); button.className = 'pill-button' + (activeNetworkMode ? ' active' : ''); button.type = 'button'; button.textContent = 'Laboratorium sieciowe'; button.dataset.subMode = 'packet-lab';
      button.disabled = labLocked;
      if (labLocked) button.title = 'Najpierw ukończ obowiązkowe fiszki.';
      tabs.querySelector('[data-sub-mode="simulator"]')?.remove();
      button.onclick = () => w.renderSubsection(sectionId, subsectionId, 'packet-lab');
      tabs.insertBefore(button, tabs.querySelector('[data-sub-mode="exam"]') || tabs.querySelector('[data-sub-mode="study"]') || null);
      if (networkMode && labLocked) return result;
      if (networkMode) {
        tabs.querySelectorAll('[data-sub-mode]').forEach(b => b.classList.toggle('active', b === button));
        host.innerHTML = '<p role="status">Wczytywanie laboratorium sieciowego…</p>';
        Promise.all([authReady(), identityReady]).then(async () => {
          if (!host.isConnected) return;
          const currentOwner = owner();
          // Only the standalone Day 02 lab may run anonymously while WIE-007 guest access is active.
          const guestDay02 = isGuestDay02(sectionId, subsectionId) && document.documentElement.dataset.portalAuth === 'guest';
          if (!guestDay02 && (document.documentElement.dataset.portalAuth !== 'user' || !currentOwner)) {
            host.innerHTML = '<p>To laboratorium jest dostępne po zalogowaniu.</p>';
            const login = doc.createElement('a'); login.className = 'action-button primary'; login.textContent = 'Zaloguj się'; login.target = '_top'; login.href = '/?konto=login&return=' + encodeURIComponent(location.pathname + location.search); host.appendChild(login); return;
          }
          await loadAssets(w);
          if (!host.isConnected || (guestDay02 ? document.documentElement.dataset.portalAuth !== 'guest' : owner() !== currentOwner)) return;
          const scenario = w.CcnaLabScenarios.resolve(sectionId, subsectionId, mode.startsWith('packet-lab:') ? mode.slice(11) : '');
          if (!scenario) throw new Error('Nie znaleziono scenariusza tego tematu.');
          host.replaceChildren();
          document.documentElement.classList.add('ccna-lab-active');
          let authWatch;
          const active = w.CcnaPacketLabUI.mount(host, {
            scenario,
            initial: guestDay02 ? readGuestDay02(scenario.id) : read(scenario.id),
            navigate: (sid, subid, variant) => w.renderSubsection(sid, subid, 'packet-lab' + (variant ? ':' + variant : '')),
            save: state => guestDay02 ? document.documentElement.dataset.portalAuth === 'guest' && saveGuestDay02(scenario.id, state) : owner() === currentOwner ? save(scenario.id, state) : false,
            onSynced: callback => { const handler = event => { if (event.detail?.appId === 'ccna' && event.detail?.userId === currentOwner) callback(); }; window.addEventListener('portal-progress-synced', handler); return () => window.removeEventListener('portal-progress-synced', handler); },
            disposed: () => { authWatch?.disconnect(); document.documentElement.classList.remove('ccna-lab-active'); },
            close: () => w.renderSubsection(sectionId, subsectionId, 'note')
          });
          authWatch = new MutationObserver(() => {
            if (guestDay02 ? document.documentElement.dataset.portalAuth !== 'guest' : owner() !== currentOwner) { active.dispose(); w.renderSubsection(sectionId, subsectionId, 'note'); }
          });
          authWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-portal-auth'] });
        }).catch(error => { if (host.isConnected) { host.textContent = error.message; const retry=doc.createElement('button');retry.className='action-button';retry.textContent='Spróbuj ponownie';retry.onclick=button.onclick;host.appendChild(retry); } });
      }
      return result;
    };
  }
  frame?.addEventListener('load', install);
  if (frame?.contentDocument?.readyState === 'complete') install();
})();

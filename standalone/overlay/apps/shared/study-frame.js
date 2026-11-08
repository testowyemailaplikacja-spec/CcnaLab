(() => {
  'use strict';
  const frame = document.getElementById('appFrame');
  const app = location.pathname.split('/')[2];
  if (!frame || !['ccna', 'oficerska'].includes(app)) return;
  const release = (() => {
    try { return new URL(document.currentScript?.src || location.href).searchParams.get('v') || ''; }
    catch { return ''; }
  })();
  const versioned = src => release ? `${src}?v=${encodeURIComponent(release)}` : src;
  let installed;
  async function install() {
    const doc = frame.contentDocument;
    if (!doc?.body || doc === installed) return;
    installed = doc;
    const css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = '/apps/shared/study-mode.css'; doc.head.append(css);
    const script = src => new Promise((resolve, reject) => { const node = doc.createElement('script'); node.src = src; node.onload = resolve; node.onerror = reject; doc.body.append(node); });
    try {
      await script('/apps/shared/study-mode.js');
      if (doc !== frame.contentDocument) return;
      if (app === 'oficerska') await script('/apps/oficerska/study-banks.js');
      if (doc !== frame.contentDocument) return;
      await script(versioned(`/apps/${app}/study-adapter.js`));
      if (doc === frame.contentDocument) window.dispatchEvent(new CustomEvent('portal-study-ready'));
    } catch { console.error('[study mode] Could not load the shared study interface.'); }
  }
  frame.addEventListener('load', install);
  if (frame.contentDocument?.readyState === 'complete') install();
})();

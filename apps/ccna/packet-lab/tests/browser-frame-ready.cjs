const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.CCNA_LAB_PLAYWRIGHT || 'playwright');
const repo = path.resolve(__dirname, '../../../..');
const server = http.createServer((req, res) => {
  let file = path.join(repo, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!fs.existsSync(file) && req.url.startsWith('/apps/ccna/')) file = path.join(repo, 'apps/ccna/index.html');
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[path.extname(file)] || 'text/plain');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CCNA_BROWSER_PATH || undefined, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  try {
    const page = await browser.newPage({ serviceWorkers: 'block' });
    // WIEDORA-CHANGE: WD-20261029-WIE-005-REGRESSION-CODEX4 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
    // This scenario checks a completed learner's lab; an empty profile is correctly gated by flashcards.
    await page.addInitScript(() => {
      if (location.pathname.endsWith('/apps/ccna/legacy.html')) {
        localStorage.setItem('ccna-learning-progress-v1', JSON.stringify({
          'path-complete:anki-ipv6': true,
          'path-complete:anki-wireless-config': true
        }));
      }
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://**/*', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
    await page.route('**/js/supabase-client.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.AppSupabase={rpc:async()=>({error:null}),auth:{getSession:async()=>({data:{session:{user:{id:"ccna-ready-test",email:"test@example.invalid"}}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:()=>({select(){return this},eq(){return this},upsert(){return this},maybeSingle:async()=>({data:null}),single:async()=>({data:{revision:1,updated_at:new Date().toISOString()}})})};' }));
    let frameReadyBeforeHooks = false;
    // Force the actual iframe load to finish before the integration and router arrive.
    // WIEDORA-CHANGE: WD-20261029-WIE-005-REGRESSION-CODEX3 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
    await page.route('**/packet-lab/integration.js**', async r => {
      await page.waitForFunction(() => {
        const w = document.getElementById('appFrame')?.contentWindow;
        return w?.document.readyState === 'complete' && typeof w.renderSubsection === 'function';
      });
      frameReadyBeforeHooks = true;
      await r.continue();
    });
    await page.goto(origin + '/apps/ccna/sekcja/ccna-ipv6/temat/anki-ipv6/?tryb=packet-lab:ipv6-slaac');
    assert.equal(frameReadyBeforeHooks, true);
    const f = page.frameLocator('#appFrame');
    await f.locator('.pt-lab').waitFor({ timeout: 5000 });
    assert.equal(await f.locator('.pt-lab').count(), 1);
    assert.match(await page.title(), /^Temat CCNA \|/);
    assert.match(await page.locator('link[rel="canonical"]').getAttribute('href'), /\/sekcja\/ccna-ipv6\/temat\/anki-ipv6\/$/);
    assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /^noindex,/);
    console.log('PASS direct advanced lab when iframe finishes before integration/router');
    await f.locator('[data-action="labs"]').click();
    await f.locator('#ptFindLab').fill('WLC');
    await f.locator('[data-lab-variant="wlc-wlan"]').first().click();
    await f.locator('[data-device="WLC1"]').waitFor();
    assert.match(page.url(), /ccna-wireless-config.*tryb=packet-lab(?:%3A|:)wlc-wlan/);
    await page.goBack();
    await f.locator('[data-device="R1"]').waitFor();
    assert.equal(await f.locator('[data-device="WLC1"]').count(), 0);
    console.log('PASS lab navigation and browser Back after late installation');
    const navigated = page.waitForEvent('framenavigated', frame => frame.url().includes('/legacy.html'));
    await page.evaluate(() => document.getElementById('appFrame').contentWindow.location.reload());
    await navigated;
    await f.locator('.pt-lab').waitFor();
    assert.equal(await f.locator('.pt-lab').count(), 1);
    await page.evaluate(() => document.getElementById('appFrame').dispatchEvent(new Event('load')));
    assert.equal(await f.locator('.pt-lab').count(), 1);
    assert.deepEqual(errors, []);
    console.log('PASS iframe reload and repeated load event without duplicate initialization or JS errors');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });

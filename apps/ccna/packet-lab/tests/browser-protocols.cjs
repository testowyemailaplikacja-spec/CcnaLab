const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.CCNA_LAB_PLAYWRIGHT || 'playwright');
const { seedCompletedLearning } = require('./browser-learner-fixture.cjs');
const repo = path.resolve(__dirname, '../../../..');
const output = process.env.CCNA_LAB_REPORT_DIR || '/tmp/ccna-lab-browser-results';
fs.mkdirSync(output, { recursive: true });
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
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, serviceWorkers: 'block' });
    // WIEDORA-CHANGE: WD-20261029-WIE-005-REGRESSION-CODEX4 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
    await seedCompletedLearning(page, ['anki-ospf', 'anki-dhcp', 'anki-nat', 'anki-ipv6', 'anki-wireless-config']);
    page.setDefaultTimeout(10000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.route('https://**/*', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
    await page.route('**/js/supabase-client.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.AppSupabase={rpc:async()=>({error:null}),auth:{getSession:async()=>({data:{session:{user:{id:"ccna-ui-protocols",email:"test@example.invalid"}}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:()=>({select(){return this},eq(){return this},upsert(){return this},maybeSingle:async()=>({data:null}),single:async()=>({data:{revision:1,updated_at:new Date().toISOString()}})})};' }));
    const f = page.frameLocator('#appFrame');
    const close = () => f.locator('[data-close-dialog]').click();
    const device = id => f.locator(`[data-device="${id}"]`).click();
    async function open(sid, sub, variant = '') {
      if (await f.locator('.pt-lab').count()) await f.locator('[data-action="close"]').click();
      await page.goto(origin + '/apps/ccna/sekcja/' + sid + '/temat/' + sub + '/?tryb=packet-lab' + (variant ? ':' + variant : ''));
      await f.locator('.pt-lab').waitFor();
    }
    async function commands(id, lines, host = false) {
      await device(id); if (host) await f.locator('[data-desktop="command"]').click();
      for (const line of lines) {
        const previousPings = /^ping\s/i.test(line) ? ((await f.locator('.pt-terminal-output').innerText()).match(/Received = \d/g) || []).length : 0;
        await f.locator('#ptCommand').fill(line); await f.locator('#ptCommand').press('Enter');
        // WIEDORA-CHANGE: WD-20261029-WIE-005-REGRESSION-CODEX4 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
        if (/^ping\s/i.test(line)) await f.locator('.pt-terminal-output').evaluate((el, prior) => new Promise((resolve, reject) => {
          const deadline = Date.now() + 10000;
          const check = () => {
            if ((el.textContent.match(/Received = \d/g) || []).length > prior) resolve();
            else if (Date.now() > deadline) reject(new Error('Ping did not finish'));
            else setTimeout(check, 40);
          };
          check();
        }), previousPings);
      }
      const result = await f.locator('.pt-terminal-output').innerText(); await close(); return result;
    }
    async function score() { await f.locator('[data-action="check"]').click(); const result = await f.locator('.pt-score').innerText(); await close(); return result; }
    await open('ccna-ospf', 'anki-ospf');
    await f.locator('[data-action="labs"]').click(); await f.locator('#ptFindLab').fill('DR/BDR');
    await f.locator('[data-lab-variant="ospf-broadcast"]').first().click();
    await f.locator('[data-device="R4"]').waitFor();
    for (let i = 1; i <= 4; i++) {
      const result = await commands('R' + i, ['en', 'conf t', 'int gi0/0', 'ip ospf priority ' + [200, 100, 0, 0][i - 1], 'router ospf 1', 'router-id ' + [i, i, i, i].join('.'), 'net 10.0.0.0 0.255.255.255 area 0', 'end']);
      assert.doesNotMatch(result, /% Invalid|% Ambiguous/);
    }
    assert.match(await commands('R3', ['sh ip ospf nei']), /2-WAY\/DROTHER/);
    await commands('R4', ['conf t', 'int gi0/0', 'ip ospf hello-interval 5', 'end']);
    assert.match(await commands('R3', ['sh ip ospf nei detail']), /Hello\/Dead interval mismatch/);
    await commands('R4', ['conf t', 'int gi0/0', 'no ip ospf hello-interval', 'mtu 1400', 'end']);
    assert.match(await commands('R1', ['sh ip ospf nei detail']), /EXSTART/);
    await commands('R4', ['conf t', 'int gi0/0', 'mtu 1500', 'end']);
    assert.match(await commands('R3', ['ping 10.4.0.1', 'sh ip ro']), /Received = 5/);
    assert.match(await score(), /100%/); console.log('PASS advanced OSPF: DR/BDR, 2-WAY, timer/MTU diagnosis, repair, 100%');
    await open('ccna-dhcp', 'anki-dhcp', 'dhcp-relay');
    await device('SRV1'); await f.locator('[data-tab="Services"]').click();
    await f.locator('input[name="dhcp"]').check();
    await f.locator('details').filter({ hasText: 'DHCP pool' }).locator('summary').click();
    for (const [name, value] of [['network', '10.0.10.0'], ['mask', '255.255.255.0'], ['gateway', '10.0.10.1'], ['dns', '10.0.20.53']]) await f.locator(`input[name="pool-${name}"]`).fill(value);
    await f.getByRole('button', { name: 'Zapisz usługi', exact: true }).click(); await close();
    await commands('R1', ['en', 'conf t', 'int gi0/0', 'ip helper-address 10.0.20.53', 'end']);
    assert.match(await commands('PC1', ['ipconfig /renew'], true), /timeout/);
    await commands('R2', ['en', 'conf t', 'ip route 10.0.10.0 255.255.255.0 10.0.12.1', 'end']);
    assert.match(await commands('PC1', ['ipconfig /renew', 'ping 10.0.20.53'], true), /DHCP ACK: 10.0.10.100/);
    await commands('R1', ['sh ip int gi0/0']); assert.match(await score(), /100%/); console.log('PASS DHCP relay GUI, missing return route, lease, 100%');
    await open('ccna-nat', 'anki-nat', 'nat-pool');
    await commands('R1', ['en', 'conf t', 'int gi0/0', 'ip nat inside', 'int gi0/1', 'ip nat outside', 'exit', 'access-list 1 permit 10.0.10.0 0.0.0.255', 'ip nat pool PUBLIC 203.0.113.1 203.0.113.2 netmask 255.255.255.248', 'ip nat inside source list 1 pool PUBLIC', 'end']);
    for (const id of ['PC1', 'PC3']) assert.match(await commands(id, ['ping 10.0.20.12'], true), /Received = 4/);
    assert.match(await commands('PC4', ['ping 10.0.20.12'], true), /Received = 0/);
    await commands('R1', ['clear ip nat translation *', 'conf t', 'no ip nat inside source list 1 pool PUBLIC', 'ip nat inside source list 1 pool PUBLIC overload', 'end']);
    for (const id of ['PC1', 'PC3', 'PC4']) assert.match(await commands(id, ['ping 10.0.20.12'], true), /Received = 4/);
    await commands('R1', ['sh ip nat stat']); assert.match(await score(), /100%/); console.log('PASS dynamic NAT exhaustion, PAT repair, 100%');
    await open('ccna-ipv6', 'anki-ipv6', 'ipv6-slaac');
    for (const [id, own, other, network] of [['R1', '1', '2', '20'], ['R2', '2', '1', '10']]) await commands(id, ['en', 'conf t', 'ipv6 unicast-routing', 'int gi0/0', 'ipv6 address fe80::1 link-local', 'int gi0/1', 'ipv6 address fe80::12:' + own + ' link-local', 'exit', 'ipv6 route 2001:db8:' + network + '::/64 gi0/1 fe80::12:' + other, 'end']);
    for (const [id, network, suffix] of [['PC1', '10', '1'], ['PC2', '20', '2']]) {
      await device(id); await f.locator('[data-desktop="ip"]').click(); await f.locator('#ptSlaac').click();
      assert.equal(await f.locator('input[name="ipv6"]').inputValue(), `2001:db8:${network}:0:2d0:baff:fe00:${suffix}/64`);
      assert.equal(await f.locator('input[name="ipv6Gateway"]').inputValue(), 'fe80::1'); await close();
    }
    assert.match(await commands('PC1', ['ping 2001:db8:20:0:2d0:baff:fe00:2', 'ping fe80::1', 'ipconfig /all'], true), /Received = 4/);
    await commands('R1', ['sh ipv6 nei']); assert.match(await score(), /100%/); console.log('PASS IPv6 SLAAC GUI, scoped link-local gateways, routed ping, 100%');
    await open('ccna-wireless-config', 'anki-wireless-config', 'wlc-wlan');
    for (const id of ['SW1', 'SW2']) await commands(id, ['en', 'conf t', 'vlan 20', 'exit', 'int gi0/1', 'switchport mode trunk', 'switchport trunk allowed vlan 1,20', 'end']);
    await commands('SW1', ['conf t', 'int fa0/1', 'switchport mode trunk', 'switchport trunk allowed vlan 1,20', 'end']);
    await commands('SW2', ['conf t', 'int fa0/1', 'switchport mode access', 'switchport access vlan 20', 'end']);
    await device('PC3'); await f.locator('[data-desktop="browser"]').click(); await f.locator('#ptBrowserUrl').fill('https://10.0.10.2'); await f.locator('#ptBrowse').click();
    await f.locator('[data-wlc-page="interfaces"]').click(); await f.locator('[data-new-interface]').click();
    for (const [name, value] of [['name', 'users'], ['vlan', '20'], ['ip', '10.20.0.2'], ['mask', '255.255.255.0']]) await f.locator(`input[name="${name}"]`).fill(value);
    await f.getByRole('button', { name: 'Apply', exact: true }).click(); assert.match(await f.locator('.pt-wlc .pt-form-status').innerText(), /applied/);
    await f.locator('[data-wlc-page="wlans"]').click(); await f.locator('[data-new-wlan]').click();
    for (const [name, value] of [['name', 'STUDENTS'], ['ssid', 'CCNA-LAB'], ['key', 'ccna2026']]) await f.locator(`input[name="${name}"]`).fill(value);
    await f.locator('input[name="enabled"]').check(); await f.locator('select[name="interface"]').selectOption('users'); await f.getByRole('button', { name: 'Apply', exact: true }).click(); await close();
    await device('PC1'); await f.locator('[data-desktop="wireless"]').click(); await f.locator('input[name="ssid"]').fill('CCNA-LAB'); await f.locator('select[name="security"]').selectOption('wpa2'); await f.locator('input[name="key"]').fill('ccna2026'); await f.getByRole('button', { name: 'Zastosuj WLAN', exact: true }).click(); await close();
    assert.match(await commands('PC1', ['ping 10.20.0.12'], true), /Received = 4/);
    await device('WLC1'); await f.locator('[data-wlc-page="aps"]').click(); assert.match(await f.locator('.pt-wlc-content').innerText(), /Joined/);
    await f.locator('[data-wlc-page="clients"]').click(); assert.match(await f.locator('.pt-wlc-content').innerText(), /CCNA-LAB/); await close(); assert.match(await score(), /100%/);
    await page.screenshot({ path: path.join(output, 'v3-wlc-topology.png') }); console.log('PASS WLC GUI through routed PC Web Browser, VLAN/WPA2, client list, 100%');
    await f.locator('.pt-kind').selectOption('wlc'); assert.equal(await f.locator('[data-add="WLC-2504"]').count(), 1);
    for (const [width, height] of [[834, 1112], [390, 844], [360, 740]]) {
      await page.setViewportSize({ width, height }); await device('WLC1'); await f.locator('[data-wlc-page="clients"]').click();
      const dialog = await f.locator('.pt-dialog').boundingBox(); assert.ok(dialog.width <= width);
      const overflow = await f.locator('.pt-wlc').evaluate(el => el.scrollWidth > el.clientWidth + 1); assert.equal(overflow, false);
      await page.screenshot({ path: path.join(output, `v3-wlc-${width}.png`) }); await close();
    }
    await page.setViewportSize({ width: 1366, height: 900 });
    await open('ccna-ospf', 'anki-ospf', 'ospf-broadcast'); assert.match(await score(), /100%/);
    await open('ccna-ipv6', 'anki-ipv6', 'ipv6-slaac'); assert.match(await commands('PC1', ['ipconfig /all'], true), /IPv6 Method: slaac/);
    await f.locator('[data-action="close"]').click();
    const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('ccna-packet-labs-v1')));
    for (const key of ['ccna-ospf:anki-ospf:ospf-broadcast', 'ccna-dhcp:anki-dhcp:dhcp-relay', 'ccna-nat:anki-nat:nat-pool', 'ccna-ipv6:anki-ipv6:ipv6-slaac', 'ccna-wireless-config:anki-wireless-config:wlc-wlan']) assert.ok(saved.labs[key], key);
    assert.ok(saved.labs['ccna-ospf:anki-ospf']); assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'browser-v3-results.json'), JSON.stringify({ passed: true, completedLabs: ['OSPF DR/BDR', 'DHCP relay', 'NAT pools', 'IPv6 SLAAC', 'WLC GUI'], jsErrors: errors, auth: 'local stub, no production changes' }, null, 2));
    console.log('PASS independent basic/advanced saves, SLAAC restore, WLC mobile/tablet, no JavaScript errors');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });

// Real browser smoke tests against the independent Wiedora CCNAlab Beta preview.
// No credentials. Uses a new browser profile and never touches other users' data.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const origin=(process.env.CCNALAB_E2E_ORIGIN||
 'https://deploy-preview-198--constant-app.netlify.app').replace(/\/$/,'');
const base=origin+'/apps/ccnalab-beta/';
const sha=process.env.CCNALAB_EXPECTED_SHA||'25d4f3a7ab55ce66b68436795920eec5b24ccfce';
const marker=name=>console.log('[CCNAlab browser]',name,'PASS');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({
  viewport:{width:1280,height:850},serviceWorkers:'allow',acceptDownloads:true
 });
 const page=await context.newPage();
 page.setDefaultTimeout(18000);
 const pageErrors=[];
 page.on('pageerror',err=>pageErrors.push(err.message.slice(0,170)));
 let phase='initialization';
 try{
  phase='Netlify preview and beta source SHA';
  const resp=await page.request.get(base+'beta-sw.js',{timeout:20000});
  assert.equal(resp.status(),200,'Preview service worker unavailable');
  const worker=await resp.text();
  assert.ok(worker.includes("const APP_ROOT='/apps/ccnalab-beta/'"),'Worker scope mismatch');
  assert.ok(worker.includes('ccnalab-beta-offline-'+sha.slice(0,12)),'Source SHA mismatch');
  assert.ok(!worker.includes('ccnalab-betalab-beta'),'Broken beta URL rewrite');
  marker(phase);

  phase='two visible apps / old CCNA preserved';
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.locator('article[data-app="ccnalab-beta"]').waitFor();
  assert.equal(await page.locator('article[data-app="ccna"]').count(),1);
  const old=await page.request.get(origin+'/apps/ccna/index.html');
  assert.equal(old.status(),200);
  const oldHtml=await old.text();
  assert.ok(oldHtml.includes('<base href="/apps/ccna/">'));
  assert.ok(!oldHtml.includes('ccnalab-beta-stagebar'));
  marker(phase);

  phase='beta iframe and backup export';
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('#ccnalab-beta-backup').waitFor();
  await page.frameLocator('#appFrame').getByText('Cyberbezpieczeństwo i CCNA',{exact:false}).first().waitFor();
  await page.evaluate(()=>{
   localStorage.setItem('ccna-unified-study-v1','ORIGINAL-SHOULD-NEVER-BE-EXPORTED');
   localStorage.setItem('ccnalab-beta:v1:ccna-spaced-review-v1',
     JSON.stringify({schema:1,cards:{testCard:{reviews:2}}}));
  });
  const downloadPending=page.waitForEvent('download');
  await page.getByRole('button',{name:'Eksportuj postęp'}).click();
  const download=await downloadPending;
  const snapshot=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  assert.equal(snapshot.app,'ccnalab-beta');
  assert.equal(snapshot.data['ccna-spaced-review-v1'].includes('"reviews":2'),true);
  assert.ok(!JSON.stringify(snapshot).includes('ORIGINAL-SHOULD-NEVER-BE-EXPORTED'));
  marker(phase);

  phase='reject untrusted backup keys and import valid beta backup';
  const bad=JSON.parse(JSON.stringify(snapshot));
  bad.data['unrelated-ccna-key']='{}';
  await page.locator('#ccnalab-beta-backup input[type=file]').setInputFiles({
   name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))
  });
  await page.getByText('Kopia zawiera nieznane klucze',{exact:false}).waitFor();
  await page.evaluate(()=>localStorage.setItem('ccnalab-beta:v1:ccna-spaced-review-v1','{"schema":1,"cards":{}}'));
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#ccnalab-beta-backup input[type=file]').setInputFiles({
   name:'valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(snapshot))
  });
  await page.getByText('Zaimportowano postęp bety',{exact:false}).waitFor();
  const stored=await page.evaluate(()=>({
   beta:JSON.parse(localStorage.getItem('ccnalab-beta:v1:ccna-spaced-review-v1')),
   old:localStorage.getItem('ccna-unified-study-v1')
  }));
  assert.equal(stored.beta.cards.testCard.reviews,2);
  assert.equal(stored.old,'ORIGINAL-SHOULD-NEVER-BE-EXPORTED');
  marker(phase);

  phase='local-only study progress notice';
  const study=base+'sekcja/interfejsy-sieciowe-i-okablowanie/temat/ethernet-standardy-i-predkosc/';
  await page.goto(study,{waitUntil:'domcontentloaded'});
  let frame=page.frameLocator('#appFrame');
  await frame.getByRole('button',{name:'Tryb nauki'}).click();
  await frame.getByRole('button',{name:'Rozpocznij naukę A/B'}).click();
  const notice=await frame.locator('.study-guest').innerText();
  assert.match(notice,/postęp zapisuje się lokalnie/i);
  assert.ok(!notice.includes('Zaloguj się'));
  marker(phase);

  phase='phone Packet Lab 44px controls';
  await page.setViewportSize({width:390,height:844});
  const lab=base+'sekcja/interfejsy-sieciowe-i-okablowanie/temat/topologia-laboratorium/';
  await page.goto(lab,{waitUntil:'domcontentloaded'});
  frame=page.frameLocator('#appFrame');
  await frame.getByRole('button',{name:'Laboratorium sieciowe'}).click();
  const tool=frame.locator('.pt-toolbar button').first();
  await tool.waitFor({timeout:25000});
  const bounds=await tool.evaluate(element=>{
   const rect=element.getBoundingClientRect();return {width:rect.width,height:rect.height};
  });
  assert.ok(bounds.width>=43&&bounds.height>=43,'Small touch target '+JSON.stringify(bounds));
  marker(phase);

  phase='active beta worker and complete cached offline package';
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(async()=>{
   const r=await navigator.serviceWorker.getRegistration('/apps/ccnalab-beta/');
   if(!r?.active||!r.active.scriptURL.includes('beta-sw.js'))return false;
   const names=(await caches.keys()).filter(x=>x.startsWith('ccnalab-beta-offline-'));
   for(const name of names){
    const cache=await caches.open(name);
    const metadata=await cache.match('/apps/ccnalab-beta/.offline-cache-state.json');
    if(!metadata)continue;
    const status=await metadata.json().catch(()=>null);
    if(!status?.complete)return false;
    const assets=['index.html','legacy.html','packet-lab/engine.js','study-mode-beta.js'];
    return (await Promise.all(assets.map(x=>cache.match('/apps/ccnalab-beta/'+x)))).every(Boolean);
   }
   return false;
  },undefined,{timeout:95000});
  await page.waitForFunction(()=>document.getElementById('ccnalab-beta-offline-status')
   ?.textContent?.includes('pełny pakiet bety zapisany'),undefined,{timeout:18000});
  marker(phase);

  phase='offline reload of full course and first lab';
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>navigator.serviceWorker.controller
    ?.scriptURL.includes('/apps/ccnalab-beta/beta-sw.js'),undefined,{timeout:25000});
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:18000});
  await page.frameLocator('#appFrame').getByText('Cyberbezpieczeństwo i CCNA',{exact:false}).first().waitFor();
  await page.goto(lab,{waitUntil:'domcontentloaded',timeout:18000});
  frame=page.frameLocator('#appFrame');
  await frame.getByRole('button',{name:'Laboratorium sieciowe'}).click();
  await frame.locator('.pt-toolbar button').first().waitFor({timeout:20000});
  marker(phase);

  phase='old CCNA local progress still untouched';
  await context.setOffline(false);
  assert.equal(await page.evaluate(()=>localStorage.getItem('ccna-unified-study-v1')),
   'ORIGINAL-SHOULD-NEVER-BE-EXPORTED');
  marker(phase);
  if(pageErrors.length)console.warn('[CCNAlab browser] unrelated page errors:',JSON.stringify(pageErrors.slice(0,5)));
  console.log('[CCNAlab browser] ALL 8 SCENARIOS PASS');
 }catch(err){
  console.error('[CCNAlab browser] FAILED PHASE:',phase);
  console.error('[CCNAlab browser] ERROR:',err.stack||err);
  console.error('[CCNAlab browser] pageErrors:',JSON.stringify(pageErrors.slice(0,8)));
  process.exitCode=1;
 }finally{
  try{await context.setOffline(false)}catch{}
  await browser.close();
 }
})().catch(err=>{console.error('[CCNAlab browser] FATAL',err.stack||err);process.exitCode=1;});

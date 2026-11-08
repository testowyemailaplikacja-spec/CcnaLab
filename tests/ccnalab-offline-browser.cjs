/* Actual Chromium online → offline → online test for the standalone CCNA PWA.
 * Assumes npm run build:standalone and Playwright Chromium installation.
 */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const {startServer}=await import('../scripts/serve-standalone.mjs');
  const server=await startServer({port:0});
  let browser;
  try{
    const base='http://127.0.0.1:'+server.address().port;
    browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
    const context=await browser.newContext({serviceWorkers:'allow'});
    const page=await context.newPage();
    const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
    await page.goto(base+'/apps/ccna/',{waitUntil:'domcontentloaded'});
    await page.locator('.offline-control').waitFor({state:'visible',timeout:30000});
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
    await page.locator('.offline-control').click();
    await page.waitForFunction(()=>localStorage.getItem('portal-offline-enabled:ccna')==='1',null,{timeout:60000});
    const cached=await page.evaluate(async()=>{
      const names=(await caches.keys()).filter(x=>x.startsWith('portal-offline-ccna-'));
      if(!names.length)return {name:null,count:0};
      const cache=await caches.open(names.at(-1));
      return {name:names.at(-1),count:(await cache.keys()).length};
    });
    assert.ok(cached.count>=40,'Service Worker should contain the full CCNA course and lab assets');
    // Let the service worker take control of this page before disabling network.
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:30000});
    await context.setOffline(true);
    await page.reload({waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>{
      const w=document.getElementById('appFrame')?.contentWindow;
      return !!w?.getLearningSections && w.getLearningSections().length>=5;
    },null,{timeout:30000});
    const savedKey='ccna-learning-progress-v1';
    await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({'offline-check':true})),savedKey);
    assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key))['offline-check'],savedKey),true);
    await context.setOffline(false);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.getElementById('appFrame')?.contentWindow?.document?.readyState==='complete',null,{timeout:30000});
    assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key))['offline-check'],savedKey),true);
    assert.deepEqual(pageErrors,[]);
    console.log('PASS Chromium CCNA PWA online/offline/online, '+cached.count+' cached assets, iframe navigation and preserved progress');
    await context.close();
  } finally {
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e);process.exitCode=1;});

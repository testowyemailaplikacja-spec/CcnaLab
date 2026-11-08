/* Real Chromium smoke of the built independent app, not mocked browser DOM. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const candidate=path.resolve(root,'.'+pathname);
  if(candidate!==root&&!candidate.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  let file=candidate;
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  else if(!fs.existsSync(file)&&/^\/apps\/ccna\//.test(pathname)&&!path.posix.extname(pathname))file=path.join(root,'apps/ccna/index.html');
  if(!fs.existsSync(file)){res.writeHead(404);res.end('Not Found');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
  fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block',acceptDownloads:true});
  const page=await context.newPage(),errors=[],missing=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)missing.push([r.status(),r.url()]);});
  page.on('request',r=>{if(/supabase\.co|constant-app\.netlify\.app/.test(r.url()))remote.push(r.url());});
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  assert.match(await page.title(),/CCNA Lab/i);
  assert.equal(await page.locator('a[href="/apps/ccna/"]').count(),1);
  await page.goto(base+'/apps/ccna/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{
    const w=document.getElementById('appFrame')?.contentWindow;
    return w?.document?.readyState==='complete'&&typeof w.getLearningSections==='function';
  },{timeout:30000});
  assert.ok(await page.evaluate(()=>document.getElementById('appFrame').contentWindow.getLearningSections().length)>5);
  assert.equal(await page.evaluate(()=>window.CCNALabRuntime.mode),'standalone');
  assert.equal(await page.evaluate(()=>window.AppSupabase),null);
  assert.equal(await page.locator('#appFrame').count(),1);
  assert.ok((await page.locator('#appFrame').boundingBox()).width>500);
  const progressKey='ccna-learning-progress-v1';
  await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({'smoke-checkpoint':true})),progressKey);
  await page.reload();
  await page.waitForFunction(()=>document.getElementById('appFrame')?.contentWindow?.document?.readyState==='complete');
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{}')['smoke-checkpoint'],progressKey),true);
  await page.locator('[data-portal-theme-choice="blue"]').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('portal-theme-v1')),'blue');
  await page.locator('[data-portal-language="en"]').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('portal-language-v1')),'en');
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const m=await mobile.newPage();
  m.on('pageerror',e=>errors.push('mobile: '+e.message));
  await m.goto(base+'/apps/ccna/',{waitUntil:'domcontentloaded'});
  await m.waitForFunction(()=>document.getElementById('appFrame')?.contentWindow?.document?.readyState==='complete');
  const rect=await m.locator('#appFrame').boundingBox();
  assert.ok(rect&&rect.width>320&&rect.width<420,'iframe mobile width must fit viewport');
  assert.deepEqual(errors,[],'No page exceptions on desktop/mobile');
  assert.deepEqual(missing,[],'No failed same-origin asset requests');
  assert.deepEqual(remote,[],'No production backend requests in standalone mode');
  console.log('PASS standalone Chromium desktop/mobile, iframe, learner sections, progress persistence, theme, language and no host backend');
  await mobile.close(); await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());

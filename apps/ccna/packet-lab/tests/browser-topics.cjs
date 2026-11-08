const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.CCNA_LAB_PLAYWRIGHT || 'playwright');
const {seedCompletedLearning}=require('./browser-learner-fixture.cjs');
const repo=path.resolve(__dirname,'../../../..');
const output=process.env.CCNA_LAB_REPORT_DIR || '/tmp/ccna-lab-browser-results';
fs.mkdirSync(output,{recursive:true});
const route='/apps/ccna/sekcja/przelaczanie-ethernet-czesc-2/temat/laboratorium-analiza-przelaczania-ethernet/?tryb=packet-lab';
const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.join(repo,name);if(!fs.existsSync(file)&&name.startsWith('/apps/ccna/'))file=path.join(repo,'apps/ccna/index.html');if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.existsSync(file)){res.statusCode=404;return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'})[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));});
function authScript(signedIn=true){return `window.testSession=${signedIn?'{user:{id:"ccna-ui-test",email:"test@example.invalid"}}':'null'};window.authListeners=[];window.testSetSession=(session)=>{window.testSession=session;window.authListeners.forEach(fn=>fn(session?'SIGNED_IN':'SIGNED_OUT',session));};window.AppSupabase={rpc:async()=>({error:null}),auth:{getSession:async()=>({data:{session:window.testSession}}),onAuthStateChange:(fn)=>{window.authListeners.push(fn);return {data:{subscription:{unsubscribe(){}}}}}},from:()=>({select(){return this},eq(){return this},upsert(){return this},maybeSingle:async()=>({data:null}),single:async()=>({data:{revision:1,updated_at:new Date().toISOString()}})})};`;}
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({executablePath:process.env.CCNA_BROWSER_PATH || undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  try{
    const page=await browser.newPage({viewport:{width:1366,height:768},serviceWorkers:'block'});page.setDefaultTimeout(10000);
    // WIEDORA-CHANGE: WD-20261029-WIE-005-REGRESSION-CODEX4 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
    await seedCompletedLearning(page,['anki-ospf','anki-dhcp','anki-dns','anki-wireless-security','anki-rest-api','anki-data-formats','anki-config-management']);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://**/*',r=>r.fulfill({body:'',contentType:'text/javascript'}));
    await page.route('**/js/supabase-client.js',r=>r.fulfill({body:authScript(),contentType:'text/javascript'}));
    const f=page.frameLocator('#appFrame');
    async function openLab(sid,sub){if(await f.locator('.pt-lab').count())await f.locator('[data-action="close"]').click();await page.goto(origin+'/apps/ccna/sekcja/'+sid+'/temat/'+sub+'/?tryb=packet-lab');await f.locator('.pt-lab').waitFor();}
    async function device(id){await f.locator(`[data-device="${id}"]`).click();}
    async function close(){await f.locator('[data-close-dialog]').click();}
    async function commands(id,commands,host=false){await device(id);if(host)await f.locator('[data-desktop="command"]').click();for(const command of commands){
      const terminal=f.locator('.pt-terminal-output'),prior=/^ping\s/i.test(command)?((await terminal.innerText()).match(/Received = \d/g)||[]).length:0;
      await f.locator('#ptCommand').fill(command);await f.locator('#ptCommand').press('Enter');
      // WIEDORA-CHANGE: WD-20261029-WIE-005-REGRESSION-CODEX4 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
      if(/^ping\s/i.test(command))await terminal.evaluate((el,count)=>new Promise((resolve,reject)=>{const deadline=Date.now()+10000;const check=()=>{if((el.textContent.match(/Received = \d/g)||[]).length>count)resolve();else if(Date.now()>deadline)reject(Error('Ping did not finish'));else setTimeout(check,40)};check()}),prior);
    }const text=await f.locator('.pt-terminal-output').innerText();await close();return text;}
    async function score(){await f.locator('[data-action="check"]').click();const score=await f.locator('.pt-score').innerText();await close();return score;}
    await openLab('ccna-ospf','anki-ospf');
    for(const [id,rid] of [['R1','1.1.1.1'],['R2','2.2.2.2']]){const output=await commands(id,['en','en','conf t','router ospf 1','router-id '+rid,'net 10.0.0.0 0.0.255.255 area 0','end']);assert.doesNotMatch(output,/% Invalid|% Ambiguous/);}
    const ospf=await commands('R1',['sh ip ospf nei','sh ip ro']);assert.match(ospf,/FULL/);assert.match(ospf,/O 10.0.20.0/);
    const ping=await commands('PC1',['ping 10.0.20.12'],true);assert.match(ping,/Received = 4/);assert.match(await score(),/100%/);
    await device('R1');await f.locator('#ptCommand').fill('sh ip int b');await f.locator('#ptCommand').press('Tab');assert.equal(await f.locator('#ptCommand').inputValue(),'show ip interface brief ');await f.locator('#ptCommand').press('Enter');await f.locator('#ptCommand').fill('sh ip ');await f.locator('#ptCommand').press('?');assert.match(await f.locator('.pt-terminal-output').innerText(),/route/);assert.equal(await f.locator('#ptCommand').inputValue(),'sh ip ');await close();
    await page.screenshot({path:path.join(output,'v2-ospf-complete.png')});console.log('PASS OSPF lab 100%, CLI aliases, immediate ?, Tab');
    await f.locator('[data-action="labs"]').click();await f.locator('#ptFindLab').fill('DHCP');await f.locator('[data-lab-section="ccna-dhcp"][data-lab-sub="anki-dhcp"]').click();await f.locator('[data-device="SRV1"]').waitFor();
    await commands('R1',['en','conf t','ip dhcp excluded-address 10.0.10.1 10.0.10.99','ip dhcp pool USERS','network 10.0.10.0 255.255.255.0','default-router 10.0.10.1','dns-server 10.0.10.53','end']);
    await commands('SW1',['en','conf t','ip dhcp snooping','ip dhcp snooping vlan 1','int fa0/24','ip dhcp snooping trust','end']);
    await device('PC1');await f.locator('[data-desktop="ip"]').click();await f.locator('#ptDhcp').click();assert.equal(await f.locator('input[name="ip"]').inputValue(),'10.0.10.100');await close();await commands('R1',['sh ip dhcp binding']);assert.match(await score(),/100%/);console.log('PASS lab picker, DHCP+snooping exercise 100%');
    await openLab('ccna-dns','anki-dns');await device('SRV1');await f.locator('[data-tab="Services"]').click();await f.locator('input[name="dns"]').check();await f.locator('textarea[name="records"]').fill('lab.ccna 10.0.10.53');await f.getByRole('button',{name:'Zapisz usługi',exact:true}).click();assert.match(await f.locator('.pt-form-status').innerText(),/Zapisano/);await close();
    await device('PC1');await f.locator('[data-desktop="ip"]').click();await f.locator('input[name="dns"]').fill('10.0.10.53');await f.getByRole('button',{name:'Zastosuj',exact:true}).click();await close();const dns=await commands('PC1',['nslookup lab.ccna','http lab.ccna'],true);assert.match(dns,/200 OK/);await commands('R1',['sh ip int br']);assert.match(await score(),/100%/);console.log('PASS server Services, DNS and HTTP lab 100%');
    await openLab('ccna-wireless-security','anki-wireless-security');
    for(const id of ['AP1','PC1']){await device(id);if(id==='PC1')await f.locator('[data-desktop="wireless"]').click();await f.locator('input[name="ssid"]').fill('CCNA-LAB');await f.locator('select[name="security"]').selectOption('wpa2');await f.locator('input[name="key"]').fill('ccna2026');await f.getByRole('button',{name:'Zastosuj WLAN',exact:true}).click();await close();}
    assert.match(await commands('PC1',['ping 10.0.10.12'],true),/Received = 4/);assert.match(await score(),/100%/);console.log('PASS WLAN association and lab 100%');
    await openLab('ccna-rest-api','anki-rest-api');await f.locator('[data-action="tools"]').click();await f.locator('[data-tool="api"]').click();await f.getByRole('button',{name:'Wyślij żądanie',exact:true}).click();assert.match(await f.locator('#ptApiResult').innerText(),/HTTP 200/);await f.locator('select[name="method"]').selectOption('PATCH');await f.locator('input[name="path"]').fill('/devices/SW1/interfaces/FastEthernet0%2F1');await f.getByRole('button',{name:'Wyślij żądanie',exact:true}).click();assert.match(await f.locator('#ptApiResult').innerText(),/REST-MANAGED/);await f.locator('select[name="method"]').selectOption('GET');await f.getByRole('button',{name:'Wyślij żądanie',exact:true}).click();await close();assert.match(await score(),/100%/);console.log('PASS REST GET+PATCH changes interface and lab 100%');
    await openLab('ccna-data-formats','anki-data-formats');await commands('SW1',['en','conf t','hostname DATA1','end']);await f.locator('[data-action="tools"]').click();
    for(const format of ['json','xml','yaml']){
      await f.locator('#ptFormat').selectOption(format);const exported=await f.locator('#ptInventory').innerText();assert.match(exported,/DATA1/);
      if(format==='json'){const data=JSON.parse(exported);assert.ok(data.devices.find(d=>d.hostname==='DATA1').interfaces['FastEthernet0/1']);assert.deepEqual(data.events,[]);}
      if(format==='xml'){const parsed=await f.locator('#ptInventory').evaluate(el=>{const doc=new DOMParser().parseFromString(el.textContent,'application/xml');return{valid:!doc.querySelector('parsererror'),port:!!doc.querySelector('entry[key="FastEthernet0/1"]'),emptyEvents:doc.querySelector('entry[key="events"] > value[type="array"]')?.children.length};});assert.deepEqual(parsed,{valid:true,port:true,emptyEvents:0});}
      if(format==='yaml'){assert.match(exported,/"FastEthernet0\/1":/);assert.match(exported,/"events":\n\s+\[\]/);}
    }
    await close();assert.match(await score(),/100%/);console.log('PASS JSON/XML/YAML lab 100%, valid XML, exact interface keys and empty arrays');
    await openLab('ccna-config-management','anki-config-management');await f.locator('[data-action="tools"]').click();await f.locator('[data-tool="batch"]').click();await f.locator('#ptRunBatch').click();assert.doesNotMatch(await f.locator('#ptBatchResult').innerText(),/% Invalid|% Ambiguous/);await f.locator('#ptRunBatch').click();await close();await commands('PC1',['ping 10.0.10.12'],true);assert.match(await score(),/100%/);console.log('PASS repeatable batch config lab 100%');
    await f.locator('[data-action="close"]').click();const saved=JSON.parse(await page.evaluate(()=>localStorage.getItem('ccna-packet-labs-v1')));assert.ok(Object.keys(saved.labs).length>=7);assert.equal(saved.labs['ccna-ospf:anki-ospf'].devices.find(d=>d.id==='R1').protocols.ospf.routerId,'1.1.1.1');console.log('PASS per-topic persistence retains seven independent labs');
    await openLab('ccna-ospf','anki-ospf');assert.match(await commands('R1',['en','sh ip ospf nei']),/FULL/);await f.locator('.pt-kind').selectOption('router');assert.equal(await f.locator('[data-add]').count(),9);await f.locator('.pt-search').fill('Server');assert.equal(await f.locator('[data-add="Server-PT"]').count(),1);await f.locator('.pt-search').fill('');
    for(const [width,height,name]of[[834,1112,'tablet'],[390,844,'mobile'],[360,740,'small-mobile']]){await page.setViewportSize({width,height});await f.getByRole('button',{name:'Instrukcja',exact:true}).click();const box=await f.locator('.pt-dialog').boundingBox();assert.ok(box.width<=width);assert.match(await f.locator('.pt-dialog').innerText(),/OSPF/);await close();await f.locator('[data-action="tools"]').click();await f.locator('[data-tool="scope"]').click();await page.screenshot({path:path.join(output,'v2-'+name+'-scope.png')});await close();await page.screenshot({path:path.join(output,'v2-'+name+'-routers.png')});}
    assert.deepEqual(errors,[]);console.log('PASS 22-profile catalogue, restored OSPF state, mobile/tablet and no JS errors');
    fs.writeFileSync(path.join(output,'browser-v2-new-results.json'),JSON.stringify({passed:true,completedLabs:['OSPF','DHCP','DNS/HTTP','WLAN','REST','data formats','configuration management'],jsErrors:errors,auth:'local stub, no production changes'},null,2));
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

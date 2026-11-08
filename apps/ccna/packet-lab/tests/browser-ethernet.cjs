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
function authScript(signedIn=true){return `if(localStorage.getItem('ccna-browser-test-session')===null)localStorage.setItem('ccna-browser-test-session',JSON.stringify(${signedIn?'{user:{id:"ccna-ui-test",email:"test@example.invalid"}}':'null'}));window.testSession=JSON.parse(localStorage.getItem('ccna-browser-test-session'));window.authListeners=[];window.testSetSession=(session)=>{localStorage.setItem('ccna-browser-test-session',JSON.stringify(session));window.testSession=session;window.authListeners.forEach(fn=>fn(session?'SIGNED_IN':'SIGNED_OUT',session));};window.AppSupabase={rpc:async()=>({error:null}),auth:{getSession:async()=>({data:{session:window.testSession}}),onAuthStateChange:(fn)=>{window.authListeners.push(fn);return {data:{subscription:{unsubscribe(){}}}}}},from:()=>({select(){return this},eq(){return this},upsert(){return this},maybeSingle:async()=>({data:null}),single:async()=>({data:{revision:1,updated_at:new Date().toISOString()}})})};`;}
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({executablePath:process.env.CCNA_BROWSER_PATH || undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  try{
    const page=await browser.newPage({viewport:{width:1366,height:768},serviceWorkers:'block'});page.setDefaultTimeout(10000);
    // WIEDORA-CHANGE: WD-20261029-WIE-005-REGRESSION-CODEX4 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
    await seedCompletedLearning(page,['laboratorium-analiza-przelaczania-ethernet']);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://**/*',r=>r.fulfill({body:'',contentType:'text/javascript'}));
    await page.route('**/js/supabase-client.js',r=>r.fulfill({body:authScript(),contentType:'text/javascript'}));
    await page.goto(origin+route);const f=page.frameLocator('#appFrame');await f.locator('.pt-lab').waitFor();console.log('PASS integrated authenticated route');
    await page.screenshot({path:path.join(output,'desktop-start.png')});
    // WIEDORA-CHANGE: WD-20261030-WIE-195-KEYBOARD | TASK: WIE-195 | AUTHOR: Codex / GPT-6
    const initialDevices=await f.locator('[data-device]').count();
    await f.locator('[data-category="pc"]').press('Enter');
    await f.locator('[data-add="PC-PT"]').press('Enter');
    await f.locator('.pt-canvas').focus();await page.keyboard.press('Enter');
    assert.equal(await f.locator('[data-device]').count(),initialDevices+1,'keyboard can place a palette device');
    const added=f.locator('[data-device]').last(),addedId=await added.getAttribute('data-device');
    assert.equal(await added.evaluate(el=>el.ownerDocument.activeElement===el),true,'new device receives focus');
    const addedPosition=await added.getAttribute('transform');await added.press('ArrowRight');
    assert.notEqual(await added.getAttribute('transform'),addedPosition);
    assert.equal(await added.evaluate(el=>el.ownerDocument.activeElement===el),true,'moving retains focus');
    await f.locator('[data-action="delete"]').press('Enter');
    await f.locator(`[data-device="${addedId}"]`).press('Enter');await f.locator('[data-confirm]').press('Enter');
    assert.equal(await f.locator('[data-device]').count(),initialDevices);await f.locator('[data-action="select"]').press('Enter');
    console.log('PASS keyboard places, moves and removes a device');
    async function clickDevice(id){await f.locator(`[data-device="${id}"]`).click();}
    async function cable(a,ap,b,bp,type){await f.locator('[data-action="cables"]').click();await f.locator(`[data-cable="${type}"]`).click();await clickDevice(a);await f.locator(`[data-port="${ap}"]`).click();await clickDevice(b);await f.locator(`[data-port="${bp}"]`).click();}
    for(const [a,ap,b,bp,type] of [['PC1','FastEthernet0','SW1','FastEthernet0/1','straight'],['PC2','FastEthernet0','SW1','FastEthernet0/2','straight'],['SW1','GigabitEthernet0/1','SW2','GigabitEthernet0/1','cross'],['PC3','FastEthernet0','SW2','FastEthernet0/1','straight'],['PC4','FastEthernet0','SW2','FastEthernet0/2','straight']])await cable(a,ap,b,bp,type);
    assert.equal(await f.locator('[data-link]').count(),5);console.log('PASS five cables through port selection');
    for(let i=1;i<=4;i++){
      await clickDevice('PC'+i);await f.getByRole('button',{name:'IP Configuration',exact:true}).click();await f.locator('input[name="ip"]').fill('192.168.1.'+i);await f.getByRole('button',{name:'Zastosuj',exact:true}).click();assert.match(await f.locator('.pt-form-status').innerText(),/Zapisano/);await f.locator('[data-close-dialog]').click();
    }
    console.log('PASS four static IP configurations');
    await f.locator('[data-action="simulation"]').click();await clickDevice('PC1');await f.getByRole('button',{name:'Command Prompt',exact:true}).click();
    await f.locator('#ptCommand').fill('ping 192.168.1.3');await f.locator('#ptCommand').press('Enter');assert.match(await f.locator('.pt-terminal-output').innerText(),/Capture/);await f.locator('[data-close-dialog]').click();
    await f.locator('[data-action="step"]').click();assert.equal(await f.locator('#ptEventRows tr').count(),1);await f.locator('#ptEventRows button').first().click();assert.match(await f.locator('#ptPduBody').innerText(),/EtherType 0x0806/);await f.locator('[data-pdu-tab="details"]').click();assert.match(await f.locator('#ptPduBody').innerText(),/ffff.ffff.ffff/);await f.locator('[data-close-dialog]').click();
    // WIEDORA-CHANGE: WD-20261030-WIE-195-KEYBOARD | TASK: WIE-195 | AUTHOR: Codex / GPT-6
    await f.locator('[data-event-envelope]').press(' ');assert.ok(await f.locator('#ptPduBody').isVisible());await f.locator('[data-close-dialog]').press('Enter');
    console.log('PASS keyboard opens SVG PDU details');
    let count=0;while(await f.locator('[data-action="step"]').isEnabled()&&count++<100)await f.locator('[data-action="step"]').click();
    assert.match(await f.locator('#ptPduRows').innerText(),/Successful/);assert.match(await f.locator('#ptPduRows').innerText(),/4\/4/);console.log('PASS stepwise ARP/ICMP and 4/4 ping; PDU details');
    await page.screenshot({path:path.join(output,'desktop-simulation.png')});
    await f.locator('[data-action="realtime"]').click();await clickDevice('PC2');await f.getByRole('button',{name:'Command Prompt',exact:true}).click();await f.locator('#ptCommand').fill('ping 192.168.1.4');await f.locator('#ptCommand').press('Enter');
    const liveStart=await f.locator('.pt-terminal-output').innerText();assert.match(liveStart,/Pinging/);assert.doesNotMatch(liveStart,/Received = 4/);
    await f.locator('.pt-terminal-output').evaluate(el=>new Promise((resolve,reject)=>{const deadline=Date.now()+10000,tick=()=>{if(/Received = 4/.test(el.textContent))resolve();else if(Date.now()>deadline)reject(new Error('Realtime ping did not finish'));else setTimeout(tick,50);};tick();}));
    assert.match(await f.locator('.pt-terminal-output').innerText(),/Received = 4/);await f.locator('[data-close-dialog]').click();
    for(const id of ['SW1','SW2']){
      await clickDevice(id);for(const command of ['enable','show mac address-table','clear mac address-table dynamic','show mac address-table']){await f.locator('#ptCommand').fill(command);await f.locator('#ptCommand').press('Enter');}
      const text=await f.locator('.pt-terminal-output').innerText();assert.match(text,/criterion: 4/);assert.match(text,/criterion: 0/);await f.locator('[data-close-dialog]').click();
    }
    await f.locator('[data-action="check"]').click();assert.match(await f.locator('.pt-score').innerText(),/100%/);await page.screenshot({path:path.join(output,'desktop-complete.png')});await f.locator('[data-close-dialog]').click();console.log('PASS full lab 15/15 via UI');
    // The on-account save is local here; auth and database are stubbed, never sent externally.
    await page.waitForFunction(()=>{const data=localStorage.getItem('ccna-packet-labs-v1');return data&&JSON.parse(data).labs.ethernetDay6.links.length===5;});
    const save=JSON.parse(await page.evaluate(()=>localStorage.getItem('ccna-packet-labs-v1')));assert.equal(save.owner,'ccna-ui-test');
    // WIEDORA-CHANGE: WD-20261029-WIE-005-REGRESSION-CODEX4 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
    await f.locator('[data-action="close"]').click();await f.locator('[data-sub-mode="packet-lab"]').click();await f.locator('.pt-lab').waitFor();assert.equal(await f.locator('[data-link]').count(),5);assert.equal(await f.locator('#ptScore').innerText(),'15/15');console.log('PASS close/reopen state and account-scoped storage');
    const download=page.waitForEvent('download');await f.locator('[data-action="export"]').click();const file=await download;await file.saveAs(path.join(output,'lab-export.json'));assert.equal(JSON.parse(fs.readFileSync(path.join(output,'lab-export.json'))).format,'ccna-network-lab');console.log('PASS JSON export');
    await f.locator('[data-action="reset"]').click();await f.locator('[data-cancel]').click();assert.equal(await f.locator('[data-link]').count(),5);console.log('PASS reset cancellation');
    await f.locator('[data-action="reset"]').click();await f.locator('[data-confirm]').click();assert.equal(await f.locator('[data-link]').count(),0);
    await f.locator('.pt-import').setInputFiles(path.join(output,'lab-export.json'));await f.locator('[data-confirm]').click();assert.equal(await f.locator('[data-link]').count(),5);assert.equal(await f.locator('#ptScore').innerText(),'15/15');
    await f.locator('[data-action="physical"]').click();await clickDevice('SW1');await f.locator('[data-tab="Physical"]').click();assert.equal(await f.locator('[data-physical-port]').count(),27);await f.locator('[data-close-dialog]').click();await f.locator('[data-action="logical"]').click();
    console.log('PASS reset, JSON import, physical ports');
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ccna-packet-labs-v1')).labs.ethernetDay6.links.length===5);await page.reload();await f.locator('.pt-lab').waitFor();assert.equal(await f.locator('[data-link]').count(),5);console.log('PASS reload restores account topology');
    for(const [width,height,name] of [[834,1112,'tablet'],[390,844,'mobile'],[360,740,'small-mobile']]){
      await page.setViewportSize({width,height});await page.screenshot({path:path.join(output,name+'.png')});
      const box=await f.locator('.pt-lab').boundingBox();assert.ok(box.width<=width+1);
      await f.getByRole('button',{name:'Instrukcja',exact:true}).click();assert.ok(await f.locator('.pt-dialog').isVisible());const db=await f.locator('.pt-dialog').boundingBox();assert.ok(db.width<=width);await f.locator('[data-close-dialog]').click();
      await f.locator('[data-action="cables"]').click();assert.ok(await f.locator('[data-cable="straight"]').isVisible());await f.locator('[data-action="select"]').click();
      await f.locator('[data-action="simulation"]').click();await f.locator('[data-action="hide-sim"]').click();await f.locator('[data-action="realtime"]').click();
    }
    console.log('PASS tablet/mobile widths and controls');
    const wrap=f.locator('.pt-canvas-wrap');const box=await wrap.boundingBox();await page.mouse.move(box.x+300,box.y+80);await page.mouse.down();await page.mouse.move(box.x+70,box.y+80,{steps:8});await page.mouse.up();assert.ok(await wrap.evaluate(el=>el.scrollLeft)>100);console.log('PASS mobile canvas panning');
    await page.setViewportSize({width:1366,height:768});await wrap.evaluate(el=>el.scrollLeft=0);const node=f.locator('[data-device="PC1"]');const before=await node.getAttribute('transform'),nb=await node.boundingBox();await page.mouse.move(nb.x+45,nb.y+35);await page.mouse.down();await page.mouse.move(nb.x+90,nb.y+65,{steps:8});await page.mouse.up();assert.notEqual(await node.getAttribute('transform'),before);assert.equal(await f.locator('.pt-dialog:visible').count(),0);console.log('PASS device dragging without opening a dialog');
    // WIEDORA-CHANGE: WD-20261030-WIE-195-KEYBOARD | TASK: WIE-195 | AUTHOR: Codex / GPT-6
    await f.locator('[data-action="delete"]').press('Enter');await f.locator('[data-link]').first().press('Enter');
    assert.equal(await f.locator('[data-link]').count(),4,'keyboard can remove a cable');
    assert.equal(await f.locator('.pt-canvas').evaluate(el=>el.ownerDocument.activeElement===el),true,'removed SVG action returns focus to topology');
    console.log('PASS keyboard removes a cable and restores focus');
    await page.evaluate(()=>window.testSetSession(null));await f.locator('.pt-lab').waitFor({state:'detached'});
    if (process.env.CCNA_LAB_RUNTIME === 'standalone') {
      // Local-only CCNALab intentionally has NO account switch or cloud sync.
      // A dummy signed-out event must not silently erase the learner's exportable local data.
      assert.notEqual(await page.evaluate(()=>localStorage.getItem('ccna-packet-labs-v1')),null);
      console.log('PASS standalone signout keeps local-only lab progress (no account isolation)');
    } else {
      assert.equal(await page.evaluate(()=>localStorage.getItem('ccna-packet-labs-v1')),null);
      await page.evaluate(()=>window.testSetSession({user:{id:'second-ui-user',email:'other@example.invalid'}}));
      await page.waitForFunction(()=>JSON.parse(localStorage.getItem('portal-progress-owners-v1')||'{}').ccna==='second-ui-user');
      await page.evaluate(()=>document.getElementById('appFrame').contentWindow.renderSubsection('przelaczanie-ethernet-czesc-2','laboratorium-analiza-przelaczania-ethernet','packet-lab'));
      await f.locator('.pt-lab').waitFor();assert.equal(await f.locator('[data-link]').count(),0);
      console.log('PASS Wiedora logout closes lab and another account starts separately');
    }
    assert.deepEqual(errors,[]);
    // WIEDORA-CHANGE: WD-20261029-WIE-005-REGRESSION-CODEX4 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
    const guest=await browser.newPage({serviceWorkers:'block'});await guest.route('https://**/*',r=>r.fulfill({body:'',contentType:'text/javascript'}));await guest.route('**/js/supabase-client.js',r=>r.fulfill({body:authScript(false),contentType:'text/javascript'}));await guest.goto(origin+route);await guest.frameLocator('#appFrame').locator('#subsectionModeContent').waitFor();assert.equal(await guest.evaluate(()=>document.documentElement.dataset.portalAuth),'guest');assert.equal(await guest.frameLocator('#appFrame').locator('[data-sub-mode="packet-lab"]').isDisabled(),true);assert.equal(await guest.frameLocator('#appFrame').locator('.pt-lab').count(),0);assert.equal(await guest.evaluate(()=>localStorage.getItem('ccna-packet-labs-v1')),null);console.log('PASS guest sees learning material but locked lab cannot write account progress');
    fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({passed:true,jsErrors:errors,desktop:[1366,768],tablet:[834,1112],mobile:[[390,844],[360,740]],labScore:'15/15',auth:'stubbed locally; no production account used'},null,2));
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

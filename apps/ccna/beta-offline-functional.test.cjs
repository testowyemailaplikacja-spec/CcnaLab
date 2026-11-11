'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const swSource=fs.readFileSync(path.join(__dirname,'beta-sw.js'),'utf8');
const uiSource=fs.readFileSync(path.join(__dirname,'beta-offline.js'),'utf8');
const ORIGIN='https://ccnalab.invalid';
const ROOT='/apps/ccnalab-beta/';
const REQUIRED=[
 ROOT,ROOT+'index.html',ROOT+'legacy.html',ROOT+'ccnalab-beta-storage.js',
 ROOT+'beta-tools.js',ROOT+'beta-offline.js',ROOT+'router.js',
 ROOT+'study-frame-beta.js',ROOT+'study-mode-beta.js',ROOT+'packet-lab/integration.js',
 ROOT+'packet-lab/lab.js',ROOT+'packet-lab/engine.js',ROOT+'packet-lab/lab.css'
];
const OPTIONAL=[ROOT+'packet-lab/scenarios.js','/apps/shared/study-mode.css'];
const absolute=input=>new URL(typeof input==='string'?input:input.url,ORIGIN).href;
function harness({missing=[],brokenRequired=[]}={}){
  const callbacks={};
  const stores=new Map([
    ['portal-offline-ccna-v1',new Map([['important','leave-intact']])],
    ['ccnalab-beta-offline-expired',new Map([['outdated','yes']])]
  ]);
  let offline=false,activated=false;
  const normal=url=>new Response('asset:'+new URL(url,ORIGIN).pathname,{status:200});
  const network=async input=>{
    const url=new URL(absolute(input)).pathname;
    if(offline||missing.includes(url)||brokenRequired.includes(url))
      throw Error('NETWORK_DOWN '+url);
    return normal(url);
  };
  class FakeCache{
    constructor(map){this.map=map;}
    async put(url,response){this.map.set(absolute(url),response.clone());}
    async match(url){const r=this.map.get(absolute(url));return r?.clone();}
    async addAll(reqs){
      const results=await Promise.all(reqs.map(network));
      for(let i=0;i<reqs.length;i++)await this.put(reqs[i],results[i]);
    }
  }
  const caches={
    async open(name){
      if(!stores.has(name))stores.set(name,new Map());
      return new FakeCache(stores.get(name));
    },
    async keys(){return [...stores.keys()]},
    async delete(name){return stores.delete(name)}
  };
  const self={
    location:{origin:ORIGIN},
    addEventListener:(name,callback)=>callbacks[name]=callback,
    skipWaiting:async()=>{activated=true},
    clients:{claim:async()=>{}}
  };
  class FakeRequest {
    constructor(url,options){this.url=absolute(url);this.method='GET';this.mode=options?.mode||'cors';}
  }
  const compiled=swSource.replace('__CCNALAB_SHA__','test00000001')
    .replace('__CCNALAB_PRECACHE__',JSON.stringify(OPTIONAL));
  vm.runInNewContext(compiled,{
    self,caches,fetch:network,Request:FakeRequest,Response,URL,
    console:{warn:()=>{}}
  });
  const invoke=async name,request=>{
    let pending;
    const event={
      request,
      waitUntil(promise){pending=promise},
      respondWith(promise){pending=promise}
    };
    callbacks[name](event);
    return pending?await pending:undefined;
  };
  return {
    invoke,caches,stores,
    online(value){offline=!value},
    activated:()=>activated,
    getCache:async()=>caches.open('ccnalab-beta-offline-test00000001')
  };
}

test('offline: genuine worker installation caches full course, labs and shared style',async()=>{
  const h=harness();
  await h.invoke('install');
  await h.invoke('activate');
  assert.equal(h.activated(),true);
  const cache=await h.getCache();
  for(const item of [...REQUIRED,...OPTIONAL])assert.ok(await cache.match(item),'not cached '+item);
  const receipt=await (await cache.match(ROOT+'.offline-cache-state.json')).json();
  assert.deepEqual({
    version:receipt.version,complete:receipt.complete,failed:receipt.failed,
    optionalSaved:receipt.optionalSaved,optionalExpected:receipt.optionalExpected
  },{version:1,complete:true,failed:0,optionalSaved:2,optionalExpected:2});
  const keys=await h.caches.keys();
  assert.ok(keys.includes('portal-offline-ccna-v1'),'Original CCNA offline cache was deleted');
  assert.ok(!keys.includes('ccnalab-beta-offline-expired'),'Expired beta cache not removed');
});

test('offline: navigation, iframe and network simulator survive disconnection',async()=>{
  const h=harness();
  await h.invoke('install');await h.invoke('activate');h.online(false);
  for(const [url,contains] of [
    [ROOT,'asset:/apps/ccnalab-beta/index.html'],
    [ROOT+'legacy.html','asset:/apps/ccnalab-beta/legacy.html'],
    [ROOT+'kurs/','asset:/apps/ccnalab-beta/index.html'],
    [ROOT+'packet-lab/engine.js','asset:/apps/ccnalab-beta/packet-lab/engine.js'],
    ['/apps/shared/study-mode.css','asset:/apps/shared/study-mode.css']
  ]){
    const mode=url.endsWith('.js')||url.endsWith('.css')?'cors':'navigate';
    const response=await h.invoke('fetch',{method:'GET',url:ORIGIN+url,mode});
    assert.ok(response,'No offline response '+url);
    assert.equal(response.status,200);
    assert.equal(await response.text(),contains);
  }
  assert.equal(await h.invoke('fetch',{
    method:'GET',url:ORIGIN+'/apps/ccna/index.html',mode:'navigate'
  }),undefined,'Beta worker intercepted original CCNA');
});

test('offline: missing optional assets are reported as PARTIAL, not complete',async()=>{
  const h=harness({missing:[ROOT+'packet-lab/scenarios.js']});
  await h.invoke('install');await h.invoke('activate');
  const receipt=await (await (await h.getCache()).match(ROOT+'.offline-cache-state.json')).json();
  assert.equal(receipt.complete,false);
  assert.equal(receipt.failed,1);
  assert.equal(receipt.optionalSaved,1);
  assert.ok(await (await h.getCache()).match(ROOT+'legacy.html'));
});

test('offline: missing essential course asset blocks installing partial version',async()=>{
  const h=harness({brokenRequired:[ROOT+'legacy.html']});
  await assert.rejects(h.invoke('install'),/NETWORK_DOWN/);
  assert.equal(h.activated(),false);
});

function simulateStatus({partial=false}={}){
  const labels={};
  const scope={
    location:{pathname:ROOT},
    document:{
      readyState:'complete',
      getElementById:id=>id==='ccnalab-beta-stagebar'?stage:id==='ccnalab-beta-offline-status'?labels.offline:null,
      createElement:tag=>{
        const node={tagName:tag.toUpperCase(),textContent:'',attrs:{},setAttribute(k,v){this.attrs[k]=v}};
        if(tag==='span')labels.offline=node;
        return node;
      }
    },
    navigator:{},
    caches:{
      keys:async()=>['ccnalab-beta-offline-test00000001'],
      open:async()=>({
        match:async key=>{
          if(key===ROOT+'index.html'||key===ROOT+'legacy.html')return {ok:true};
          if(key===ROOT+'.offline-cache-state.json')return {
            json:async()=>({version:1,cache:'ccnalab-beta-offline-test00000001',
              complete:!partial,failed:partial?1:0,optionalExpected:2,optionalSaved:partial?1:2})
          };
          return null;
        }
      })
    },
    window:{addEventListener:()=>{}},
    setTimeout,clearTimeout,Error,Promise
  };
  scope.window.caches=scope.caches;
  const stage={append(node){this.child=node}};
  const installing={
    state:'installing',callbacks:{},
    addEventListener(type,fn){this.callbacks[type]=fn},
    removeEventListener(type){delete this.callbacks[type]}
  };
  const registration={
    active:null,installing,
    addEventListener:()=>{},update:async()=>{}
  };
  // The unrelated root ready promise is already resolved. A correct beta status
  // check must nevertheless wait for our own registration to activate.
  scope.navigator.serviceWorker={
    ready:Promise.resolve({active:{scriptURL:'/host-sw.js'}}),
    register:async()=>registration
  };
  vm.runInNewContext(uiSource,scope);
  return {labels,activate(){
    installing.state='activated';
    registration.active=installing;
    installing.callbacks.statechange?.();
  }};
}
test('UI does not confuse Wiedora root worker with beta offline readiness',async()=>{
  const h=simulateStatus();
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.match(h.labels.offline.textContent,/przygotowywanie/);
  h.activate();
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.match(h.labels.offline.textContent,/pełny pakiet bety zapisany/);
});
test('UI warns accurately when some Packet Lab files were not cached',async()=>{
  const h=simulateStatus({partial:true});
  await new Promise(resolve=>setTimeout(resolve,0));h.activate();
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.match(h.labels.offline.textContent,/część materiałów wymaga Internetu/);
});

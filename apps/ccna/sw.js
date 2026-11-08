// WIEDORA-CHANGE: WD-20261101-WIE-155-PREFERENCES-CAS-03 | TASK: WIE-155 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
// WIEDORA-CHANGE: WD-20261101-WIE-005-NATIVE-REGRESSION-10 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
// WIEDORA-CHANGE: WD-20261031-WIE-161-CCNA-PROVENANCE-04 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
// WIEDORA-CHANGE: WD-20261031-WIE-161-CCNA-PROVENANCE-03 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
// WIEDORA-CHANGE: WD-20261031-WIE-161-CCNA-REPORTS-02 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
// WIEDORA-CHANGE: WD-20261031-WIE-005-NATIVE-REGRESSION-09 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
// WIEDORA-CHANGE: WD-20261030-WIE-195-KEYBOARD | TASK: WIE-195 | AUTHOR: Codex / GPT-6
// WIEDORA-CHANGE: WD-20261030-WIE-157-REDACTION | TASK: WIE-157 | AUTHOR: Codex / GPT-6
// WIEDORA-CHANGE: WD-20261030-WIE-008-CANONICAL | TASK: WIE-008 | AUTHOR: Codex / GPT-6
// WIEDORA-CHANGE: WD-20261030-WIE-008-TARGETS-01 | TASK: WIE-008 | AUTHOR: Codex / GPT-6 (full version unknown)
const APP_ID="ccna";
// WIEDORA-CHANGE: WD-20261029-WIE-155-GUEST-OFFLINE | TASK: WIE-155 | AUTHOR: ChatGPT / GPT-6
// WIEDORA-CHANGE: WD-20261031-WIE-195-POSTDRAG-KEYBOARD-01 | TASK: WIE-195 | AUTHOR: Codex / GPT-6 (full version unknown)
// WIEDORA-CHANGE: WD-20261031-WIE-157-ERROR-PATH-ROOT-01 | TASK: WIE-157 | AUTHOR: ChatGPT / GPT-6
// WIEDORA-CHANGE: WD-20261101-WIE-161-CCNA-GATING-01 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
const CACHE_NAME="portal-offline-"+APP_ID+"-20261108-ccna-content-modules-1";
const APP_ROOT="/apps/"+APP_ID+"/";
const INDEX=APP_ROOT+"index.html";
const ASSETS=["/assets/vendor/supabase-2.117.2.js","./","./index.html","./legacy.html","./legacy.html?v=20261101-ccna-qualification-1","./data/terminology.js?v=20261101-ccna-qualification-1","./data/jitl-labs.js?v=20261019-course-audit-1","/js/supabase-client.js","/js/platform-data.js?v=20261101-preferences-cas-3","/js/error-monitor.js?v=20261031-errorpath-1","/js/ai-core.js?v=20261002-platform-2","/assets/ai-core.css?v=20261002-1","/js/user-presence.js","/js/progress-storage.js","./question-pool-visibility.js?v=20261101-question-pool-restore-1","./router.js?v=20261030-targets-1","./bug-fixes.js?v=20261101-ccna-main-source-hidden-1","./packet-lab/integration.js?v=20261031-day02-guest-1","./packet-lab/devices.js?v=20261024-bugfix-1","./packet-lab/ethernet.js?v=20261024-bugfix-1","./packet-lab/protocols.js?v=20261024-bugfix-1","./packet-lab/wireless.js?v=20261024-bugfix-1","./packet-lab/protocol-cli.js?v=20261024-bugfix-1","./packet-lab/cli.js?v=20261024-bugfix-1","./packet-lab/engine.js?v=20261024-bugfix-1","./packet-lab/curriculum.js?v=20261024-bugfix-1","./packet-lab/scenario-extensions.js?v=20261024-bugfix-1","./packet-lab/scenarios.js?v=20261024-bugfix-1","./packet-lab/wlc-ui.js?v=20261024-bugfix-1","./packet-lab/lab.js?v=20261031-postdrag-keyboard-1","./packet-lab/lab.css?v=20261024-bugfix-1","../shared/content-protection.js","../shared/account-sync.js","../shared/guest-access.js?v=20261029-guest-free-1","../shared/portal-nav.css?v=20261024-bugfix-1","../shared/portal-nav.js","../shared/offline-control.css","../shared/offline-control.js","./manifest.webmanifest","./icon.svg"];
ASSETS.push("../shared/study-mode.js","../shared/study-mode.css","../shared/study-frame.js?v=20261102-section-review-3","./study-adapter.js?v=20261102-section-review-3");
ASSETS.push("./data/modules/day03-tcpip.js?v=20261108-module-1","./lesson-overlay.js?v=20261108-module-1");

async function notify(client,type,extra={}){
  try{client&&client.postMessage({type,appId:APP_ID,...extra})}catch{}
}
async function fetchAndCache(cache,url){
  const absolute=new URL(url,self.registration.scope).href;
  const response=await fetch(absolute,{cache:"no-store",credentials:"same-origin"});
  if(!response.ok)throw new Error("HTTP "+response.status+" for "+absolute);
  await cache.put(absolute,response.clone());
}
async function cacheAll(client,refresh=false){
  const cache=await caches.open(CACHE_NAME);
  let done=0,failed=0;
  for(const url of ASSETS){
    try{
      if(refresh||!(await cache.match(new URL(url,self.registration.scope).href))) await fetchAndCache(cache,url);
    }catch(error){
      failed++;console.warn("[offline cache]",APP_ID,url,error);
    }
    done++;await notify(client,"CACHE_PROGRESS",{done,total:ASSETS.length,failed});
  }
  if(refresh) await notify(client,"REFRESH_DONE",{done,total:ASSETS.length,failed});
  else if(failed) await notify(client,"CACHE_ERROR",{done,total:ASSETS.length,failed});
  else await notify(client,"CACHE_DONE",{done,total:ASSETS.length,failed:0});
}
self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    for(const url of ["./","./index.html"]){
      try{await fetchAndCache(cache,url)}catch{}
    }
    self.skipWaiting();
  })());
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    const current=await caches.open(CACHE_NAME);
    for(const key of keys.filter(k=>k.startsWith("portal-offline-"+APP_ID+"-")&&k!==CACHE_NAME)){
      const previous=await caches.open(key);
      try{
        for(const request of await previous.keys()){
          if(!(await current.match(request))){const response=await previous.match(request);if(response)await current.put(request,response);}
        }
        await caches.delete(key);
      }catch(error){console.warn("[offline migration]",APP_ID,error);}
    }
    await self.clients.claim();
  })());
});
self.addEventListener("message",event=>{
  const type=event.data?.type;
  if(type==="CACHE_APP")event.waitUntil(cacheAll(event.source,false));
  if(type==="REFRESH_APP")event.waitUntil(cacheAll(event.source,true));
});
self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;

  if(req.mode==="navigate"){
    event.respondWith((async()=>{
      try{
        const network=await fetch(req);
        const cache=await caches.open(CACHE_NAME);
        if(network.ok && url.pathname.startsWith(APP_ROOT)) {
          const isShell = url.pathname === APP_ROOT || url.pathname === INDEX || !url.pathname.split("/").pop().includes(".");
          cache.put(isShell ? INDEX : req,network.clone()).catch(()=>{});
        }
        return network;
      }catch{
        const cache=await caches.open(CACHE_NAME);
        return (await cache.match(req)) || (await cache.match(INDEX)) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(req)||await cache.match(req,{ignoreSearch:true});
    const isCode=/\.(?:html?|js|css)(?:$|\?)/i.test(url.pathname+url.search) ||
      url.pathname.startsWith("/js/") || url.pathname.startsWith("/apps/shared/");

    if(isCode){
      try{
        const network=await fetch(req,{cache:"no-store"});
        if(network.ok)cache.put(req,network.clone()).catch(()=>{});
        return network;
      }catch{
        return cached || Response.error();
      }
    }

    if(cached){
      fetch(req).then(r=>{if(r.ok)cache.put(req,r.clone())}).catch(()=>{});
      return cached;
    }
    try{
      const network=await fetch(req);
      if(network.ok)cache.put(req,network.clone()).catch(()=>{});
      return network;
    }catch{
      return cached || Response.error();
    }
  })());
});

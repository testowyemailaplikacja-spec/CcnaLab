/* CCNAlab Beta only. Scoped to /apps/ccnalab-beta/ by registration.
 * This worker must NEVER serve or delete /apps/ccna/ data or cache.
 */
'use strict';
const APP_ROOT='/apps/ccnalab-beta/';
const CACHE='ccnalab-beta-offline-__CCNALAB_SHA__';
const STATUS=APP_ROOT+'.offline-cache-state.json';
const REQUIRED=[
 APP_ROOT,APP_ROOT+'index.html',APP_ROOT+'legacy.html',
 APP_ROOT+'ccnalab-beta-storage.js',APP_ROOT+'beta-tools.js',
 APP_ROOT+'beta-offline.js',APP_ROOT+'router.js',
 APP_ROOT+'study-frame-beta.js',APP_ROOT+'study-mode-beta.js',
 APP_ROOT+'packet-lab/integration.js',APP_ROOT+'packet-lab/lab.js',
 APP_ROOT+'packet-lab/engine.js',APP_ROOT+'packet-lab/lab.css'
];
const OPTIONAL=__CCNALAB_PRECACHE__;
const uniqueAssets=[...new Set(OPTIONAL.filter(asset=>
 typeof asset==='string'&&(asset.startsWith(APP_ROOT)||asset.startsWith('/apps/shared/'))
 && !REQUIRED.includes(asset)))];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    // Do not activate a version whose fundamental course, question and lab files failed.
    await cache.addAll(REQUIRED.map(p=>new Request(p,{cache:'reload'})));
    let saved=0, failed=0;
    for(const asset of uniqueAssets) {
      try {
        const response=await fetch(asset,{cache:'reload',credentials:'same-origin'});
        if(!response.ok)throw Error('HTTP '+response.status);
        await cache.put(asset,response);
        saved++;
      }catch(error){
        failed++;
        console.warn('[CCNAlab beta offline] asset unavailable:',asset,String(error?.message||error));
      }
    }
    // A checkable, same-cache receipt prevents a partial download being reported as complete.
    await cache.put(STATUS,new Response(JSON.stringify({
      version:1,cache:CACHE,complete:failed===0,
      optionalExpected:uniqueAssets.length,optionalSaved:saved,
      failed
    }),{headers:{'content-type':'application/json'}}));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys()){
      if(key.startsWith('ccnalab-beta-offline-')&&key!==CACHE)await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  // The only shared files served here are fetched by pages in our isolated scope.
  if(!url.pathname.startsWith(APP_ROOT)&&!url.pathname.startsWith('/apps/shared/'))return;
  const isNavigation=request.mode==='navigate'&&url.pathname.startsWith(APP_ROOT);
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const canonical=url.pathname;
    if(isNavigation){
      try {
        const net=await fetch(request);
        if(net.ok){
          if(canonical===APP_ROOT||canonical===APP_ROOT+'index.html')
            await cache.put(APP_ROOT+'index.html',net.clone());
          return net;
        }
      }catch{}
      const asset=/\.(?:html?|js|css|svg|json|webmanifest)$/.test(canonical);
      const fallback=asset?canonical:APP_ROOT+'index.html';
      return (await cache.match(fallback))||Response.error();
    }
    try{
      const network=await fetch(request);
      if(network.ok){
        if(/\.(?:html?|js|css|svg|json|webmanifest)$/.test(canonical))
          await cache.put(canonical,network.clone());
        return network;
      }
    }catch{}
    return (await cache.match(canonical))||(await cache.match(request,{ignoreSearch:true}))||Response.error();
  })());
});

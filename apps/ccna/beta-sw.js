/* Beta-only service worker. Rewritten at staging to use pinned SHA and an asset allowlist.
 * Scope MUST remain /apps/ccnalab-beta/; no cache or fetch interception for /apps/ccna/.
 */
'use strict';
const APP_ROOT='/apps/ccnalab-beta/';
const CACHE='ccnalab-beta-offline-__CCNALAB_SHA__';
const REQUIRED=[
 APP_ROOT,APP_ROOT+'index.html',APP_ROOT+'legacy.html',
 APP_ROOT+'ccnalab-beta-storage.js',APP_ROOT+'beta-tools.js',
 APP_ROOT+'beta-offline.js'
];
const OPTIONAL=__CCNALAB_PRECACHE__;
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    // Core assets must all be present before claiming offline readiness.
    await cache.addAll(REQUIRED.map(p=>new Request(p,{cache:'reload'})));
    for(const asset of OPTIONAL) {
      if(REQUIRED.includes(asset))continue;
      try {
        const response=await fetch(asset,{cache:'reload',credentials:'same-origin'});
        if(response.ok)await cache.put(asset,response);
      }catch{}
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys()){
      // Only remove this beta's previous versions.
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
  if(!url.pathname.startsWith(APP_ROOT))return;
  const isNavigation=request.mode==='navigate';
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const canonical=url.pathname;
    if(isNavigation){
      // Network-first for deep router URLs, fallback to the beta shell only.
      try {
        const net=await fetch(request);
        if(net.ok){
          if(canonical===APP_ROOT || canonical===APP_ROOT+'index.html')await cache.put(APP_ROOT+'index.html',net.clone());
          return net;
        }
      }catch{}
      return (await cache.match(APP_ROOT+'index.html'))||Response.error();
    }
    try{
      const network=await fetch(request);
      if(network.ok) {
        // Dynamic JS/HTML can update after a new pinned release; keep the latest copy.
        if(/\.(?:html?|js|css|svg|json|webmanifest)$/.test(canonical))await cache.put(canonical,network.clone());
        return network;
      }
    }catch{}
    return (await cache.match(canonical))||(await cache.match(request,{ignoreSearch:true}))||Response.error();
  })());
});
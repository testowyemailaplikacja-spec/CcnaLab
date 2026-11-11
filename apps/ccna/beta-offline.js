/* CCNAlab Beta offline controller: independent from Wiedora's CCNA SW. */
(() => {
  'use strict';
  if(!location.pathname.startsWith('/apps/ccnalab-beta/'))return;
  function attach(){
    const bar=document.getElementById('ccnalab-beta-stagebar');
    if(!bar||document.getElementById('ccnalab-beta-offline-status'))return;
    const wrap=document.createElement('span');
    wrap.id='ccnalab-beta-offline-status';
    wrap.style.cssText='font:12px/1.4 system-ui;color:white;align-self:center';
    wrap.setAttribute('role','status');
    wrap.setAttribute('aria-live','polite');
    wrap.textContent='Offline: przygotowywanie…';
    bar.append(wrap);
    if(!('serviceWorker' in navigator)||!('caches' in window)){
      wrap.textContent='Offline: niedostępne w tej przeglądarce';
      return;
    }
    navigator.serviceWorker.register('/apps/ccnalab-beta/beta-sw.js',{scope:'/apps/ccnalab-beta/'})
      .then(async reg=>{
        await navigator.serviceWorker.ready;
        const storage=await caches.keys();
        const cached=storage.filter(name=>name.startsWith('ccnalab-beta-offline-'));
        if(!cached.length){
          wrap.textContent='Offline: pakiet nie jest jeszcze zapisany';
          return;
        }
        const cache=await caches.open(cached[0]);
        const shell=await cache.match('/apps/ccnalab-beta/index.html');
        const legacy=await cache.match('/apps/ccnalab-beta/legacy.html');
        wrap.textContent=shell&&legacy?'Offline: pakiet zapisany na urządzeniu':'Offline: pakiet niekompletny';
        reg.update().catch(()=>{});
      }).catch(()=>{wrap.textContent='Offline: nie udało się zapisać pakietu';});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});
  else attach();
})();
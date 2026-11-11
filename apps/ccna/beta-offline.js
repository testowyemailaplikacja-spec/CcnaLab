/* CCNAlab Beta only: truthful offline readiness for the separate course scope. */
(() => {
  'use strict';
  const ROOT='/apps/ccnalab-beta/';
  if(!location.pathname.startsWith(ROOT))return;
  const STATUS=ROOT+'.offline-cache-state.json';
  function attach() {
    const bar=document.getElementById('ccnalab-beta-stagebar');
    if(!bar||document.getElementById('ccnalab-beta-offline-status'))return;
    const status=document.createElement('span');
    status.id='ccnalab-beta-offline-status';
    status.style.cssText='font:12px/1.4 system-ui;color:white;align-self:center';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    const setStatus=message=>{status.textContent=message;};
    setStatus('Offline: przygotowywanie pakietu…');
    bar.append(status);
    if(!('serviceWorker' in navigator)||!('caches' in window)){
      setStatus('Offline: przeglądarka nie obsługuje zapisu pakietu');
      return;
    }
    // navigator.serviceWorker.ready is NOT a beta readiness check: it can resolve
    // with the existing Wiedora root registration before the beta has installed.
    function waitForBeta(reg) {
      if(reg.active)return Promise.resolve(reg.active);
      const installing=reg.installing||reg.waiting;
      if(!installing)return Promise.reject(Error('No beta service worker'));
      if(installing.state==='activated')return Promise.resolve(installing);
      return new Promise((resolve,reject)=>{
        let timer;
        const finish=(error)=>{
          clearTimeout(timer);
          installing.removeEventListener('statechange',onState);
          if(error)reject(error);else resolve(reg.active||installing);
        };
        const onState=()=>{
          if(installing.state==='activated')finish();
          else if(installing.state==='redundant')finish(Error('Beta SW installation failed'));
        };
        installing.addEventListener('statechange',onState);
        timer=setTimeout(()=>finish(Error('Beta SW activation timeout')),90000);
        onState();
      });
    }
    async function checkCache() {
      const names=(await caches.keys()).filter(name=>name.startsWith('ccnalab-beta-offline-'));
      if(!names.length){setStatus('Offline: pakiet jeszcze nie został zapisany');return;}
      // All earlier names are removed by activation. A receipt identifies completeness.
      for(const name of names.slice().reverse()){
        const cache=await caches.open(name);
        const [shell,legacy,receipt]=await Promise.all([
          cache.match(ROOT+'index.html'),
          cache.match(ROOT+'legacy.html'),
          cache.match(STATUS)
        ]);
        if(!shell||!legacy)continue;
        let result;
        try{result=receipt?await receipt.json():null;}catch{}
        if(!result||result.cache!==name||result.version!==1){
          setStatus('Offline: podstawowe materiały zapisane · pełna zawartość niezweryfikowana');
        }else if(result.complete&&result.failed===0&&result.optionalSaved===result.optionalExpected){
          setStatus('Offline: pełny pakiet bety zapisany na urządzeniu');
        }else{
          setStatus('Offline: część materiałów wymaga Internetu ('+
            result.optionalSaved+'/'+result.optionalExpected+' plików dodatkowych)');
        }
        return;
      }
      setStatus('Offline: niekompletny pakiet — wymagane połączenie');
    }
    navigator.serviceWorker.register(ROOT+'beta-sw.js',{scope:ROOT}).then(async reg=>{
      reg.addEventListener('updatefound',()=>{
        const sw=reg.installing;
        sw?.addEventListener('statechange',()=>{
          if(sw.state==='activated')checkCache().catch(()=>setStatus('Offline: nie udało się sprawdzić pakietu'));
        });
      });
      await waitForBeta(reg);
      await checkCache();
      reg.update().catch(()=>{});
      window.addEventListener('online',()=>{checkCache().catch(()=>{});});
    }).catch(()=>setStatus('Offline: nie udało się zapisać pakietu'));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});
  else attach();
})();
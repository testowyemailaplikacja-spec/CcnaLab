/* CCNAlab Beta: only runs on the separate /apps/ccnalab-beta/ preview.
 * Local backup; no cloud upload or access to /apps/ccna/ progress.
 */
(() => {
  'use strict';
  if (!location.pathname.startsWith('/apps/ccnalab-beta/')) return;
  const PREFIX='ccnalab-beta:v1:';
  const KEYS=Object.freeze([
    'ccna-learning-progress-v1',
    'ccna-spaced-review-v1',
    'ccna-unified-study-v1',
    'ccnalab-beta-all-labs-v1'
  ]);
  const LIMIT=5*1024*1024;
  function safeStorage() {
    try {
      const key=PREFIX+'__probe';
      localStorage.setItem(key,'ok');
      if (localStorage.getItem(key)!=='ok') throw Error('No read-back');
      localStorage.removeItem(key);
      return true;
    } catch { return false; }
  }
  function snapshot() {
    const data=Object.create(null);
    for(const key of KEYS) {
      const value=localStorage.getItem(PREFIX+key);
      if(value!==null)data[key]=value;
    }
    return data;
  }
  function validateBackup(parsed) {
    if(!parsed || typeof parsed!=='object' || Array.isArray(parsed) ||
      parsed.app!=='ccnalab-beta' || parsed.version!==1 ||
      !parsed.data || typeof parsed.data!=='object' || Array.isArray(parsed.data))
      throw Error('Nieprawidłowy format kopii CCNAlab Beta.');
    const keys=Object.keys(parsed.data);
    if(keys.some(key=>!KEYS.includes(key)))throw Error('Kopia zawiera nieznane klucze. Import zatrzymany.');
    for(const key of keys) {
      const value=parsed.data[key];
      if(typeof value!=='string' || value.length>LIMIT)throw Error('Nieprawidłowe dane: '+key);
      let structured;
      try{structured=JSON.parse(value)}catch{throw Error('Nieprawidłowy JSON postępu: '+key);}
      if(!structured || typeof structured!=='object' || Array.isArray(structured))
        throw Error('Nieprawidłowa struktura postępu: '+key);
    }
    return parsed.data;
  }
  function createUI() {
    const stage=document.getElementById('ccnalab-beta-stagebar');
    if(!stage || document.getElementById('ccnalab-beta-backup'))return;
    const row=document.createElement('section');
    row.id='ccnalab-beta-backup';
    row.setAttribute('aria-label','Kopia postępu CCNAlab Beta');
    row.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:9px 14px;background:#eaf4ff;color:#14334f;font:13px/1.45 system-ui;border-bottom:1px solid #b7d2eb';
    const label=document.createElement('span');
    label.id='ccnalab-beta-storage-status';
    label.style.cssText='flex:1 1 220px';
    const accessibleButton=(text,action)=>{
      const b=document.createElement('button');
      b.type='button'; b.textContent=text; b.addEventListener('click',action);
      b.style.cssText='min-height:44px;border:1px solid #30628b;border-radius:7px;padding:8px 12px;background:#fff;color:#123858;cursor:pointer';
      return b;
    };
    const input=document.createElement('input');
    input.type='file';input.accept='.json,application/json';input.hidden=true;
    input.setAttribute('aria-label','Wybierz kopię postępu CCNAlab Beta');
    function setStatus(message,error=false) {
      label.textContent=message;
      label.style.color=error?'#a11b28':'#14334f';
    }
    const available=safeStorage();
    setStatus(available
      ? 'Postęp bety zapisuje się lokalnie na tym urządzeniu. Nie jest synchronizowany z kontem Wiedory.'
      : 'Zapis postępu jest niedostępny. Przeglądarka może usunąć wyniki po zamknięciu.',!available);
    const download=accessibleButton('Eksportuj postęp',()=>{
      if(!safeStorage()){setStatus('Nie można odczytać lokalnego zapisu.',true);return;}
      try {
        const backup={app:'ccnalab-beta',version:1,exportedAt:new Date().toISOString(),data:snapshot()};
        const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a');a.href=url;a.download='ccnalab-beta-postep.json';document.body.appendChild(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),2000);
        setStatus('Kopia postępu została przygotowana do pobrania.');
      }catch{setStatus('Nie udało się wyeksportować postępu.',true);}
    });
    const importButton=accessibleButton('Importuj postęp',()=>input.click());
    input.addEventListener('change',async()=>{
      const file=input.files?.[0];input.value='';
      if(!file)return;
      if(!safeStorage()){setStatus('Brak dostępu do lokalnego zapisu.',true);return;}
      if(file.size>LIMIT){setStatus('Kopia przekracza limit 5 MB.',true);return;}
      try {
        const parsed=JSON.parse(await file.text());
        const data=validateBackup(parsed);
        const keys=Object.keys(data);
        if(!keys.length){setStatus('Kopia nie zawiera zapisanych wyników.',true);return;}
        if(!window.confirm('Import zastąpi zapisane wyniki CCNAlab Beta na tym urządzeniu. Stare CCNA pozostanie nietknięte. Kontynuować?'))return;
        const rollback=snapshot();
        try {
          for(const key of KEYS) {
            if(Object.hasOwn(data,key)) localStorage.setItem(PREFIX+key,data[key]);
            else localStorage.removeItem(PREFIX+key);
          }
        }catch(error){
          for(const key of KEYS)try {
            if(Object.hasOwn(rollback,key))localStorage.setItem(PREFIX+key,rollback[key]);
            else localStorage.removeItem(PREFIX+key);
          }catch{}
          throw error;
        }
        setStatus('Zaimportowano postęp bety. Odśwież stronę, aby załadować wyniki.');
      }catch(error){setStatus(error?.message||'Nie udało się wczytać kopii.',true);}
    });
    download.disabled=importButton.disabled=!available;
    row.append(label,download,importButton,input);
    stage.insertAdjacentElement('afterend',row);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',createUI,{once:true});
  else createUI();
})();

(() => {
  "use strict";
  if(!("serviceWorker" in navigator)) return;

  const APP_LABELS={
    prawo:"Aplikacja prawnicza",
    ccna:"CCNA",
    fitplan:"FitPlan",
    oficerska:"Aplikacja oficerska"
  };
  const match=location.pathname.match(/^\/apps\/([^/]+)/);
  const appId=match?.[1];
  if(!APP_LABELS[appId]) return;

  const enabledKey="portal-offline-enabled:"+appId;
  const pendingKey="portal-sync-pending:"+appId;
  const lastRefreshKey="portal-offline-refreshed:"+appId;
  const lastOnlineKey="portal-last-online:"+appId;
  const originalSetItem=Storage.prototype.setItem;
  let installing=false;
  let registration=null;

  const button=document.createElement("button");
  button.type="button";
  button.className="offline-control";
  button.innerHTML='<span class="offline-icon" aria-hidden="true">⇩</span><span class="offline-label">Włącz offline</span>';
  button.setAttribute("aria-label","Pobierz aplikację do korzystania bez internetu");
  document.body.appendChild(button);

  const toast=document.createElement("div");
  toast.className="offline-toast";
  toast.hidden=true;
  document.body.appendChild(toast);
  let toastTimer=0;

  function showToast(text,ms=4200){
    clearTimeout(toastTimer);toast.textContent=text;toast.hidden=false;
    toastTimer=setTimeout(()=>toast.hidden=true,ms);
  }
  function isEnabled(){try{return localStorage.getItem(enabledKey)==="1"}catch{return false}}
  function setRaw(key,value){try{originalSetItem.call(localStorage,key,value)}catch{}}
  function setEnabled(){setRaw(enabledKey,"1")}
  function markPending(){
    if(!isEnabled())return;
    setRaw(pendingKey,String(Date.now()));
    render();
  }
  function pending(){try{return localStorage.getItem(pendingKey)}catch{return null}}
  function clearPending(){try{localStorage.removeItem(pendingKey)}catch{}}

  function render(){
    const label=button.querySelector(".offline-label");
    button.classList.remove("ready","offline-now","error");
    if(installing){
      button.disabled=true;label.textContent="Pobieranie…";return;
    }
    button.disabled=false;
    if(!navigator.onLine){
      button.classList.add("offline-now");
      label.textContent=isEnabled()?"Tryb offline":"Brak internetu";
      return;
    }
    if(isEnabled()){
      button.classList.add("ready");
      label.textContent=pending()?"Offline · zapis lokalny":"Offline gotowe";
    }else{
      label.textContent="Włącz offline";
    }
  }

  async function getReadyWorker(){
    if(!registration) registration=await navigator.serviceWorker.register("/apps/"+appId+"/sw.js",{scope:"/apps/"+appId+"/"});
    if(registration.active)return registration.active;
    const ready=await navigator.serviceWorker.ready;
    return ready.active;
  }

  async function enableOffline(){
    if(installing)return;
    installing=true;render();
    try{
      const worker=await getReadyWorker();
      if(navigator.storage?.persist) { try{await navigator.storage.persist()}catch{} }
      worker.postMessage({type:"CACHE_APP"});
      showToast("Pobieram pliki "+APP_LABELS[appId]+". Nie zamykaj tej karty do zakończenia.");
    }catch(error){
      installing=false;button.classList.add("error");button.querySelector(".offline-label").textContent="Błąd offline";
      showToast("Nie udało się uruchomić trybu offline. Odśwież stronę i spróbuj ponownie.");
      console.error("[offline]",error);
    }
  }

  async function refreshOffline(){
    if(!isEnabled()||!navigator.onLine)return;
    try{
      const worker=await getReadyWorker();
      worker.postMessage({type:"REFRESH_APP"});
    }catch(error){console.warn("[offline refresh]",error)}
  }

  navigator.serviceWorker.addEventListener("message",event=>{
    const msg=event.data||{};
    if(msg.appId!==appId)return;
    if(msg.type==="CACHE_PROGRESS"){
      installing=true;
      const pct=msg.total?Math.round(msg.done/msg.total*100):0;
      button.querySelector(".offline-label").textContent="Pobieranie "+pct+"%";
    }
    if(msg.type==="CACHE_DONE"){
      installing=false;
      if(msg.failed){
        render();
        showToast("Nie udało się pobrać wszystkich plików. Spróbuj ponownie przy stabilnym połączeniu.");
      }else{
        setEnabled();render();
        showToast("Gotowe. "+APP_LABELS[appId]+" może teraz działać bez internetu.");
      }
    }
    if(msg.type==="CACHE_ERROR"){
      installing=false;render();
      showToast("Część plików nie została pobrana. Sprawdź połączenie i spróbuj ponownie.");
    }
    if(msg.type==="REFRESH_DONE"){
      installing=false;
      if(!msg.failed)setRaw(lastRefreshKey,String(Date.now()));
      setRaw(lastOnlineKey,String(Date.now()));
      if(pending()){
        window.dispatchEvent(new CustomEvent("portal-sync-request",{detail:{appId,changedAt:Number(pending())}}));
      }
      render();
    }
  });

  button.addEventListener("click",()=>{
    if(!navigator.onLine){showToast("Aby pierwszy raz włączyć tryb offline, połącz się z internetem.");return}
    enableOffline();
  });

  window.addEventListener("offline",()=>{
    if(isEnabled())markPending();
    render();
    if(isEnabled())showToast("Jesteś offline. Postęp będzie zapisywany lokalnie na tym urządzeniu.");
  });
  window.addEventListener("storage",event=>{
    if(!navigator.onLine && event.storageArea===localStorage && event.key && !String(event.key).startsWith("portal-")) markPending();
  });

  window.addEventListener("online",()=>{
    setRaw(lastOnlineKey,String(Date.now()));
    render();refreshOffline();
    if(isEnabled())showToast("Połączenie wróciło. Sprawdzam aktualizacje aplikacji i synchronizuję postęp.");
  });

  window.addEventListener("portal-progress-synced",event=>{
    if(event.detail?.appId!==appId)return;
    clearPending();
    setRaw(lastOnlineKey,String(Date.now()));
    render();
    if(isEnabled())showToast("Postęp został zsynchronizowany z Twoim kontem.");
  });

  // Oznacz lokalny postęp jako oczekujący, gdy aplikacja zapisuje dane podczas braku sieci.
  Storage.prototype.setItem=function(key,value){
    const result=originalSetItem.apply(this,arguments);
    if(this===localStorage && !navigator.onLine && !String(key).startsWith("portal-")) markPending();
    return result;
  };

  getReadyWorker().then(()=>{render();let last=0;try{last=Number(localStorage.getItem(lastRefreshKey)||0)}catch{}if(isEnabled()&&navigator.onLine&&Date.now()-last>3600000)refreshOffline()}).catch(()=>render());
  render();
})();

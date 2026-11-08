(() => {
  "use strict";

  const APP_PATH=/^\/apps\/(prawo|ccna|fitplan|oficerska)(?:\/|$)/;
  if(!APP_PATH.test(location.pathname))return;

  const client=window.AppSupabase;
  if(!client)return;

  const SETTING_KEY="app_content_protection";
  const CACHE_KEY="portal-app-content-protection-v1";
  const STYLE_ID="portal-content-protection-style";
  const WATERMARK_ID="portal-content-protection-watermark";
  const COVER_ID="portal-content-protection-cover";
  const installedDocs=new Set();

  let enabled=false;
  let coverLockUntil=0;

  try{enabled=localStorage.getItem(CACHE_KEY)==="1"}catch{}

  function addStyle(doc){
    if(!doc?.head||doc.getElementById(STYLE_ID))return;
    const style=doc.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      html.portal-content-protected,html.portal-content-protected body{-webkit-user-select:none!important;user-select:none!important}
      html.portal-content-protected img,html.portal-content-protected svg{-webkit-user-drag:none!important}
      #${WATERMARK_ID}{position:fixed;inset:0;z-index:2147483000;pointer-events:none;overflow:hidden;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:120px;align-items:center;justify-items:center;opacity:.105}
      #${WATERMARK_ID}[hidden]{display:none}
      #${WATERMARK_ID} span{font:800 13px/1.2 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.08em;color:#334155;transform:rotate(-28deg);white-space:nowrap}
      #${COVER_ID}{position:fixed;inset:0;z-index:2147483647;display:none;place-items:center;background:#0f172a;color:#fff;text-align:center;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
      #${COVER_ID}.visible{display:grid}
      #${COVER_ID} .portal-protection-cover-card{max-width:520px;padding:24px 28px;border:1px solid rgba(255,255,255,.15);border-radius:20px;background:rgba(255,255,255,.07);box-shadow:0 20px 70px rgba(0,0,0,.35)}
      #${COVER_ID} strong{display:block;font-size:20px;margin-bottom:7px}
      #${COVER_ID} span{display:block;color:#cbd5e1;font-size:12px;line-height:1.55}
      @media print{
        html.portal-content-protected body>*{display:none!important}
        html.portal-content-protected body::before{content:"Drukowanie treści tej aplikacji jest wyłączone.";display:block!important;padding:40px;font:700 18px ui-sans-serif,system-ui,sans-serif;color:#111}
      }
    `;
    doc.head.appendChild(style);
  }

  function ensureProtectionLayers(){
    const doc=document;
    addStyle(doc);

    let watermark=doc.getElementById(WATERMARK_ID);
    if(!watermark){
      watermark=doc.createElement("div");
      watermark.id=WATERMARK_ID;
      watermark.setAttribute("aria-hidden","true");
      for(let i=0;i<24;i++){
        const span=doc.createElement("span");
        span.textContent="TREŚĆ CHRONIONA";
        watermark.appendChild(span);
      }
      doc.body.appendChild(watermark);
    }

    let cover=doc.getElementById(COVER_ID);
    if(!cover){
      cover=doc.createElement("div");
      cover.id=COVER_ID;
      cover.setAttribute("aria-hidden","true");
      cover.innerHTML='<div class="portal-protection-cover-card"><strong>Treść aplikacji jest chroniona</strong><span>Zawartość została ukryta, ponieważ okno aplikacji nie jest aktywne.</span></div>';
      doc.body.appendChild(cover);
    }

    watermark.hidden=!enabled;
    if(!enabled)cover.classList.remove("visible");
  }

  function showCover(message,lockMs=0){
    if(!enabled)return;
    ensureProtectionLayers();
    const cover=document.getElementById(COVER_ID);
    if(!cover)return;
    const text=cover.querySelector("span");
    if(text&&message)text.textContent=message;
    cover.classList.add("visible");
    if(lockMs){
      coverLockUntil=Math.max(coverLockUntil,Date.now()+lockMs);
      setTimeout(()=>hideCover(),lockMs+30);
    }
  }

  function hideCover(){
    if(Date.now()<coverLockUntil)return;
    document.getElementById(COVER_ID)?.classList.remove("visible");
  }

  function blockedShortcut(event){
    const key=String(event.key||"");
    const lower=key.toLowerCase();
    const command=event.ctrlKey||event.metaKey;
    const printScreen=key==="PrintScreen";
    const print=command&&lower==="p";
    const copyOrCut=command&&(lower==="c"||lower==="x");
    const macCapture=event.metaKey&&event.shiftKey&&["3","4","5"].includes(lower);
    const captureTool=event.metaKey&&event.shiftKey&&lower==="s";
    return {blocked:printScreen||print||copyOrCut||macCapture||captureTool,screenshot:printScreen||macCapture||captureTool};
  }

  function installDocument(doc,win){
    if(!doc||!win||installedDocs.has(doc))return;
    installedDocs.add(doc);
    addStyle(doc);

    const stopIfProtected=event=>{
      if(!enabled)return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    };

    doc.addEventListener("copy",stopIfProtected,true);
    doc.addEventListener("cut",stopIfProtected,true);
    doc.addEventListener("contextmenu",stopIfProtected,true);
    doc.addEventListener("dragstart",stopIfProtected,true);
    doc.addEventListener("selectstart",stopIfProtected,true);
    doc.addEventListener("keydown",event=>{
      if(!enabled)return;
      const state=blockedShortcut(event);
      if(!state.blocked)return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      if(state.screenshot)showCover("Wykonywanie zrzutów ekranu jest wyłączone dla treści aplikacji.",1200);
    },true);

    try{
      const originalPrint=win.print?.bind(win);
      if(originalPrint){
        win.print=()=>{
          if(enabled){
            showCover("Drukowanie i zapisywanie treści aplikacji do PDF jest wyłączone.",1200);
            return;
          }
          return originalPrint();
        };
      }
    }catch{}

    doc.querySelectorAll("iframe").forEach(attachFrame);
    const observer=new MutationObserver(mutations=>{
      mutations.forEach(mutation=>mutation.addedNodes.forEach(node=>{
        if(node?.nodeType!==1)return;
        if(node.tagName==="IFRAME")attachFrame(node);
        node.querySelectorAll?.("iframe").forEach(attachFrame);
      }));
    });
    observer.observe(doc.documentElement,{childList:true,subtree:true});
  }

  function attachFrame(frame){
    if(!frame)return;
    const install=()=>{
      try{installDocument(frame.contentDocument,frame.contentWindow)}catch{}
    };
    frame.addEventListener("load",install,{passive:true});
    install();
  }

  function applyState(next){
    enabled=Boolean(next);
    try{localStorage.setItem(CACHE_KEY,enabled?"1":"0")}catch{}

    installedDocs.forEach(doc=>{
      try{doc.documentElement.classList.toggle("portal-content-protected",enabled)}catch{}
    });

    ensureProtectionLayers();
    if(enabled){
      coverLockUntil=0;
      hideCover();
    }
    window.dispatchEvent(new CustomEvent("portal-content-protection-change",{detail:{enabled}}));
  }

  async function refreshSetting(){
    try{
      const {data,error}=await client
        .from("portal_settings")
        .select("enabled")
        .eq("key",SETTING_KEY)
        .maybeSingle();
      if(error)throw error;
      applyState(Boolean(data?.enabled));
    }catch(error){
      console.warn("[content-protection] Nie udało się pobrać ustawienia.",error);
    }
  }

  installDocument(document,window);
  ensureProtectionLayers();
  applyState(enabled);

  document.addEventListener("visibilitychange",()=>{
    if(!enabled)return;
    if(document.hidden){
      showCover("Treść jest ukrywana, gdy karta aplikacji nie jest aktywna.");
    }else{
      coverLockUntil=0;
      setTimeout(hideCover,80);
    }
  },true);
  window.addEventListener("beforeprint",()=>{if(enabled)showCover("Drukowanie treści aplikacji jest wyłączone.",1200);});

  refreshSetting();
  setInterval(refreshSetting,15000);
  window.addEventListener("focus",refreshSetting,{passive:true});

  window.PortalContentProtection=Object.freeze({
    enabled:()=>enabled,
    refresh:refreshSetting
  });
})();

(() => {
  "use strict";
  // WIEDORA-CHANGE: WD-20261029-WIE-007-PUBLIC-LEARNING | TASK: WIE-007 | AUTHOR: ChatGPT / GPT-6
  // Temporary development policy: public learning is open; account/private data permissions stay unchanged.
  const REQUIRE_LOGIN_FOR_LEARNING = false;

  const client = window.AppSupabase;
  const frame = document.getElementById("appFrame");
  const appId = (location.pathname.split("/")[2] || "").trim();
  const LOGIN_URL = () => "/?konto=login&return=" + encodeURIComponent(location.pathname + location.search + location.hash);

  let authenticated = false;
  let stateVersion = 0;
  const officerDocuments = new WeakSet();

  function setState(isAuth){
    // WIEDORA-CHANGE: WD-20261029-WIE-155-SIGNOUT-CODEX1 | TASK: WIE-155 | AUTHOR: Codex / GPT-6
    // Public learning must not leave an account's unsaved calendar draft on screen after sign-out.
    if(authenticated&&!isAuth&&appId==="fitplan"){
      frame?.contentWindow?.FitPlanCalendarView?.hide();
      frame?.contentWindow?.goHome?.();
    }
    authenticated = Boolean(isAuth);
    stateVersion++;
    document.documentElement.dataset.portalAuth = authenticated ? "user" : "guest";
    if(frame?.contentWindow) applyToFrame(frame.contentWindow);
  }

  async function resolve(){
    if(!client){ setState(offlineSession()); return; }
    const version = stateVersion;
    try{
      const { data } = await client.auth.getSession();
      if(version===stateVersion)setState(Boolean(data?.session?.user)||offlineSession());
    }catch{
      if(version===stateVersion)setState(offlineSession());
    }
  }

  function offlineSession(){
    if(navigator.onLine)return false;
    try{return Boolean(JSON.parse(localStorage.getItem("portal-auth-session-v1")||"null")?.userId);}catch{return false;}
  }

  function buildOverlay(doc, message){
    let overlay = doc.getElementById("portalGuestLockOverlay");
    if(overlay) return overlay;
    overlay = doc.createElement("div");
    overlay.id = "portalGuestLockOverlay";
    overlay.style.cssText = [
      "position:fixed","inset:0","z-index:2147483646","display:grid","place-items:center",
      "padding:20px","background:rgba(12,18,32,.72)","backdrop-filter:blur(8px)"
    ].join(";");
    overlay.innerHTML = '<section style="width:min(560px,100%);background:#fff;border-radius:24px;padding:28px;box-shadow:0 28px 80px rgba(0,0,0,.28);font-family:Inter,system-ui,sans-serif;text-align:center;color:#162033">'+
      '<div style="width:58px;height:58px;border-radius:18px;background:#edf2ff;color:#3157d5;display:grid;place-items:center;margin:0 auto 14px;font-size:24px">🔒</div>'+
      '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#3157d5">Dostęp po zalogowaniu</div>'+
      '<h2 style="margin:9px 0 10px;font-size:26px;letter-spacing:-.03em">Zaloguj się, aby kontynuować</h2>'+
      '<p style="margin:0;color:#667085;line-height:1.6;font-size:14px">'+message+'</p>'+
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px">'+
      '<a target="_top" href="'+LOGIN_URL()+'" style="display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 15px;border-radius:12px;background:#3157d5;color:#fff;text-decoration:none;font-weight:800">Zaloguj się</a>'+
      '<button type="button" id="portalGuestBackButton" style="min-height:44px;padding:10px 15px;border-radius:12px;border:1px solid #dfe5ee;background:#fff;color:#344054;font-weight:800">Wróć</button>'+
      '</div></section>';
    doc.body.appendChild(overlay);
    overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");
    const previous=doc.activeElement;
    const close=()=>{overlay.remove();previous?.focus?.();};
    overlay.querySelector("#portalGuestBackButton")?.addEventListener("click",close);
    overlay.addEventListener("keydown",event=>{
      if(event.key==="Escape"){event.preventDefault();close();}
      if(event.key==="Tab"){
        const controls=[...overlay.querySelectorAll("a,button")],first=controls[0],last=controls.at(-1);
        if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus();}
      }
    });
    overlay.querySelector("button")?.focus();
    return overlay;
  }

  function guardFunctions(w, names, allowedPredicate, message="Bez logowania dostępny jest tylko pierwszy rozdział pierwszej części. Pozostałe materiały odblokowują się po zalogowaniu."){
    names.forEach(name=>{
      const original = w[name];
      if(typeof original !== "function" || original.__portalGuestGuard) return;
      function wrapped(...args){
        if(!REQUIRE_LOGIN_FOR_LEARNING || authenticated || allowedPredicate(name,args,w)){
          return original.apply(this,args);
        }
        buildOverlay(w.document,message);
      }
      wrapped.__portalGuestGuard = true;
      wrapped.__portalGuestOriginal = original;
      w[name] = wrapped;
    });
  }

  function installCcna(w){
    let freePartId = null;
    let freeSectionId = null;
    try{
      const firstSection = w.getLearningSections?.()[0];
      freeSectionId = firstSection?.id || null;
      freePartId = w.findPartForSection?.(freeSectionId)?.id || null;
    }catch{}

    const allow = (name,args)=>{
      if(name==="showHome" || name==="renderAdministrativeHome" || name==="openSection") return true;
      if(name==="renderPart") return args[0]===freePartId;
      if(name==="renderLearningSection" || name==="renderSubsection" || name==="renderWholeSectionExam" || name==="renderSectionStudy") return args[0]===freeSectionId;
      return false;
    };
    guardFunctions(w,[
      "renderPart","renderLearningSection","renderSubsection","renderWholeSectionExam","renderSectionStudy",
      "renderPartExam","renderLatinSection","renderProgressSection","renderCollectiveExam","renderAllStudy"
    ],allow);
  }

  function installFitplan(w){
    let freeId = "kalendarz-treningowy";
    try{
      const cards = [...w.document.querySelectorAll("#sectionGrid .section-card")];
      const first = cards[0];
      freeId = first?.getAttribute("data-section") || first?.dataset?.section || freeId;
      if(!freeId && first?.onclick){
        const m = String(first.getAttribute("onclick")||"").match(/openSection\(['"]([^'"]+)/);
        if(m) freeId = m[1];
      }
    }catch{}
    guardFunctions(w,["openSection"],(_name,args)=>String(args[0]||"")===String(freeId),"Bez logowania dostępny jest Kalendarz treningowy. Zaloguj się, aby otworzyć pozostałe moduły FitPlan.");
    guardFunctions(w,["switchTab"],()=>true);
  }

  function installOficerska(w){
    if(!officerDocuments.has(w.document)){
      officerDocuments.add(w.document);
      // Legacy buttons captured function references before our wrappers loaded.
      w.document.addEventListener("click",event=>{
        const button=event.target.closest?.("#homePage button");
        if(!REQUIRE_LOGIN_FOR_LEARNING||authenticated||!button||button.id==="openWritten")return;
        event.preventDefault();event.stopImmediatePropagation();
        buildOverlay(w.document,"Bez logowania dostępny jest pierwszy moduł: egzamin pisemny. Zaloguj się, aby otworzyć pozostałe materiały.");
      },true);
    }
    const free = new Set(["showHome","showWritten"]);
    guardFunctions(w,[
      "showWritten","showHistory","showMethodology","showOralSecond","showIhlOral",
      "showCollective","showWeaponsHub","openSafetyPage","openTechnicalPage",
      "openAssemblyPage","openNotesPage","openWeaponColloquiumPage"
    ],name=>free.has(name));
  }

  function applyToFrame(w){
    if(!w || !w.document?.body) return;
    w.document.getElementById("portalGuestLockOverlay")?.remove();
    if(REQUIRE_LOGIN_FOR_LEARNING&&!authenticated){
      if(appId==="ccna") installCcna(w);
      else if(appId==="fitplan") installFitplan(w);
      else if(appId==="oficerska") installOficerska(w);
    }
    // Reapply direct routes after guards are installed, including on sign-out.
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  frame?.addEventListener("load",()=>applyToFrame(frame.contentWindow));

  if(client){
    client.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_OUT")try{localStorage.removeItem("portal-auth-session-v1");}catch{}
      setState(Boolean(session?.user));
    });
  }
  resolve();
})();

(() => {
"use strict";
const BASE="/apps/ccna";
// WIEDORA-CHANGE: WD-20261030-WIE-008-CANONICAL | TASK: WIE-008 | AUTHOR: Codex / GPT-6
const CANONICAL_ORIGIN="https://constant-app.netlify.app";
const TITLE="Akademia cyberbezpieczeństwa — CCNA";
const DEFAULT_DESC="Nauka CCNA: sekcje tematyczne, laboratoria, pytania, fiszki, egzaminy i śledzenie postępów.";
const frame=document.getElementById("appFrame");
let restoring=false;
let installedDocument;
const clean=s=>String(s||"").replace(/^\/+|\/+$/g,"");
const path=s=>{const t=clean(s);return t?BASE+"/"+t+"/":BASE+"/";};
function preview(){const h=location.hostname;return h.endsWith(".netlify.app")||(h.endsWith(".vercel.app")&&h!=="stronaaplikacji.vercel.app")||h.startsWith("develop--");}
function seo(name=TITLE,description=DEFAULT_DESC,canonicalPath=path(""),indexable=true){
 document.title=name===TITLE?TITLE:name+" | "+TITLE;
 let d=document.querySelector('meta[name="description"]'); if(d)d.content=description;
 let r=document.querySelector('meta[name="robots"]'); if(r)r.content=(indexable&&!preview())?"index,follow,max-image-preview:large":"noindex,follow";
 let c=document.querySelector('link[rel="canonical"]'); if(c)c.href=CANONICAL_ORIGIN+canonicalPath;
 let ot=document.querySelector('meta[property="og:title"]'); if(ot)ot.content=document.title;
 let od=document.querySelector('meta[property="og:description"]'); if(od)od.content=description;
 let ou=document.querySelector('meta[property="og:url"]'); if(ou)ou.content=CANONICAL_ORIGIN+canonicalPath;
}
function nav(to,options={}){if(restoring)return;const u=new URL(to,location.origin);if(options.query)Object.entries(options.query).forEach(([k,v])=>v&&u.searchParams.set(k,v));const next=u.pathname+u.search;if(next!==location.pathname+location.search)history.pushState({appRouter:true},"",next);seo(options.title||TITLE,options.description||DEFAULT_DESC,options.canonical||u.pathname,options.indexable!==false);}
function wrap(w,name,after){const orig=w[name];if(typeof orig!=="function"||orig.__portalWrapped)return;function fn(...args){const result=orig.apply(this,args);if(!restoring)queueMicrotask(()=>{try{after(...args)}catch(e){console.warn("[router]",e)}});return result;}fn.__portalWrapped=true;fn.__orig=orig;w[name]=fn;}

function showModule(w){const h=w.document.getElementById("homePage"),m=w.document.getElementById("modulePage");if(h)h.hidden=true;if(m)m.hidden=false;}
// WIEDORA-CHANGE: WD-20261030-WIE-008-TARGETS-01 | TASK: WIE-008 | AUTHOR: Codex / GPT-6 (full version unknown)
function homeAtRoot(w){
 w.showHome?.();
 if(location.pathname!==path("")||location.search)history.replaceState({appRouter:true},"",path(""));
 seo();
}
function routeTargetExists(w,seg){
 if(seg[0]==="czesc")return seg.length===2&&Boolean(w.getPart(seg[1]));
 if(seg[0]!=="sekcja")return true;
 const section=w.getSection(seg[1]);
 if(section?.type!=="learning-section")return false;
 if(seg.length===2)return true;
 return seg.length===4&&seg[2]==="temat"&&w.getSubsection(section,seg[3])?.type==="learning-subsection";
}
function install(){
 const w=frame.contentWindow;
 if(typeof w?.renderSubsection!=="function"||installedDocument===w.document)return;
 installedDocument=w.document;
 wrap(w,"showHome",()=>nav(path(""),{title:TITLE}));
 wrap(w,"renderAdministrativeHome",()=>nav(path("kurs"),{title:"Kurs CCNA",description:"Pełna ścieżka nauki CCNA z podziałem na części, sekcje i laboratoria."}));
 wrap(w,"renderLaboratories",()=>nav(path("laboratoria"),{title:"Laboratoria CCNA",description:"Katalog istniejących laboratoriów CCNA, uporządkowany według kolejności kursu."}));
 wrap(w,"openSection",section=>{if(section?.id==="ccna")nav(path("kurs"),{title:"Kurs CCNA"});});
 wrap(w,"renderPart",id=>nav(path("czesc/"+encodeURIComponent(id)),{title:"Część kursu CCNA"}));
 wrap(w,"renderLearningSection",id=>nav(path("sekcja/"+encodeURIComponent(id)),{title:"Sekcja CCNA"}));
 wrap(w,"renderSubsection",(sid,subid,mode="note")=>nav(path("sekcja/"+encodeURIComponent(sid)+"/temat/"+encodeURIComponent(subid)),{title:"Temat CCNA",query:mode&&mode!=="note"?{tryb:mode}:null,indexable:mode==="note"}));
 wrap(w,"renderSectionStudy",id=>nav(path("sekcja/"+encodeURIComponent(id)),{title:"Fiszki CCNA",query:{tryb:"flashcards"},indexable:false}));
 wrap(w,"renderSectionLearningMode",id=>nav(path("sekcja/"+encodeURIComponent(id)),{title:"Tryb nauki CCNA",query:{tryb:"study"},indexable:false}));
 wrap(w,"renderAllStudy",(from="progress")=>nav(path("postep"),{title:"Fiszki — cały CCNA",query:{tryb:"flashcards",from},indexable:false}));
 wrap(w,"renderAllLearningMode",(from="progress")=>nav(path("postep"),{title:"Tryb nauki — cały CCNA",query:{tryb:"study",from},indexable:false}));
 wrap(w,"renderLatinSection",()=>nav(path("angielski"),{title:"Angielski techniczny CCNA"}));
 wrap(w,"renderProgressSection",()=>nav(path("postep"),{title:"Postęp CCNA",canonical:path("kurs"),indexable:false}));
 restore();
}
function restore(){
 const w=frame.contentWindow; if(!w)return; const seg=location.pathname.slice(BASE.length).split("/").filter(Boolean).map(value=>{try{return decodeURIComponent(value)}catch{return value}});
 // WIEDORA-CHANGE: WD-20261030-WIE-008-TARGETS-01 | TASK: WIE-008 | AUTHOR: Codex / GPT-6 (full version unknown)
 // Wait for the iframe data API before judging a bookmarked target as absent.
 if(seg[0]==="czesc"&&typeof w.getPart!=="function")return;
 if(seg[0]==="sekcja"&&(typeof w.getSection!=="function"||typeof w.getSubsection!=="function"))return;
 restoring=true;
 try{
   if(!routeTargetExists(w,seg)){homeAtRoot(w);}
   else if(!seg.length){w.showHome?.();seo();}
   else if(seg[0]==="kurs"){showModule(w);w.renderAdministrativeHome?.();seo("Kurs CCNA","Pełna ścieżka nauki CCNA.",path("kurs"));}
   else if(seg[0]==="laboratoria"){showModule(w);w.renderLaboratories?.();seo("Laboratoria CCNA","Katalog laboratoriów CCNA.",path("laboratoria"));}
   else if(seg[0]==="czesc"&&seg[1]){showModule(w);w.renderPart?.(seg[1]);seo("Część kursu CCNA",DEFAULT_DESC,path("czesc/"+encodeURIComponent(seg[1])));}
   else if(seg[0]==="sekcja"&&seg[1]&&seg[2]==="temat"&&seg[3]){const query=new URL(location.href).searchParams;let mode=query.get("tryb")||"note";if(query.get("study")==="1")mode="study";showModule(w);w.renderSubsection?.(seg[1],seg[3],mode);seo("Temat CCNA",DEFAULT_DESC,path("sekcja/"+encodeURIComponent(seg[1])+"/temat/"+encodeURIComponent(seg[3])),!query.has("tryb"));}
   else if(seg[0]==="sekcja"&&seg[1]){const mode=new URL(location.href).searchParams.get("tryb");showModule(w);if(mode==="flashcards")w.renderSectionStudy?.(seg[1]);else if(mode==="study")w.renderSectionLearningMode?.(seg[1]);else w.renderLearningSection?.(seg[1]);seo("Sekcja CCNA",DEFAULT_DESC,path("sekcja/"+encodeURIComponent(seg[1])));}
   else if(seg[0]==="angielski"){showModule(w);w.renderLatinSection?.();seo("Angielski techniczny CCNA",DEFAULT_DESC,path("angielski"));}
   else if(seg[0]==="postep"){const query=new URL(location.href).searchParams,mode=query.get("tryb"),from=query.get("from")||"progress";showModule(w);if(mode==="flashcards")w.renderAllStudy?.(from);else if(mode==="study")w.renderAllLearningMode?.(from);else w.renderProgressSection?.();seo("Postęp CCNA",DEFAULT_DESC,path("kurs"),false);}
   else {homeAtRoot(w);}
 } finally {restoring=false;}
}
frame.addEventListener("load",install);
window.addEventListener("popstate",restore);
window.addEventListener("portal-study-ready",restore);
seo();
if(frame.contentDocument?.readyState==="complete")install();
})();

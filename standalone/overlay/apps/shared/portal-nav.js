/* CCNA Lab standalone navigation adapter.
 * Preserves Wiedora's visible course page and preferences keys. It is excluded
 * from the upstream Wiedora export, where original portal-nav.js remains canonical.
 */
(() => {
 'use strict';
 const langKey='portal-language-v1',themeKey='portal-theme-v1';
 const themes=new Set(['light','blue','gray']);
 const languages=new Set(['pl','en']);
 const lookup=(key,fallback)=>{try{return localStorage.getItem(key)||fallback;}catch{return fallback;}};
 const currentLanguage=()=>languages.has(lookup(langKey,'pl'))?lookup(langKey,'pl'):'pl';
 const currentTheme=()=>themes.has(lookup(themeKey,'light'))?lookup(themeKey,'light'):'light';
 const frame=document.getElementById('appFrame');
 function applyDocument(doc){
   doc.documentElement.dataset.portalTheme=currentTheme();
   doc.documentElement.dataset.portalLanguage=currentLanguage();
   doc.documentElement.lang=currentLanguage();
 }
 function apply(){
   applyDocument(document);
   try{if(frame?.contentDocument)applyDocument(frame.contentDocument);}catch{}
   document.querySelectorAll('[data-portal-language]').forEach(btn=>{const active=btn.dataset.portalLanguage===currentLanguage();btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
   document.querySelectorAll('[data-portal-theme-choice]').forEach(btn=>{const active=btn.dataset.portalThemeChoice===currentTheme();btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
   window.dispatchEvent(new CustomEvent('portal-preferences-change',{detail:{language:currentLanguage(),theme:currentTheme()}}));
 }
 function set(key,value,allowed){if(!allowed.has(value))return;try{localStorage.setItem(key,value);}catch{}apply();}
 function install(){
   if(!document.querySelector('.portal-home-link')){
     const link=document.createElement('a');link.className='portal-home-link';link.href='/';link.setAttribute('aria-label','Wróć do strony CCNA Lab');
     link.innerHTML='<span class="portal-home-icon" aria-hidden="true">⌂</span><span class="portal-home-text">CCNA Lab</span>';
     document.body.appendChild(link);
   }
   if(!document.querySelector('.portal-preferences')){
     const bar=document.createElement('div');bar.className='portal-preferences';bar.setAttribute('aria-label','Język i kolorystyka');
     bar.innerHTML='<div class="portal-pref-group portal-language-switch" role="group" aria-label="Język"><button type="button" data-portal-language="pl">PL</button><button type="button" data-portal-language="en">EN</button></div><div class="portal-pref-group portal-theme-switch" role="group" aria-label="Motyw"><button type="button" data-portal-theme-choice="light" title="Jasny">☀</button><button type="button" data-portal-theme-choice="blue" title="Granatowy">◐</button><button type="button" data-portal-theme-choice="gray" title="Szary">◒</button></div>';
     document.body.appendChild(bar);
     bar.querySelectorAll('[data-portal-language]').forEach(btn=>btn.addEventListener('click',()=>set(langKey,btn.dataset.portalLanguage,languages)));
     bar.querySelectorAll('[data-portal-theme-choice]').forEach(btn=>btn.addEventListener('click',()=>set(themeKey,btn.dataset.portalThemeChoice,themes)));
   }
   if(frame)frame.addEventListener('load',apply);
   apply();
 }
 window.PortalPreferences=Object.freeze({
   getLanguage:currentLanguage,getTheme:currentTheme,
   setLanguage:v=>set(langKey,v,languages),setTheme:v=>set(themeKey,v,themes),
   translate:value=>String(value),translations:{},
   getMissingTranslations:()=>window.PortalI18n?.getMissing()||[],
   clearMissingTranslations:()=>window.PortalI18n?.clearMissing()
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

/* Local preferences adapter matching PortalData's public surface.
 * Does not share accounts or cloud data with Wiedora. */
(() => {
 'use strict';
 const KEY='ccnalab-standalone-preferences-v1';
 const record=x=>x&&typeof x==='object'&&!Array.isArray(x);
 const clone=x=>JSON.parse(JSON.stringify(x));
 function read(){ try { const value=JSON.parse(localStorage.getItem(KEY)||'{}'); return record(value)?value:{}; } catch {return {};} }
 let value=read();
 const keys=p=>Array.isArray(p)?p:String(p||'').split('.').filter(Boolean);
 const forbidden=new Set(['__proto__','prototype','constructor']);
 function get(p,def=null){let v=value;for(const k of keys(p)){if(forbidden.has(k)||!record(v)||!Object.hasOwn(v,k))return def;v=v[k];}return v===undefined?def:clone(v);}
 function set(p,newValue){const parts=keys(p);if(!parts.length||parts.some(k=>forbidden.has(k)))return false; const draft=clone(value);let target=draft;for(const key of parts.slice(0,-1)){if(!record(target[key]))target[key]={};target=target[key];}target[parts.at(-1)]=clone(newValue);try{localStorage.setItem(KEY,JSON.stringify(draft));value=draft;window.dispatchEvent(new CustomEvent('portal-preferences-change'));return true;}catch{return false;}}
 function patch(p,patchValue){const current=get(p,{});return set(p,{...(record(current)?current:{}),...(record(patchValue)?patchValue:{})});}
 window.PortalData=Object.freeze({ready:async()=>clone(value),get,set,patch,all:()=>clone(value),save:async()=>true});
 queueMicrotask(()=>window.dispatchEvent(new CustomEvent('portal-preferences-ready')));
})();

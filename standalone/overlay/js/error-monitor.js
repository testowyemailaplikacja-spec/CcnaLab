/* Standalone error monitor: local debugging only. Never uploads error reports. */
(() => {
 'use strict';
 const entries=[];
 const report=(message,stack='',source='standalone')=>{
   const item={message:String(message).slice(0,400),source:String(source).slice(0,80),at:new Date().toISOString()};
   entries.push(item);if(entries.length>100)entries.shift();
   console.warn('[CcnaLab local diagnostic]',item.message,stack||'');
   return Promise.resolve({localOnly:true});
 };
 window.PortalErrorMonitor=Object.freeze({report,entries:()=>entries.slice()});
 window.addEventListener('error',event=>{void report(event.message||'JavaScript error','','window.error');});
 window.addEventListener('unhandledrejection',event=>{void report(event.reason?.message||'Unhandled promise rejection','','promise');});
 window.addEventListener('portal-report-error',event=>{void report(event.detail?.message||'Application error','','application');});
})();

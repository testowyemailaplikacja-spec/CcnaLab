/* Standalone progress adapter. Keeps Wiedora's legacy localStorage keys unchanged.
 * Cloud account synchronization is intentionally not simulated. Export/import
 * is explicit and does not remove unrelated application data.
 */
(() => {
  'use strict';
  const APP='ccna';
  const store=window.PortalProgressStorage;
  if(!store?.snapshot||!store?.applySnapshot)return;
  function exportData(){return {format:'ccnalab-progress-v1',appId:APP,exportedAt:new Date().toISOString(),storage:store.snapshot(APP)};}
  function importData(payload){
    if(!payload||payload.format!=='ccnalab-progress-v1'||payload.appId!==APP||!payload.storage||typeof payload.storage!=='object'||Array.isArray(payload.storage))throw new TypeError('Wrong CCNA progress format');
    const accepted=new Set(store.keysFor(APP));
    for(const [key,val] of Object.entries(payload.storage))if(!accepted.has(key)||(val!==null&&typeof val!=='string'))throw new TypeError('Unknown key or invalid progress value: '+key);
    // Validate entire input before modifying any localStorage key.
    store.applySnapshot(APP,{...store.snapshot(APP),...payload.storage});
    window.dispatchEvent(new CustomEvent('ccnalab-local-progress-imported'));
    return true;
  }
  window.CCNALabLocalProgress=Object.freeze({exportData,importData,mode:'local-only'});
})();

/* Standalone identity boundary — local/guest mode ONLY.
 * Do not fabricate a Supabase session or use the Wiedora production project.
 * When integrated back into Wiedora this overlay is EXCLUDED and the real host
 * supplies its original /js/supabase-client.js.
 */
(() => {
  'use strict';
  window.CCNALabRuntime = Object.freeze({mode:'standalone',account:'local',cloudSync:false});
  window.AppSupabase = null;
  window.dispatchEvent(new CustomEvent('ccnalab-runtime-ready',{detail:window.CCNALabRuntime}));
})();

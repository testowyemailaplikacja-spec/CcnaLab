'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=__dirname;
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const offline=read('beta-sw.js');
const tools=read('beta-tools.js');
const mobile=read('beta-mobile.css');

test('beta offline service worker is hard scoped and has an explicit versioned cache',()=>{
  assert.match(offline,/const APP_ROOT='\/apps\/ccnalab-beta\/'/);
  assert.match(offline,/startsWith\(APP_ROOT\)/);
  assert.match(offline,/ccnalab-beta-offline-__CCNALAB_SHA__/);
  assert.match(offline,/const OPTIONAL=__CCNALAB_PRECACHE__/);
  assert.match(offline,/await cache\.addAll\(REQUIRED/);
  assert.match(offline,/const fallback=asset\?canonical:APP_ROOT\+'index\.html'/);
  assert.doesNotMatch(offline,/caches\.delete\(key\)[^;]*?key\.startsWith\('portal-offline-ccna'/);
});
test('staging requires a compiled offline precache with actual paths',()=>{
  const generated=offline.replace('__CCNALAB_SHA__','0123456789ab')
    .replace('__CCNALAB_PRECACHE__',JSON.stringify(['/apps/ccnalab-beta/router.js','/apps/shared/study-mode.css']));
  assert.doesNotMatch(generated,/__CCNALAB_/);
  assert.doesNotThrow(()=>new vm.Script(generated));
  assert.match(generated,/0123456789ab/);
});
test('beta-only controls avoid network upload and read only isolated keys',()=>{
  assert.match(tools,/const PREFIX='ccnalab-beta:v1:';/);
  for(const name of ['ccna-learning-progress-v1','ccna-spaced-review-v1','ccna-unified-study-v1','ccnalab-beta-all-labs-v1'])
    assert.ok(tools.includes(name));
  assert.match(tools,/Object\.keys\(parsed\.data\)/);
  assert.match(tools,/keys\.some\(key=>!KEYS\.includes\(key\)\)/);
  assert.match(tools,/window\.confirm\(/);
  assert.match(tools,/const rollback=snapshot\(\)/);
  assert.doesNotMatch(tools,/\bfetch\(|XMLHttpRequest|AppSupabase|postMessage\(/);
  assert.doesNotThrow(()=>new vm.Script(tools));
});
test('touch targets use 44px while preserving horizontal toolbar scroll',()=>{
  assert.match(mobile,/min-width:\s*44px\s*!important/);
  assert.match(mobile,/height:\s*44px\s*!important/);
  assert.match(mobile,/overflow-x:\s*auto/);
  assert.doesNotThrow(()=>new vm.Script(read('beta-offline.js')));
});

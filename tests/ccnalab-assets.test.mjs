import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLocalAsset, listReferencedAssets, auditAssets } from '../scripts/ccnalab-asset-audit.mjs';

test('relative host resources normalize under apps/shared',()=>{
 assert.equal(resolveLocalAsset('apps/ccna/index.html','../shared/study-mode.js?v=1'),'apps/shared/study-mode.js');
 assert.equal(resolveLocalAsset('apps/ccna/index.html','/js/platform-data.js?v=1'),'js/platform-data.js');
});
test('routes and remote resources are not confused with files',()=>{
 assert.equal(resolveLocalAsset('apps/ccna/index.html','/apps/ccna/'),null);
 assert.equal(resolveLocalAsset('apps/ccna/index.html','https://example.invalid/a.js'),null);
});
test('HTML and SW references are collected without returning paths from comments',()=>{
 const refs=listReferencedAssets('<script src="../shared/a.js"></script>','const ASSETS=["./a.js"]; ASSETS.push("../shared/b.css");');
 assert.deepEqual(refs.map(x=>x.url),['../shared/a.js','./a.js','../shared/b.css']);
});
test('static audit finds missing host assets on current standalone import',()=>{
 const result=auditAssets();
 assert.ok(result.missing.some(x=>x.path==='apps/shared/study-mode.js'));
 assert.ok(result.missing.some(x=>x.path==='js/supabase-client.js'));
 assert.equal(result.status,'BLOCKED_DEPENDENCIES');
});

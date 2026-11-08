import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { buildStandalone } from '../scripts/build-standalone.mjs';
import { prepareWiedoraExport } from '../scripts/prepare-wiedora-export.mjs';
import { resolveLocalAsset, listReferencedAssets } from '../scripts/ccnalab-asset-audit.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const overlay=path.join(ROOT,'standalone/overlay');

test('all CCNA wrapper and service-worker asset references have a source or standalone overlay',()=>{
 const html=fs.readFileSync(path.join(ROOT,'apps/ccna/index.html'),'utf8');
 const sw=fs.readFileSync(path.join(ROOT,'apps/ccna/sw.js'),'utf8');
 const refs=listReferencedAssets(html,sw);
 const missing=[];
 for(const ref of refs){
  const source=resolveLocalAsset(ref.from,ref.url);
  if(!source)continue;
  if(!fs.existsSync(path.join(ROOT,source))&&!fs.existsSync(path.join(overlay,source)))missing.push(source);
 }
 assert.deepEqual([...new Set(missing)],[]);
});

test('standalone does not contain live Supabase credentials or fake remote authentication',()=>{
 const client=fs.readFileSync(path.join(overlay,'js/supabase-client.js'),'utf8');
 const sdk=fs.readFileSync(path.join(overlay,'assets/vendor/supabase-2.117.2.js'),'utf8');
 assert.doesNotMatch(client+sdk,/sb_publishable_|sb_secret_|supabase\.co|service_role/);
 assert.match(client,/window\.AppSupabase\s*=\s*null/);
});

test('independent build and Wiedora export preserve the original course but isolate host overrides',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ccnalab-package-'));
 try{
  for(const p of ['apps/ccna','standalone/overlay','standalone/site']){
   fs.mkdirSync(path.join(temp,path.dirname(p)),{recursive:true});
   fs.cpSync(path.join(ROOT,p),path.join(temp,p),{recursive:true});
  }
  fs.mkdirSync(path.join(temp,'docs'),{recursive:true});
  fs.copyFileSync(path.join(ROOT,'docs/CCNALAB_PROTECTED_ORIGINAL_FILES.json'),path.join(temp,'docs/CCNALAB_PROTECTED_ORIGINAL_FILES.json'));
  const built=buildStandalone({root:temp});
  assert.equal(built.status,'PASS_STATIC_PACKAGE');
  assert.equal(built.missingAssets,0);
  assert.ok(built.assetReferences>=40);
  const unchanged=['apps/ccna/legacy.html','apps/ccna/packet-lab/engine.js','apps/ccna/packet-lab/lab.js','apps/ccna/sw.js'];
  for(const p of unchanged)assert.deepEqual(fs.readFileSync(path.join(temp,p)),fs.readFileSync(path.join(temp,'dist',p)),p);
  const newIndex=fs.readFileSync(path.join(temp,'dist/apps/ccna/index.html'),'utf8');
  assert.match(newIndex,/noindex,nofollow/);
  assert.doesNotMatch(newIndex,/https:\/\/constant-app\.netlify\.app\/apps\/ccna\//);
  const exported=prepareWiedoraExport({root:temp});
  assert.deepEqual(exported.modifiedAgainstOriginal.map(x=>x.path),['apps/ccna/index.html','apps/ccna/packet-lab/tests/browser-ethernet.cjs','apps/ccna/sw.js']);
  assert.deepEqual(exported.addedAgainstOriginal.map(x=>x.path),['apps/ccna/answer-quality.js','apps/ccna/data/modules/day03-tcpip.js','apps/ccna/lesson-overlay.js']);
  assert.equal(exported.removedAgainstOriginal.length,0);
  assert.equal(exported.files,40);
  assert.deepEqual(fs.readFileSync(path.join(temp,'dist-wiedora/apps/ccna/index.html')),fs.readFileSync(path.join(temp,'apps/ccna/index.html')));
  assert.equal(fs.existsSync(path.join(temp,'dist-wiedora/apps/shared')),false);
  assert.equal(fs.existsSync(path.join(temp,'dist-wiedora/js')),false);
  assert.equal(fs.existsSync(path.join(temp,'dist-wiedora/standalone')),false);
 } finally {fs.rmSync(temp,{recursive:true,force:true});}
});

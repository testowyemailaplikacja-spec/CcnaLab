/**
 * Static asset dependency audit for independent CcnaLab hosting.
 * Run: node scripts/ccnalab-asset-audit.mjs [--strict]
 * --strict exits 1 when local dependencies do not exist.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function resolveLocalAsset(sourcePath, resource) {
  if (typeof resource !== 'string' || !resource) return null;
  if (/^(?:https?:|data:|mailto:|#)/i.test(resource)) return null;
  const pathname=resource.split(/[?#]/)[0];
  if (pathname === '/' || pathname.endsWith('/')) return null; // route, not a file
  const finalPath=pathname.startsWith('/') ? pathname.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath),pathname));
  if (finalPath.startsWith('../') || path.posix.isAbsolute(finalPath)) return null;
  return finalPath;
}

export function listReferencedAssets(index, sw) {
  const refs=[];
  const html=/<(?:script|link|iframe|img)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["']/gi;
  let found;
  while ((found=html.exec(index))) refs.push({from:'apps/ccna/index.html',url:found[1]});
  const match=sw.match(/const ASSETS\s*=\s*\[([\s\S]*?)\]/);
  const push=sw.match(/ASSETS\.push\(([\s\S]*?)\)\s*;/);
  for(const item of [match?.[1],push?.[1]]) if(item) {
    const strings=/"([^"]+)"/g; let s;while((s=strings.exec(item))) refs.push({from:'apps/ccna/sw.js',url:s[1]});
  }
  return refs;
}

export function auditAssets({root=ROOT,index,sw}={}) {
  const html=index ?? fs.readFileSync(path.join(root,'apps/ccna/index.html'),'utf8');
  const worker=sw ?? fs.readFileSync(path.join(root,'apps/ccna/sw.js'),'utf8');
  const byFile=new Map();
  for (const item of listReferencedAssets(html,worker)) {
    const location=resolveLocalAsset('apps/ccna/index.html',item.url);
    if(!location)continue;
    const prior=byFile.get(location)||{path:location,referencedFrom:[],exists:fs.existsSync(path.join(root,location))};
    prior.referencedFrom.push(item.from);
    byFile.set(location,prior);
  }
  const resources=[...byFile.values()].sort((a,b)=>a.path.localeCompare(b.path));
  const missing=resources.filter(x=>!x.exists);
  return {status:missing.length?'BLOCKED_DEPENDENCIES':'PASS_STATIC_PATHS',references:resources.length,existing:resources.length-missing.length,missing};
}

const main=process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main){
  const at=process.argv.indexOf('--root');
  if(at>=0&&(!process.argv[at+1]||process.argv[at+1].startsWith('--')))throw new Error('Use --root path');
  const root=at>=0?path.resolve(ROOT,process.argv[at+1]):ROOT;
  if(root!==ROOT&&!root.startsWith(ROOT+path.sep))throw new Error('Audit root must stay within repository');
  const result=auditAssets({root});
  console.log(JSON.stringify({root:path.relative(ROOT,root)||'.',...result},null,2));
  if(process.argv.includes('--strict')&&result.missing.length)process.exitCode=1;
}

/**
 * Build standalone static CCNA without modifying original Wiedora app source.
 * The overlay provides locally scoped host dependencies for development.
 * No production credentials or backend are copied into dist.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditAssets } from './ccnalab-asset-audit.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const DIST=path.join(ROOT,'dist');
const inside=(base,relative)=>{const target=path.resolve(base,relative);if(target===base||!target.startsWith(base+path.sep))throw new Error('Unsafe build destination: '+relative);return target;};
const copy=(src,dst)=>{if(!fs.existsSync(src))throw new Error('Missing source: '+src);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.cpSync(src,dst,{recursive:true,force:false,errorOnExist:true});};
function overlayCopy(from,to){
 for(const entry of fs.readdirSync(from,{withFileTypes:true})){
   const source=path.join(from,entry.name),destination=path.join(to,entry.name);
   if(entry.isDirectory()){fs.mkdirSync(destination,{recursive:true});overlayCopy(source,destination);}
   else if(entry.isFile())copy(source,destination);
   else throw new Error('Symlink or special file not allowed: '+source);
 }
}
export function buildStandalone({root=ROOT,output=path.join(root,'dist')}={}){
 root=path.resolve(root);output=path.resolve(output);
 if(!output.startsWith(root+path.sep)||!['dist','.tmp-ccnalab-standalone'].includes(path.basename(output)))throw new Error('Use only the explicit temporary build output');
 const overlay=inside(root,'standalone/overlay');
 const app=inside(root,'apps/ccna');
 const website=inside(root,'standalone/site');
 if(!fs.existsSync(overlay)||!fs.existsSync(app))throw new Error('Missing code or standalone overlay');
 // Read all inputs before deleting an old temporary output.
 if(fs.existsSync(output))fs.rmSync(output,{recursive:true,force:true});
 fs.mkdirSync(output,{recursive:true});
 copy(app,inside(output,'apps/ccna'));
 overlayCopy(overlay,output);
 copy(path.join(website,'index.html'),inside(output,'index.html'));
 copy(path.join(website,'_redirects'),inside(output,'_redirects'));
 copy(path.join(website,'robots.txt'),inside(output,'robots.txt'));
 // Standalone pages must not publish Wiedora's canonical origin.
 const index=inside(output,'apps/ccna/index.html');
 let html=fs.readFileSync(index,'utf8');
 html=html.replaceAll('https://constant-app.netlify.app/apps/ccna/','/apps/ccna/');
 html=html.replace('content="index,follow,max-image-preview:large"','content="noindex,nofollow"');
 fs.writeFileSync(index,html);
 const router=inside(output,'apps/ccna/router.js');
 let js=fs.readFileSync(router,'utf8');
 js=js.replace('const CANONICAL_ORIGIN="https://constant-app.netlify.app";','const CANONICAL_ORIGIN=location.origin;');
 fs.writeFileSync(router,js);
 const audit=auditAssets({root:output});
 if(audit.missing.length)throw new Error('Standalone package misses '+audit.missing.length+' static host assets: '+audit.missing.map(x=>x.path).join(', '));
 const result={status:'PASS_STATIC_PACKAGE',app:'/apps/ccna/',output:path.relative(root,output),assetReferences:audit.references,missingAssets:audit.missing.length,mode:'local-only',hostSync:'not available without Wiedora'};
 fs.writeFileSync(inside(output,'build-manifest.json'),JSON.stringify(result,null,2)+'\n');
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(buildStandalone(),null,2));}catch(error){console.error(error.stack||String(error));process.exitCode=1;}
}

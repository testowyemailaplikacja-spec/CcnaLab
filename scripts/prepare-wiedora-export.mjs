/**
 * Prepare a clean, reviewable module-only export for Wiedora. Never merges,
 * pushes or deploys to Wiedora. Excludes standalone overrides and credentials.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const TARGET=path.join(ROOT,'dist-wiedora');
const blobSha=data=>crypto.createHash('sha1').update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex');
function scan(folder,base=folder){
 const result=[];for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
  const file=path.join(folder,entry.name);
  if(entry.isDirectory())result.push(...scan(file,base));
  else if(entry.isFile())result.push({path:path.relative(base,file).replaceAll(path.sep,'/'),sha:blobSha(fs.readFileSync(file))});
  else throw Error('Export refused symlink: '+file);
 }return result;
}
export function prepareWiedoraExport({root=ROOT,output=path.join(root,'dist-wiedora')}={}){
 root=path.resolve(root);output=path.resolve(output);
 if(!output.startsWith(root+path.sep)||path.basename(output)!=='dist-wiedora')throw new Error('Only dist-wiedora is an accepted output');
 const source=path.join(root,'apps/ccna');
 const baseline=JSON.parse(fs.readFileSync(path.join(root,'docs/CCNALAB_PROTECTED_ORIGINAL_FILES.json'),'utf8'));
 const baselineByPath=new Map(baseline.files.map(x=>[x.path,x.sha]));
 const current=scan(source).map(x=>({...x,path:'apps/ccna/'+x.path})).sort((a,b)=>a.path.localeCompare(b.path));
 const changed=current.filter(x=>baselineByPath.has(x.path)&&baselineByPath.get(x.path)!==x.sha);
 const added=current.filter(x=>!baselineByPath.has(x.path));
 const removed=[...baselineByPath.keys()].filter(x=>!current.some(f=>f.path===x));
 if(fs.existsSync(output))fs.rmSync(output,{recursive:true,force:true});
 fs.mkdirSync(path.join(output,'apps'),{recursive:true});
 fs.cpSync(source,path.join(output,'apps/ccna'),{recursive:true});
 const manifest={
  schemaVersion:1,targetRepo:'testowyemailaplikacja-spec/Constant_app',targetBranch:'develop',
  modulePath:'apps/ccna/',files:current.length,
  modifiedAgainstOriginal:changed,addedAgainstOriginal:added,removedAgainstOriginal:removed,
  excluded:['standalone/','dist/','apps/shared/','js/','assets/','netlify.toml','account configuration'],
  mergeRule:'Copy only apps/ccna/ into Wiedora develop after CI/native/browser/Supabase acceptance. Do not overwrite host assets.'
 };
 fs.writeFileSync(path.join(output,'INTEGRATION_MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(output,'README.md'),'# Wiedora CCNA module-only handoff\n\nCopy ONLY apps/ccna/ after a reviewed PR, preserved-ID checks and regressions. Standalone overlays are excluded. See docs/CCNALAB_WIEDORA_REINTEGRATION.md in CcnaLab.\n');
 return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const r=prepareWiedoraExport();console.log(JSON.stringify({status:'PASS_MODULE_ONLY_EXPORT',count:r.files,modified:r.modifiedAgainstOriginal.length,added:r.addedAgainstOriginal.length,removed:r.removedAgainstOriginal.length},null,2));}
 catch(e){console.error(e.stack||String(e));process.exitCode=1;}
}

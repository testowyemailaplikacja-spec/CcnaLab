/**
 * Dependency-free static dev server for build:standalone output.
 * Deep routes render CCNA wrapper; JS/CSS files never get HTML fallbacks.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
function resolvePath(url) {
 const pathname=new URL(url,'http://localhost').pathname;
 let decoded;try{decoded=decodeURIComponent(pathname);}catch{return {status:400};}
 if(decoded.includes('\\')||decoded.includes('\0'))return {status:400};
 const target=path.resolve(ROOT,'.'+decoded);
 if(target!==ROOT&&!target.startsWith(ROOT+path.sep))return {status:403};
 if(fs.existsSync(target)&&fs.statSync(target).isFile())return {status:200,file:target};
 if(fs.existsSync(target)&&fs.statSync(target).isDirectory()){
   const index=path.join(target,'index.html');
   if(fs.existsSync(index))return {status:200,file:index};
 }
 if(/^\/apps\/ccna\//.test(decoded)&&!path.posix.extname(decoded))return {status:200,file:path.join(ROOT,'apps/ccna/index.html')};
 return {status:404};
}
export function startServer({port=Number(process.env.PORT||4173),host='127.0.0.1'}={}){
 if(!fs.existsSync(path.join(ROOT,'apps/ccna/index.html')))throw new Error('Run npm run build:standalone first');
 const server=http.createServer((req,res)=>{
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
   const route=resolvePath(req.url||'/');
   if(!route.file){res.writeHead(route.status,{'Content-Type':'text/plain; charset=utf-8'});res.end(String(route.status));return;}
   const ext=path.extname(route.file).toLowerCase();
   res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':ext==='.html'||ext==='.js'?'no-cache':'public,max-age=600'});
   if(req.method==='HEAD'){res.end();return;}fs.createReadStream(route.file).pipe(res);
 });
 return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>resolve(server));});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 startServer().then(s=>console.log('CCNA Lab http://127.0.0.1:'+s.address().port+'/apps/ccna/')).catch(e=>{console.error(e);process.exitCode=1;});
}

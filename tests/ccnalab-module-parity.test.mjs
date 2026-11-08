import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const original=fs.readFileSync(path.join(root,'apps/ccna/legacy.html'),'utf8');
function sourceObject(id) {
 const marker='"id": "'+id+'"',at=original.indexOf(marker);
 assert.ok(at>0,'legacy subsection exists');
 const start=original.lastIndexOf('{',at);let depth=0,quote=false,escape=false;
 for(let i=start;i<original.length;i++){
  const c=original[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quote=false;continue;}
  if(c==='"')quote=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0)return JSON.parse(original.slice(start,i+1));
 }
 throw Error('unterminated subsection');
}
function loadedModule(){
 const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'apps/ccna/data/modules/day03-tcpip.js'),'utf8'),sandbox);
 return JSON.parse(JSON.stringify(sandbox.window.CCNALabLessonModules[0]));
}
test('pilot module is exact legacy source, no synthetic questions or changed answers',()=>{
 const original=sourceObject('piec-warstw-tcp-ip'),module=loadedModule();
 assert.equal(module.sectionId,'model-tcp-ip');
 assert.equal(module.sourceReview,'NOT_RUN_VIDEO');
 assert.deepEqual(module.data,original);
 assert.equal(original.questions.length,8);
});
test('bridge changes note only; question ID and count remain stable',()=>{
 const module=loadedModule(), original=sourceObject('piec-warstw-tcp-ip');
 const subsection=structuredClone(original);subsection.questions.push({id:'imported-unchanged',answer:'Never overwrite'});
 const frame={contentDocument:{readyState:'complete'},contentWindow:{getLearningSections:()=>[{id:'model-tcp-ip',subsections:[subsection]}]},addEventListener(){}};
 const win={CCNALabLessonModules:[module],dispatchEvent(){}},doc={getElementById:id=>id==='appFrame'?frame:null};
 const fakeEvent=class CustomEvent{constructor(name,{detail}){this.type=name;this.detail=detail;}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'apps/ccna/lesson-overlay.js'),'utf8'),{window:win,document:doc,CustomEvent:fakeEvent});
 const state=JSON.parse(JSON.stringify(win.CCNALabModuleBridge.status()));
 assert.equal(state[0].result,'ACTIVE');
 assert.equal(subsection.questions.length,9);
 assert.equal(subsection.questions[8].id,'imported-unchanged');
});
test('conflict prevents overwriting an edited lesson',()=>{
 const module=loadedModule(),subsection={...sourceObject('piec-warstw-tcp-ip'),note:'Later Wiedora revision'};
 const frame={contentDocument:{readyState:'complete'},contentWindow:{getLearningSections:()=>[{id:'model-tcp-ip',subsections:[subsection]}]},addEventListener(){}};
 const win={CCNALabLessonModules:[module],dispatchEvent(){}},doc={getElementById:()=>frame};
 vm.runInNewContext(fs.readFileSync(path.join(root,'apps/ccna/lesson-overlay.js'),'utf8'),{window:win,document:doc,CustomEvent:class {}});
 assert.equal(win.CCNALabModuleBridge.status()[0].result,'CONFLICT_NO_OVERRIDE');
 assert.equal(subsection.note,'Later Wiedora revision');
});

test('bridge preserves dynamic certification supplements after external note hydration',()=>{
 const module=loadedModule(),subsection={...sourceObject('piec-warstw-tcp-ip')};
 const suffix='<details class="ccna-question-note-supplement">Notatka dodana po imporcie</details>';
 subsection.note+=suffix;
 const frame={contentDocument:{readyState:'complete'},contentWindow:{getLearningSections:()=>[{id:'model-tcp-ip',subsections:[subsection]}]},addEventListener(){}};
 const win={CCNALabLessonModules:[module],dispatchEvent(){}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'apps/ccna/lesson-overlay.js'),'utf8'),{window:win,document:{getElementById:()=>frame},CustomEvent:class {}});
 assert.equal(win.CCNALabModuleBridge.status()[0].result,'ACTIVE');
 assert.ok(subsection.note.endsWith(suffix));
});

// WIEDORA-CHANGE: WD-20261031-WIE-195-POSTDRAG-KEYBOARD-01 | TASK: WIE-195 | AUTHOR: Codex / GPT-6 (full version unknown)
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const E=require('../apps/ccna/packet-lab/engine.js');

function mount(t){
  const dom=new JSDOM('<main id="host"></main>',{url:'http://localhost/apps/ccna/',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,timers=new Map();let timerId=0;
  w.CcnaLabEngine=E;w.CcnaLabScenarios={curriculum:[],extensions:[]};
  w.CcnaWlcUI={mount(){},accessPoint(){}};
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  // Hold browser timers so activation happens before the post-pointerup reset.
  w.setTimeout=(fn,delay)=>{const id=++timerId;timers.set(id,{fn,delay});return id;};
  w.clearTimeout=id=>timers.delete(id);
  w.eval(fs.readFileSync(path.join(__dirname,'../apps/ccna/packet-lab/lab.js'),'utf8'));
  const net=new E.Network();net.connect('PC1','FastEthernet0','SW1','FastEthernet0/1','straight');
  const app=w.CcnaPacketLabUI.mount(w.document.getElementById('host'),{
    scenario:{id:'keyboard-postdrag',title:'Keyboard after drag',original:true,create:()=>new E.Network()},initial:net.snapshot(),save:()=>true
  });
  const canvas=w.document.querySelector('.pt-canvas');
  canvas.createSVGPoint=()=>({x:0,y:0,matrixTransform(){return{x:this.x,y:this.y};}});
  canvas.getScreenCTM=()=>({inverse(){return{};}});
  canvas.setPointerCapture=()=>{};canvas.releasePointerCapture=()=>{};
  t.after(()=>{app.dispose();w.close();});
  return{w,app,canvas,timers};
}
function drag(h,pan=false){
  const {w,canvas}=h;
  const target=pan?canvas:w.document.querySelector('[data-device="PC1"]');
  target.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,button:0,clientX:100,clientY:100}));
  canvas.dispatchEvent(new w.MouseEvent('pointermove',{bubbles:true,clientX:145,clientY:130}));
  canvas.dispatchEvent(new w.MouseEvent('pointerup',{bubbles:true,button:0,clientX:145,clientY:130}));
  w.document.querySelector('[data-action="delete"]').click();
  assert.equal(w.document.querySelector('[data-action="delete"]').getAttribute('aria-pressed'),'true');
}
for(const [key,pan] of [['Enter',false],[' ',true]]){
  test(`cable ${JSON.stringify(key)} activation works immediately after ${pan?'panning':'device drag'}`,t=>{
    const h=mount(t);drag(h,pan);
    h.w.document.querySelector('[data-link]').dispatchEvent(new h.w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));
    assert.equal(h.app.network.state.links.length,0,'keyboard activation must not be swallowed by the pointer-click guard');
    assert.equal(h.w.document.activeElement,h.canvas,'focus returns to the topology after removing the cable');
  });
}
test('post-drag pointer click is still suppressed, then a deliberate pointer click removes the cable',t=>{
  const h=mount(t);drag(h);
  const click=()=>h.w.document.querySelector('[data-link]').dispatchEvent(new h.w.MouseEvent('click',{bubbles:true,detail:1}));
  click();assert.equal(h.app.network.state.links.length,1,'do not treat the release of a drag as a new deletion');
  for(const {fn,delay} of h.timers.values())if(delay===0)fn();
  click();assert.equal(h.app.network.state.links.length,0,'the next deliberate pointer click remains usable');
});

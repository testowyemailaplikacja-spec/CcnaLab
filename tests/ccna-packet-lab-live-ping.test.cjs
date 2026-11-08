const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const E=require('../apps/ccna/packet-lab/engine.js');

test('packet-lab realtime ping paints replies progressively before final statistics',()=>{
  const dom=new JSDOM('<main id="host"></main>',{url:'http://localhost/apps/ccna/',runScripts:'dangerously',pretendToBeVisual:true});
  const {window:w}=dom,intervals=new Set();
  w.CcnaLabEngine=E;
  w.CcnaLabScenarios={curriculum:[],extensions:[]};
  w.CcnaWlcUI={mount(){},accessPoint(){}};
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.setInterval=fn=>{intervals.add(fn);return fn;};
  w.clearInterval=id=>intervals.delete(id);
  w.eval(fs.readFileSync(path.join(__dirname,'../apps/ccna/packet-lab/lab.js'),'utf8'));
  const network=new E.Network();
  for(const [a,ap,b,bp] of E.REQUIRED)network.connect(a,ap,b,bp,a.startsWith('SW')&&b.startsWith('SW')?'cross':'straight');
  for(let i=1;i<=4;i++)network.configurePC('PC'+i,'192.168.1.'+i,'255.255.255.0');
  const mounted=w.CcnaPacketLabUI.mount(w.document.getElementById('host'),{
    scenario:{id:'live-ping',title:'Live ping',original:true,create:()=>new E.Network()},
    initial:network.snapshot(),save:()=>true
  });
  try{
    w.document.querySelector('[data-device="PC1"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
    w.document.querySelector('[data-desktop="command"]').click();
    const input=w.document.getElementById('ptCommand');input.value='ping 192.168.1.3';
    input.form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
    const output=()=>w.document.querySelector('.pt-terminal-output').textContent;
    assert.match(output(),/Pinging 192\.168\.1\.3/);
    assert.doesNotMatch(output(),/Ping statistics/,'the command must not complete in the same submit turn');
    let sawPartial=false;
    for(let i=0;i<500&&intervals.size;i++){
      for(const tick of [...intervals])tick();
      if(/Reply from/.test(output())&&!/Ping statistics/.test(output()))sawPartial=true;
    }
    assert.equal(sawPartial,true,'at least one reply is visible while the ping is still running');
    assert.match(output(),/Packets: Sent = 4, Received = 4/);
    assert.equal(intervals.size,0);
  } finally { mounted.dispose();dom.window.close(); }
});

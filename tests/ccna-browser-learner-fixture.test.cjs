// WIEDORA-CHANGE: WD-20261031-WIE-005-LEARNER-BOOTSTRAP-03 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (full version unknown)
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {seedCompletedLearning}=require('../apps/ccna/packet-lab/tests/browser-learner-fixture.cjs');

async function bootstrap(pathname, existing={}){
  const store=new Map([['ccna-learning-progress-v1',JSON.stringify(existing)]]);
  const context=vm.createContext({location:{pathname},localStorage:{
    getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,String(value))
  }});
  await seedCompletedLearning({addInitScript:async(fn,ids)=>{
    context.ids=ids;vm.runInContext('('+fn.toString()+')(ids)',context);
  }},['anki-ospf','anki-dhcp']);
  // The wrapper and legacy app may cache progress independently during startup.
  // Both must observe the completed learner before their first read.
  const cached=JSON.parse(store.get('ccna-learning-progress-v1'));
  return cached;
}

test('completed learner exists before the parent wrapper can read or cache progress',async()=>{
  const progress=await bootstrap('/apps/ccna/sekcja/ccna-ospf/temat/anki-ospf/');
  assert.equal(progress['path-complete:anki-ospf'],true);
  assert.equal(progress['path-complete:anki-dhcp'],true);
});
test('legacy iframe setup preserves existing progress and is idempotent',async()=>{
  const before={'passed:existing-topic':true,'path-complete:anki-ospf':true};
  const first=await bootstrap('/apps/ccna/legacy.html',before);
  assert.equal(first['passed:existing-topic'],true);
  assert.equal(first['path-complete:anki-dhcp'],true,'the iframe must seed missing prerequisites too');
  assert.deepEqual(await bootstrap('/apps/ccna/legacy.html',first),first);
});
test('learner fixture does not grant prerequisites on another application or a lookalike path',async()=>{
  for(const pathname of ['/apps/prawo/','/apps/ccna-other/','/konto/']){
    assert.deepEqual(await bootstrap(pathname),{},pathname);
  }
});

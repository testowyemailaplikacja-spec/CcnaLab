import test from 'node:test';
import assert from 'node:assert/strict';
import { newWorkflow, recordStep, validateWorkflow, completeWorkflow, STEP_ORDER } from '../scripts/ccnalab-lesson-workflow.mjs';

test('new lesson starts with ten not-started gates',()=>{
 const s=newWorkflow('ccna-day03');assert.equal(s.steps.length,10);assert.equal(s.overall,'IN_PROGRESS');assert.deepEqual(validateWorkflow(s),[]);
});
test('cannot skip unverified source',()=>assert.throws(()=>recordStep(newWorkflow('day3'),'cards','PASS',['ok']),/Poprzedni etap/));
test('PASS without evidence is blocked',()=>assert.throws(()=>recordStep(newWorkflow('day3'),'verified_source','PASS',[]),/wymaga dowodu/));
test('source gate can pass and next gate can enter progress',()=>{
 let s=newWorkflow('day3');s=recordStep(s,'verified_source','PASS',['checked source and rights log']);s=recordStep(s,'source_note','IN_PROGRESS');assert.equal(s.steps[1].status,'IN_PROGRESS');
});
test('cannot claim overall completed by modifying JSON',()=>{
 let s=newWorkflow('day3');s.overall='COMPLETED';s.completedAt='2026-11-08';assert.match(validateWorkflow(s).join(' '),/Fałszywy status/);
});
test('manual COMPLETE without signed test artifacts is blocked',()=>{
 let s=newWorkflow('day3');for(const step of STEP_ORDER)s=recordStep(s,step,'PASS',['synthetic gate evidence']);
 assert.throws(()=>completeWorkflow(s,{}),/Niepoprawne dane lekcji/);
});
test('cannot rewrite approved predecessor after downstream approval',()=>{
 let s=newWorkflow('day3');s=recordStep(s,'verified_source','PASS',['checked']);s=recordStep(s,'source_note','PASS',['completed']);
 assert.throws(()=>recordStep(s,'verified_source','FAIL',[]),/Nie można zmienić/);
});

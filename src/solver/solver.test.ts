import assert from 'node:assert/strict';import test from 'node:test';import {solveProject} from './solve';
const deadline=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
test('keeps mandatory TouchDesigner',()=>{const s=solveProject({brief:'TouchDesigner is mandatory. Hand tracking controls a projected flower.',deadline,hoursPerDay:2,skills:'Blender, TouchDesigner, DaVinci Resolve',constraints:'Must use TouchDesigner',language:'en'});assert(s.recommended.softwareIds.includes('touchdesigner'));assert(s.alternatives.every((p)=>p.softwareIds.includes('touchdesigner')));assert(s.rejected.length>0)});
test('prefers familiar Blender',()=>{const s=solveProject({brief:'Cel-shaded product animation',deadline,hoursPerDay:3,skills:'Blender modelling materials lighting keyframes',constraints:'Do not introduce another 3D package',language:'en'});assert.equal(s.recommended.softwareIds[0],'blender');assert(!s.recommended.softwareIds.includes('maya'))});
test('uses p5.js for audio poster',()=>{const s=solveProject({brief:'Bauhaus poster where shapes react to music',deadline,hoursPerDay:2,skills:'Illustrator advanced, no coding',constraints:'Free tools',language:'en'});assert(s.recommended.softwareIds.includes('p5js'))});
test('explains only project-specific routes that the solver actually rejected',()=>{
 const solution=solveProject({brief:'TouchDesigner is mandatory. Hand tracking controls a projected flower.',deadline,hoursPerDay:2,skills:'Blender, TouchDesigner',constraints:'Must use TouchDesigner',language:'en'});
 assert(solution.detours.length>0);
 assert.deepEqual(solution.detours.map((detour)=>detour.id),solution.rejected.slice(0,3).map((path)=>path.id));
 assert(solution.detours.every((detour)=>/missing required TouchDesigner/i.test(detour.summary)));
 assert(solution.detours.every((detour)=>detour.costAvoided.length>20&&detour.reconsiderWhen.length>20&&detour.evidence.length>0));
 assert(solution.detours.every((detour)=>!detour.title.includes('Generic beginner courses')));
});
test('omits the detour section data when every evaluated route is viable',()=>{
 const solution=solveProject({brief:'Bauhaus poster where shapes react to music',deadline,hoursPerDay:2,skills:'Illustrator advanced, no coding',constraints:'Prefer free tools',language:'en'});
 assert.equal(solution.rejected.length,0);
 assert.deepEqual(solution.detours,[]);
});
test('localizes structured detour evidence in Vietnamese',()=>{
 const solution=solveProject({brief:'TouchDesigner là bắt buộc cho installation trình chiếu.',deadline,hoursPerDay:2,skills:'Blender cơ bản',constraints:'Phải dùng TouchDesigner',language:'vi'});
 assert(solution.detours.length>0);
 assert(solution.detours.every((detour)=>detour.summary.startsWith('Bị loại vì')));
 assert(solution.detours.every((detour)=>detour.costAvoided.startsWith('Tránh')));
});
test('every current delegated route has an actionable playbook',()=>{
 const inputs=[
  {brief:'Projected installation where hand tracking controls flowers',skills:'Blender basics',constraints:'TouchDesigner required'},
  {brief:'Interactive Three.js portfolio with pointer and scroll motion',skills:'HTML and CSS basics',constraints:'Must deploy to Vercel'},
  {brief:'Bauhaus poster where shapes react to music',skills:'Illustrator advanced, no coding',constraints:'Free tools'},
  {brief:'Dating chatbot website for language conversation practice',skills:'none',constraints:'Free to build and use a free response model'},
 ];
 const delegated=inputs.flatMap((input)=>{const solution=solveProject({...input,deadline,hoursPerDay:2,language:'en'});return[solution.recommended,...solution.alternatives,...solution.rejected].flatMap((path)=>path.tasks).filter((task)=>task.method==='delegate_to_agent')});
 assert(delegated.length>=4);
 assert(delegated.every((task)=>(task.agentDelegation?.techniquePlan.length??0)>0));
 assert(delegated.every((task)=>(task.agentDelegation?.implementationSteps.length??0)>0));
 assert(delegated.every((task)=>(task.agentDelegation?.reviewChecklist.length??0)>2));
 assert(delegated.every((task)=>task.agentDelegation?.prompt.includes('FAILURE MODES TO PREVENT')));
});

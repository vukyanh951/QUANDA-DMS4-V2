import assert from 'node:assert/strict';import test from 'node:test';import relationshipData from '@/knowledge/knowledge-relationships.json';import playbookData from '@/knowledge/technique-playbooks.json';import {validateKnowledgeRelationships} from './knowledge-graph';import {candidateStrategies,delegationActionOverlap,solveProject} from './solve';import {validateStrategyGraph} from './strategy-graph';
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
test('every recommended step is grounded across supported request families',()=>{
 const inputs=[
  {brief:'Projected installation where hand tracking controls flowers',skills:'Blender basics',constraints:'TouchDesigner required'},
  {brief:'Cel-shaded product animation',skills:'Blender advanced',constraints:'No new 3D software'},
  {brief:'Lyrics website with creative scrolling typography',skills:'Illustrator advanced; coding none',constraints:'Prefer free tools'},
  {brief:'Interactive Three.js portfolio',skills:'HTML CSS basics; Codex available',constraints:'Deploy to Vercel'},
  {brief:'Dating chatbot for language practice',skills:'none',constraints:'Free to build'},
  {brief:'Bauhaus poster reacting to music',skills:'Illustrator advanced',constraints:'Free tools'},
  {brief:'Procedural vegetation with Geometry Nodes',skills:'Blender intermediate',constraints:''},
  {brief:'Something meaningful for a small community event',skills:'',constraints:''},
 ];
 for(const input of inputs){
  const solution=solveProject({...input,deadline,hoursPerDay:3,language:'en'});
  assert(solution.recommended.tasks.length>0,input.brief);
  assert(solution.recommended.tasks.every((task)=>task.knowledgeGrounding.source==='knowledge/quanda.skills'),input.brief);
  assert(solution.recommended.tasks.every((task)=>task.knowledgeGrounding.status==='grounded'),input.brief);
  assert(solution.recommended.tasks.every((task)=>task.knowledgeGrounding.playbookIds.length>0),input.brief);
  assert(solution.recommended.tasks.every((task)=>task.definitionOfDone.length>2),input.brief);
 }
});
test('creative lyric route has distinct grounded phases and no invented agent access',()=>{
 const solution=solveProject({
  brief:'I know Illustrator but have never coded. I want a website that displays song lyrics with creative web scrolling animations and interactive visuals.',
  deadline,
  hoursPerDay:2,
  skills:'Illustrator advanced; coding none',
  constraints:'Prefer free tools.',
  language:'en',
 });
 const tasks=solution.recommended.tasks;
 assert.deepEqual(tasks.map((task)=>task.id),['direction','scaffold','typography','review','deploy']);
 assert(tasks.every((task)=>task.knowledgeGrounding.status==='grounded'));
 assert(tasks.find((task)=>task.id==='direction')?.techniqueIds.includes('graphic-design.visual-system.color-system'));
 assert(tasks.find((task)=>task.id==='review')?.techniqueIds.includes('ui-ux-interaction.accessibility-pattern.reduced-motion'));
 assert(tasks.find((task)=>task.id==='deploy')?.techniqueIds.includes('web-and-creative-coding.deployment-platform.vercel'));
 const delegated=tasks.filter((task)=>task.method==='delegate_to_agent');
 assert(delegated.every((task)=>task.agentDelegation?.aiModelDecision.recommended===null));
 assert(delegated.every((task)=>(task.agentDelegation?.aiModelDecision.candidates.length??0)>=3));
 assert(delegated.every((task)=>task.agentDelegation?.prompt.includes('REQUIRED QUANDA KNOWLEDGE SOURCES')));
 assert.notDeepEqual(delegated[0]?.techniqueIds,delegated[1]?.techniqueIds);
});
test('shared web playbooks remain project-neutral',()=>{
 const sharedIds=new Set([
  'web-and-creative-coding.markup-language.html',
  'web-and-creative-coding.styling-language.css',
  'web-and-creative-coding.rendering-technology.dom',
  'web-and-creative-coding.library.p5-js',
  'web-and-creative-coding.web-standard.accessibility-aria',
  'ui-ux-interaction.accessibility-pattern.reduced-motion',
 ]);
 const shared=playbookData.playbooks.filter((playbook)=>sharedIds.has(playbook.techniqueId));
 assert.equal(shared.length,sharedIds.size);
 for(const playbook of shared){
  const text=JSON.stringify(playbook).toLowerCase();
  assert.doesNotMatch(text,/\b(lyric|lyrics|verse|chorus|song|portfolio|dating|flower)\b/,playbook.techniqueId);
 }
});
test('Three.js task briefs are project-correct and operationally distinct',()=>{
 const solution=solveProject({
  brief:'Build an interactive Three.js portfolio with pointer and scroll motion.',
  deadline,
  hoursPerDay:3,
  skills:'HTML CSS basics; Codex available',
  constraints:'Must deploy to Vercel.',
  language:'en',
 });
 const scaffold=solution.recommended.tasks.find((task)=>task.id==='scaffold');
 const interaction=solution.recommended.tasks.find((task)=>task.id==='interaction');
 assert(scaffold?.agentDelegation&&interaction?.agentDelegation);
 assert.match(scaffold.agentDelegation.prompt,/RESPONSIBILITY BOUNDARY/);
 assert.match(scaffold.responsibility,/renderer lifecycle/);
 assert.match(interaction.responsibility,/normalized pointer state/);
 assert(scaffold.nonGoals.some((item)=>item.includes('signature pointer')));
 assert(interaction.nonGoals.some((item)=>item.includes('renderer setup')));
 assert.doesNotMatch(scaffold.agentDelegation.prompt,/\b(lyric|lyrics|verse|chorus|song|dating|flower)\b/i);
 assert.doesNotMatch(interaction.agentDelegation.prompt,/\b(lyric|lyrics|verse|chorus|song|dating|flower)\b/i);
 assert(delegationActionOverlap(scaffold,interaction)<.35);
});
test('delegated prompts do not inherit unrelated project subjects',()=>{
 const cases=[
  {brief:'Dating chatbot for language practice',skills:'none',constraints:'Free to build',forbidden:/\b(lyric|lyrics|portfolio|flower|bauhaus)\b/i},
  {brief:'Projected installation where hand tracking controls flowers',skills:'Blender basics',constraints:'TouchDesigner required',forbidden:/\b(lyric|lyrics|portfolio|dating|bauhaus)\b/i},
  {brief:'Bauhaus poster reacting to music',skills:'Illustrator advanced',constraints:'Free tools',forbidden:/\b(lyric|lyrics|portfolio|dating|flower)\b/i},
 ];
 for(const item of cases){
  const solution=solveProject({...item,deadline,hoursPerDay:3,language:'en'});
  for(const task of solution.recommended.tasks.filter((candidate)=>candidate.agentDelegation)){
   assert.doesNotMatch(task.agentDelegation?.prompt??'',item.forbidden,`${item.brief}: ${task.id}`);
   assert.match(task.agentDelegation?.prompt??'',/RESPONSIBILITY BOUNDARY/);
  }
 }
});
test('execution tasks form an explicit artifact handoff graph',()=>{
 const solution=solveProject({brief:'Lyrics website with creative scrolling typography',deadline,hoursPerDay:3,skills:'Illustrator advanced; coding none',constraints:'Prefer free tools',language:'en'});
 const tasks=solution.recommended.tasks;
 for(const task of tasks){
  assert(task.inputs.length>0,`${task.id} inputs`);
  assert(task.outputs.length>0,`${task.id} outputs`);
  assert(task.acceptanceEvidence.length>0,`${task.id} evidence`);
  for(const downstreamId of task.consumedBy){
   const downstream=tasks.find((candidate)=>candidate.id===downstreamId);
   assert(downstream,`${task.id} -> ${downstreamId}`);
   assert(downstream.prerequisiteTaskIds.includes(task.id));
   assert(task.outputs.some((output)=>downstream.inputs.includes(output)),`${task.id} output is consumed by ${downstreamId}`);
  }
 }
 const scaffold=tasks.find((task)=>task.id==='scaffold');
 const typography=tasks.find((task)=>task.id==='typography');
 assert(scaffold?.consumedBy.includes('typography'));
 assert(scaffold?.outputs.some((output)=>typography?.inputs.includes(output)));
 assert.match(scaffold?.agentDelegation?.prompt??'',/CROSS-STEP ARTIFACT FLOW/);
 assert.match(scaffold?.agentDelegation?.prompt??'',/Outputs owned by this step/);
});
test('typed knowledge relationships cover the complete planning vocabulary',()=>{
 const techniqueIds=playbookData.playbooks.map((playbook)=>playbook.techniqueId);
 assert.deepEqual(validateKnowledgeRelationships(techniqueIds),[]);
 const types=new Set(relationshipData.relationships.map((edge)=>edge.relationType));
 for(const required of ['requires','produces','consumes','enables','conflicts-with','alternative-to','validated-by'])assert(types.has(required),required);
});
test('candidate strategies are graph-derived and expose a relationship reasoning chain',()=>{
 assert.deepEqual(validateStrategyGraph(),[]);
 assert(candidateStrategies('creative-web').length>=4);
 assert(candidateStrategies('ai-chatbot').length>=4);
 const solution=solveProject({brief:'Lyrics website with creative scrolling typography',deadline,hoursPerDay:3,skills:'Illustrator advanced; coding none',constraints:'Prefer free tools',language:'en'});
 assert(solution.alternatives.length>=3);
 assert(solution.recommended.reasoningChain.length>=3);
 assert(solution.recommended.reasoningChain.some((item)=>item.includes('produces:')||item.includes('requires:')||item.includes('enables:')));
 const typography=solution.recommended.tasks.find((task)=>task.id==='typography');
 assert(typography?.agentDelegation?.techniquePlan.some((plan)=>plan.relationshipNotes.length>0));
 assert.match(typography?.agentDelegation?.prompt??'',/Relationship:/);
});

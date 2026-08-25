import assert from 'node:assert/strict';
import test from 'node:test';
import { runProjectAnalysis } from './analyze';
import {
  parseProjectAnalysisJson,
  ProjectAnalysisSchema,
  type ProjectAnalysis,
} from './schema';
import { resolveProjectAnalysis } from './resolve';
import { solveProject } from '@/src/solver/solve';
import type { ProjectInput } from '@/src/solver/types';

const deadline = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
const input: ProjectInput = {
  brief: 'TouchDesigner is mandatory. Webcam hand tracking controls projected flowers.',
  deadline,
  hoursPerDay: 2,
  skills: 'Blender modelling; TouchDesigner TOPs and CHOPs',
  constraints: 'Must use TouchDesigner.',
  language: 'en',
};

const validAnalysis: ProjectAnalysis = {
  destination: 'Interactive projected flower installation controlled by hand movement',
  deliverables: ['Projected interactive installation'],
  creativeDirection: ['Organic procedural flowers'],
  mandatoryRequirements: ['TouchDesigner is mandatory'],
  forbiddenConstraints: [],
  knownSoftware: ['Blender', 'TouchDesigner'],
  knownSkills: ['Blender modelling', 'TouchDesigner TOPs and CHOPs'],
  requiredCapabilities: ['hand tracking', 'projection mapping'],
  likelyTechniques: ['MediaPipe hand tracking', 'projector calibration'],
  highImpactUncertainties: [],
  unknownTerminology: [],
};

test('accepts valid structured Gemini analysis', () => {
  assert.deepEqual(parseProjectAnalysisJson(JSON.stringify(validAnalysis)), validAnalysis);
});

test('rejects invalid Gemini JSON', () => {
  assert.throws(() => parseProjectAnalysisJson('{not json'));
});

test('Gemini cannot add a winning path decision', () => {
  assert.throws(() => ProjectAnalysisSchema.parse({ ...validAnalysis, winningPath: 'Unity' }));
});

test('returns validated Gemini analysis and known capability resolution', async () => {
  const outcome = await runProjectAnalysis(input, async () => validAnalysis);
  assert.equal(outcome.source, 'gemini');
  assert(outcome.resolution.techniqueIds.includes('motion-and-animation.interaction-reactive-motion.hand-tracking'));
  assert(outcome.resolution.softwareIds.includes('touchdesigner'));
  assert(outcome.resolution.mandatorySoftwareIds.includes('touchdesigner'));
});

test('falls back deterministically after a Gemini timeout', async () => {
  const outcome = await runProjectAnalysis(input, async () => {
    throw new Error('timeout');
  });
  assert.equal(outcome.source, 'fallback');
  assert(outcome.analysis.mandatoryRequirements.some((item) => item.includes('TouchDesigner')));
  assert(outcome.analysis.knownSkills.some((item) => item.includes('Blender')));
});

test('falls back deterministically after a Gemini API error', async () => {
  const outcome = await runProjectAnalysis(input, async () => {
    throw new Error('quota exceeded');
  });
  const solution = solveProject(input, outcome);
  assert.equal(outcome.source, 'fallback');
  assert(solution.recommended.softwareIds.includes('touchdesigner'));
});

test('preserves unresolved ontology concepts without inventing IDs', () => {
  const resolution = resolveProjectAnalysis({
    ...validAnalysis,
    requiredCapabilities: ['quantum spline bloom'],
    likelyTechniques: [],
  });
  assert(resolution.unresolvedConcepts.includes('quantum spline bloom'));
  assert(!resolution.techniqueIds.some((id) => id.includes('quantum')));
});

test('explicit mandatory software outranks Gemini inference', async () => {
  const outcome = await runProjectAnalysis(input, async () => ({
    ...validAnalysis,
    knownSoftware: ['Maya'],
    mandatoryRequirements: ['Maya might also work'],
  }));
  const solution = solveProject(input, outcome);
  assert.deepEqual(solution.requirements, ['TouchDesigner']);
  assert(solution.recommended.softwareIds.includes('touchdesigner'));
  assert(solution.alternatives.every((path) => path.softwareIds.includes('touchdesigner')));
});

test('preserves user-reported software when Gemini omits it', async () => {
  const blenderInput: ProjectInput = {
    brief: 'I need a cel-shaded product animation for a launch video.',
    deadline,
    hoursPerDay: 3,
    skills: 'Blender modelling, materials, lighting and keyframes',
    constraints: 'Do not introduce another 3D package.',
    language: 'en',
  };
  const outcome = await runProjectAnalysis(blenderInput, async () => ({
    ...validAnalysis,
    destination: 'Cel-shaded product launch animation',
    knownSoftware: [],
    knownSkills: [],
    mandatoryRequirements: [],
    requiredCapabilities: ['cel shading'],
    likelyTechniques: ['toon shading'],
  }));
  const solution = solveProject(blenderInput, outcome);
  assert(solution.knownSoftware.includes('Blender'));
  assert.equal(solution.recommended.softwareIds[0], 'blender');
});

test('same fallback input produces a stable ranking', async () => {
  const fallback = async () => { throw new Error('offline'); };
  const first = solveProject(input, await runProjectAnalysis(input, fallback));
  const second = solveProject(input, await runProjectAnalysis(input, fallback));
  assert.equal(first.recommended.id, second.recommended.id);
  assert.equal(first.recommended.score, second.recommended.score);
  assert.deepEqual(first.recommended.scoreBreakdown, second.recommended.scoreBreakdown);
});

test('Three.js benchmark keeps agent delegation and human review', async () => {
  const threeInput: ProjectInput = {
    brief: 'I need an interactive Three.js portfolio in three days.',
    deadline: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
    hoursPerDay: 3,
    skills: 'HTML/CSS, very little JavaScript, Codex available',
    constraints: 'Must run in a browser.',
    language: 'en',
  };
  const analysis = ProjectAnalysisSchema.parse({
    ...validAnalysis,
    destination: 'Interactive browser portfolio',
    deliverables: ['Deployed portfolio'],
    mandatoryRequirements: ['Three.js', 'Browser compatible'],
    knownSoftware: [],
    knownSkills: ['HTML', 'CSS'],
    requiredCapabilities: ['Three.js'],
    likelyTechniques: ['WebGL'],
  });
  const solution = solveProject(threeInput, await runProjectAnalysis(threeInput, async () => analysis));
  assert(solution.recommended.softwareIds.includes('threejs'));
  assert(!solution.knownSoftware.includes('Three.js'));
  assert(solution.recommended.estimatedAgentMinutes > 0);
  assert(solution.recommended.tasks.some((task) => task.method === 'human_review'));
});

test('messy Y2K brief resolves concepts before deterministic ranking', async () => {
  const messyInput: ProjectInput = {
    brief: 'I want something kinda like shiny early-2000s tech ads, chrome stuff, weird wide camera, probably 3D, and I need an Instagram video by Friday.',
    deadline,
    hoursPerDay: 2,
    skills: 'I know Blender pretty well.',
    constraints: '',
    language: 'en',
  };
  const analysis = ProjectAnalysisSchema.parse({
    ...validAnalysis,
    destination: 'Short 3D social-video product animation',
    deliverables: ['Instagram video'],
    creativeDirection: ['Y2K', 'chrome'],
    mandatoryRequirements: [],
    knownSoftware: ['Blender'],
    knownSkills: ['Blender'],
    requiredCapabilities: ['3D animation'],
    likelyTechniques: ['wide-angle distortion', 'fisheye'],
  });
  const outcome = await runProjectAnalysis(messyInput, async () => analysis);
  const solution = solveProject(messyInput, outcome);
  assert(outcome.resolution.ontologyConceptIds.some((id) => id.includes('y2k')));
  assert(outcome.resolution.ontologyConceptIds.some((id) => id.includes('chrome')));
  assert.equal(solution.recommended.softwareIds[0], 'blender');
});

test('creative-coding lyrics website resolves to a web path instead of Blender', async () => {
  const creativeWebInput: ProjectInput = {
    brief: 'I know Illustrator but have never coded. I want a web to displays a song lyrics with creative coding techniques',
    deadline,
    hoursPerDay: 2,
    skills: 'Illustrator — advanced; Coding — none',
    constraints: 'Prefer free tools.',
    language: 'en',
  };
  const analysis = ProjectAnalysisSchema.parse({
    ...validAnalysis,
    destination: 'Creative-coded lyrics website',
    deliverables: ['Published website'],
    creativeDirection: ['Generative typography'],
    mandatoryRequirements: ['Prefer free tools'],
    knownSoftware: ['Illustrator'],
    knownSkills: ['Illustrator — advanced', 'Coding — none'],
    requiredCapabilities: ['Web publishing', 'Text rendering', 'Generative typography', 'Interactive web graphics'],
    likelyTechniques: [],
  });
  const outcome = await runProjectAnalysis(creativeWebInput, async () => analysis);
  const solution = solveProject(creativeWebInput, outcome);
  const everyCandidate = [solution.recommended, ...solution.alternatives, ...solution.rejected];

  assert.equal(outcome.source, 'gemini');
  assert.equal(solution.detectedKind, 'creative-web');
  assert.deepEqual(solution.recommended.softwareIds, ['illustrator', 'p5js', 'vercel']);
  assert(solution.recommended.tasks.some((task) => task.recommendedSoftwareId === 'p5js'));
  assert(solution.recommended.tasks.some((task) => task.method === 'delegate_to_agent'));
  const delegatedTasks = solution.recommended.tasks.filter((task) => task.method === 'delegate_to_agent');
  assert(delegatedTasks.every((task) => task.agentDelegation));
  assert(delegatedTasks.every((task) => task.agentDelegation?.compatibleAgents.join(' ') === 'Claude Codex Kimi'));
  assert(delegatedTasks.every((task) => task.agentDelegation?.prompt.includes(creativeWebInput.brief)));
  assert(delegatedTasks.every((task) => task.agentDelegation?.prompt.includes(task.objective)));
  assert(delegatedTasks.every((task) => task.agentDelegation?.expectedOutputs.length === 4));
  assert(solution.recommended.tasks.filter((task) => task.method !== 'delegate_to_agent').every((task) => task.agentDelegation === null));
  assert(everyCandidate.every((path) => !path.softwareIds.includes('blender')));
  assert(everyCandidate.every((path) => !path.softwareIds.includes('maya')));
});

test('creative-coding website remains a web path when Gemini is unavailable', async () => {
  const creativeWebInput: ProjectInput = {
    brief: 'I want a website that displays song lyrics with creative coding techniques.',
    deadline,
    hoursPerDay: 2,
    skills: 'Illustrator advanced; no coding',
    constraints: 'Prefer free tools.',
    language: 'en',
  };
  const outcome = await runProjectAnalysis(creativeWebInput, async () => {
    throw new Error('offline');
  });
  const solution = solveProject(creativeWebInput, outcome);

  assert.equal(outcome.source, 'fallback');
  assert.equal(solution.detectedKind, 'creative-web');
  assert(solution.recommended.softwareIds.includes('p5js'));
  assert(!solution.recommended.softwareIds.includes('blender'));
});

test('unrecognized briefs request clarification instead of defaulting to animation', () => {
  const solution = solveProject({
    brief: 'I want to make something meaningful for a small community event.',
    deadline,
    hoursPerDay: 2,
    skills: '',
    constraints: '',
    language: 'en',
  });

  assert.equal(solution.detectedKind, 'unresolved');
  assert.equal(solution.recommended.id, 'clarify-project');
  assert.deepEqual(solution.recommended.softwareIds, []);
  assert(!solution.recommended.title.includes('Blender'));
});

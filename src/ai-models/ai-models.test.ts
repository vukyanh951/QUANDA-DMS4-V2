import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ontologyData from '@/knowledge/ontology.compiled.json';
import { aiModelCatalog, getAIModelsByCapability } from './catalog';
import { selectAIModel } from './select';
// The compiler is intentionally executable JavaScript so it can run before TypeScript is built.
// @ts-expect-error The build-time compiler does not ship a TypeScript declaration.
import { parseAIModelsSource } from '../../scripts/compile-ai-models.mjs';

const sourcePath = new URL('../../knowledge/quanda-ai-models.skills', import.meta.url);
const source = await readFile(sourcePath, 'utf8');

const expectedIds = [
  'ai-model.openai.gpt-5-5',
  'ai-model.anthropic.claude-opus-4-8',
  'ai-model.google.gemini-3-1-pro-preview',
  'ai-model.xai.grok-4-3',
  'ai-model.meta.llama-4',
  'ai-model.deepseek.v4-r1',
  'ai-model.moonshot.kimi-k2-6',
  'ai-model.alibaba.qwen3',
  'ai-model.google.gemma-4',
  'ai-model.zai.glm-5',
];

test('the dedicated compiler parses all ten stable model families', () => {
  const parsed = parseAIModelsSource(source);
  assert.equal(parsed.modelCount, 10);
  assert.deepEqual(parsed.models.map((model: { id: string }) => model.id), expectedIds);
});

test('duplicate canonical model IDs fail compilation', () => {
  const duplicate = source.replace('ai-model.openai.gpt-5-5', 'ai-model.anthropic.claude-opus-4-8');
  assert.throws(() => parseAIModelsSource(duplicate), /Duplicate AI model canonical_id/);
});

test('unknown optional metadata is preserved as an extension', () => {
  const extended = source.replace('- family:', '- future_metadata: retained for a future schema\n- family:');
  const parsed = parseAIModelsSource(extended);
  assert.equal(parsed.models[0].extensions.future_metadata, 'retained for a future schema');
});

test('AI metadata remains separate from the base creative ontology', () => {
  assert.equal(ontologyData.conceptCount, 24_870);
  assert(!ontologyData.concepts.some((concept) => concept.label === 'OpenAI GPT-5.5'));
  assert(!ontologyData.concepts.some((concept) => concept.label.includes('1,048,576 tokens')));
  assert.equal(aiModelCatalog.source, 'knowledge/quanda-ai-models.skills');
});

test('capability indexes retrieve the expected model families', () => {
  const coding = getAIModelsByCapability('agentic-coding').map((model) => model.id);
  assert(coding.includes('ai-model.openai.gpt-5-5'));
  assert(coding.includes('ai-model.anthropic.claude-opus-4-8'));
  assert(coding.includes('ai-model.moonshot.kimi-k2-6'));
  assert(coding.includes('ai-model.alibaba.qwen3'));
  assert(coding.includes('ai-model.zai.glm-5'));

  const multimodal = getAIModelsByCapability('multimodal-analysis').map((model) => model.id);
  assert(multimodal.includes('ai-model.google.gemini-3-1-pro-preview'));
  assert(multimodal.includes('ai-model.meta.llama-4'));
  assert(multimodal.includes('ai-model.google.gemma-4'));
});

test('local lookup exposes only catalog models with a local route', () => {
  const local = getAIModelsByCapability('local-self-hosted-inference');
  assert(local.length >= 6);
  assert(local.every((model) => model.localDeployable === true));
  assert(!local.some((model) => model.id.includes('.openai.')));
  assert(!local.some((model) => model.id.includes('.anthropic.')));
  assert(!local.some((model) => model.id.includes('.google.gemini')));
});

test('hard privacy constraints reject hosted-only proprietary routes and expose hardware uncertainty', () => {
  const decision = selectAIModel({
    executionMethod: 'local_ai',
    requiredCapabilities: ['privacy-sensitive-local-inference'],
    constraints: 'Must run locally. Do not send private files to a hosted API.',
  });
  assert(decision.aiNeeded);
  assert(decision.candidates.every((candidate) => !candidate.modelId.includes('.openai.') && !candidate.modelId.includes('.anthropic.')));
  assert(decision.rejected.some((candidate) => candidate.modelId.includes('.openai.')));
  assert(decision.uncertainties.some((uncertainty) => uncertainty.includes('hardware')));
});

test('existing Codex access reduces switching cost and favors the OpenAI route', () => {
  const decision = selectAIModel({
    executionMethod: 'delegate_to_agent',
    requiredCapabilities: ['agentic-coding', 'repository-scale-coding'],
    userAccess: 'Codex is available',
    taskDescription: 'Implement a bounded feature across a repository.',
  });
  assert.equal(decision.recommended?.modelId, 'ai-model.openai.gpt-5-5');
  const openAI = decision.candidates.find((candidate) => candidate.modelId.includes('.openai.'));
  const claude = decision.candidates.find((candidate) => candidate.modelId.includes('.anthropic.'));
  assert(openAI && claude && openAI.score > claude.score);
  assert(openAI.breakdown.switching > claude.breakdown.switching);
});

test('non-AI execution remains a first-class deterministic choice', () => {
  const decision = selectAIModel({ executionMethod: 'deterministic_implementation' });
  assert.equal(decision.aiNeeded, false);
  assert.equal(decision.recommended, null);
  assert.match(decision.nonAIReason ?? '', /does not require an AI model/);
});

test('the same nested-selector input produces the same scored decision', () => {
  const input = {
    executionMethod: 'multimodal_analysis' as const,
    requiredCapabilities: ['multimodal-analysis', 'structured-output'],
    userAccess: 'Gemini API is available',
    taskDescription: 'Analyze a visual moodboard into structured design principles.',
  };
  assert.deepEqual(selectAIModel(input), selectAIModel(input));
});

test('multilingual local LM Studio work favors the matching Qwen route', () => {
  const decision = selectAIModel({
    executionMethod: 'local_ai',
    requiredCapabilities: ['local-self-hosted-inference', 'multilingual-work'],
    userAccess: 'LM Studio is installed',
    constraints: 'Must run locally and preferably use a free model.',
    preferredLanguage: 'Vietnamese',
  });
  assert.equal(decision.recommended?.modelId, 'ai-model.alibaba.qwen3');
});

test('snapshot provenance is preserved without pretending it is current verification', () => {
  for (const model of aiModelCatalog.models) {
    assert.equal(model.currentVerification.status, 'snapshot_only');
    assert.equal(model.currentVerification.lastVerifiedAt, null);
    assert.equal(model.provenance.sourceTerm, '2026B');
    assert.equal(model.provenance.capturedDateContext, '2026-08-26');
  }
});

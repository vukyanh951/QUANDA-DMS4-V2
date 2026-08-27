import { aiModelCatalog } from './catalog';
import type {
  AIExecutionMethod,
  AIModelCandidateDecision,
  AIModelRecord,
  AIModelScoreBreakdown,
  AIModelSelectionDecision,
  AIModelSelectionInput,
} from './schema';

const aiMethods = new Set<AIExecutionMethod>([
  'delegate_to_agent',
  'multimodal_analysis',
  'local_ai',
  'coding_assistance',
  'long_context_review',
]);

const unique = <T,>(values: T[]) => [...new Set(values)];
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const includesAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term));
const sum = (breakdown: AIModelScoreBreakdown) => Object.values(breakdown).reduce((total, value) => total + value, 0);

function modelSearchText(model: AIModelRecord): string {
  return normalize([
    model.id,
    model.label,
    model.family,
    ...model.providers,
    ...model.aliases,
    ...model.accessModes,
    ...model.strongFor,
  ].join(' '));
}

function accessMatch(model: AIModelRecord, accessText: string): boolean {
  if (!accessText) return false;
  const aliases = [model.label, model.family, ...model.providers, ...model.accessModes]
    .map(normalize)
    .filter((value) => value.length > 2);
  if (aliases.some((alias) => accessText.includes(alias))) return true;
  if (model.id.includes('.openai.') && includesAny(accessText, ['codex', 'chatgpt', 'openai'])) return true;
  if (model.id.includes('.anthropic.') && includesAny(accessText, ['claude code', 'claude'])) return true;
  if (model.id.includes('.google.gemini') && includesAny(accessText, ['gemini api', 'google ai studio', 'gemini'])) return true;
  if (model.id.includes('.alibaba.') && includesAny(accessText, ['qwen', 'qwen code', 'lm studio', 'ollama'])) return true;
  if (model.localDeployable && includesAny(accessText, ['ollama', 'lm studio', 'llama cpp', 'vllm', 'local runtime'])) {
    return modelSearchText(model).split(' ').some((word) => word.length > 5 && accessText.includes(word));
  }
  return false;
}

function requiredNamedModel(text: string): string | null {
  const requirement = text.match(/(?:must use|required(?: model)?|only use)\s+([^.;,]+)/i)?.[1];
  return requirement ? normalize(requirement) : null;
}

function candidateFor(model: AIModelRecord, input: AIModelSelectionInput): AIModelCandidateDecision {
  const requiredCapabilities = unique(input.requiredCapabilities ?? []);
  const accessText = normalize(`${input.userAccess ?? ''} ${input.userFamiliarity ?? ''}`);
  const constraints = normalize(input.constraints ?? '');
  const searchable = modelSearchText(model);
  const reasons: string[] = [];
  const rejectionReasons: string[] = [];
  const methodKey = input.executionMethod.replaceAll('_', '-');
  const methodModels = aiModelCatalog.executionMethodIndex[methodKey] ?? [];
  const needsLocal = input.executionMethod === 'local_ai' || includesAny(constraints, [
    'must run locally', 'local only', 'offline only', 'cannot send data', 'do not send data', 'private local', 'self hosted only',
  ]);
  const prohibitsHostedApi = includesAny(constraints, ['no api access', 'cannot use api', 'no hosted api', 'no cloud ai']);
  const freeOnly = includesAny(constraints, ['must be free', 'free only', 'no paid api', 'cannot pay for api']);
  const namedRequirement = requiredNamedModel(input.constraints ?? '');
  const missingCapabilities = requiredCapabilities.filter((capability) => !model.capabilities.includes(capability));

  if (missingCapabilities.length) rejectionReasons.push(`Missing required capabilities: ${missingCapabilities.join(', ')}`);
  if (needsLocal && model.localDeployable !== true) rejectionReasons.push('Does not satisfy the local/private execution requirement.');
  if (prohibitsHostedApi && model.localDeployable !== true) rejectionReasons.push('Requires a hosted route while hosted APIs are prohibited.');
  if (freeOnly && model.providerType === 'proprietary' && model.localDeployable !== true) rejectionReasons.push('The snapshot does not establish a free, local route.');
  if (namedRequirement && !searchable.includes(namedRequirement)) rejectionReasons.push(`Does not satisfy the explicitly required model: ${namedRequirement}.`);

  const matchedAccess = accessMatch(model, accessText);
  const requiredCoverage = requiredCapabilities.length
    ? (requiredCapabilities.length - missingCapabilities.length) / requiredCapabilities.length
    : 1;
  const hasOtherProviderAccess = Boolean(accessText) && !matchedAccess && includesAny(accessText, [
    'codex', 'chatgpt', 'openai', 'claude', 'gemini', 'qwen', 'kimi', 'deepseek', 'grok', 'ollama', 'lm studio',
  ]);
  const wantsMultimodal = requiredCapabilities.includes('multimodal-analysis') || input.executionMethod === 'multimodal_analysis';
  const privacyRelevant = needsLocal || includesAny(constraints, ['privacy', 'confidential', 'sensitive']);
  const prefersFree = freeOnly || includesAny(constraints, ['prefer free', 'cost sensitive', 'low cost']);
  const knowsLocalRuntime = includesAny(accessText, ['ollama', 'lm studio', 'llama cpp', 'vllm', 'local runtime']);
  const previewLifecycle = normalize(model.lifecycleStatus ?? '').includes('preview');

  const breakdown: AIModelScoreBreakdown = {
    taskFit: Math.round((methodModels.includes(model.id) ? 12 : 4) + requiredCoverage * 18),
    access: matchedAccess ? 16 : model.hostedAvailable ? 8 : 5,
    familiarity: matchedAccess ? 10 : 3,
    modality: wantsMultimodal ? (model.capabilities.includes('multimodal-analysis') ? 10 : 0) : 5,
    privacy: privacyRelevant ? (model.localDeployable ? 12 : 0) : (model.localDeployable ? 8 : 6),
    cost: prefersFree ? (model.localDeployable ? 8 : model.providerType === 'proprietary' ? 1 : 6) : (model.localDeployable ? 7 : 5),
    setup: knowsLocalRuntime && model.localDeployable ? 8 : model.localDeployable ? 3 : model.hostedAvailable ? 7 : 2,
    switching: matchedAccess ? 8 : hasOtherProviderAccess ? 1 : 4,
    lifecycleStability: previewLifecycle ? 2 : 5,
    freshness: model.currentVerification.status === 'verified_current' ? 3 : model.currentVerification.status === 'snapshot_only' ? 1 : 0,
  };

  if (methodModels.includes(model.id)) reasons.push(`Listed for ${methodKey} in the curated snapshot.`);
  if (requiredCapabilities.length && missingCapabilities.length === 0) reasons.push('Covers every requested AI capability.');
  if (matchedAccess) reasons.push('Matches the user’s stated model access or familiar runtime.');
  if (model.localDeployable && privacyRelevant) reasons.push('Provides a local route for the stated privacy constraint.');
  if (model.localDeployable && prefersFree) reasons.push('Offers an open/local route that reduces hosted API dependence.');
  if (model.currentVerification.status === 'snapshot_only') reasons.push('Catalog facts are snapshot evidence and require current verification before deployment.');

  const viable = rejectionReasons.length === 0;
  return {
    modelId: model.id,
    label: model.label,
    score: viable ? sum(breakdown) : 0,
    viable,
    breakdown,
    reasons,
    rejectionReasons,
    accessRoute: matchedAccess
      ? model.accessModes.find((route) => accessText.includes(normalize(route))) ?? model.accessModes[0] ?? 'Access route not recorded'
      : model.accessModes[0] ?? 'Access route not recorded',
    freshnessStatus: model.currentVerification.status,
  };
}

export function selectAIModel(input: AIModelSelectionInput): AIModelSelectionDecision {
  const requestedCapabilities = unique(input.requiredCapabilities ?? []).sort();
  if (!aiMethods.has(input.executionMethod)) {
    return {
      aiNeeded: false,
      executionMethod: input.executionMethod,
      requestedCapabilities,
      hardFilters: [],
      recommended: null,
      candidates: [],
      rejected: [],
      uncertainties: [],
      nonAIReason: `The selected execution method (${input.executionMethod}) does not require an AI model.`,
      selectorVersion: 'deterministic-ai-selector-1.0.0',
    };
  }

  const constraints = normalize(input.constraints ?? '');
  const hardFilters = [
    ...requestedCapabilities.map((capability) => `Required capability: ${capability}`),
    ...(input.executionMethod === 'local_ai' || includesAny(constraints, ['must run locally', 'local only', 'offline only', 'cannot send data', 'private local']) ? ['Local deployment required'] : []),
    ...(includesAny(constraints, ['no api access', 'no hosted api', 'no cloud ai']) ? ['Hosted API prohibited'] : []),
    ...(includesAny(constraints, ['must be free', 'free only', 'no paid api']) ? ['Paid proprietary-only access prohibited'] : []),
  ];
  const evaluated = aiModelCatalog.models.map((model) => candidateFor(model, input));
  const candidates = evaluated.filter((candidate) => candidate.viable).sort((left, right) => right.score - left.score || left.modelId.localeCompare(right.modelId));
  const rejected = evaluated.filter((candidate) => !candidate.viable).sort((left, right) => left.modelId.localeCompare(right.modelId));
  const localRequired = hardFilters.includes('Local deployment required');
  const uncertainties = unique([
    'Catalog access, lifecycle, context, and pricing facts are a 2026B snapshot; verify current provider documentation before deployment.',
    ...(localRequired && !input.hardware?.trim() ? ['Local hardware was not supplied; model size, quantization, RAM, and VRAM fit remain unverified.'] : []),
    ...(candidates.length === 0 ? ['No catalog model satisfies every hard filter. Keep the execution method unresolved until constraints change or evidence is updated.'] : []),
  ]);

  return {
    aiNeeded: true,
    executionMethod: input.executionMethod,
    requestedCapabilities,
    hardFilters,
    recommended: candidates[0] ?? null,
    candidates,
    rejected,
    uncertainties,
    nonAIReason: null,
    selectorVersion: 'deterministic-ai-selector-1.0.0',
  };
}

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { z } from 'zod';

const stringList = z.array(z.string().min(1));
const nullableString = z.string().min(1).nullable();

export const AIModelSchema = z.object({
  id: z.string().regex(/^ai-model\.[a-z0-9-]+\.[a-z0-9-]+$/),
  label: z.string().min(1),
  family: z.string().min(1),
  providers: stringList,
  providerType: z.string().min(1),
  lifecycleStatus: nullableString,
  aliases: stringList,
  accessModes: stringList,
  licenseType: nullableString,
  licenseNotes: nullableString,
  contextWindowSnapshot: stringList,
  maxOutputSnapshot: stringList,
  roles: stringList,
  strongFor: stringList,
  executionMethods: stringList,
  typicalUses: stringList,
  watchFor: stringList,
  capabilities: stringList,
  localDeployable: z.boolean().nullable(),
  hostedAvailable: z.boolean().nullable(),
  hardwareRequirements: stringList,
  volatility: z.string().min(1),
  freshnessPolicy: z.string().min(1),
  currentVerification: z.object({
    status: z.enum(['verified_current', 'snapshot_only', 'possibly_stale', 'deprecated', 'unknown']),
    lastVerifiedAt: z.string().nullable(),
    currentStatus: z.string().nullable(),
    deprecatedAliases: stringList,
    currentContextWindow: z.string().nullable(),
    currentAccess: stringList,
    currentPricingTier: z.string().nullable(),
  }),
  provenance: z.object({
    source: z.string().min(1),
    sourceTerm: z.string().min(1),
    sourceSnapshot: z.string().min(1),
    capturedDateContext: z.string().min(1),
    sourceType: z.string().min(1),
  }),
  extensions: z.record(z.string(), z.union([z.string(), stringList])),
});

export const AIModelCatalogSchema = z.object({
  aiModelSchemaVersion: z.literal('1.0.0'),
  source: z.literal('knowledge/quanda-ai-models.skills'),
  sourceVersion: z.string().min(1),
  snapshotLabel: z.string().min(1),
  freshnessStates: z.array(z.enum(['verified_current', 'snapshot_only', 'possibly_stale', 'deprecated', 'unknown'])),
  modelCount: z.number().int().positive(),
  models: z.array(AIModelSchema),
  capabilityIndex: z.record(z.string(), stringList),
  executionMethodIndex: z.record(z.string(), stringList),
  provenance: z.record(z.string(), z.union([z.string(), stringList, z.boolean()])),
});

const knownFields = new Set([
  'canonical_id', 'family', 'provider', 'provider_type', 'lifecycle_snapshot', 'access', 'license',
  'context_window_snapshot', 'max_output_snapshot', 'model_roles', 'strong_for', 'useful_execution_methods',
  'typical_uses', 'watch_for', 'best_role_summary', 'volatility', 'freshness_policy',
]);

const capabilityNames = {
  'Agentic Coding': 'agentic-coding',
  'Repository-Scale Coding': 'repository-scale-coding',
  'Tool Use / Agent Tool Calling': 'tool-use',
  'Long-Context': 'long-context-analysis',
  Multimodal: 'multimodal-analysis',
  'Local / Self-Hosted Friendly': 'local-self-hosted-inference',
  'Multilingual / Localization Friendly': 'multilingual-work',
  'Cost-Sensitive / Open-Model Experimentation': 'cost-sensitive-ai',
  'Google Ecosystem Integration': 'google-ecosystem-integration',
  'Privacy-Sensitive Local Prototype': 'privacy-sensitive-local-inference',
};

const normalize = (value) => value
  .normalize('NFKD')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const slug = (value) => normalize(value).replace(/\s+/g, '-');
const unique = (values) => [...new Set(values.filter(Boolean))];
const asList = (value) => value == null ? [] : Array.isArray(value) ? value : [value];
const asScalar = (value) => Array.isArray(value) ? value.join('; ') : value ?? null;

function parseMetadataField(line) {
  const match = line.match(/^-\s+([a-z_]+):(?:\s*(.*))?$/);
  if (!match) return null;
  return { key: match[1], value: match[2]?.trim() || null };
}

function resolveModelReference(reference, models) {
  const normalized = normalize(reference)
    .replace(/\b(multimodal|open|weight|checkpoints?|family|variants?|lineage|scout|coding)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  let best = null;
  let bestScore = 0;
  for (const model of models) {
    const label = normalize(model.label);
    const family = normalize(model.family);
    const providers = model.providers.map(normalize);
    let score = 0;
    if (normalized.includes(label) || label.includes(normalized)) score = Math.max(score, 100);
    if (normalized.includes(family) || family.includes(normalized)) score = Math.max(score, 80);
    if (providers.some((provider) => normalized.includes(provider))) score = Math.max(score, 40);
    if (score > bestScore) { best = model; bestScore = score; }
  }
  return best;
}

function derivedCapabilities(record) {
  const text = normalize([
    ...record.roles,
    ...record.strongFor,
    ...record.executionMethods,
    ...record.typicalUses,
  ].join(' '));
  return unique([
    /structured output|structured extraction/.test(text) ? 'structured-output' : '',
    /coding|code generation|code review|code repair|repository analysis|debugging/.test(text) ? 'coding-assistance' : '',
    /document analysis|document review|documents/.test(text) ? 'document-analysis' : '',
    /provider comparison/.test(text) ? 'provider-comparison' : '',
  ]);
}

function inferLocalDeployable(raw) {
  const text = normalize([...asList(raw.access), ...asList(raw.useful_execution_methods), raw.provider_type].join(' '));
  if (/local model|self hosted|open weight|open source checkpoints|local runtimes|open weight downloads/.test(text)) return true;
  if (raw.provider_type === 'proprietary') return false;
  return null;
}

function inferHostedAvailable(raw) {
  const text = normalize(asList(raw.access).join(' '));
  if (/hosted api| api|cloud|hosted runtimes|services|chatgpt ecosystem|claude app|grok ecosystem/.test(text)) return true;
  if (/open weight|local runtimes|downloads|hugging face/.test(text)) return false;
  return null;
}

export function parseAIModelsSource(source) {
  const lines = source.split(/\r?\n/);
  const rawModels = [];
  const capabilityReferences = new Map();
  const executionReferences = new Map();
  const provenance = {};
  let sourceVersion = '';
  let snapshotLabel = '';
  let section = 0;
  let currentModel = null;
  let currentField = null;
  let currentIndexName = null;

  for (const line of lines) {
    const versionMatch = line.match(/^Version:\s*(.+)$/);
    const snapshotMatch = line.match(/^Source snapshot:\s*(.+)$/);
    if (versionMatch) sourceVersion = versionMatch[1].trim();
    if (snapshotMatch) snapshotLabel = snapshotMatch[1].trim();

    const sectionMatch = line.match(/^##\s+(\d+)\./);
    if (sectionMatch) {
      section = Number(sectionMatch[1]);
      currentModel = null;
      currentField = null;
      currentIndexName = null;
      continue;
    }

    const headingMatch = line.match(/^###\s+(.+)$/);
    if (headingMatch) {
      const heading = headingMatch[1].trim();
      currentField = null;
      if (section === 2) {
        currentModel = { label: heading, fields: {} };
        rawModels.push(currentModel);
      } else if (section === 3) {
        currentIndexName = capabilityNames[heading] ?? slug(heading);
        capabilityReferences.set(currentIndexName, []);
      } else if (section === 6) {
        currentIndexName = slug(heading.replace(/\s+IMPLEMENTED_WITH$/, ''));
        executionReferences.set(currentIndexName, []);
      }
      continue;
    }

    if (section === 2 && currentModel) {
      const field = parseMetadataField(line);
      if (field) {
        currentField = field.key;
        currentModel.fields[currentField] = field.value ?? [];
        continue;
      }
      const nested = line.match(/^\s{2}-\s+(.+)$/);
      if (nested && currentField) {
        const existing = currentModel.fields[currentField];
        currentModel.fields[currentField] = [...asList(existing), nested[1].trim()];
      }
      continue;
    }

    if ((section === 3 || section === 6) && currentIndexName) {
      const item = line.match(/^-\s+(.+)$/);
      if (item) {
        const target = section === 3 ? capabilityReferences : executionReferences;
        target.get(currentIndexName).push(item[1].trim());
      }
      continue;
    }

    if (section === 11) {
      const field = parseMetadataField(line);
      if (field) {
        currentField = field.key;
        provenance[currentField] = field.value ?? [];
        continue;
      }
      const nested = line.match(/^\s{2}-\s+(.+)$/);
      if (nested && currentField) provenance[currentField] = [...asList(provenance[currentField]), nested[1].trim()];
    }
  }

  if (!sourceVersion || !snapshotLabel) throw new Error('AI model source is missing version or source snapshot metadata');

  const ids = new Set();
  const models = rawModels.map(({ label, fields }) => {
    const required = ['canonical_id', 'family', 'provider', 'provider_type', 'access', 'license', 'model_roles', 'strong_for', 'useful_execution_methods', 'typical_uses', 'watch_for', 'volatility', 'freshness_policy'];
    const missing = required.filter((key) => fields[key] == null || asList(fields[key]).length === 0);
    if (missing.length) throw new Error(`${label} is missing required metadata: ${missing.join(', ')}`);
    const id = asScalar(fields.canonical_id);
    if (ids.has(id)) throw new Error(`Duplicate AI model canonical_id: ${id}`);
    ids.add(id);
    const extensions = Object.fromEntries(Object.entries(fields).filter(([key]) => !knownFields.has(key)));
    const accessModes = asList(fields.access);
    const providers = asList(fields.provider);
    const watchFor = asList(fields.watch_for);
    const record = {
      id,
      label,
      family: asScalar(fields.family),
      providers,
      providerType: asScalar(fields.provider_type),
      lifecycleStatus: asScalar(fields.lifecycle_snapshot),
      aliases: unique([label, asScalar(fields.family), ...providers]),
      accessModes,
      licenseType: asScalar(fields.license),
      licenseNotes: null,
      contextWindowSnapshot: asList(fields.context_window_snapshot),
      maxOutputSnapshot: asList(fields.max_output_snapshot),
      roles: asList(fields.model_roles),
      strongFor: asList(fields.strong_for),
      executionMethods: asList(fields.useful_execution_methods),
      typicalUses: asList(fields.typical_uses),
      watchFor,
      capabilities: [],
      localDeployable: inferLocalDeployable(fields),
      hostedAvailable: inferHostedAvailable(fields),
      hardwareRequirements: watchFor.filter((item) => /ram|vram|gpu|hardware|memory|quantization|model size|laptop|infrastructure/i.test(item)),
      volatility: asScalar(fields.volatility),
      freshnessPolicy: asScalar(fields.freshness_policy),
      currentVerification: {
        status: 'snapshot_only',
        lastVerifiedAt: null,
        currentStatus: null,
        deprecatedAliases: [],
        currentContextWindow: null,
        currentAccess: [],
        currentPricingTier: null,
      },
      provenance: {
        source: asScalar(provenance.source_name) || 'DMS4 Client Solutions — Models tab',
        sourceTerm: asScalar(provenance.source_term) || '2026B',
        sourceSnapshot: snapshotLabel,
        capturedDateContext: asScalar(provenance.captured_date_context) || '2026-08-26',
        sourceType: asScalar(provenance.source_type) || 'course_resource_screenshot',
      },
      extensions,
    };
    return record;
  });

  const capabilityIndex = {};
  for (const [capability, references] of capabilityReferences) {
    capabilityIndex[capability] = unique(references.map((reference) => resolveModelReference(reference, models)?.id));
  }
  for (const model of models) {
    for (const capability of derivedCapabilities(model)) {
      capabilityIndex[capability] = unique([...(capabilityIndex[capability] ?? []), model.id]);
    }
  }
  for (const model of models) {
    model.capabilities = Object.entries(capabilityIndex)
      .filter(([, modelIds]) => modelIds.includes(model.id))
      .map(([capability]) => capability)
      .sort();
  }

  const executionMethodIndex = {};
  for (const [method, references] of executionReferences) {
    executionMethodIndex[method] = unique(references.map((reference) => resolveModelReference(reference, models)?.id));
  }

  return AIModelCatalogSchema.parse({
    aiModelSchemaVersion: '1.0.0',
    source: 'knowledge/quanda-ai-models.skills',
    sourceVersion,
    snapshotLabel,
    freshnessStates: ['verified_current', 'snapshot_only', 'possibly_stale', 'deprecated', 'unknown'],
    modelCount: models.length,
    models,
    capabilityIndex,
    executionMethodIndex,
    provenance,
  });
}

export async function compileAIModelsFile(sourcePath = 'knowledge/quanda-ai-models.skills', outputPath = 'knowledge/ai-models.compiled.json') {
  const source = await readFile(sourcePath, 'utf8');
  const compiled = parseAIModelsSource(source);
  await writeFile(outputPath, `${JSON.stringify(compiled, null, 2)}\n`);
  return compiled;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const compiled = await compileAIModelsFile();
  console.log(`Compiled ${compiled.modelCount} AI model families.`);
}

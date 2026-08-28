import { z } from 'zod';

const strings = z.array(z.string().min(1));
const optionalSnapshot = z.string().min(1).nullable();

export const AIModelRecordSchema = z.object({
  id: z.string().regex(/^ai-model\.[a-z0-9-]+\.[a-z0-9-]+$/),
  label: z.string().min(1),
  family: z.string().min(1),
  providers: strings,
  providerType: z.string().min(1),
  lifecycleStatus: optionalSnapshot,
  aliases: strings,
  accessModes: strings,
  licenseType: optionalSnapshot,
  licenseNotes: optionalSnapshot,
  contextWindowSnapshot: strings,
  maxOutputSnapshot: strings,
  roles: strings,
  strongFor: strings,
  executionMethods: strings,
  typicalUses: strings,
  watchFor: strings,
  capabilities: strings,
  localDeployable: z.boolean().nullable(),
  hostedAvailable: z.boolean().nullable(),
  hardwareRequirements: strings,
  volatility: z.string().min(1),
  freshnessPolicy: z.string().min(1),
  currentVerification: z.object({
    status: z.enum(['verified_current', 'snapshot_only', 'possibly_stale', 'deprecated', 'unknown']),
    lastVerifiedAt: z.string().nullable(),
    currentStatus: z.string().nullable(),
    deprecatedAliases: strings,
    currentContextWindow: z.string().nullable(),
    currentAccess: strings,
    currentPricingTier: z.string().nullable(),
  }).strict(),
  provenance: z.object({
    source: z.string().min(1),
    sourceTerm: z.string().min(1),
    sourceSnapshot: z.string().min(1),
    capturedDateContext: z.string().min(1),
    sourceType: z.string().min(1),
  }).strict(),
  extensions: z.record(z.string(), z.union([z.string(), strings])),
}).strict();

export const AIModelCatalogSchema = z.object({
  aiModelSchemaVersion: z.literal('1.0.0'),
  source: z.literal('knowledge/quanda-ai-models.skills'),
  sourceVersion: z.string().min(1),
  snapshotLabel: z.string().min(1),
  freshnessStates: z.array(z.enum(['verified_current', 'snapshot_only', 'possibly_stale', 'deprecated', 'unknown'])),
  modelCount: z.number().int().positive(),
  models: z.array(AIModelRecordSchema),
  capabilityIndex: z.record(z.string(), strings),
  executionMethodIndex: z.record(z.string(), strings),
  provenance: z.record(z.string(), z.union([z.string(), strings, z.boolean()])),
}).strict();

export type AIModelRecord = z.infer<typeof AIModelRecordSchema>;
export type AIModelCatalog = z.infer<typeof AIModelCatalogSchema>;

export type AIExecutionMethod =
  | 'delegate_to_agent'
  | 'multimodal_analysis'
  | 'local_ai'
  | 'coding_assistance'
  | 'long_context_review'
  | 'deterministic_implementation'
  | 'do_yourself'
  | 'read_documentation'
  | 'follow_tutorial'
  | 'human_review';

export interface AIModelSelectionInput {
  executionMethod: AIExecutionMethod;
  requiredCapabilities?: string[];
  userAccess?: string;
  userFamiliarity?: string;
  constraints?: string;
  hardware?: string;
  preferredLanguage?: string;
  taskDescription?: string;
  requireKnownAccess?: boolean;
}

export interface AIModelScoreBreakdown {
  taskFit: number;
  access: number;
  familiarity: number;
  modality: number;
  privacy: number;
  cost: number;
  setup: number;
  switching: number;
  lifecycleStability: number;
  freshness: number;
}

export interface AIModelCandidateDecision {
  modelId: string;
  label: string;
  score: number;
  viable: boolean;
  breakdown: AIModelScoreBreakdown;
  reasons: string[];
  rejectionReasons: string[];
  accessRoute: string;
  accessMatched: boolean;
  roleSummary: string[];
  strongFor: string[];
  watchFor: string[];
  freshnessStatus: AIModelRecord['currentVerification']['status'];
}

export interface AIModelSelectionDecision {
  aiNeeded: boolean;
  executionMethod: AIExecutionMethod;
  requestedCapabilities: string[];
  hardFilters: string[];
  recommended: AIModelCandidateDecision | null;
  candidates: AIModelCandidateDecision[];
  rejected: AIModelCandidateDecision[];
  uncertainties: string[];
  nonAIReason: string | null;
  selectorVersion: 'deterministic-ai-selector-1.1.0';
}

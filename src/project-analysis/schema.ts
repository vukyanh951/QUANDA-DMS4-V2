import { z } from 'zod';
import type { Solution } from '@/src/solver/types';

const conciseText = z.string().trim().min(1).max(240);
const conciseList = z.array(conciseText).max(20);

export const ProjectInputSchema = z.object({
  brief: z.string().trim().min(18).max(5_000),
  deadline: z.string().max(32),
  hoursPerDay: z.number().min(0.5).max(16),
  skills: z.string().max(2_000),
  constraints: z.string().max(2_000),
  language: z.enum(['en', 'vi']),
}).strict();

export const ProjectAnalysisSchema = z.object({
  destination: conciseText,
  deliverables: conciseList,
  creativeDirection: conciseList,
  mandatoryRequirements: conciseList,
  forbiddenConstraints: conciseList,
  knownSoftware: conciseList,
  knownSkills: conciseList,
  requiredCapabilities: conciseList,
  likelyTechniques: conciseList,
  highImpactUncertainties: conciseList,
  unknownTerminology: conciseList,
}).strict();

const stringArraySchema = {
  type: 'array',
  items: { type: 'string', maxLength: 240 },
  maxItems: 20,
} as const;

export const ProjectAnalysisJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    destination: { type: 'string', maxLength: 240 },
    deliverables: stringArraySchema,
    creativeDirection: stringArraySchema,
    mandatoryRequirements: stringArraySchema,
    forbiddenConstraints: stringArraySchema,
    knownSoftware: stringArraySchema,
    knownSkills: stringArraySchema,
    requiredCapabilities: stringArraySchema,
    likelyTechniques: stringArraySchema,
    highImpactUncertainties: stringArraySchema,
    unknownTerminology: stringArraySchema,
  },
  required: [
    'destination',
    'deliverables',
    'creativeDirection',
    'mandatoryRequirements',
    'forbiddenConstraints',
    'knownSoftware',
    'knownSkills',
    'requiredCapabilities',
    'likelyTechniques',
    'highImpactUncertainties',
    'unknownTerminology',
  ],
} as const;

export type ProjectInputPayload = z.infer<typeof ProjectInputSchema>;
export type ProjectAnalysis = z.infer<typeof ProjectAnalysisSchema>;
export type AnalysisSource = 'gemini' | 'fallback';

export function parseProjectAnalysisJson(text: string): ProjectAnalysis {
  return ProjectAnalysisSchema.parse(JSON.parse(text));
}

export interface ResolvedProjectAnalysis {
  softwareIds: string[];
  mandatorySoftwareIds: string[];
  techniqueIds: string[];
  ontologyConceptIds: string[];
  unresolvedConcepts: string[];
}

export interface ProjectAnalysisOutcome {
  source: AnalysisSource;
  analysis: ProjectAnalysis;
  resolution: ResolvedProjectAnalysis;
}

export interface AnalyzeProjectResponse extends ProjectAnalysisOutcome {
  solution: Solution;
}

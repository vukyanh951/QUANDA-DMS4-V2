import { z } from 'zod';

const shortText = z.string().trim().min(1).max(320);
const shortList = z.array(shortText).max(16);

export const DesignPrincipleSchema = z.object({
  principle: shortText,
  evidence: shortText,
  application: shortText,
}).strict();

export const VisualOntologyMatchSchema = z.object({
  conceptId: z.string().trim().min(1).max(240),
  label: shortText.optional(),
  evidence: shortText,
  confidence: z.enum(['high', 'medium', 'low']),
}).strict();

export const VisualStyleProfileSchema = z.object({
  summary: z.string().trim().min(1).max(800),
  moodKeywords: shortList,
  designPrinciples: z.array(DesignPrincipleSchema).min(1).max(10),
  color: z.object({
    palette: shortList,
    contrast: shortText,
    usage: shortText,
  }).strict(),
  typography: z.object({
    characteristics: shortList,
    hierarchy: shortText,
  }).strict(),
  composition: z.object({
    layout: shortText,
    hierarchy: shortText,
    spacingAndRhythm: shortText,
  }).strict(),
  imagery: z.object({
    shapesAndForms: shortText,
    textureAndMaterial: shortText,
    lightingAndDepth: shortText,
  }).strict(),
  motion: z.object({
    observedCues: shortList,
    suggestedBehaviors: shortList,
  }).strict(),
  cautions: shortList,
  ontologyMatches: z.array(VisualOntologyMatchSchema).max(16).optional(),
}).strict();

export const VisualReferenceAnalysisSchema = VisualStyleProfileSchema.extend({
  sourceFileNames: z.array(z.string().trim().min(1).max(180)).min(1).max(4),
  analysisVersion: z.literal('visual-style-1.0.0'),
}).strict();

const stringArrayJsonSchema = {
  type: 'array',
  items: { type: 'string', maxLength: 320 },
  maxItems: 16,
} as const;

export const VisualReferenceAnalysisJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string', maxLength: 800 },
    moodKeywords: stringArrayJsonSchema,
    designPrinciples: {
      type: 'array',
      minItems: 1,
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          principle: { type: 'string', maxLength: 320 },
          evidence: { type: 'string', maxLength: 320 },
          application: { type: 'string', maxLength: 320 },
        },
        required: ['principle', 'evidence', 'application'],
      },
    },
    color: {
      type: 'object',
      additionalProperties: false,
      properties: {
        palette: stringArrayJsonSchema,
        contrast: { type: 'string', maxLength: 320 },
        usage: { type: 'string', maxLength: 320 },
      },
      required: ['palette', 'contrast', 'usage'],
    },
    typography: {
      type: 'object',
      additionalProperties: false,
      properties: {
        characteristics: stringArrayJsonSchema,
        hierarchy: { type: 'string', maxLength: 320 },
      },
      required: ['characteristics', 'hierarchy'],
    },
    composition: {
      type: 'object',
      additionalProperties: false,
      properties: {
        layout: { type: 'string', maxLength: 320 },
        hierarchy: { type: 'string', maxLength: 320 },
        spacingAndRhythm: { type: 'string', maxLength: 320 },
      },
      required: ['layout', 'hierarchy', 'spacingAndRhythm'],
    },
    imagery: {
      type: 'object',
      additionalProperties: false,
      properties: {
        shapesAndForms: { type: 'string', maxLength: 320 },
        textureAndMaterial: { type: 'string', maxLength: 320 },
        lightingAndDepth: { type: 'string', maxLength: 320 },
      },
      required: ['shapesAndForms', 'textureAndMaterial', 'lightingAndDepth'],
    },
    motion: {
      type: 'object',
      additionalProperties: false,
      properties: {
        observedCues: stringArrayJsonSchema,
        suggestedBehaviors: stringArrayJsonSchema,
      },
      required: ['observedCues', 'suggestedBehaviors'],
    },
    cautions: stringArrayJsonSchema,
    ontologyMatches: {
      type: 'array',
      maxItems: 16,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          conceptId: { type: 'string', maxLength: 240 },
          evidence: { type: 'string', maxLength: 320 },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['conceptId', 'evidence', 'confidence'],
      },
    },
  },
  required: [
    'summary',
    'moodKeywords',
    'designPrinciples',
    'color',
    'typography',
    'composition',
    'imagery',
    'motion',
    'cautions',
    'ontologyMatches',
  ],
} as const;

export type VisualStyleProfile = z.infer<typeof VisualStyleProfileSchema>;
export type VisualReferenceAnalysis = z.infer<typeof VisualReferenceAnalysisSchema>;

export function parseVisualReferenceAnalysisJson(text: string): VisualStyleProfile {
  return VisualStyleProfileSchema.parse(JSON.parse(text));
}

export function visualStyleContext(profile: VisualStyleProfile): string[] {
  return [
    profile.summary,
    ...profile.moodKeywords,
    ...profile.designPrinciples.flatMap((item) => [item.principle, item.application]),
    ...profile.color.palette,
    profile.color.contrast,
    profile.color.usage,
    ...profile.typography.characteristics,
    profile.typography.hierarchy,
    profile.composition.layout,
    profile.composition.hierarchy,
    profile.composition.spacingAndRhythm,
    profile.imagery.shapesAndForms,
    profile.imagery.textureAndMaterial,
    profile.imagery.lightingAndDepth,
    ...profile.motion.observedCues,
    ...profile.motion.suggestedBehaviors,
    ...(profile.ontologyMatches ?? []).flatMap((match) => [match.conceptId, match.label ?? '']),
  ];
}

import vocabularyData from '@/knowledge/visual-design-vocabulary.compiled.json';
import { z } from 'zod';
import type { VisualStyleProfile } from './schema';

const conceptSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  section: z.string().min(1),
  category: z.string().min(1),
}).strict();

const vocabularySchema = z.object({
  visualVocabularySchemaVersion: z.literal('1.0.0'),
  source: z.literal('knowledge/quanda.skills'),
  compiledFrom: z.literal('knowledge/ontology.compiled.json'),
  conceptCount: z.number().int().positive(),
  promptConceptCount: z.number().int().positive(),
  domains: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    concepts: z.array(conceptSchema).min(1),
    promptConceptIds: z.array(z.string().min(1)).min(1),
  }).strict()).min(1),
}).strict();

export const visualDesignVocabulary = vocabularySchema.parse(vocabularyData);

const conceptsById = new Map(
  visualDesignVocabulary.domains.flatMap((domain) => domain.concepts).map((concept) => [concept.id, concept]),
);

export function visualVocabularyForPrompt() {
  return visualDesignVocabulary.domains.map((domain) => ({
    domain: domain.label,
    concepts: domain.promptConceptIds.map((id) => {
      const concept = conceptsById.get(id);
      if (!concept) throw new Error(`Prompt vocabulary references missing concept: ${id}`);
      return { id: concept.id, label: concept.label };
    }),
  }));
}

export function groundVisualStyleProfile(profile: VisualStyleProfile): VisualStyleProfile {
  const seen = new Set<string>();
  const ontologyMatches = (profile.ontologyMatches ?? []).flatMap((match) => {
    const concept = conceptsById.get(match.conceptId);
    if (!concept || seen.has(concept.id)) return [];
    seen.add(concept.id);
    return [{
      conceptId: concept.id,
      label: concept.label,
      evidence: match.evidence,
      confidence: match.confidence,
    }];
  }).slice(0, 16);
  return { ...profile, ontologyMatches };
}

export function isVisualVocabularyConcept(id: string): boolean {
  return conceptsById.has(id);
}

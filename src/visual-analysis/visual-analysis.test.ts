import assert from 'node:assert/strict';
import test from 'node:test';
import { createFallbackProjectAnalysis, runProjectAnalysis } from '@/src/project-analysis/analyze';
import { solveProject } from '@/src/solver/solve';
import type { ProjectInput } from '@/src/solver/types';
import {
  parseVisualReferenceAnalysisJson,
  VisualReferenceAnalysisSchema,
  VisualStyleProfileSchema,
  visualStyleContext,
  type VisualStyleProfile,
} from './schema';
import {
  groundVisualStyleProfile,
  isVisualVocabularyConcept,
  visualDesignVocabulary,
  visualVocabularyForPrompt,
} from './vocabulary';

const profile: VisualStyleProfile = {
  summary: 'High-contrast editorial layout with oversized type and asymmetric pacing.',
  moodKeywords: ['editorial', 'kinetic', 'bold'],
  designPrinciples: [
    {
      principle: 'Asymmetric hierarchy',
      evidence: 'Large text blocks sit against small marginal labels.',
      application: 'Use an asymmetric grid and strong changes in type scale.',
    },
    {
      principle: 'Controlled repetition',
      evidence: 'Geometric elements repeat at varied intervals.',
      application: 'Repeat lyric fragments with a measured scroll rhythm.',
    },
  ],
  color: {
    palette: ['ink black', 'warm cream', 'signal red'],
    contrast: 'Very high value contrast with one saturated accent.',
    usage: 'Reserve red for active lyric emphasis.',
  },
  typography: {
    characteristics: ['oversized grotesk', 'condensed labels'],
    hierarchy: 'Extreme display-to-caption scale contrast.',
  },
  composition: {
    layout: 'Asymmetric editorial grid.',
    hierarchy: 'One dominant lyric phrase per viewport.',
    spacingAndRhythm: 'Alternates dense clusters with generous negative space.',
  },
  imagery: {
    shapesAndForms: 'Hard rectangles and cropped letterforms.',
    textureAndMaterial: 'Mostly flat with restrained print grain.',
    lightingAndDepth: 'Shallow graphic depth established by overlap.',
  },
  motion: {
    observedCues: ['sequential framing'],
    suggestedBehaviors: ['scroll-driven typography', 'character stagger'],
  },
  cautions: ['Preserve lyric readability and reduced-motion behavior.'],
};

const input: ProjectInput = {
  brief: 'I want to make an interactive website that displays song lyrics with creative scrolling animation.',
  deadline: new Date(Date.now() + 8 * 86_400_000).toISOString().slice(0, 10),
  hoursPerDay: 2,
  skills: 'Illustrator — advanced; Coding — none; Codex — available',
  constraints: 'Prefer free tools.',
  language: 'en',
  visualStyleProfile: profile,
};

test('accepts a complete visual style profile and rejects unknown model output fields', () => {
  assert.deepEqual(VisualStyleProfileSchema.parse(profile), profile);
  assert.throws(() => VisualStyleProfileSchema.parse({ ...profile, recommendedSoftware: 'Three.js' }));
});

test('parses structured Gemini visual analysis without allowing path selection', () => {
  assert.deepEqual(parseVisualReferenceAnalysisJson(JSON.stringify(profile)), profile);
  assert.throws(() => parseVisualReferenceAnalysisJson(JSON.stringify({ ...profile, winningPath: 'Three.js' })));
});

test('requires source evidence metadata on an API visual-analysis response', () => {
  const response = VisualReferenceAnalysisSchema.parse({
    ...profile,
    sourceFileNames: ['moodboard.png'],
    analysisVersion: 'visual-style-1.0.0',
  });
  assert.deepEqual(response.sourceFileNames, ['moodboard.png']);
});

test('visual vocabulary is a compact, balanced artifact compiled from quanda.skills', () => {
  assert.equal(visualDesignVocabulary.source, 'knowledge/quanda.skills');
  assert.equal(visualDesignVocabulary.compiledFrom, 'knowledge/ontology.compiled.json');
  assert.equal(visualDesignVocabulary.conceptCount, 560);
  assert.equal(visualDesignVocabulary.promptConceptCount, 196);
  assert.equal(visualDesignVocabulary.domains.length, 7);
  assert(visualDesignVocabulary.domains.every((domain) => domain.concepts.length === 80));
  assert(visualDesignVocabulary.domains.every((domain) => domain.promptConceptIds.length === 28));
});

test('every concept sent to Gemini is a canonical member of the compiled visual vocabulary', () => {
  const promptConcepts = visualVocabularyForPrompt().flatMap((domain) => domain.concepts);
  assert.equal(promptConcepts.length, 196);
  assert(promptConcepts.every((concept) => isVisualVocabularyConcept(concept.id)));
});

test('repository grounding drops invented IDs and restores canonical labels', () => {
  const grounded = groundVisualStyleProfile({
    ...profile,
    ontologyMatches: [
      {
        conceptId: 'creative-direction.aesthetic.minimalist',
        label: 'Model-supplied label must not win',
        evidence: 'Restrained palette and sparse composition.',
        confidence: 'high',
      },
      {
        conceptId: 'invented.visual.style.fake',
        label: 'Fake',
        evidence: 'No canonical evidence.',
        confidence: 'medium',
      },
    ],
  });
  assert.equal(grounded.ontologyMatches?.length, 1);
  assert.equal(grounded.ontologyMatches?.[0].conceptId, 'creative-direction.aesthetic.minimalist');
  assert.equal(grounded.ontologyMatches?.[0].label, 'minimalist');
});

test('flattens every approved design layer into repository-owned project context', () => {
  const context = visualStyleContext(profile).join(' ');
  assert.match(context, /Asymmetric hierarchy/);
  assert.match(context, /signal red/);
  assert.match(context, /scroll-driven typography/);
  assert.match(context, /print grain/);
});

test('fallback analysis preserves the approved profile and resolves its known techniques', () => {
  const analysis = createFallbackProjectAnalysis(input);
  assert(analysis.creativeDirection.includes(profile.summary));
  assert(analysis.likelyTechniques.includes('scroll-driven typography'));
  assert(analysis.likelyTechniques.includes('character stagger'));
});

test('approved visual direction reaches delegated implementation prompts', async () => {
  const groundedInput: ProjectInput = {
    ...input,
    visualStyleProfile: groundVisualStyleProfile({
      ...profile,
      ontologyMatches: [{
        conceptId: 'creative-direction.aesthetic.minimalist',
        evidence: 'Restrained palette and sparse composition.',
        confidence: 'high',
      }],
    }),
  };
  const outcome = await runProjectAnalysis(groundedInput, async () => { throw new Error('offline'); });
  const solution = solveProject(groundedInput, outcome);
  const delegated = solution.recommended.tasks.filter((task) => task.agentDelegation);
  assert(delegated.length > 0);
  assert(delegated.every((task) => task.agentDelegation?.prompt.includes('User-approved visual profile')));
  assert(delegated.every((task) => task.agentDelegation?.prompt.includes('Asymmetric hierarchy')));
  assert(delegated.every((task) => task.agentDelegation?.prompt.includes('creative-direction.aesthetic.minimalist')));
  assert(outcome.resolution.ontologyConceptIds.includes('creative-direction.aesthetic.minimalist'));
  assert.equal(solution.detectedKind, 'creative-web');
});

test('the text-only workflow remains valid without a visual profile', () => {
  const { visualStyleProfile: _visualStyleProfile, ...textOnly } = input;
  void _visualStyleProfile;
  assert.doesNotThrow(() => createFallbackProjectAnalysis(textOnly));
});

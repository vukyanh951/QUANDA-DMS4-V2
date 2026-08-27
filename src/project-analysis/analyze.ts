import type { ProjectInput } from '@/src/solver/types';
import { visualStyleContext } from '@/src/visual-analysis/schema';
import { isVisualVocabularyConcept } from '@/src/visual-analysis/vocabulary';
import { ProjectAnalysisSchema, type ProjectAnalysis, type ProjectAnalysisOutcome } from './schema';
import { findSoftwareLabels, resolveProjectAnalysis } from './resolve';

export type ProjectAnalyzer = (input: ProjectInput) => Promise<ProjectAnalysis>;

function addApprovedVisualConcepts(input: ProjectInput, resolution: ProjectAnalysisOutcome['resolution']) {
  const approvedIds = (input.visualStyleProfile?.ontologyMatches ?? [])
    .map((match) => match.conceptId)
    .filter(isVisualVocabularyConcept);
  return {
    ...resolution,
    ontologyConceptIds: [...new Set([...resolution.ontologyConceptIds, ...approvedIds])],
  };
}

const splitFacts = (value: string) => value
  .split(/[;\n]+/)
  .map((item) => item.trim())
  .filter(Boolean);

export function createFallbackProjectAnalysis(input: ProjectInput): ProjectAnalysis {
  const visualContext = input.visualStyleProfile ? visualStyleContext(input.visualStyleProfile) : [];
  const combined = `${input.brief} ${input.skills} ${input.constraints} ${visualContext.join(' ')}`;
  const constraintFacts = splitFacts(input.constraints);
  const forbiddenConstraints = constraintFacts.filter((constraint) =>
    /\b(do not|don't|avoid|without|no\s|không|đừng)\b/i.test(constraint),
  );
  const explicitRequirements = [
    ...constraintFacts,
    ...input.brief
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => /\b(must|required|mandatory|bắt buộc|phải)\b/i.test(sentence)),
  ];

  return ProjectAnalysisSchema.parse({
    destination: input.brief.trim(),
    deliverables: [],
    creativeDirection: input.visualStyleProfile
      ? [input.visualStyleProfile.summary, ...input.visualStyleProfile.moodKeywords].slice(0, 20)
      : [],
    mandatoryRequirements: [...new Set(explicitRequirements)],
    forbiddenConstraints,
    knownSoftware: findSoftwareLabels([input.skills]),
    knownSkills: splitFacts(input.skills),
    requiredCapabilities: [],
    likelyTechniques: [
      /hand tracking|hand landmarks|mediapipe/i.test(combined) ? 'hand tracking' : '',
      /cel[- ]shad|toon shad/i.test(combined) ? 'cel shading' : '',
      /geometry nodes|procedural vegetation/i.test(combined) ? 'procedural vegetation' : '',
      /react to music|audio[- ]react|frequency band/i.test(combined) ? 'audio reactive frequency bands' : '',
      /projection|projected installation/i.test(combined) ? 'projection mapping' : '',
      /three\.?js|webgl/i.test(combined) ? 'Three.js' : '',
      /scroll|scrollytelling/i.test(combined) ? 'scroll-driven typography' : '',
      /lyrics?|kinetic typography|generative typography/i.test(combined) ? 'kinetic typography' : '',
      /lyrics?|text reveal|animated typography/i.test(combined) ? 'character stagger' : '',
      /scroll reveal|scrolling animation|scrollytelling/i.test(combined) ? 'scroll reveal' : '',
      /chatbot|chat bot|conversational tutor/i.test(combined) ? 'chatbot' : '',
      /chatbot|chat bot|conversation practice|language practice|language learning/i.test(combined) ? 'chat model' : '',
      /language practice|language learning|multilingual|translation/i.test(combined) ? 'multilingual model' : '',
      /dating chatbot|role[- ]?play|conversation scenario/i.test(combined) ? 'role prompting' : '',
      /chatbot|chat bot/i.test(combined) ? 'moderation' : '',
      ...(input.visualStyleProfile?.motion.suggestedBehaviors ?? []),
      ...(input.visualStyleProfile?.designPrinciples.map((item) => item.application) ?? []),
    ].filter(Boolean).slice(0, 20),
    highImpactUncertainties: [],
    unknownTerminology: [],
  });
}

export async function runProjectAnalysis(
  input: ProjectInput,
  analyzer: ProjectAnalyzer,
): Promise<ProjectAnalysisOutcome> {
  try {
    const analyzed = ProjectAnalysisSchema.parse(await analyzer(input));
    const analysis = ProjectAnalysisSchema.parse(input.visualStyleProfile ? {
      ...analyzed,
      creativeDirection: [...new Set([
        ...analyzed.creativeDirection,
        input.visualStyleProfile.summary,
        ...input.visualStyleProfile.moodKeywords,
      ])].slice(0, 20),
      likelyTechniques: [...new Set([
        ...analyzed.likelyTechniques,
        ...input.visualStyleProfile.motion.suggestedBehaviors,
        ...input.visualStyleProfile.designPrinciples.map((item) => item.application),
      ])].slice(0, 20),
    } : analyzed);
    return { source: 'gemini', analysis, resolution: addApprovedVisualConcepts(input, resolveProjectAnalysis(analysis)) };
  } catch {
    const analysis = createFallbackProjectAnalysis(input);
    return { source: 'fallback', analysis, resolution: addApprovedVisualConcepts(input, resolveProjectAnalysis(analysis)) };
  }
}

import ontologyData from '@/knowledge/ontology.compiled.json';
import capabilitiesData from '@/knowledge/software-capabilities.json';
import type { ProjectAnalysis, ResolvedProjectAnalysis } from './schema';

const normalize = (value: string) => value
  .normalize('NFKD')
  .toLowerCase()
  .replace(/[^a-z0-9.+]+/g, ' ')
  .trim();

const unique = <T,>(values: T[]) => [...new Set(values)];

const softwareAliases: Record<string, string[]> = {
  blender: ['blender'],
  touchdesigner: ['touchdesigner', 'touch designer'],
  'davinci-resolve': ['davinci resolve', 'resolve'],
  'python-opencv': ['python opencv', 'opencv', 'python'],
  p5js: ['p5.js', 'p5 js', 'p5js'],
  threejs: ['three.js', 'three js', 'threejs'],
  'after-effects': ['after effects', 'adobe after effects'],
  houdini: ['houdini'],
  maya: ['maya', 'autodesk maya'],
  illustrator: ['illustrator', 'adobe illustrator'],
  vercel: ['vercel'],
};

const capabilityAliases: Record<string, string[]> = {
  '3d-production.npr-technique.cel-shading': ['cel shading', 'cel shaded', 'toon shading', 'toon material'],
  '3d-production.geometry-nodes-technique.vegetation-scatter': ['geometry nodes', 'procedural vegetation', 'vegetation scatter'],
  'motion-and-animation.interaction-reactive-motion.hand-tracking': ['hand tracking', 'hand landmarks', 'mediapipe'],
  'audio-and-music.audio-reactive-technique.frequency-bands': ['audio reactive', 'react to music', 'frequency bands', 'audio spectrum'],
  'web-and-creative-coding.library.three-js': ['three.js', 'three js', 'webgl'],
  'web-and-creative-coding.library.p5-js': ['p5.js', 'p5 js', 'p5js'],
  'traditional-and-physical-media.installation-technique.projection-mapping': ['projection mapping', 'projected installation', 'projector calibration'],
};

const softwareLabelById = Object.fromEntries(
  capabilitiesData.software.map((software) => [software.id, software.label]),
);

const ontologyIdsByLabel = new Map<string, string[]>();
for (const concept of ontologyData.concepts) {
  const label = normalize(concept.label);
  ontologyIdsByLabel.set(label, [...(ontologyIdsByLabel.get(label) ?? []), concept.id]);
}

export function findSoftwareIds(values: string[]): string[] {
  return unique(values.flatMap((value) => {
    const normalized = normalize(value);
    return Object.entries(softwareAliases)
      .filter(([, aliases]) => aliases.some((alias) => normalized.includes(normalize(alias))))
      .map(([id]) => id);
  }));
}

export function findSoftwareLabels(values: string[]): string[] {
  return findSoftwareIds(values).map((id) => softwareLabelById[id]);
}

function findTechniqueIds(values: string[]): string[] {
  return unique(values.flatMap((value) => {
    const normalized = normalize(value);
    return Object.entries(capabilityAliases)
      .filter(([id, aliases]) => normalize(id) === normalized || aliases.some((alias) => normalized.includes(normalize(alias))))
      .map(([id]) => id);
  }));
}

function findOntologyIds(value: string): string[] {
  const normalized = normalize(value);
  const exact = ontologyIdsByLabel.get(normalized);
  if (exact) return exact.slice(0, 3);

  const phraseMatches: string[] = [];
  for (const [label, ids] of ontologyIdsByLabel) {
    if (label.length >= 4 && normalized.includes(label)) phraseMatches.push(...ids.slice(0, 1));
    if (phraseMatches.length >= 3) break;
  }
  return phraseMatches;
}

export function resolveProjectAnalysis(analysis: ProjectAnalysis): ResolvedProjectAnalysis {
  const capabilityTerms = [...analysis.requiredCapabilities, ...analysis.likelyTechniques];
  const ontologyTerms = [
    ...analysis.creativeDirection,
    ...analysis.deliverables,
    ...capabilityTerms,
  ];
  const techniqueIds = findTechniqueIds(capabilityTerms);
  const ontologyConceptIds = unique(ontologyTerms.flatMap(findOntologyIds));
  const unresolvedConcepts = unique([
    ...analysis.unknownTerminology,
    ...capabilityTerms.filter((term) =>
      findTechniqueIds([term]).length === 0 && !ontologyIdsByLabel.has(normalize(term))),
  ]);

  return {
    softwareIds: findSoftwareIds(analysis.knownSoftware),
    mandatorySoftwareIds: findSoftwareIds(analysis.mandatoryRequirements),
    techniqueIds,
    ontologyConceptIds,
    unresolvedConcepts,
  };
}

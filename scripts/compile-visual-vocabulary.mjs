import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { z } from 'zod';

const conceptSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  section: z.string().min(1),
  category: z.string().min(1),
});

export const VisualVocabularySchema = z.object({
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
  })).min(1),
});

const domainDefinitions = [
  {
    id: 'aesthetic-direction',
    label: 'Aesthetic, mood, and visual identity',
    categories: [
      ['Creative Direction', 'Aesthetic'], ['Creative Direction', 'Design Movement'],
      ['Creative Direction', 'Mood'], ['Creative Direction', 'Atmosphere'],
      ['Creative Direction', 'Visual Identity'],
    ],
  },
  {
    id: 'composition-layout',
    label: 'Composition, hierarchy, spacing, and rhythm',
    categories: [
      ['Visual Characteristics', 'Composition'], ['Visual Characteristics', 'Layout'],
      ['Visual Characteristics', 'Visual Hierarchy'], ['Visual Characteristics', 'Negative Space'],
      ['Visual Characteristics', 'Balance'], ['Visual Characteristics', 'Proportion'],
      ['Visual Characteristics', 'Scale'], ['Visual Characteristics', 'Rhythm'],
      ['Visual Characteristics', 'Repetition'], ['Visual Characteristics', 'Symmetry'],
      ['Visual Characteristics', 'Asymmetry'], ['Graphic Design', 'Graphic Composition'],
    ],
  },
  {
    id: 'color-light',
    label: 'Color, contrast, value, and lighting',
    categories: [
      ['Visual Characteristics', 'Color Palette'], ['Visual Characteristics', 'Color Relationship'],
      ['Visual Characteristics', 'Color Temperature'], ['Visual Characteristics', 'Contrast'],
      ['Visual Characteristics', 'Brightness'], ['Visual Characteristics', 'Saturation'],
      ['Visual Characteristics', 'Value Range'], ['Visual Characteristics', 'Lighting Mood'],
    ],
  },
  {
    id: 'typography',
    label: 'Typography and typographic motion',
    categories: [
      ['Graphic Design', 'Typography Style'],
      ['Conceptual / Theoretical Metadata', 'Typography Principle'],
      ['Motion and Animation', 'Typography Animation'],
    ],
  },
  {
    id: 'form-material-depth',
    label: 'Form, shape, texture, material, and depth',
    categories: [
      ['Visual Characteristics', 'Form Language'], ['Visual Characteristics', 'Shape Language'],
      ['Visual Characteristics', 'Geometry'], ['Visual Characteristics', 'Texture'],
      ['Visual Characteristics', 'Surface Quality'], ['Visual Characteristics', 'Material Appearance'],
      ['Visual Characteristics', 'Depth'], ['Visual Characteristics', 'Perspective'],
      ['Visual Characteristics', 'Pattern'], ['Visual Characteristics', 'Ornamentation'],
    ],
  },
  {
    id: 'motion-interaction',
    label: 'Motion, transitions, scroll, and interaction',
    categories: [
      ['Motion and Animation', 'Motion Style'], ['Motion and Animation', 'Motion Quality'],
      ['Motion and Animation', 'Motion Rhythm'], ['Motion and Animation', 'Motion Speed'],
      ['Motion and Animation', 'Transition Style'], ['Motion and Animation', 'UI Animation'],
      ['Motion and Animation', 'Interaction-Reactive Motion'], ['UI / UX / Interaction', 'Scroll Behavior'],
      ['UI / UX / Interaction', 'Hover Behavior'], ['UI / UX / Interaction', 'Microinteraction'],
      ['UI / UX / Interaction', 'Motion Design Pattern'],
    ],
  },
  {
    id: 'accessibility-usability',
    label: 'Accessibility, readability, and responsive behavior',
    categories: [
      ['UI / UX / Interaction', 'Accessibility Pattern'], ['UI / UX / Interaction', 'Responsive Behavior'],
      ['Constraints', 'Accessibility Constraint'], ['Audience', 'Accessibility Needs'],
      ['Web and Creative Coding', 'Web Standard'],
    ],
  },
];

function roundRobinConcepts(concepts, categories, limit) {
  const groups = categories.map(([section, category]) => concepts
    .filter((concept) => concept.section === section && concept.category === category)
    .sort((left, right) => left.sourceLine - right.sourceLine));
  const selected = [];
  let index = 0;
  while (selected.length < limit && groups.some((group) => index < group.length)) {
    for (const group of groups) {
      if (group[index] && selected.length < limit) selected.push(group[index]);
    }
    index += 1;
  }
  return selected;
}

export async function compileVisualVocabularyFile({ root = resolve(fileURLToPath(new URL('..', import.meta.url))) } = {}) {
  const ontologyPath = resolve(root, 'knowledge/ontology.compiled.json');
  const outputPath = resolve(root, 'knowledge/visual-design-vocabulary.compiled.json');
  const ontology = JSON.parse(await readFile(ontologyPath, 'utf8'));
  const domains = domainDefinitions.map((definition) => {
    const concepts = roundRobinConcepts(ontology.concepts, definition.categories, 80)
      .map(({ id, label, section, category }) => ({ id, label, section, category }));
    const promptConceptIds = roundRobinConcepts(ontology.concepts, definition.categories, 28)
      .map((concept) => concept.id);
    return { id: definition.id, label: definition.label, concepts, promptConceptIds };
  });
  const artifact = VisualVocabularySchema.parse({
    visualVocabularySchemaVersion: '1.0.0',
    source: 'knowledge/quanda.skills',
    compiledFrom: 'knowledge/ontology.compiled.json',
    conceptCount: domains.reduce((total, domain) => total + domain.concepts.length, 0),
    promptConceptCount: domains.reduce((total, domain) => total + domain.promptConceptIds.length, 0),
    domains,
  });
  await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
  return artifact;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const artifact = await compileVisualVocabularyFile();
  console.log(`Compiled ${artifact.conceptCount} visual-design concepts (${artifact.promptConceptCount} sent to Gemini).`);
}

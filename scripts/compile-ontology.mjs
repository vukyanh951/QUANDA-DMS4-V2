import { readFile, writeFile } from 'node:fs/promises';

const source = await readFile('knowledge/quanda.skills', 'utf8');
const slug = (value) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
let section = '';
let category = '';
const concepts = [];
const seen = new Set();
for (const [index, line] of source.split(/\r?\n/).entries()) {
  if (/^## 42\./.test(line)) break;
  const sectionMatch = line.match(/^## \d+\.\s+(.+)$/);
  const categoryMatch = line.match(/^###\s+(.+)$/);
  const itemMatch = line.match(/^-\s+(.+)$/);
  if (sectionMatch) { section = sectionMatch[1].trim(); category = ''; continue; }
  if (categoryMatch) { category = categoryMatch[1].trim(); continue; }
  if (!itemMatch || !section || !category) continue;
  const label = itemMatch[1].trim();
  const id = `${slug(section)}.${slug(category)}.${slug(label)}`;
  if (seen.has(id)) continue;
  seen.add(id);
  concepts.push({ id, label, section, category, sourceLine: index + 1 });
}
await writeFile('knowledge/ontology.compiled.json', `${JSON.stringify({ ontologySchemaVersion: '1.0.0', source: 'knowledge/quanda.skills', conceptCount: concepts.length, concepts }, null, 2)}\n`);
console.log(`Compiled ${concepts.length} ontology concepts.`);

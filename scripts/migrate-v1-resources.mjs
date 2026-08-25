import { readFile, writeFile } from 'node:fs/promises';

const input = JSON.parse(await readFile('knowledge/v1-verified-resources.json', 'utf8'));
const ids = { 'Adobe After Effects':'after-effects', 'Adobe Illustrator':'illustrator', 'Adobe Photoshop':'photoshop', 'Adobe Premiere Pro':'premiere-pro', Audacity:'audacity', Blender:'blender', 'DaVinci Resolve':'davinci-resolve', Figma:'figma', 'FL Studio':'fl-studio', Procreate:'procreate' };
const resources = input.resources.map((r) => ({
  id:r.id, type:r.resourceType, title:r.title, url:r.url, provider:r.provider, creator:r.creator,
  softwareIds:r.software.map((name) => ids[name]).filter(Boolean), techniqueIds:r.techniques, skillIds:r.skills,
  language:r.language, durationMinutes:r.durationMinutes,
  reliability:r.verification.status === 'trusted_source' ? 'official' : 'curated', verifiedAt:r.verification.verifiedAt,
  versionInfo:r.versionInfo, status:'available', provenance:r.provenance, sourceVerification:r.verification,
  originalMetadata:r.originalMetadata,
  migration:{ source:'QUANDA V1 reusable knowledge export', sourceSchemaVersion:input.schemaVersion, migratedWithoutRankingLogic:true },
}));
await writeFile('knowledge/resources.json', `${JSON.stringify({ resourceSchemaVersion:'2.0.0', source:'knowledge/v1-verified-resources.json', migrationPolicy:'Reusable knowledge only; no V1 ranking or architecture imported.', resourceCount:resources.length, resources }, null, 2)}\n`);
console.log(`Migrated ${resources.length} V1 resources.`);

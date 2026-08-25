# QUANDA V1 Resource Extraction Report

## Scope

This extraction records only learning-resource knowledge present in the local QUANDA V1 repository. It does not include live web research, link revalidation, ranking logic, UI code, prompts, roadmap logic, or QUANDA V2 implementation.

The repository already contained unrelated modified and untracked files before extraction. Those files were treated as the input state and were not changed by this task.

## A. Sources inspected

### Files containing authoritative or potentially reusable resource data

- `tutorial-recommender.mjs`
  - Contains `CURATED_TUTORIALS`, the current six-record manually curated video catalogue.
  - Contains `OFFICIAL_LEARNING_HUBS`, the current ten-record official fallback catalogue.
  - Constructs canonical YouTube watch URLs deterministically from stored video IDs.
- `public/tutorial-recommender.mjs`
  - Byte-identical generated copy of `tutorial-recommender.mjs` used by the static client build.
- `dist/client/tutorial-recommender.mjs`
  - Byte-identical build copy of `tutorial-recommender.mjs`.
- `app.js` at tracked revision `da3e32d`
  - Contains the earlier production `tutorialsByStage` array with the same six YouTube resources.
  - This historical occurrence corroborates that the six videos were part of the V1 product rather than test-only fixtures.
- `index.html`
  - Supplies the production application names associated with official learning hubs.

### Files establishing how the resource data is used or copied

- `app.js`
  - Imports `recommendTutorials` and renders curated videos, official hubs, and generated search fallbacks.
- `public/app.js`
  - Static runtime copy of the application renderer.
- `dist/client/app.js`
  - Client build copy of the application renderer.
- `scripts/sync-static.mjs`
  - Copies the root tutorial catalogue into `public/tutorial-recommender.mjs` during development/build.
- `tests/tutorial-recommender.test.mjs`
  - Exercises production catalogue selection and generated fallback behaviour.
  - Contains no separate real resources or mock resource URLs.
- `package.json`
  - Identifies the build and test entry points used by the current V1 working tree.

### Areas and formats searched

The repository was searched across `app/`, `assets/`, `build/`, `dist/`, `public/`, `scripts/`, `tests/`, `worker/`, root source files, JSON, JavaScript, TypeScript, Markdown, generated client/server files, hardcoded arrays, URLs, YouTube IDs, documentation references, creator metadata, application tags, language, duration, difficulty, prerequisites, version, verification, trust, and fallback data.

No additional reusable resource catalogue was found in the V1 API, worker, hosting configuration, assets, package metadata, or server build files. The nested `QUANDA-DMS4-demo-fix/` repository was not treated as V1 and was excluded from this extraction.

## B. Authoritative resource sources

The current authoritative source is `tutorial-recommender.mjs`:

- `CURATED_TUTORIALS` is the authoritative current list for six individually curated YouTube videos.
- `OFFICIAL_LEARNING_HUBS` is the authoritative current list for ten manually hardcoded official learning sources.

`public/tutorial-recommender.mjs` and `dist/client/tutorial-recommender.mjs` have the same SHA-256 hash as the root source and are generated mirrors, not separate catalogues.

Important repository-state caveat: `tutorial-recommender.mjs` is currently untracked in the V1 Git working tree, although it is imported by the modified `app.js`, copied by `scripts/sync-static.mjs`, present in the built client, and its six videos are corroborated by the tracked production `app.js` at revision `da3e32d`. The export therefore represents the actual local V1 product state, but the source file itself should be reviewed and committed before being treated as durable migration history.

## C. Export statistics

| Metric | Count |
|---|---:|
| Raw current resource occurrences found | 48 |
| Unique real resources exported | 16 |
| Duplicate build/copy occurrences merged | 32 |
| Placeholder resource records excluded | 0 |
| Test/mock resource records excluded | 0 |
| Verified | 0 |
| Curated | 6 |
| Trusted-source only | 10 |
| Unverified | 0 |
| Unknown verification | 0 |

The 48 raw occurrences are the same 16 logical resources appearing in the root catalogue and its two byte-identical `public/` and `dist/client/` copies. The six historical occurrences in tracked `app.js` were used as corroborating provenance and were not added to the current raw-occurrence count.

One dynamic YouTube search-result generator was excluded. It can create an unbounded number of query URLs at runtime, but those URLs are searches rather than curated resource records and are therefore not counted above.

No resource was promoted to `verified`: V1 explicitly labels the six videos as curated but stores no per-resource verification flag or date. Official product-owned hubs are represented as `trusted_source`, not individually reviewed resources.

## D. Resource types

| Resource type | Count |
|---|---:|
| `tutorial_video` | 6 |
| `tutorial_article` | 0 |
| `official_documentation` | 10 |
| `example` | 0 |
| `template` | 0 |
| `plugin` | 0 |
| `repository` | 0 |
| `reference` | 0 |
| `unknown` | 0 |

The official tutorial, training, handbook, help, support, and manual hubs were normalized as `official_documentation` because V1 points directly to the software owners' learning/support properties. No live ownership or availability check was performed.

## E. Software coverage

| Software | Resource count |
|---|---:|
| Blender | 7 |
| Adobe Photoshop | 1 |
| Adobe Illustrator | 1 |
| Adobe After Effects | 1 |
| Adobe Premiere Pro | 1 |
| DaVinci Resolve | 1 |
| Figma | 1 |
| Procreate | 1 |
| Audacity | 1 |
| FL Studio | 1 |

Only Blender has individually curated video coverage. The other nine applications are represented solely by an official learning hub.

## F. Languages

| Language metadata | Count |
|---|---:|
| English (`en`) | 13 |
| Vietnamese (`vi`) | 3 |
| Missing | 0 |

The six curated videos contain explicit V1 language metadata: three English and three Vietnamese. V1's runtime assigns English to all ten official learning hubs. This records V1's behaviour, but it should not be interpreted as a complete audit of every language available inside those external hubs.

## G. Missing metadata

- Verification date is absent for 16 of 16 resources (100%).
- Difficulty is absent for 16 of 16 resources (100%).
- Prerequisite information is absent for 16 of 16 resources (100%).
- Resource-quality or ranking scores are absent for 16 of 16 persisted records (100%). Ranking is calculated at runtime and was intentionally not migrated.
- Duration is absent for 10 of 16 resources (62.5%). It is present only for the six curated videos.
- Specific software-version information is absent for 10 of 16 resources (62.5%). V1 displays “Continuously updated” for official hubs, but that UI label is preserved only in `originalMetadata` rather than treated as a software version.
- Structured `skills` and `techniques` are absent for all resources. The six videos have mixed-purpose `topics` arrays, which are preserved unchanged in `originalMetadata` rather than guessed into skill or technique fields.
- Individual trusted-source status is absent for the six curated YouTube videos. Their `trustedSource` value is therefore `null`.
- V1 contains creators for every exported resource, but no creator IDs, channel IDs, moderation records, verification notes, or source-quality scores.

## H. Suspicious or uncertain data

### Excluded dynamic YouTube search fallbacks

`toSearchResource()` builds YouTube results-page URLs from the application, inferred focus, stage, and language. These are useful V1 fallback logic but are not verified learning resources. They were excluded from the JSON export.

### Official hub “Continuously updated” label

`toOfficialResource()` generates “Continuously updated” or “Luôn cập nhật” as the `version` display value. V1 does not store evidence that each destination is continuously updated. The label is preserved in `originalMetadata.runtimeVersionLabels`, but `versionInfo` remains empty.

### Curated does not mean verified

The six videos are named inside `CURATED_TUTORIALS` and existed in the tracked production application, but V1 has no per-video review status, verification date, trusted-channel flag, or quality score. They are exported as `curated`, not `verified`.

### Working-tree durability

The current root catalogue and its tests are untracked in the V1 repository. Their use by the modified runtime and build output supports treating them as current product data, but this repository state should be resolved before migration sign-off.

No `example.com` resources, fake YouTube IDs, lorem ipsum records, or separate demo-only resource catalogues were found in the V1 scope.

## I. Migration recommendation

1. The ten official hubs are safe to provide to QUANDA V2 as `trusted_source` seed records, subject to a one-time manual URL and ownership review before release.
2. The six YouTube videos are safe to import as legacy `curated` candidates. Manually confirm availability, content relevance, creator/channel identity, and current software compatibility before upgrading any to `verified`.
3. Preserve `originalMetadata.topics`, stage indexes, specialized terms, and V1 version strings during migration. Do not automatically convert the mixed topic tags into V2 skills or techniques without review.
4. Do not migrate the generated YouTube-search fallback as verified data. If V2 needs search fallback behaviour, implement it separately from the trusted resource catalogue.
5. Keep the provenance array intact so V2 can distinguish the canonical source, generated copies, build copies, and historical production evidence.
6. Commit or otherwise archive the authoritative V1 catalogue before using it as a long-term migration source.

## Validation summary

- The JSON export parses successfully after generation.
- `resourceCount` matches the resource array length: 16.
- All 16 canonical URLs are unique, and all six YouTube video IDs are unique.
- The exported video-ID and official-URL sets exactly match the authoritative V1 source definitions.
- Every resource contains non-empty provenance.
- No placeholder domains should appear in the export.
- No live web research was performed and no URL was regenerated from a title.
- YouTube watch URLs were derived deterministically from the exact stored V1 video IDs.
- No API keys, tokens, or repository secrets are included.
- No V1 source-code logic was copied into the export.
- No existing V1 application file was modified by this extraction.

Generated files:

- `exports/v1-verified-resources.json`
- `exports/V1_RESOURCE_EXTRACTION_REPORT.md`

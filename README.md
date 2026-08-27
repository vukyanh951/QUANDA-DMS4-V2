# QUANDA V2

QUANDA V2 is a clean rebuild of QUANDA around an evidence-backed project pipeline solver.

## Source of truth

Before implementation, read:

- `QUANDA_V2_SPEC.md`

The specification defines the product behavior, architecture, solver requirements, user flow, benchmark cases, and MVP constraints.

## Core knowledge

The primary ontology source is:

- `knowledge/quanda.skills`

Treat `quanda.skills` as the human-maintained creative and technical knowledge source. Compile it into runtime data rather than sending the whole file to Gemini on every request.

The runtime knowledge layers are:

- `knowledge/ontology.compiled.json` — canonical concepts compiled from `quanda.skills`
- `knowledge/quanda-ai-models.skills` — curated, time-scoped AI model-family knowledge kept separate from the creative ontology
- `knowledge/ai-models.compiled.json` — validated model capabilities, access routes, lifecycle snapshots, and provenance used by the nested model selector
- `knowledge/software-capabilities.json` — technique-to-software support and methods
- `knowledge/technique-playbooks.json` — curated prerequisites, artifacts, implementation steps, acceptance checks, and failure modes for executable tasks and agent handoffs

Gemini identifies plain-language project intent. Repository-owned resolution validates it against these canonical layers, and the deterministic solver selects paths, task dependencies, and delegation playbooks. Agent prompts are generated from the selected playbooks; they are not generic Gemini-authored instructions.

When a selected execution step actually benefits from AI, a second deterministic selector compares the curated model families by hard capability fit, user access, familiarity, modality, privacy, cost, setup burden, switching friction, lifecycle stability, and snapshot freshness. This nested choice is separate from the server-side Gemini call used internally for project understanding. Non-AI execution remains a first-class option.

## Optional visual-reference analysis

Users may attach one to four JPEG, PNG, or WebP moodboard/reference images. A dedicated server route sends those images to Gemini for structured observation of composition, hierarchy, color, typography, spacing, shapes, texture, lighting/depth, and motion cues. QUANDA then shows an editable visual-style profile. The profile does not affect project analysis, deterministic ranking, or agent prompts until the user explicitly approves it.

Reference images are held only in the browser and request body for that analysis; QUANDA does not persist them or include them in the saved local draft. The approved structured profile may be saved locally with the rest of the draft. The original text-only workflow still works when no images are provided or visual analysis is unavailable.

## V2 product direction

QUANDA V2 is **not** primarily a tutorial recommender.

Its job is to:

1. Understand what the user is trying to make.
2. Respect deadlines, constraints, existing skills, and existing software familiarity.
3. Resolve required techniques into concrete software and methods.
4. Generate multiple genuinely viable execution paths.
5. Compare those paths using deterministic scoring.
6. Recommend the best-fit viable path.
7. Show why it won and why alternatives lost.
8. Turn the winning path into executable production tasks.

Possible execution methods include:

- do it yourself
- delegate to an AI coding agent
- read official documentation
- follow a focused tutorial
- use an example
- use a template
- use a plugin/tool
- switch application when justified

Tutorials are one resource type, not the foundation of the product.

## V1 separation

This repository is independent from QUANDA V1.

Do not copy or recreate V1's tutorial-first architecture, mandatory tutorial-review flow, or old roadmap assumptions.

V1 may only be used as a source for reusable knowledge assets such as:

- verified/curated resource records
- benchmark briefs
- translations
- branding assets
- useful ontology/compiler ideas

If V1 resource data is migrated, convert it into the V2 resource schema rather than importing old tutorial-matching logic.

## Initial repository inputs

The repository should initially contain at least:

```text
QUANDA_V2_SPEC.md
README.md
knowledge/
  quanda.skills
```

The implementation should then create the required V2 structures described in the specification, including:

```text
knowledge/software-capabilities.json
knowledge/resources.json
evals/
src/
scripts/
```

## Technical priorities

- TypeScript
- Vercel-compatible web application
- Gemini Flash / Flash-Lite
- free-tier-conscious architecture
- local ontology and capability data
- deterministic path scoring
- low cognitive load
- English + Vietnamese
- no fabricated URLs or ontology IDs

## Development rule

If implementation details are ambiguous, `QUANDA_V2_SPEC.md` is authoritative.

Do not modify QUANDA V1.

## Local development

QUANDA V2 is a standard Next.js App Router application.

```bash
pnpm install
pnpm dev
```

Run the validation gate with:

```bash
pnpm test:solver
pnpm test:analysis
pnpm test:visual-analysis
pnpm test:ai-models
pnpm lint
pnpm build
```

## Vercel deployment

Import this repository into Vercel as a Next.js project. No custom build or output configuration is required.

Copy `.env.example` to `.env.local` for local server-side integrations. Configure the same variable names in Vercel for Preview and Production. `GEMINI_API_KEY` is server-only and must never use a `NEXT_PUBLIC_` prefix.

Each uncached project submission makes one server-side Gemini structured-analysis request. Visual-reference analysis is a separate optional request made only when the user clicks the analysis control. The validated and user-approved result enriches repository-owned ontology and capability resolution, then the deterministic QUANDA solver ranks the paths. If project-understanding Gemini configuration, quota, output validation, or the request itself fails, the API automatically uses local deterministic analysis instead. If optional visual analysis fails, QUANDA reports the issue and leaves the text-only workflow available.

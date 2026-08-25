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
pnpm lint
pnpm build
```

## Vercel deployment

Import this repository into Vercel as a Next.js project. No custom build or output configuration is required.

Copy `.env.example` to `.env.local` for local server-side integrations. Configure the same variable names in Vercel for Preview and Production. `GEMINI_API_KEY` is server-only and must never use a `NEXT_PUBLIC_` prefix.

Each uncached project submission makes one server-side Gemini structured-analysis request. The validated analysis enriches repository-owned ontology and capability resolution, then the deterministic QUANDA solver ranks the paths. If Gemini configuration, quota, output validation, or the request itself fails, the API automatically uses local deterministic analysis instead.

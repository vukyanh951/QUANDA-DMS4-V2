# QUANDA V2 — Product & Technical Specification

## 0. Status

**Product:** QUANDA V2  
**Working definition:** Evidence-backed creative pipeline solver  
**Primary goal:** Given a user's project goal, constraints, existing skills, and available tools, QUANDA should find the **most efficient viable execution path**, show the **top alternative paths considered**, and explain why the recommended path won.

This document is the source of truth for the V2 MVP. Do not inherit V1 assumptions unless they directly support this specification.

---

# 1. Product Thesis

QUANDA V1 was mainly:

```text
Project brief
→ identify skills
→ find tutorials
→ build roadmap
```

QUANDA V2 changes the core model to:

```text
Project brief
→ understand destination
→ identify required capabilities
→ resolve each capability into concrete tools/software
→ generate multiple viable execution paths
→ compare paths
→ select the best path
→ explain why it won
→ give the user an executable production pipeline
```

The destination is **finishing the project**, not "learning software." Learning is only one possible way to solve a task.

---

# 2. Core Product Promise

> **QUANDA finds the shortest viable way to finish your project — what to do yourself, what to delegate to AI, what tools to use, what you actually need to learn, and what you can skip.**

QUANDA should feel meaningfully easier than using a normal AI search/chat workflow.

A normal user might currently:

```text
Ask ChatGPT/Gemini
→ Google
→ YouTube
→ documentation
→ Reddit/forum
→ another AI prompt
→ compare tools manually
→ create a schedule manually
```

QUANDA should compress that into:

```text
Brief
→ evaluated paths
→ recommended pipeline
→ proof
→ execution
```

---

# 3. Primary Competitive Benchmark

QUANDA V2 should be compared against:

> **A regular person solving the same project by searching things up with AI Mode / ChatGPT / Gemini and manually deciding what to do next.**

QUANDA does **not** need to be "more intelligent" than the base model. It needs to create a better **workflow**.

## QUANDA should beat normal AI on

1. Cognitive load
2. Number of follow-up prompts
3. Decision fatigue
4. Time to first useful action
5. Number of external searches
6. Unnecessary learning
7. Unnecessary software switching
8. Consistency across the whole project
9. Evidence for recommendations
10. Ability to turn advice into execution
11. Deadline awareness
12. Remembering what the user already knows

---

# 4. Cognitive Load Goal

The user should not have to operate QUANDA like a complicated expert system.

Target:

```text
Complete brief
↓
1. Find my best path
↓
2. Confirm only major assumptions if needed
↓
3. Start / view recommended path
```

Target approximately **3 meaningful decisions** from a completed brief to a usable execution path.

Optional refinement actions such as:

- change software
- replace resource
- "I already know this"
- compare alternatives
- inspect evidence
- edit creative direction

should not be mandatory gates.

QUANDA should only ask the user a follow-up question when missing information materially prevents a defensible decision.

---

# 5. Required User Input

Keep required input minimal.

## 5.1 What are you trying to make?

Free-text natural-language project brief.

Example:

> I need to make an interactive installation where hand movement grows projected flowers.

## 5.2 Deadline and available time

At minimum:

- deadline
- approximate time available

Example:

```text
Deadline: 7 days
Available time: ~2 hours/day
```

## 5.3 What do you already know / use?

Examples:

- Blender — intermediate
- TouchDesigner — basics
- Photoshop — advanced
- JavaScript — beginner
- Codex — available
- DaVinci Resolve — basic editing

This is essential because switching software and learning new tools must carry a cost.

## 5.4 Non-negotiable constraints

Examples:

- must use TouchDesigner
- must export MP4
- cannot use paid software
- final output must be interactive
- assignment requires Blender
- do not introduce another 3D package
- must run in browser

---

# 6. Optional User Input

Hide these behind progressive disclosure or infer them when possible.

- reference images / moodboard
- output quality target
- preferred resource language
- budget
- preferred AI-agent usage
- target platform
- required file format
- accessibility constraints
- team size
- hardware constraints
- preferred software
- forbidden software
- preferred learning style

Do not require users to manually choose techniques, frameworks, or software that QUANDA is supposed to optimize.

### 6.1 Optional visual-reference analyzer

When reference images or a moodboard are supplied, QUANDA may use a multimodal model to produce a structured visual-style profile covering:

- composition and visual hierarchy
- spacing, density, and rhythm
- palette, contrast, and color usage
- typography characteristics and scale relationships
- shapes, texture, material, lighting, and depth
- observed motion cues and reasonable interaction suggestions
- conflicts, weak evidence, and accessibility cautions

The analysis must distinguish visible evidence from suggested application. It must be editable and must not affect path generation until the user explicitly approves it. References are direction, not permission to copy an artist or work. The text-only flow remains fully functional.

---

# 7. Central Product Rule

> **Never ask the user to choose something QUANDA is supposed to optimize unless QUANDA cannot make a defensible decision.**

Bad:

> Do you want Blender, Maya, or 3ds Max?

Better:

> **Blender recommended.**  
> You already know it and it satisfies all required 3D tasks.  
> `See 4 alternatives`

---

# 8. Definitive Software Resolution

A major lecturer requirement:

> A technique alone is not actionable.

QUANDA must not output:

```text
Use toon shading.
```

It should output:

```text
Technique: Toon shading
Software: Blender
Method: Shader Nodes
```

For every actionable technique, QUANDA should resolve:

```text
Technique
→ candidate software
→ recommended software
→ method
→ reason
```

Unless a technique is genuinely software-agnostic.

## Hard rule

> **No actionable technique should reach the final pipeline without a resolved software/application context, unless explicitly marked software-agnostic.**

---

# 9. Tool Selection Principle

QUANDA should strongly prefer tools the user already knows when they are viable.

Switching tools has a cost:

- learning time
- setup time
- cognitive overhead
- file handoff overhead
- compatibility risk
- tutorial/resource discovery cost

A new tool should only win when it offers a clear project-specific advantage.

Example:

```text
Project:
Cel-shaded product animation

User knows:
Blender

Candidates:
Blender
Maya
3ds Max

Recommended:
Blender

Why:
- user already knows it
- required techniques are supported
- no additional 3D software learning
- no capability advantage from switching
```

---

# 10. Execution Methods

QUANDA should not assume "learn from a tutorial" is always the best way to solve a task.

Every task can be solved through one or more execution methods.

Canonical V2 execution methods:

```text
DO_YOURSELF
DELEGATE_TO_AGENT
READ_DOCUMENTATION
FOLLOW_TUTORIAL
USE_EXAMPLE
USE_TEMPLATE
USE_PLUGIN_OR_TOOL
SWITCH_APPLICATION
ASK_FOR_HUMAN_REVIEW
```

## DO_YOURSELF

Use when:

- user already knows the skill
- task is straightforward
- subjective art direction is required

## DELEGATE_TO_AGENT

Use when:

- repetitive implementation can be delegated
- agent has access to the relevant code/repo
- user can validate the output
- delegation reduces human time

Examples include Codex, Claude Code, and other compatible coding agents. Do not permanently couple V2 to a single agent brand.

## READ_DOCUMENTATION

Use when:

- information is precise/reference-oriented
- tutorial would be excessive
- current official API/software behavior matters

## FOLLOW_TUTORIAL

Use when:

- user genuinely needs to learn a technique
- focused learning is the efficient route
- understanding is necessary to complete or judge the work

## USE_EXAMPLE / TEMPLATE

Use when:

- solved infrastructure already exists
- adaptation is faster than rebuilding

## USE_PLUGIN_OR_TOOL

Use when:

- a stable tool meaningfully reduces manual work
- setup cost is lower than manual implementation

## SWITCH_APPLICATION

Use only when:

- existing tools cannot satisfy the requirement well
- or a different tool provides a strong enough efficiency advantage to justify switching cost

---

# 11. The Solver

The solver is the main differentiator of QUANDA V2.

Gemini may help identify and classify options.

**Gemini should not simply declare the winner.**

QUANDA's deterministic code should compare candidate paths using explicit scoring criteria.

---

# 12. Candidate Paths

For every project, generate approximately **3–5 viable end-to-end pipelines** when enough alternatives exist.

Example:

```text
PATH 1 — Blender → DaVinci Resolve
PATH 2 — Blender → After Effects
PATH 3 — Houdini → DaVinci Resolve
PATH 4 — Maya → After Effects
PATH 5 — Blender only
```

Do not generate fake alternatives simply to fill five slots.

If only two genuinely viable paths exist, show two.

---

# 13. Path Scoring

Create a deterministic scoring engine.

Suggested factors:

```text
Requirement satisfaction
User software familiarity
User skill familiarity
New learning time
Human execution time
Agent/delegation time
Tool-switching cost
Setup overhead
Cross-application handoff cost
Resource availability
Resource reliability
Software compatibility
Output compatibility
Deadline fit
Budget fit
Risk
Number of unknowns
```

Weights should be centrally configurable and versioned.

## High-priority factors

1. explicit requirement satisfaction
2. deadline feasibility
3. user familiarity
4. required capability coverage
5. new learning burden
6. tool-switching overhead

## Lower-priority factors

- aesthetic affinity
- popularity
- novelty
- recency, unless version-sensitive

---

# 14. Recommended Path

The final result should prominently show one path:

```text
★ RECOMMENDED PATH
```

Do not overwhelm the user with alternatives first.

The user should immediately know what QUANDA recommends.

---

# 15. Proof / Path Evidence

This is a core lecturer requirement.

QUANDA must show:

> **We considered other viable routes. This one won for concrete reasons.**

Example:

```text
Recommended: Blender + DaVinci Resolve
Score: 92/100

Why this path won:
✓ You already know Blender
✓ Meets every required 3D technique
✓ Lowest additional learning time
✓ No unnecessary 3D software switch
✓ Fits your deadline
✓ Reliable resources available
```

Then:

```text
Other paths considered

2. Blender + After Effects — 86
   Lost because:
   - you do not know After Effects
   - additional learning required

3. Houdini + DaVinci — 73
   Lost because:
   - procedural capability is strong
   - but software learning overhead is high

4. Maya + After Effects — 64
   Lost because:
   - two new applications
   - no required capability advantage
```

---

# 16. Claim Language

Do not claim:

> "This is mathematically the shortest possible path."

unless the system can actually guarantee it.

Prefer:

- **Recommended path**
- **Most efficient path among the evaluated viable options**
- **Shortest viable path found by QUANDA**
- **Best-fit route based on your current skills and constraints**

---

# 17. What QUANDA Should Show Was Skipped

A key proof mechanism is showing unnecessary work removed.

Example:

```text
QUANDA skipped

Blender navigation
→ You already know it

Basic modelling
→ You already know it

Sculpting
→ Not required

Rigging
→ Not required

Maya
→ Adds learning overhead with no project-specific advantage
```

Optional:

```text
Estimated unnecessary learning avoided: ~2h 40m
```

Only calculate this when supported by real estimated alternatives. Do not fabricate savings.

---

# 18. Task Model

Each selected pipeline contains executable tasks.

Conceptual schema:

```ts
interface PipelineTask {
  id: string;

  title: string;
  objective: string;

  techniqueIds: string[];

  recommendedSoftwareId: string | null;
  softwareAgnostic: boolean;

  executionMethod:
    | "do_yourself"
    | "delegate_to_agent"
    | "read_documentation"
    | "follow_tutorial"
    | "use_example"
    | "use_template"
    | "use_plugin_or_tool"
    | "switch_application"
    | "human_review";

  resourceIds: string[];

  prerequisiteTaskIds: string[];

  estimatedHumanMinutes?: number;
  estimatedLearningMinutes?: number;
  estimatedAgentMinutes?: number;

  whyIncluded: string;
  definitionOfDone: string[];

  priority:
    | "required"
    | "useful"
    | "optional";
}
```

Adapt to the chosen stack.

---

# 19. Resolved Technique Model

Conceptually:

```ts
interface ResolvedTechnique {
  techniqueId: string;

  candidateSoftwareIds: string[];

  recommendedSoftwareId: string | null;

  method?: string;

  reason: string;

  alternatives: {
    softwareId: string;
    reasonNotSelected: string;
  }[];

  softwareAgnostic: boolean;
}
```

---

# 20. Candidate Path Model

Conceptually:

```ts
interface CandidatePath {
  id: string;

  title: string;

  tasks: PipelineTask[];

  softwareIds: string[];

  estimatedHumanMinutes: number;
  estimatedLearningMinutes: number;
  estimatedAgentMinutes: number;

  score: number;

  scoreBreakdown: {
    requirements: number;
    familiarity: number;
    learningCost: number;
    executionCost: number;
    switchingCost: number;
    resourceQuality: number;
    deadlineFit: number;
    risk: number;
  };

  strengths: string[];
  weaknesses: string[];

  viable: boolean;
  rejectionReasons?: string[];
}
```

---

# 21. Resource Model

V2 resources are broader than tutorials.

Conceptually:

```ts
type ResourceType =
  | "official_documentation"
  | "tutorial_video"
  | "tutorial_article"
  | "example"
  | "template"
  | "plugin"
  | "repository"
  | "forum_answer"
  | "reference"
  | "agent";

interface Resource {
  id: string;

  type: ResourceType;

  title: string;
  url?: string;

  provider?: string;
  creator?: string;

  softwareIds: string[];
  techniqueIds: string[];
  skillIds?: string[];

  language?: string;
  durationMinutes?: number;

  reliability:
    | "curated"
    | "official"
    | "indexed"
    | "live_unverified";

  verifiedAt?: string;

  versionInfo?: string[];

  status:
    | "available"
    | "stale"
    | "broken";
}
```

---

# 22. Resource Priority

Prefer, when relevance is similar:

```text
Official documentation
↓
QUANDA-curated / verified resource
↓
Previously indexed resource
↓
Live discovered resource
```

But relevance still matters.

An official 100-page reference should not automatically beat a focused 10-minute tutorial for a complete beginner.

---

# 23. YouTube's New Role

YouTube is no longer the foundation.

Old:

```text
Need skill
→ YouTube
→ tutorial
```

V2:

```text
Need task solved
→ evaluate execution methods
→ tutorial wins?
→ then search YouTube
```

Use YouTube Data API only when video learning is actually appropriate.

Do not fabricate URLs.

---

# 24. Web / Search Role

When current external evidence is necessary, QUANDA may use:

- Gemini + Google Search grounding
- URL context / page inspection where available
- official documentation sources
- curated resource database

Search should gather evidence.

The solver chooses.

---

# 25. Free-First Architecture

A hard MVP constraint:

> **Prefer free or free-tier infrastructure.**

Recommended stack:

```text
Gemini Flash / Flash-Lite
→ brief understanding
→ structured classification
→ candidate-option generation

Local quanda.skills ontology
→ creative + technical concepts

Local software-capability knowledge
→ technique ↔ software ↔ method

Local TypeScript solver
→ candidate paths
→ scoring
→ top-path selection
→ proof

Google Search grounding
→ only when external/current evidence is required

YouTube Data API
→ only when tutorial method wins

Local scheduling
→ deadline/capacity calculations
```

Avoid unnecessary paid vector databases or repeated AI calls.

---

# 26. AI vs Deterministic Responsibilities

## Gemini / LLM responsibilities

Good uses:

- interpret messy project briefs
- extract constraints
- infer creative intent
- classify concepts
- propose candidate techniques
- propose candidate execution options
- summarize evidence
- parse external resources into structured metadata
- interpret user-supplied visual references into an editable, evidence-linked style profile

## Deterministic application responsibilities

Must be code-driven where practical:

- canonical ontology validation
- software constraint validation
- user-skill comparison
- path scoring
- ranking
- deadline arithmetic
- switching-cost calculation
- resource filtering
- broken-resource rejection
- top-5 ordering
- evidence assembly
- duplicate removal
- apply only user-approved visual-style facts to project resolution and task prompts
- choose an AI model only inside an execution method that actually needs AI

Do not make the product "Gemini with one giant prompt."

---

# 27. Existing `quanda.skills`

The supplied:

```text
knowledge/quanda.skills
```

remains useful.

V2 uses it as a creative/technical ontology.

It should support:

```text
creative direction
techniques
software
programming
3D
motion
audio
interaction
production
outputs
constraints
etc.
```

Do not send the entire raw file in every Gemini request.

Compile it into stable machine-readable data.

---

# 28. New Knowledge Layer: Software Capabilities

V2 needs a second knowledge source:

```text
knowledge/software-capabilities.json
```

Its purpose:

> Map actionable techniques to concrete software/methods.

Example:

```json
{
  "techniqueId": "hand-tracking",
  "softwareOptions": [
    {
      "softwareId": "touchdesigner",
      "method": "MediaPipe / tracking input",
      "support": "strong",
      "suitableFor": [
        "real-time installation",
        "projection",
        "interactive visuals"
      ]
    },
    {
      "softwareId": "python-opencv",
      "method": "OpenCV / MediaPipe",
      "support": "strong",
      "suitableFor": [
        "custom computer vision"
      ]
    }
  ]
}
```

Another:

```json
{
  "techniqueId": "procedural-vegetation",
  "softwareOptions": [
    {
      "softwareId": "blender",
      "method": "Geometry Nodes",
      "support": "strong"
    },
    {
      "softwareId": "houdini",
      "method": "procedural networks",
      "support": "strong"
    },
    {
      "softwareId": "unreal-engine",
      "method": "PCG",
      "support": "strong"
    }
  ]
}
```

Do not invent unsupported claims.

Start with a curated MVP subset and expand.

---

# 29. Knowledge Open-World Rule

QUANDA cannot know every technique/software relationship.

If a concept is unknown:

- preserve original wording
- search for evidence if allowed
- present uncertainty
- do not force an incorrect mapping

Example:

```text
Software choice needs confirmation
```

is better than a confident hallucination.

---

# 30. Project Understanding / Creative DNA

Keep the useful V1 idea of Creative DNA, but simplify its role.

It should capture:

```text
destination
medium
aesthetic
required capabilities
explicit requirements
preferences
known tools/skills
unknown terms
constraints
```

It is input to the solver, not a long mandatory review form.

Only ask the user to confirm high-impact uncertain assumptions.

---

# 31. User Flow

Recommended V2 MVP flow:

```text
LANDING
↓
PROJECT INPUT
    └── optional visual references → analyze → edit → approve
↓
FIND MY BEST PATH
↓
SHORT ANALYSIS
↓
RECOMMENDED PATH
    ├── execution steps
    ├── definitive apps
    ├── execution methods
    ├── resources
    └── definitions of done
↓
WHY THIS PATH?
↓
OTHER PATHS CONSIDERED
```

Optional controls:

```text
I already know this
Use another app
Replace resource
Too advanced
Too long
Show evidence
Edit constraints
Recalculate path
```

---

# 32. Recommended Result UI

Example:

```text
YOUR BEST PATH

Blender → TouchDesigner → DaVinci Resolve

Estimated human time: 6h 20m
New learning: 45m

01 — Prepare flower asset
Blender · Do yourself
You already know modelling

02 — Implement hand tracking
TouchDesigner · Learn
Focused resource · 18 min

03 — Map hand position to flower growth
TouchDesigner · Do + reference docs
Estimated work · 45 min

04 — Build final projection scene
TouchDesigner · Do yourself

05 — Final edit/export
DaVinci Resolve · Do yourself
```

Then:

```text
WHY THIS PATH?

✓ Uses Blender, which you already know
✓ TouchDesigner is required for the live installation
✓ Avoids introducing Unity or Unreal
✓ Only one new technique needs focused learning
✓ Fits your available time
```

Then:

```text
4 OTHER PATHS CONSIDERED
```

---

# 33. Top-5 Path UI

Do not make the comparison the first thing users see.

Recommended path first.

Alternatives collapsed under:

```text
See other paths considered
```

Example:

```text
#1 Blender + TouchDesigner + DaVinci
92/100
Recommended

#2 Blender + Python/OpenCV + TouchDesigner
84/100

#3 Blender + Unity
73/100

#4 Unreal Engine
61/100

#5 Maya + TouchDesigner
58/100
```

Show reasons, not only scores.

---

# 34. "Why This Path?" Evidence

Every major decision should answer:

```text
Why this software?
Why this technique?
Why this method?
Why this resource?
Why this order?
Why not the alternative?
What did QUANDA skip?
```

If QUANDA cannot explain a major choice, it should not confidently present it as optimal.

---

# 35. Deadline and Capacity

Compute actual user capacity deterministically.

Example:

```text
7 days
×
2 hours/day
=
14 hours available
```

Compare against:

```text
human execution
+
learning time
+
setup / switching overhead
```

If estimated work exceeds capacity:

```text
This path is unlikely to fit your available time.
```

Then identify:

```text
optional polish
scope reduction
lower-cost technique
shorter viable resource
delegatable work
```

Never silently remove mandatory requirements.

---

# 36. Production Orientation

Do not build stages like:

```text
Learn Blender
Learn After Effects
```

Build:

```text
Create base model
Build chrome material
Animate camera
Composite title
Export deliverable
```

Learning or agent delegation is embedded inside the production task that needs it.

---

# 37. Cross-App Handoffs

Represent explicit handoffs.

Example:

```text
Illustrator
→ export SVG

Blender
→ import / extrude / render

After Effects
→ composite

DaVinci
→ final edit / export
```

Include handoff requirements when useful:

- file format
- color space
- resolution
- alpha/transparency
- codec
- naming
- export settings

---

# 38. Agentic Coding Support

Agentic coding is an execution method, not the entire identity of QUANDA.

Example:

```text
Task:
Scaffold Three.js project

Method:
Delegate to coding agent

Agent:
Codex / compatible coding agent

QUANDA provides:
- task scope
- ready-to-use instruction
- validation checklist

Human role:
Review generated project and verify behavior
```

Do not assume every project should use an agent.

---

# 39. Ready-to-Use Agent Instructions

When agent delegation wins, QUANDA may provide:

```text
Copy prompt
```

Prompt should contain:

- exact task
- repo/project context
- constraints
- files likely involved
- definition of done
- do-not-change boundaries
- validation requirements

Do not ask the user to invent the agent prompt from scratch.

---

# 40. Evidence Sources

For live/external recommendations, preserve evidence such as:

- official software documentation
- API docs
- resource metadata
- provider
- verified date
- tutorial duration
- software version
- repository/source identity

Do not expose internal chain-of-thought.

"Proof" means observable evidence and deterministic scoring reasons.

---

# 41. Bilingual Requirement

V2 must support:

```text
English
Vietnamese
```

User-facing UI should be bilingual.

Generated path content should follow interface language where practical.

Canonical ontology IDs should remain language-independent.

Unknown user wording should be preserved in its original language.

---

# 42. Mobile / Responsive Requirement

The result must remain understandable on mobile.

Avoid enormous walls of text.

Use:

- concise cards
- progressive disclosure
- expandable evidence
- collapsed alternative paths
- clear primary path
- one primary CTA at a time

---

# 43. Accessibility

At minimum:

- semantic headings
- keyboard-accessible controls
- visible focus
- buttons have labels
- status not conveyed only by color
- loading/error messages accessible
- alternative-path comparison usable without hover

---

# 44. MVP Non-Goals

Do not build yet:

- accounts
- social/community features
- collaboration
- giant ontology editor
- autonomous long-running agents
- paid vector infrastructure
- full project-file understanding
- background monitoring
- automatic code execution by QUANDA itself
- arbitrary browser automation
- all possible creative disciplines perfectly
- mathematically guaranteed global optimum

---

# 45. Benchmark Suite

V2 should have a benchmark comparing QUANDA against the intended product behavior.

## Case 1 — Blender familiarity

> I need a cel-shaded product animation. I already know Blender modelling, materials, lighting and keyframes. I have never used Maya or 3ds Max. There is no required software.

Expected:

- Blender should strongly win
- no unnecessary Maya/3ds Max learning
- explain why Blender wins

## Case 2 — Geometry Nodes

> I know Blender modelling but not Geometry Nodes. I want a hand-painted solarpunk environment with procedural vegetation.

Expected:

- Blender / Geometry Nodes is a strong candidate
- do not recommend generic Blender beginner course
- compare against Houdini/other routes only when viable
- show learning overhead difference

## Case 3 — TouchDesigner

> TouchDesigner is mandatory. I know TOPs, CHOPs and parameter references. I need webcam hand tracking to control flower growth in a projected installation.

Expected:

- TouchDesigner must remain the primary runtime app
- hand tracking resolves to TouchDesigner
- no unrelated Unity/Unreal route should outrank it
- resource search should be TouchDesigner-specific

## Case 4 — Creative coding

> I know Illustrator but have never coded. I want a Bauhaus poster where shapes react to music.

Expected:

- choose a concrete coding environment
- consider p5.js / similar viable routes
- avoid irrelevant web-stack complexity
- consider delegation to coding agent where useful
- human art direction remains explicit

## Case 5 — Existing app preference

> I know Blender. I need a short 3D animation. Do not make me learn another 3D package unless absolutely necessary.

Expected:

- Blender strongly preferred
- switching requires proof

## Case 6 — Impossible deadline

> Project needs around 12 hours of work, but I only have 4 hours available.

Expected:

- feasibility warning
- optional scope reduction
- preserve mandatory requirements

## Case 7 — Vietnamese

> Tôi đã biết cơ bản Blender và modelling. Tôi cần làm animation sản phẩm phong cách Y2K với vật liệu chrome và camera fisheye.

Expected:

- sensible Vietnamese output
- definitive apps
- no beginner modelling repetition
- evidence remains understandable

## Case 8 — Agentic coding

> I need to build an interactive Three.js portfolio. I know basic HTML/CSS but very little JavaScript. I have Codex available and 3 days.

Expected:

- delegate scaffolding/implementation where efficient
- user handles visual decisions/review
- docs/tutorial used only where understanding is needed
- ready-to-use coding-agent instructions
- deployment path

---

# 46. Evaluation Metrics

Measure V2 against the same project solved through normal AI search.

## Cognitive-load metrics

- number of required user decisions
- number of required follow-up prompts
- number of mandatory screens
- time to first useful action

## Search-friction metrics

- number of external searches needed
- number of resources the user must manually compare
- number of tool decisions left unresolved

## Path-quality metrics

- explicit requirement satisfaction
- technique → software resolution rate
- unnecessary software-switch rate
- known-skill repetition rate
- unnecessary learning time
- deadline feasibility
- required task coverage

## Evidence metrics

- percentage of major decisions with a reason
- percentage of selected tools with alternatives considered
- percentage of resource recommendations with valid source metadata
- rejected-path explanation coverage

## User-facing metrics

- confidence in chosen path
- perceived clarity
- perceived effort saved
- "I know what to do next" rating

---

# 47. Success Criteria for V2 MVP

A good MVP should be able to demonstrate:

1. User enters one project brief.
2. QUANDA understands the destination and constraints.
3. Required techniques resolve into concrete software.
4. User familiarity affects tool selection.
5. QUANDA produces multiple viable paths.
6. Paths are scored deterministically.
7. One path is clearly recommended.
8. Alternatives are visible.
9. QUANDA explains why the winner beat the alternatives.
10. The winning path contains executable production tasks.
11. Each task has a definite app or is explicitly software-agnostic.
12. Each task has an execution method.
13. Resources are only introduced when appropriate.
14. YouTube is not automatically the primary resource.
15. Agent delegation can be used where useful.
16. Known skills are skipped.
17. Deadline feasibility is checked.
18. EN and VI work.
19. User can reach the recommended path with low cognitive load.
20. The app deploys cleanly on Vercel.
21. Optional visual references produce an editable design-principles profile.
22. Unapproved visual analysis cannot affect deterministic ranking or execution prompts.
23. The original text-only workflow remains usable when visual analysis is skipped or unavailable.

---

# 48. Suggested Starter Repository Structure

```text
QUANDA-DMS4-v2/
│
├── knowledge/
│   ├── quanda.skills
│   ├── software-capabilities.json
│   └── resources.json
│
├── evals/
│   ├── briefs.v1.json
│   └── README.md
│
├── src/
│   ├── ontology/
│   ├── project-analysis/
│   ├── capabilities/
│   ├── resources/
│   ├── solver/
│   ├── scheduling/
│   ├── components/
│   └── i18n/
│
├── scripts/
│   └── compile-ontology.*
│
├── QUANDA_V2_SPEC.md
└── package.json
```

Adapt to the actual chosen framework.

---

# 49. Suggested Technical Stack

Prefer a simple stack compatible with Vercel.

Recommended:

```text
TypeScript
React / Next.js or current Vercel-friendly equivalent
Gemini Flash / Flash-Lite
Zod or equivalent runtime validation
Local JSON ontology/capability/resource data
Server-side Gemini calls
Deterministic TypeScript solver
```

Avoid a database unless required for the MVP.

Use localStorage for anonymous draft persistence if appropriate.

---

# 50. Environment Variables

Use server-only variables.

Conceptually:

```text
GEMINI_API_KEY=
GEMINI_MODEL=
YOUTUBE_API_KEY=
```

Add optional Google Search / grounding configuration according to current Gemini API requirements.

Never expose keys to the browser.

---

# 51. Failure Behavior

QUANDA should degrade gracefully.

If Gemini fails:

- preserve explicit user requirements
- use deterministic ontology/tool matching where possible
- do not fabricate detailed analysis

If web search fails:

- use local curated resources
- use local software-capability knowledge
- clearly mark lower confidence

If no resource exists:

```text
No suitable verified resource found
```

is valid.

Never fabricate URLs.

---

# 52. Versioning

Version important deterministic systems:

```text
ontologySchemaVersion
capabilitySchemaVersion
resourceSchemaVersion
solverVersion
scoringVersion
benchmarkVersion
```

This makes path comparisons reproducible.

---

# 53. Development Diagnostics

Development mode should expose:

```text
Parsed project requirements
Detected user capabilities
Resolved techniques
Software candidates
Candidate execution methods
Candidate paths
Score breakdown
Rejected paths
Resource sources
Deadline calculations
```

Do not expose secrets.

This debug view is important for proving that QUANDA is actually solving rather than generating plausible prose.

---

# 54. Explainability Rule

User-facing explanation should come from structured evidence.

Bad:

> Blender is the best choice because it is powerful and popular.

Good:

> Blender is recommended because you already know it, it supports every required 3D technique in this project, and switching to Maya would add new-software learning without providing a required capability advantage.

---

# 55. UX Writing Principle

QUANDA should sound decisive but not falsely certain.

Prefer:

```text
Recommended
Best-fit
Most efficient viable option found
Considered alternatives
Requires confirmation
```

Avoid:

```text
Guaranteed best
Perfect path
Only correct solution
```

---

# 56. Build Strategy

Do not recreate the old multi-PR architecture blindly.

Build V2 around the solver.

Recommended implementation order:

```text
1. Core data contracts
2. quanda.skills compiler
3. software capability seed
4. project analysis
5. candidate path generation
6. deterministic solver/scoring
7. proof / alternatives UI
8. resource routing
9. deadline scheduling
10. benchmark/evaluation
11. polish EN/VI + responsive UX
```

---

# 57. First Functional Milestone

The first version does not need live web search.

It should be able to solve a small curated set of benchmark projects using:

```text
quanda.skills
+
software-capabilities.json
+
resources.json
+
Gemini Flash
+
local solver
```

Once path selection works reliably, add live external resource discovery.

This prevents the MVP from becoming dependent on unreliable search behavior before the core solver works.

---

# 58. V1 Reuse Policy

Reuse from V1 only when it supports V2 directly.

Good candidates:

- `quanda.skills`
- ontology compiler ideas
- Creative DNA concepts
- EN/VI infrastructure
- deadline calculations
- curated resources
- evaluation briefs
- branding assets
- useful UI components

Do not inherit:

- tutorial-first architecture
- software-first roadmap logic
- mandatory tutorial review
- old PR6 assumptions
- giant multi-step approval flow

V1 remains available as research/history and should not be overwritten.

---

# 59. Codex Instruction

When implementing V2:

1. Read this entire file first.
2. Inspect supplied `quanda.skills`.
3. Inspect any supplied resource and benchmark files.
4. Do not assume V1 architecture.
5. Keep the first implementation narrow.
6. Prioritize working solver behavior over visual polish.
7. Keep AI calls bounded and free-tier conscious.
8. Make scoring deterministic and inspectable.
9. Never invent URLs or ontology IDs.
10. Do not claim global optimality.
11. Preserve user requirements as hard constraints.
12. Resolve actionable techniques to definite software.
13. Show alternative paths and why they lost.
14. Keep user cognitive load low.
15. Stop and report if a required dependency or credential is unavailable rather than silently substituting a different architecture.

---

# 60. Final Product Test

A successful QUANDA V2 session should leave the user able to answer:

```text
What do I do first?
Which app do I use?
Why this app?
What can I delegate?
What do I actually need to learn?
What can I skip?
What resources should I use?
What other paths were considered?
Why did this path win?
Will it fit my deadline?
```

If QUANDA cannot answer these clearly, the pipeline is not solved yet.

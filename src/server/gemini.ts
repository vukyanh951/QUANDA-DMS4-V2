import 'server-only';
import { GoogleGenAI } from '@google/genai';
import type { ProjectInput } from '@/src/solver/types';
import {
  ProjectAnalysisJsonSchema,
  parseProjectAnalysisJson,
  type ProjectAnalysis,
} from '@/src/project-analysis/schema';
import {
  parseVisualReferenceAnalysisJson,
  VisualReferenceAnalysisJsonSchema,
  type VisualStyleProfile,
} from '@/src/visual-analysis/schema';
import { getGeminiServerEnvironment } from './env';

const GEMINI_TIMEOUT_MS = 12_000;
const VISUAL_ANALYSIS_TIMEOUT_MS = 20_000;

const systemInstruction = `You interpret messy creative-project briefs for QUANDA.
Return only the requested structured project facts. Separate explicit user facts from reasonable interpretation. mandatoryRequirements and forbiddenConstraints may only restate constraints explicitly supplied by the user; never infer new hard constraints.

You may identify plain-language capabilities, techniques, aesthetics, deliverables, and uncertainties.
You must never choose or recommend a winning software path, calculate a score, weaken an explicit constraint, invent ontology IDs, invent resources, invent URLs, or claim that a path is optimal.
If terminology is unclear, place it in unknownTerminology. Keep lists concise. Do not request web search and do not use tools.`;

export async function analyzeProjectWithGemini(input: ProjectInput): Promise<ProjectAnalysis> {
  const { GEMINI_API_KEY, GEMINI_MODEL } = getGeminiServerEnvironment();
  const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: JSON.stringify({
      brief: input.brief,
      deadline: input.deadline,
      hoursPerDay: input.hoursPerDay,
      userReportedSkills: input.skills,
      explicitConstraints: input.constraints,
      approvedVisualStyleProfile: input.visualStyleProfile ?? null,
      language: input.language,
    }),
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseJsonSchema: ProjectAnalysisJsonSchema,
      temperature: 0.1,
      maxOutputTokens: 2_048,
      httpOptions: { timeout: GEMINI_TIMEOUT_MS },
    },
  });

  if (!response.text) throw new Error('Gemini returned no project analysis.');
  return parseProjectAnalysisJson(response.text);
}

export interface VisualReferenceInput {
  name: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  data: string;
}

const visualSystemInstruction = `You analyze user-supplied visual references for QUANDA.
Describe observable design evidence and translate it into an editable visual-style profile. Analyze composition, hierarchy, spacing, rhythm, color, contrast, typography, shapes, texture, material, lighting, depth, and motion or interaction cues that the still references reasonably imply.

Separate observation from application: evidence must say what is visibly present; application must describe how the principle could guide the user's project. Do not identify artists, copyrighted works, brands, or exact typefaces unless unmistakably supplied as text. Do not imitate a living artist. Do not recommend a winning software path, invent project requirements, claim certainty about unseen motion, or use web search. Use cautious language when references conflict or evidence is weak. Return only the requested JSON.`;

export async function analyzeVisualReferencesWithGemini(
  references: VisualReferenceInput[],
  projectBrief: string,
  language: 'en' | 'vi',
): Promise<VisualStyleProfile> {
  const { GEMINI_API_KEY, GEMINI_MODEL } = getGeminiServerEnvironment();
  const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{
      role: 'user',
      parts: [
        ...references.map((reference) => ({
          inlineData: { mimeType: reference.mimeType, data: reference.data },
        })),
        {
          text: JSON.stringify({
            task: 'Analyze these references as one moodboard and produce a reusable visual-style profile.',
            projectBrief,
            responseLanguage: language,
            sourceFileNames: references.map((reference) => reference.name),
          }),
        },
      ],
    }],
    config: {
      systemInstruction: visualSystemInstruction,
      responseMimeType: 'application/json',
      responseJsonSchema: VisualReferenceAnalysisJsonSchema,
      temperature: 0.15,
      maxOutputTokens: 4_096,
      httpOptions: { timeout: VISUAL_ANALYSIS_TIMEOUT_MS },
    },
  });

  if (!response.text) throw new Error('Gemini returned no visual analysis.');
  return parseVisualReferenceAnalysisJson(response.text);
}

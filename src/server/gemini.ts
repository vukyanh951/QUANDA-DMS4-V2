import 'server-only';
import { GoogleGenAI } from '@google/genai';
import type { ProjectInput } from '@/src/solver/types';
import {
  ProjectAnalysisJsonSchema,
  parseProjectAnalysisJson,
  type ProjectAnalysis,
} from '@/src/project-analysis/schema';
import { getGeminiServerEnvironment } from './env';

const GEMINI_TIMEOUT_MS = 12_000;

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

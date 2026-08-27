import { NextResponse } from 'next/server';
import { runProjectAnalysis } from '@/src/project-analysis/analyze';
import { ProjectInputSchema, type AnalyzeProjectResponse } from '@/src/project-analysis/schema';
import { analyzeProjectWithGemini } from '@/src/server/gemini';
import { solveProject } from '@/src/solver/solve';
import { groundVisualStyleProfile } from '@/src/visual-analysis/vocabulary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }

  const parsedInput = ProjectInputSchema.safeParse(payload);
  if (!parsedInput.success) {
    return NextResponse.json({ error: 'Invalid project input.' }, { status: 400 });
  }

  const input = parsedInput.data.visualStyleProfile ? {
    ...parsedInput.data,
    visualStyleProfile: groundVisualStyleProfile(parsedInput.data.visualStyleProfile),
  } : parsedInput.data;
  const outcome = await runProjectAnalysis(input, analyzeProjectWithGemini);
  const solution = solveProject(input, outcome);
  const response: AnalyzeProjectResponse = { ...outcome, solution };
  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

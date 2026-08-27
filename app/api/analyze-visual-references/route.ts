import { NextResponse } from 'next/server';
import { analyzeVisualReferencesWithGemini, type VisualReferenceInput } from '@/src/server/gemini';
import { VisualReferenceAnalysisSchema } from '@/src/visual-analysis/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set<VisualReferenceInput['mimeType']>([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const MAX_FILES = 4;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 16 * 1024 * 1024;

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid visual-reference request.' }, { status: 400 });
  }

  const projectBrief = String(formData.get('brief') ?? '').trim().slice(0, 5_000);
  const language = formData.get('language') === 'vi' ? 'vi' : 'en';
  const files = formData.getAll('references').filter((entry): entry is File => entry instanceof File);

  if (files.length < 1 || files.length > MAX_FILES) {
    return NextResponse.json({ error: `Attach between 1 and ${MAX_FILES} reference images.` }, { status: 400 });
  }
  if (files.some((file) => !ALLOWED_TYPES.has(file.type as VisualReferenceInput['mimeType']))) {
    return NextResponse.json({ error: 'Only JPEG, PNG, and WebP reference images are supported.' }, { status: 415 });
  }
  if (files.some((file) => file.size < 1 || file.size > MAX_FILE_BYTES)) {
    return NextResponse.json({ error: 'Each reference image must be 8 MB or smaller.' }, { status: 413 });
  }
  if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_BYTES) {
    return NextResponse.json({ error: 'The reference set must be 16 MB or smaller.' }, { status: 413 });
  }

  try {
    const references = await Promise.all(files.map(async (file): Promise<VisualReferenceInput> => ({
      name: file.name.slice(0, 180),
      mimeType: file.type as VisualReferenceInput['mimeType'],
      data: Buffer.from(await file.arrayBuffer()).toString('base64'),
    })));
    const profile = await analyzeVisualReferencesWithGemini(references, projectBrief, language);
    const analysis = VisualReferenceAnalysisSchema.parse({
      ...profile,
      sourceFileNames: references.map((reference) => reference.name),
      analysisVersion: 'visual-style-1.0.0',
    });
    return NextResponse.json(analysis, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json({
      error: language === 'vi'
        ? 'Không thể phân tích hình tham khảo. Hãy thử lại hoặc tiếp tục không dùng moodboard.'
        : 'The references could not be analyzed. Try again or continue without a moodboard.',
    }, { status: 502 });
  }
}

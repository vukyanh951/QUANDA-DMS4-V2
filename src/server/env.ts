import 'server-only';
import { z } from 'zod';

const geminiEnvironmentSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1),
});

export type GeminiServerEnvironment = z.infer<typeof geminiEnvironmentSchema>;

/**
 * Read Gemini configuration only from server code and only when the future
 * Gemini integration is invoked. The current deterministic MVP does not need
 * these variables during build or at runtime.
 */
export function getGeminiServerEnvironment(): GeminiServerEnvironment {
  return geminiEnvironmentSchema.parse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
  });
}

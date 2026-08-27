import catalogData from '@/knowledge/ai-models.compiled.json';
import { AIModelCatalogSchema, type AIModelRecord } from './schema';

export const aiModelCatalog = AIModelCatalogSchema.parse(catalogData);

const modelById = new Map(aiModelCatalog.models.map((model) => [model.id, model]));

export function getAIModel(id: string): AIModelRecord | undefined {
  return modelById.get(id);
}

export function getAIModelsByCapability(capability: string): AIModelRecord[] {
  return (aiModelCatalog.capabilityIndex[capability] ?? [])
    .map((id) => modelById.get(id))
    .filter((model): model is AIModelRecord => Boolean(model));
}

export function getAIModelsForExecutionMethod(method: string): AIModelRecord[] {
  const key = method.replaceAll('_', '-');
  return (aiModelCatalog.executionMethodIndex[key] ?? [])
    .map((id) => modelById.get(id))
    .filter((model): model is AIModelRecord => Boolean(model));
}

import relationshipData from '@/knowledge/knowledge-relationships.json';
import type { Language } from './types';

export type KnowledgeRelationType='requires'|'produces'|'consumes'|'enables'|'conflicts-with'|'alternative-to'|'validated-by';
export interface KnowledgeRelationship {
  id:string;
  sourceId:string;
  relationType:KnowledgeRelationType;
  targetId:string;
  contexts:string[];
  weight:number;
  rationale:Record<Language,string>;
}

const relationships=relationshipData.relationships as KnowledgeRelationship[];

export function validateKnowledgeRelationships(knownTechniqueIds:string[]):string[]{
  const errors:string[]=[];
  const known=new Set(knownTechniqueIds);
  const seen=new Set<string>();
  for(const edge of relationships){
    if(seen.has(edge.id))errors.push(`Duplicate relationship ${edge.id}`);
    seen.add(edge.id);
    if(edge.weight<=0||edge.weight>1)errors.push(`Invalid relationship weight ${edge.id}`);
    if(!known.has(edge.sourceId)&&!edge.sourceId.startsWith('software.'))errors.push(`Unknown relationship source ${edge.sourceId}`);
    if(!known.has(edge.targetId)&&!edge.targetId.startsWith('artifact.')&&!edge.targetId.startsWith('constraint.')&&!edge.targetId.startsWith('software.'))errors.push(`Unknown relationship target ${edge.targetId}`);
  }
  return errors;
}

export function relevantRelationships(techniqueIds:string[],context:string):KnowledgeRelationship[]{
  const selected=new Set(techniqueIds);
  return relationships.filter((edge)=>
    (edge.contexts.length===0||edge.contexts.includes(context))&&
    (selected.has(edge.sourceId)||selected.has(edge.targetId))&&
    (selected.has(edge.sourceId)||edge.sourceId.startsWith('software.'))&&
    (selected.has(edge.targetId)||edge.targetId.startsWith('artifact.')||edge.targetId.startsWith('constraint.')||edge.targetId.startsWith('software.')),
  );
}

export function orderTechniquesByRelationships(techniqueIds:string[],context:string):string[]{
  const ordered=[...new Set(techniqueIds)];
  const selected=new Set(ordered);
  const position=new Map(ordered.map((id,index)=>[id,index]));
  const before=new Map<string,Set<string>>(ordered.map((id)=>[id,new Set<string>()]));
  for(const edge of relevantRelationships(ordered,context)){
    if(!selected.has(edge.sourceId)||!selected.has(edge.targetId))continue;
    if(edge.relationType==='requires')before.get(edge.sourceId)?.add(edge.targetId);
    if(edge.relationType==='enables')before.get(edge.targetId)?.add(edge.sourceId);
  }
  const result:string[]=[];
  const remaining=new Set(ordered);
  while(remaining.size){
    const ready=[...remaining].filter((id)=>[...(before.get(id)??[])].every((dependency)=>!remaining.has(dependency)))
      .sort((left,right)=>(position.get(left)??0)-(position.get(right)??0));
    const next=ready[0]??[...remaining].sort((left,right)=>(position.get(left)??0)-(position.get(right)??0))[0];
    result.push(next);
    remaining.delete(next);
  }
  return result;
}

export function relationshipNotes(techniqueId:string,techniqueIds:string[],context:string,language:Language):string[]{
  const selected=new Set(techniqueIds);
  return relevantRelationships(techniqueIds,context)
    .filter((edge)=>edge.sourceId===techniqueId||edge.targetId===techniqueId)
    .filter((edge)=>selected.has(edge.sourceId)||selected.has(edge.targetId))
    .map((edge)=>edge.rationale[language]);
}

export function reasoningChainForStrategy(args:{projectKind:string;strategyId:string;softwareIds:string[];techniqueIds:string[];knownSoftwareIds:string[];requiredSoftwareIds:string[];language:Language}):string[]{
  const {projectKind,strategyId,softwareIds,techniqueIds,knownSoftwareIds,requiredSoftwareIds,language}=args;
  const tr=(en:string,vi:string)=>language==='vi'?vi:en;
  const edges=relevantRelationships(techniqueIds,projectKind);
  const chain=[tr(`Project type “${projectKind}” activated curated strategy “${strategyId}”.`,`Loại dự án “${projectKind}” kích hoạt chiến lược “${strategyId}” đã tuyển chọn.`)];
  const connected=edges.filter((edge)=>['requires','enables','produces','consumes','validated-by'].includes(edge.relationType)).slice(0,4);
  chain.push(...connected.map((edge)=>`${edge.relationType}: ${edge.rationale[language]}`));
  if(requiredSoftwareIds.length)chain.push(tr(`Hard requirement preserved: ${requiredSoftwareIds.join(', ')}.`,`Giữ yêu cầu bắt buộc: ${requiredSoftwareIds.join(', ')}.`));
  const reused=softwareIds.filter((id)=>knownSoftwareIds.includes(id));
  if(reused.length)chain.push(tr(`Familiar software reused: ${reused.join(', ')}.`,`Tái sử dụng phần mềm quen thuộc: ${reused.join(', ')}.`));
  chain.push(tr(`Execution chain: ${softwareIds.join(' → ')||'software selection deferred until the brief is clarified'}.`,`Chuỗi thực hiện: ${softwareIds.join(' → ')||'hoãn chọn phần mềm đến khi brief được làm rõ'}.`));
  return chain;
}

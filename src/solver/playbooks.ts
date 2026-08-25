import playbookData from '@/knowledge/technique-playbooks.json';
import type { Language } from './types';

type LocalizedText = Record<Language,string>;
type LocalizedList = Record<Language,string[]>;

export interface TechniquePlan {
  techniqueId:string;
  label:string;
  method:string;
  artifacts:string[];
  implementationSteps:string[];
  acceptanceChecks:string[];
  failureModes:string[];
}

const unique=<T,>(values:T[])=>[...new Set(values)];
const text=(value:LocalizedText,language:Language)=>value[language];
const list=(value:LocalizedList,language:Language)=>value[language];

export const playbookAliases:Record<string,string[]>=Object.fromEntries(
  playbookData.playbooks.map((playbook)=>[playbook.techniqueId,playbook.aliases]),
);

export function resolveTechniquePlans(techniqueIds:string[],softwareId:string|null,language:Language):TechniquePlan[]{
  return unique(techniqueIds).flatMap((techniqueId)=>{
    const playbook=playbookData.playbooks.find((candidate)=>candidate.techniqueId===techniqueId);
    if(!playbook)return[];
    const softwareMethod=playbook.softwareMethods.find((candidate)=>softwareId&&candidate.softwareIds.includes(softwareId))??playbook.softwareMethods[0];
    return[{techniqueId,label:text(playbook.label,language),method:text(softwareMethod.method,language),artifacts:list(playbook.artifacts,language),implementationSteps:list(playbook.implementationSteps,language),acceptanceChecks:list(playbook.acceptanceChecks,language),failureModes:list(playbook.failureModes,language)}];
  });
}

export function flattenTechniquePlans(plans:TechniquePlan[]){
  return{
    artifacts:unique(plans.flatMap((plan)=>plan.artifacts)),
    implementationSteps:unique(plans.flatMap((plan)=>plan.implementationSteps)),
    acceptanceChecks:unique(plans.flatMap((plan)=>plan.acceptanceChecks)),
    failureModes:unique(plans.flatMap((plan)=>plan.failureModes)),
  };
}

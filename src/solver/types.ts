import type { VisualStyleProfile } from '@/src/visual-analysis/schema';
import type { AIModelSelectionDecision } from '@/src/ai-models/schema';

export type Language = 'en' | 'vi';
export interface ProjectInput { brief:string; deadline:string; hoursPerDay:number; skills:string; constraints:string; language:Language; visualStyleProfile?:VisualStyleProfile }
export type ExecutionMethod = 'do_yourself'|'delegate_to_agent'|'read_documentation'|'follow_tutorial'|'use_example'|'human_review';
export interface AgentTechniquePlan { techniqueId:string; label:string; method:string; relationshipNotes:string[] }
export interface AgentDelegationSummary { approach:string[]; keyActions:string[]; outputs:string[]; checks:string[]; avoid:string[] }
export interface KnowledgeGrounding { source:'knowledge/quanda.skills'; status:'grounded'|'partial'; conceptIds:string[]; playbookIds:string[] }
export interface TaskArtifactGraph { inputs:string[]; outputs:string[]; consumedBy:string[]; acceptanceEvidence:string[] }
export interface AgentDelegationGuide { compatibleAgents:string[]; prompt:string; summary:AgentDelegationSummary; prerequisiteTaskIds:string[]; techniquePlan:AgentTechniquePlan[]; implementationSteps:string[]; contextChecklist:string[]; expectedOutputs:string[]; reviewChecklist:string[]; failureModes:string[]; artifactGraph:TaskArtifactGraph; aiModelDecision:AIModelSelectionDecision }
export interface PipelineTask { id:string; title:string; objective:string; responsibility:string; nonGoals:string[]; inputs:string[]; outputs:string[]; consumedBy:string[]; acceptanceEvidence:string[]; techniqueIds:string[]; knowledgeGrounding:KnowledgeGrounding; prerequisiteTaskIds:string[]; recommendedSoftwareId:string|null; softwareLabel:string; softwareAgnostic:boolean; method:ExecutionMethod; methodLabel:string; resourceIds:string[]; estimatedHumanMinutes:number; estimatedLearningMinutes:number; estimatedAgentMinutes:number; whyIncluded:string; definitionOfDone:string[]; agentDelegation:AgentDelegationGuide|null }
export interface ScoreBreakdown { requirements:number; familiarity:number; learningCost:number; executionCost:number; switchingCost:number; resourceQuality:number; deadlineFit:number; risk:number }
export interface CandidatePath { id:string; title:string; strategyLabel:string; softwareIds:string[]; softwareLabels:string[]; tasks:PipelineTask[]; reasoningChain:string[]; estimatedHumanMinutes:number; estimatedLearningMinutes:number; estimatedAgentMinutes:number; score:number; scoreBreakdown:ScoreBreakdown; strengths:string[]; weaknesses:string[]; viable:boolean; rejectionReasons:string[] }
export interface DetourDecision { id:string; title:string; summary:string; costAvoided:string; reconsiderWhen:string; evidence:string[] }
export interface Solution { destination:string; detectedKind:string; capacityMinutes:number; daysAvailable:number; requirements:string[]; knownSoftware:string[]; recommended:CandidatePath; alternatives:CandidatePath[]; rejected:CandidatePath[]; detours:DetourDecision[]; solverVersion:string; scoringVersion:string }

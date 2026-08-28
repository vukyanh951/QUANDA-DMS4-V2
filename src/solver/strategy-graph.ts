import strategyGraphData from '@/knowledge/strategy-graph.json';

export interface StrategyNode {
  id:string;
  projectKind:string;
  softwareIds:string[];
  humanMinutes:number;
  learningMinutes:number;
  agentMinutes:number;
  risk:number;
}

export function deriveCandidateStrategies(projectKind:string):StrategyNode[]{
  return strategyGraphData.strategies
    .filter((strategy)=>strategy.projectKind===projectKind)
    .map((strategy)=>({...strategy,softwareIds:[...strategy.softwareIds]}));
}

export function validateStrategyGraph():string[]{
  const errors:string[]=[];
  const keys=new Set<string>();
  for(const strategy of strategyGraphData.strategies){
    const key=`${strategy.projectKind}:${strategy.id}`;
    if(keys.has(key))errors.push(`Duplicate strategy ${key}`);
    keys.add(key);
    if(strategy.risk<0||strategy.risk>100)errors.push(`Invalid risk for ${key}`);
    if([strategy.humanMinutes,strategy.learningMinutes,strategy.agentMinutes].some((value)=>value<0))errors.push(`Negative effort for ${key}`);
  }
  return errors;
}

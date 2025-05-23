export interface MetaFile {
  checkForDsommUpdates: boolean;
  lang: string;
  strings: Record<string, MetaStrings>;
  progress: ProgressDefinition;
  teamGroups: TeamGroups;
  teams: TeamNames;
  activityFiles: string[];
  teamProgressFile: string;
}


export interface MetaStrings {
  labels: string[];
  maturityLevels: string[];
  hardness: string[];
  knowledgeLabels: string[];
}

export type TeamGroups = Record<string, TeamNames>;
export type TeamNames = string[];

export interface TeamProgressFile {
  progress: Progress;
}

export type ProgressDefinition = Record<ProgressState, Date>;
export type Progress = Record<Uuid, ActivityProgress>; 
export type ActivityProgress = Record<TeamName, TeamProgress>; 
export type TeamProgress = Record<ProgressState, Date>; 
type Uuid = string; 
type TeamName = string; 
type ProgressState = string; 


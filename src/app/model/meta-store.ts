import { ProgressDefinition, TeamNames, TeamGroups } from "./types";

export interface MetaStore {
  checkForDsommUpdates: boolean;
  lang: string;
  strings: Record<string, MetaStrings>;
  progressDefinition: ProgressDefinition;
  teamGroups: TeamGroups;
  teams: TeamNames;
  activityFiles: string[];
  teamProgressFile: string;
}


export interface MetaStrings {
  allTeamsGroupName: string;
  labels: string[];
  maturityLevels: string[];
  knowledgeLabels: string[];
}

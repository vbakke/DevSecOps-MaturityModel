export interface Meta {
  checkForDsommUpdates: boolean;
  lang: string;
  strings: Record<string, MetaStrings>;
  progress: Record<string, number>;
  $teams: string;
  $teamGroups: string;
  activityFiles: string[];
}

export interface MetaStrings {
  labels: string[];
  maturityLevels: string[];
  hardness: string[];
  knowledgeLabels: string[];
}

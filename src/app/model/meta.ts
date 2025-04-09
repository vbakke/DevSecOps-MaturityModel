export interface Meta {
  checkForDsommUpdates: boolean;
  lang: string;
  strings: Record<string, any>;
  progress: Record<string, number>;
  $teams: string;
  $teamGroups: string;
  activityFiles: string[];
}

import { Activity } from "src/app/model/activity-store";
import { ActivityProgress, Progress, ProgressDefinition, TeamNames, TeamProgress } from "src/app/model/meta";

export class SectorViewController {
    static _allProgress: Progress | null;
    static _progressValues: ProgressDefinition | null;
    static _progressStates: string[] | null;
    static _allTeams: TeamNames = [];
    static _visibleTeams: TeamNames = [];

    dimension: string;
    level: string;
    activities: Activity[];
    progressValue: number;
  
    static init(teamnames: TeamNames, progress: Progress, progressStates: ProgressDefinition) {
      this._allTeams = teamnames;
      this._allProgress = progress;
      this._progressValues = progressStates;
      this._progressStates = Object.keys(progressStates)
      .sort((a, b) => progressStates[b] - progressStates[a]);      
    }

    static getProgressStates() {
      return this._progressStates?.reverse() || [];
    }

    static setVisibleTeams(teams: TeamNames) {
      this._visibleTeams = teams;
    }
  
    constructor(dimension: string, level: string, activities: Activity[]) {
      this.dimension = dimension;
      this.level = level;
      this.activities = activities;
      this.progressValue = 0;
    }
  
    public recalculateProgress() {
      // this.progress = this.activities.reduce((acc, activity) => acc + activity.progress, 0) / this.activities.length;
      let progress = 0; 
    }
  
    // Calculate the progress of the sector, across all visible teams
    public getSectorProgress() {
      let teams: TeamNames = SectorViewController._visibleTeams.length === 0 
        ? SectorViewController._allTeams 
        : SectorViewController._visibleTeams;
      let progress: number = 0;
      for (const activity of this.activities) {
        progress += this.getActivityProgress(activity.uuid, teams);
      }
      return progress / this.activities.length;
    }

    // Calculate the progress of an activity, across all visible teams
    private getActivityProgress(uuid: string, teams: TeamNames): number {
      let activity: ActivityProgress = SectorViewController._allProgress?.[uuid] || {};
      let progress: number = 0;
      for (const team of teams) {
        progress += SectorViewController.getProgressValue(activity[team]);
      }
      return progress / teams.length;
    }

    // Calculate the progress value for a team progress state
    static getProgressValue(teamProgress: TeamProgress): number {
      if (!this._progressValues) return 0;
      if (!teamProgress) return 0;
  
      for (const state of SectorViewController._progressStates || []) {
        if (teamProgress[state] !== undefined) {
          return this._progressValues[state];
        }
      }
      return 0;
    }
  }
  
  
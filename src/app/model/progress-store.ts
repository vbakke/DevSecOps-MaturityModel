import { appendHashElement } from '../util/ArrayHash';
import { isEmptyObj } from '../util/util';
import { IgnoreList } from './ignore-list';
import { TeamProgress, Progress, TeamNames, ProgressDefinition } from './meta';

export class ProgressStore {
  private _progress: Progress = {};

  public init(teams: TeamNames, progressDefinition: ProgressDefinition) {
  }

  public getProgress(): Progress {
    return this._progress;
  }


  public addProgressData(progress: Progress) {
    // TODO: Merge second progress
    this._progress = progress;
  }
  public addTeamProgress(inProgress: Progress): void {
    console.log(inProgress);
    if (!inProgress) return;

    if (isEmptyObj(this._progress)) {
      this._progress = inProgress;
      return;
    }
    
    let orgProgress: Progress = this._progress;
    for (let activityUuid in inProgress) {
      if (isEmptyObj(orgProgress[activityUuid])) {
        orgProgress[activityUuid] = inProgress[activityUuid];
        continue;
      }
    
      for (let teamname in inProgress[activityUuid]) {
        if (isEmptyObj(orgProgress[activityUuid][teamname])) {
          orgProgress[activityUuid][teamname] = inProgress[activityUuid][teamname];
        } else {
          let inTeamProgress: TeamProgress = inProgress[activityUuid][teamname];
          let orgTeamProgress: TeamProgress = orgProgress[activityUuid][teamname];
  
          for (let key in inTeamProgress) {
            let orgDate: Date = orgTeamProgress[key];
            let inDate: Date = inTeamProgress[key];
            
            if (this.isOutdated(orgDate, inDate)) {
              orgTeamProgress[key] = inTeamProgress[key];
            }
          }
        }
      }
    }
  }

  private isOutdated(orgDate: Date, inDate: Date): boolean {
    if (!inDate) return false;
    if (!orgDate) return true
    
    return inDate.getTime() < orgDate.getTime();
  }


  public getTeamActivityProgressState(activityUuid: string, teamName: string): string {
    // Return the key with the most largest value
    let teamProgress: TeamProgress = this._progress?.[activityUuid]?.[teamName];
    if (!teamProgress) return '';

    let newestProgressState: string = '';
    let maxDate: Date = new Date(0);
    for (let key in teamProgress) {
      if (teamProgress[key].getTime() > maxDate.getTime()) {
        maxDate = teamProgress[key];
        newestProgressState = key;
      } 
    }
    return newestProgressState;
  }

  public getTeamProgressState(activityUuid: string, teamName: string): string {
    // Return the key with the most largest value
    let teamProgress: TeamProgress = this._progress?.[activityUuid]?.[teamName];
    if (!teamProgress) return '';

    let newestProgressState: string = '';
    let maxDate: Date = new Date(0);
    for (let key in teamProgress) {
      if (teamProgress[key].getTime() > maxDate.getTime()) {
        maxDate = teamProgress[key];
        newestProgressState = key;
      } 
    }
    return newestProgressState;
  }



}


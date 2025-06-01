import { appendHashElement } from '../util/ArrayHash';
import { isEmptyObj } from '../util/util';
import { IgnoreList } from './ignore-list';
import { TeamProgress, Progress, TeamNames, ProgressDefinition, Uuid, TeamName, ProgressTitle } from './meta';

export class ProgressStore {
  private _progress: Progress = {};
  private _tempProgress: Progress = {};
  private _progressDefinition: ProgressDefinition | null = null;
  private _progressTitles: ProgressTitle[] | null = null;
  private _progressTitlesDescOrder: ProgressTitle[] | null = null;

  public init(teams: TeamNames, progressDefinition: ProgressDefinition) {
    // Sort the progress titles, from most completed, to not started
    this._progressDefinition = progressDefinition;
    this._progressTitles = Object.keys(progressDefinition)
            .sort((a, b) => progressDefinition[a] - progressDefinition[b]);
    this._progressTitlesDescOrder = this._progressTitles.slice().reverse();
  }

  public getProgress(): Progress {
    return this._progress;
  }


  public addProgressData(progress: Progress) {
    // TODO: Merge second progress
    this._progress = progress;
  }

  public addTeamProgress(newProgress: Progress): void {
    console.log(newProgress);
    if (!newProgress) return;

    if (isEmptyObj(this._progress)) {
      this._progress = newProgress;
      return;
    }
    
    let orgProgress: Progress = this._progress;
    for (let activityUuid in newProgress) {
      if (isEmptyObj(orgProgress[activityUuid])) {
        orgProgress[activityUuid] = newProgress[activityUuid];
        continue;
      }
    
      for (let teamname in newProgress[activityUuid]) {
        if (isEmptyObj(orgProgress[activityUuid][teamname])) {
          orgProgress[activityUuid][teamname] = newProgress[activityUuid][teamname];
        } else {
          let inTeamProgress: TeamProgress = newProgress[activityUuid][teamname];
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


  public getTeamActivityProgressState_WHY(activityUuid: string, teamName: string): ProgressTitle {
    // Return the progressTitle with the most recent date
    let teamProgress: TeamProgress = this._progress?.[activityUuid]?.[teamName];
    if (!teamProgress) return '';

    let newestProgressTitle: ProgressTitle = '';
    let maxDate: Date = new Date(0);
    for (let key in teamProgress) {
      if (teamProgress[key].getTime() > maxDate.getTime()) {
        maxDate = teamProgress[key];
        newestProgressTitle = key;
      } 
    }
    return newestProgressTitle;
  }

  public getTeamProgress(activityUuid: Uuid, teamName: TeamName): TeamProgress {
    // Return the team progress for the given activity and team
    // if (!this._progress?.[activityUuid]) return {};
    // if (!this._progress[activityUuid][teamName]) return {};
    
    return this._progress?.[activityUuid]?.[teamName];
  }

  public getTeamProgressTitle(activityUuid: Uuid, teamName: TeamName): ProgressTitle {
    // Return the key with the most largest value
    let teamProgress: TeamProgress = this._progress?.[activityUuid]?.[teamName];
    if (isEmptyObj(teamProgress)) {
      return this._progressTitles?.[0] || '';
    }

    let newestProgressState: ProgressTitle = '';
    let maxDate: Date = new Date(0);
    for (let key in teamProgress) {
      if (teamProgress[key].getTime() > maxDate.getTime()) {
        maxDate = teamProgress[key];
        newestProgressState = key;
      } 
    }
    return newestProgressState;
  }

  public getTeamActivityProgressValue(activityUuid: Uuid, teamName: TeamName): number {
    let teamProgress: TeamProgress = this.getTeamProgress(activityUuid, teamName);
    return this.getProgressValue(teamProgress);
  }

  public getTeamActivityTitle(activityUuid: Uuid, teamName: TeamName): ProgressTitle {
    // Return the team activity title for the given activity and team
    let teamProgress: TeamProgress = this.getTeamProgress(activityUuid, teamName);
    for (const title of this._progressTitlesDescOrder || []) {
      if (teamProgress[title] !== undefined && this._progressDefinition) {
        return title;
      }
    }
    return '';
  }

  // Calculate the progress value for a team progress state
  private getProgressValue(teamProgress: TeamProgress): number {
      if (!this._progressTitlesDescOrder) return 0;
      if (!teamProgress) return 0;
  
      for (const progressTitle of this._progressTitlesDescOrder || []) {
        if (teamProgress[progressTitle] !== undefined && this._progressDefinition) {
          return this._progressDefinition[progressTitle];
        }
      }
      return 0;
    }

  public setTeamActivityProgressState(
    activityUuid: Uuid,
    teamName: TeamName,
    newProgress: ProgressTitle)
  {
    console.log(`Setting progress state for activity ${activityUuid} and team ${teamName} to ${newProgress}`);
    if (!this._progressTitles || !this._progressTitlesDescOrder) {
      throw Error('Progress states are not initialized');
    }

    if (!this._progress[activityUuid]) {
      this._progress[activityUuid] = {};
    }
    if (!this._progress[activityUuid][teamName]) {
      this._progress[activityUuid][teamName] = {};
    }

    // let teamProgress: TeamProgress = this._progress[activityUuid][teamName];
    let orgProgress: ProgressTitle = this.getTeamProgressTitle(activityUuid, teamName);
    let orgIndex: number = this._progressTitles.indexOf(orgProgress);
    let newIndex: number = this._progressTitles.indexOf(newProgress);

    if (newIndex < orgIndex) {
      this.temporarilyStoreTeamActivity(activityUuid, teamName, newIndex + 1, orgIndex);
    } else if (newIndex > orgIndex) {
      this.restoreTemporaryTeamActivity(activityUuid, teamName, orgIndex + 1, newIndex);
    }
  }

  private temporarilyStoreTeamActivity(
    activityUuid: Uuid,
    teamName: TeamName,
    startIndex: number,
    endIndex: number)
  {
    if (!this._progressTitles) {
      throw Error('Progress states are not initialized');
    }

    if (!this._tempProgress[activityUuid]) {
      this._tempProgress[activityUuid] = {};
    }
    if (!this._tempProgress[activityUuid][teamName]) {
      this._tempProgress[activityUuid][teamName] = {};
    }

    // Loop through the progress states in the specified range
    for (let i = startIndex; i <= endIndex; i++) {
      let progressTitle: ProgressTitle = this._progressTitles[i];
      if (this._tempProgress[activityUuid][teamName][progressTitle]) {
        console.warn(`Progress state ${progressTitle} already exists for activity ${activityUuid} and team ${teamName}`);
      }
      // Store the current progress state in the temporary store
      console.log(`Backup ${teamName}: ${progressTitle}: ${this._progress[activityUuid][teamName][progressTitle]}`);
      this._tempProgress[activityUuid][teamName][progressTitle] = this._progress[activityUuid][teamName][progressTitle];
      delete this._progress[activityUuid][teamName][progressTitle];
    }
    console.log(`Temporary store: `, this._tempProgress);
  }

  private restoreTemporaryTeamActivity(
    activityUuid: Uuid,
    teamName: TeamName,
    startIndex: number,
    endIndex: number)
  {
    if (!this._progressTitles) {
      throw Error('Progress states are not initialized');
    }

    if (!this._progress[activityUuid]) {
      throw Error(`Temporary progress for activity ${activityUuid} does not exist`);
    }
    if (!this._progress[activityUuid][teamName]) {
      throw Error(`Temporary progress for team ${teamName} does not exist`);
    }

    // Create dateonly object, for today, in UTC timezone
    let prevDate = new Date();
    prevDate = new Date(Date.UTC(prevDate.getUTCFullYear(), prevDate.getUTCMonth(), prevDate.getUTCDate()));

    for (let i = endIndex; i >= startIndex; i--) {
      let progressTitle: ProgressTitle = this._progressTitles[i];
      if (this._tempProgress?.[activityUuid]?.[teamName]?.[progressTitle]) {
        // Move the progress date from temp to progress, and update the `prevDate
        prevDate = this._tempProgress[activityUuid][teamName][progressTitle];
        this._progress[activityUuid][teamName][progressTitle] = prevDate;
        delete this._tempProgress[activityUuid][teamName][progressTitle];
        console.log(`Restore ${teamName}: ${progressTitle}: ${this._progress[activityUuid][teamName][progressTitle]}`);
    } else {
        // If temp title does not exist, use the date from the previous step
        console.log(`Set ${teamName}: ${progressTitle}: ${prevDate}`);
        this._progress[activityUuid][teamName][progressTitle] = prevDate;        
      }
    }
    console.log(`Restored ${teamName}. Temporary store: `, this._tempProgress);
  }
}


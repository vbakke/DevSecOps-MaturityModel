import { appendHashElement } from '../util/ArrayHash';
import { isEmptyObj } from '../util/util';
import { ActivityStore } from './activity-store';
import { IgnoreList } from './ignore-list';
import { TeamProgress, Progress, TeamNames, ProgressDefinition, MetaFile, MetaStrings } from './meta';
import { ProgressStore } from './progress-store';

export class DataStore {
  public meta: MetaFile | null = null;
  public activityStore: ActivityStore | null = null;
  public progressStore: ProgressStore | null = null;

  constructor() {
    this.activityStore = new ActivityStore();
    this.progressStore = new ProgressStore();
  }

  public clearCache() {
    // TODO: Clear what ever has been cached 
  }

  public addActivities(activities: ActivityStore): void {
    this.activityStore = activities;
  }
  public addTeamProgress(progress: Progress): void {
    this.progressStore?.addTeamProgress(progress);
  }

  public getMetaStrings(): MetaStrings {
    if (this.meta == null) {
      throw Error('Meta yaml has not yet been loaded successfully');
    }

    let lang: string = this.meta.lang || 'en';
    if (!this.meta.strings?.hasOwnProperty(lang)) {
      lang = Object(this.meta?.strings).keys()[0];
      this.meta.lang = lang;
    }
    return this.meta?.strings[lang];
  }

  public getMaxLevel(): number {
    return this.activityStore?.getMaxLevel() || 0;
  }

  public getLevels(): string[] {
    let maxLvl: number = this.getMaxLevel();
    return this.getMetaStrings().maturityLevels.slice(0, maxLvl);
  }


}



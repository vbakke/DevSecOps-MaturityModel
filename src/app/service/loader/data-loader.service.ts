import { Injectable } from '@angular/core';
import { perfNow } from 'src/app/util/util';
import { YamlService } from '../yaml-loader/yaml-loader.service';
import { MetaFile, MetaStrings, TeamProgressFile } from 'src/app/model/meta';
import { ActivityStore, Data } from 'src/app/model/activity-store';
import { ProgressStore } from 'src/app/model/progress-store';
import { DataStore } from 'src/app/model/data-store';

export class DataValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private META_FILE: string = '/assets/YAML/meta.yaml';
  private debug: boolean = true;
  // public meta: MetaFile | null = null;
  private dataStore: DataStore | null = null;
  // private cachedActivityStore: ActivityStore | null = null;
  // private cachedProgressStore: ProgressStore | null = null;

  constructor(private yamlService: YamlService) {}

  public async load(): Promise<DataStore> {
    // Return cached data if available
    if (this.dataStore) {
      return this.dataStore;
    }
    this.dataStore = new DataStore();

    try {
      if (this.debug) console.log(`${perfNow()}s: ----- Load Service Begin -----`);
      
      // Load meta.yaml first
      this.dataStore.meta = await this.loadMeta();
      console.warn('TODO: MOVE THIS TO DATASTORE...');
      this.dataStore.progressStore?.init(this.dataStore.meta.teams, this.dataStore.meta.progressDefinition);
      
      // Then load activities
      this.dataStore.addActivities(await this.loadActivities(this.dataStore.meta));

      // Load the progress for each team's activities
      let teamProgress: TeamProgressFile = await this.loadTeamProgress(this.dataStore.meta);
      this.dataStore.addTeamProgress(teamProgress.progress);
      
      teamProgress = await this.yamlService.loadYamlUnresolvedRefs(this.dataStore.meta.teamProgressFile.replace('.yaml', '-2.yaml')) as TeamProgressFile;
      this.dataStore.addTeamProgress(teamProgress.progress);
    

      // teamProgress = JSON.parse(localStorage.getItem('teamProgress') || '{}') as TeamProgressFile;
      // this.dataStore.addTeamProgress(teamProgress.progress);

      // TODO: Load old yaml format (generated.yaml)
      // TODO: Load old yaml format (localStorage)
      if (this.debug) console.log(`${perfNow()}s: ----- Load Service End -----`);

      return this.dataStore;
    } catch (err) {
      // Clear cache on error
      this.dataStore.clearCache();
      throw err;
    }
  }

  private async loadMeta(): Promise<MetaFile> {
    if (this.debug) {
      console.log(`${perfNow()} s: Load meta: ${this.META_FILE}`);
    }
    let meta: MetaFile = await this.yamlService.loadYaml(this.META_FILE);

    if (!meta.activityFiles) {
      throw Error("The meta.yaml has no 'activityFiles' to be loaded");
    }
    if (!meta.teamProgressFile) {
      throw Error("The meta.yaml has no 'teamProgressFile' to be loaded");
    }
    
    // Recalculate percentages of progress definition
    this.recalculateProgressDefinition(meta);

    // Remove group teams not specified 
    Object.keys(meta.teamGroups).forEach(group => {
      meta.teamGroups[group] = meta.teamGroups[group].filter(team => meta.teams.includes(team));
    });
    // Insert key: 'All' with value: [], in the first position of the meta.teamGroups Record<string, string[]>
    meta.teamGroups = { 'All': [], ...meta.teamGroups };

    // Resolve paths relative to meta.yaml
    meta.teamProgressFile = this.yamlService.makeFullPath(meta.teamProgressFile, this.META_FILE);
    meta.activityFiles = meta.activityFiles.map(file => 
      this.yamlService.makeFullPath(file, this.META_FILE)
    );

    if (this.debug) console.log(`${perfNow()} s: meta loaded`);
    return meta;
  }
  
  private async loadTeamProgress(meta: MetaFile): Promise<TeamProgressFile> {
    if (this.debug) console.log(`${perfNow()} s: Loading `);
    return this.yamlService.loadYamlUnresolvedRefs(meta.teamProgressFile);
  }

  private async loadActivities(meta: MetaFile): Promise<ActivityStore> {
    const activityStore = new ActivityStore();
    const errors: string[] = [];
    let usingHistoricYamlFile = false;
    
    for (let filename of meta.activityFiles) {
      if (this.debug) console.log(`${perfNow()}s: Loading activity file: ${filename}`);
      const data: Data = await this.loadActivityFile(filename);
      
      usingHistoricYamlFile ||= filename.endsWith('generated/generated.yaml');
      activityStore.addActivityFile(data, errors);

      // Handle validation errors
      if (errors.length > 0) {
        errors.forEach(error => console.error(error));

        // Only throw for non-generated files (backwards compatibility)
        if (!usingHistoricYamlFile) {
          throw new DataValidationError(
            'Data validation error after loading: ' +
              filename +
              '\n\n----\n\n' +
              errors.join('\n\n')
          );
        }
      }
    }
    return activityStore;
  }

  private async loadActivityFile(filename: string): Promise<Data> {
    return this.yamlService.loadYamlUnresolvedRefs(filename);
  }

  public clearCache(): void {
    // this.cachedActivityStore = null;
    // this.meta = null;
  }

  public forceReload(): Promise<DataStore> {
    this.clearCache();
    return this.load();
  }

  private recalculateProgressDefinition(meta: MetaFile) {
    let errors: string[] = [];

    for (let state of Object.keys(meta.progressDefinition)) {
      let value: string | number = meta.progressDefinition[state];
      if (typeof value === 'string') {
        let isPercentage: boolean = (value as string).includes('%');
        value = parseFloat(value);
        if (isPercentage) { 
          value = value / 100;
        }
        if (value > 1 || value < 0) {
          errors.push(`The progress value for '${state}' must be between 0% and 100%`);
          continue;
        }
      }
      meta.progressDefinition[state] = value;
    }
    
    if (Math.min(...Object.values(meta.progressDefinition)) !== 0) {
      errors.push(`The meta.progressDefinition must specify a name for 0% completed`);
    }
    if (Math.max(...Object.values(meta.progressDefinition)) !== 1) {
      errors.push(`The meta.progressDefinition must specify a name for 100% completed`);
    }

    if (errors.length > 0) {
      throw new DataValidationError(
        'Data validation error for progress definition in meta.yaml: \n\n- ' +
          errors.join('\n- ')
      );
    }
  }




  
}

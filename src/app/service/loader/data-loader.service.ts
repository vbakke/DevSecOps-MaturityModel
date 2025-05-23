import { Injectable } from '@angular/core';
import { perfNow } from 'src/app/util/util';
import { YamlService } from '../yaml-loader/yaml-loader.service';
import { MetaFile, MetaStrings, TeamProgressFile } from 'src/app/model/meta';
import { ActivityStore, Data } from 'src/app/model/activity-store';

export class DataValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private META_FILE: string = '/assets/YAML/meta.yaml';
  private debug: boolean = true;
  private cachedActivityStore: ActivityStore | null = null;
  public meta: MetaFile | null = null;

  constructor(private yamlService: YamlService) {}

  public async load(): Promise<ActivityStore> {
    // Return cached data if available
    if (this.cachedActivityStore) {
      return this.cachedActivityStore;
    }

    try {
      if (this.debug) console.log(`${perfNow()}s: ----- Load Service Begin -----`);
      
      // Load meta.yaml first
      this.meta = await this.loadMeta();
      
      // Then load activities
      this.cachedActivityStore = await this.loadActivities(this.meta);

      // Load the progress of each team
      let teamProgress: TeamProgressFile = await this.loadTeamProgress(this.meta);
      this.cachedActivityStore.addTeamProgress(teamProgress.progress);
      
      teamProgress = await this.yamlService.loadYamlUnresolvedRefs(this.meta.teamProgressFile.replace('.yaml', '-2.yaml')) as TeamProgressFile;
      this.cachedActivityStore.addTeamProgress(teamProgress.progress);
    
      teamProgress = JSON.parse(localStorage.getItem('teamProgress') || '{}') as TeamProgressFile;
      this.cachedActivityStore.addTeamProgress(teamProgress.progress);

      // TODO: Load old yaml format (generated.yaml)
      // TODO: Load old yaml format (localStorage)

  

      if (this.debug) console.log(`${perfNow()}s: ----- Load Service End -----`);
      return this.cachedActivityStore;
    } catch (err) {
      // Clear cache on error
      this.clearCache();
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
    this.cachedActivityStore = null;
    this.meta = null;
  }

  public forceReload(): Promise<ActivityStore> {
    this.clearCache();
    return this.load();
  }

  public getMaxLevel(): number {
    if (!this.cachedActivityStore) {
      throw new Error('Activities not loaded. Call load() first.');
    }
    return this.cachedActivityStore.getMaxLevel();
  }

  public getLevels(): string[] {
    if (!this.cachedActivityStore) {
      throw new Error('Activities not loaded. Call load() first.');
    }
    let maxLvl: number = this.cachedActivityStore.getMaxLevel();
    return this.getMetaStrings().maturityLevels.slice(0, maxLvl);
  }

  getMetaStrings(): MetaStrings {
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
  
}

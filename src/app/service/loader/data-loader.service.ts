import { Injectable } from '@angular/core';
import { perfNow } from 'src/app/util/util';
import { YamlService } from '../yaml-loader/yaml-loader.service';
import { Meta, MetaStrings } from 'src/app/model/meta';
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
  public meta: Meta | null = null;

  constructor(private yamlService: YamlService) {}

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
      
      if (this.debug) console.log(`${perfNow()}s: ----- Load Service End -----`);
      return this.cachedActivityStore;
    } catch (err) {
      // Clear cache on error
      this.clearCache();
      throw err;
    }
  }

  private async loadMeta(): Promise<Meta> {
    if (this.debug) {
      console.log(`${perfNow()} s: Load meta: ${this.META_FILE}`);
    }
    let meta: Meta = await this.yamlService.loadYaml(this.META_FILE);

    if (!meta.activityFiles) {
      throw Error("The meta.yaml has no 'activityFiles' to be loaded");
    }
    
    // Resolve paths relative to meta.yaml
    meta.activityFiles = meta.activityFiles.map(file => 
      this.yamlService.makeFullPath(file, this.META_FILE)
    );

    if (this.debug) console.log(`${perfNow()} s: meta loaded`);
    return meta;
  }

  private async loadActivities(meta: Meta): Promise<ActivityStore> {
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
}

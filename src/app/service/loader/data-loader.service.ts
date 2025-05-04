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
  public meta: Meta | null;
  public activities: ActivityStore;

  constructor(private yamlService: YamlService) {
    this.meta = null;
    this.activities = new ActivityStore();
  }

  public getLevels(): string[] {
    let maxLvl: number = this.activities.getMaxLevel();
    return this.getMetaStrings().maturity_levels.slice(0, maxLvl);
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
    console.log(`${perfNow()}s: ----- New Load Service Begin -----`);
    this.meta = await this.loadMeta();
    await this.loadActivities(this.meta);
    console.log(`${perfNow()}s: ----- New Load Service End-----`);
    return this.activities;
  }

  async loadMeta(): Promise<Meta> {
    if (this.debug) {
      console.log(`${perfNow()} s: Load meta: ${this.META_FILE}`);
    }
    let meta: Meta = await this.yamlService.loadYaml(this.META_FILE);

    if (!meta.activityFiles) {
      throw Error("The meta.yaml has no 'activityFiles' to be loaded");
    }
    for (let i = 0; i < meta.activityFiles.length; i++) {
      meta.activityFiles[i] = this.yamlService.makeFullPath(
        meta.activityFiles[i],
        this.META_FILE
      );
    }

    if (this.debug) console.log(`${perfNow()} s: meta loaded`);
    return meta;
  }

  async loadActivities(meta: Meta): Promise<ActivityStore> {
    let errors: string[] = [];
    // let activities: Activities = new Activities();
    for (let filename of meta.activityFiles) {
      console.log(`${perfNow()}s: Loading activity file: ${filename}`);
      let data: Data = await this.loadActivityFile(filename);
      
      this.activities.addActivityFile(data, errors);
      if (errors.length) {
        for (let error of errors) console.error(error);

        // Don't throw validation errors for the old `generated.yaml`.
        // For backwards compatibility. 
        // Console error message have to suffice in those cases.
        if (!filename.endsWith('generated/generated.yaml')) {
          throw new DataValidationError(
            'Data validation error in: ' +
              filename +
              '\n\n----\n\n' +
              errors.join('\n\n')
          );
        }
      }
    }
    return this.activities;
  }

  async loadActivityFile(filename: string): Promise<Data> {
    let yaml: any = this.yamlService.loadYamlUnresolvedRefs(filename);
    return yaml;
  }
}

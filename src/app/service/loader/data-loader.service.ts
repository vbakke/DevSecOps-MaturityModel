import { Injectable } from '@angular/core';
import { perfNow } from 'src/app/util/util';
import { YamlService } from '../yaml-loader/yaml-loader.service';
import { Meta } from '../../model/meta';
import {
  Categories,
  Dimensions,
  Activity,
  ActivityStore,
} from '../../model/activity-store';

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

  public async load(): Promise<any> {
    console.log(`${perfNow()}s: ----- New Load Service Begin -----`);
    this.meta = await this.loadMeta();
    await this.loadActivities(this.meta);
    console.log(`${perfNow()}s: ----- New Load Service End-----`);
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
      let data: Categories = await this.loadActivityFile(filename);
      // console.log(activities);
      this.activities.addActivityFile(data, errors);
      // return this.activities; // REMOVEME

      if (errors.length) {
        for (let error of errors) console.error(error);
        throw Error(
          'Load error!\n\n----\n\nLoading: ' +
            filename +
            '\n\n----\n\n' +
            errors.join('\n\n')
        );
      }
    }
    return this.activities;
  }

  async loadActivityFile(filename: string): Promise<Categories> {
    let yaml: any = this.yamlService.loadYamlUnresolvedRefs(filename);
    return yaml;
  }
}

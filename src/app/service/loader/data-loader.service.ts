import { Injectable } from '@angular/core';
import { parse } from 'yamljs';
import { YamlService } from '../yaml-loader/yaml-loader.service';
import { Meta } from '../../model/meta';
import {
  Categories,
  Dimensions,
  Activity,
  Activities,
} from '../../model/activities';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private META_FILE: string = '/assets/YAML/meta.yaml';
  private debug: boolean = true;
  public meta: Meta | null;
  public activities: Activities;

  constructor(private yamlService: YamlService) {
    this.meta = null;
    this.activities = new Activities();
  }

  public async load(): Promise<any> {
    this.meta = await this.loadMeta();
    await this.loadActivities(this.meta);
  }

  async loadMeta(): Promise<Meta> {
    if (this.debug)
      console.log(`${this.perfNow()} s: Load meta: ${this.META_FILE}`);
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

    if (this.debug) console.log(`${this.perfNow()} s: meta loaded`);
    return meta;
  }

  async loadActivities(meta: Meta): Promise<Activities> {
    let errors: string[] = [];
    // let activities: Activities = new Activities();
    for (let filename of meta.activityFiles) {
      console.log(`LOADING: ${filename}`);
      let data: Categories = await this.loadActivityFile(filename);      
      // console.log(activities);
      this.activities.addActivityFile(data, errors);
      // return this.activities; // REMOVEME

      if (errors.length) {
        for (let error of errors)
          console.error(error);
        throw Error('Load error!\n\n----\n\nLoading: ' + filename + '\n\n----\n\n' +  errors.join('\n\n'));
      }
  
  
    }
    return this.activities;
  }

  async loadActivityFile(filename: string): Promise<Categories> {
    let yaml: any = this.yamlService.loadYamlUnresolvedRefs(filename);
    return yaml;
  }

  perfNow(): string {
    return (performance.now() / 1000).toFixed(3);
  }
}

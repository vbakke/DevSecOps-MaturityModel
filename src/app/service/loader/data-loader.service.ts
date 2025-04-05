import { Injectable } from '@angular/core';
import { parse } from 'yamljs';
import { YamlService } from '../yaml-loader/yaml-loader.service';
import { Meta } from '../../model/meta';
import {
  Category,
  Dimension,
  Activity,
  Activities,
} from '../../model/activities';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private META_FILE: string = '/assets/YAML/meta.yaml';
  public meta: Meta | null;
  public activities: Category[];
  private debug: boolean = true;

  constructor(private yamlService: YamlService) {
    this.meta = null;
    this.activities = [];
    // this._lookupNameToUuid = {};
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

  async loadActivities(meta: Meta): Promise<string> {
    let activities: Activities = new Activities();
    for (let filename of meta.activityFiles) {
      console.log(`LOADING: ${filename}`);
      let data: Category[] = await this.loadActivityFile(filename);
      activities.addActivityFile(data);
      console.log(activities);
    }
    return '';
  }

  async loadActivityFile(filename: string): Promise<Category[]> {
    let yaml: any = this.yamlService.loadYamlUnresolvedRefs(filename);
    return yaml;
  }

  perfNow(): string {
    return (performance.now() / 1000).toFixed(3);
  }
}

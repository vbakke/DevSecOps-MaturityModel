import { Injectable } from '@angular/core';
import { parse } from 'yamljs';

export interface MetaSchema {
  checkForDsommUpdates: boolean;
  lang: string;
  strings: Record<string, any>;
  progress: Record<string, number>;
  $teamsRef: string;
  $activityRef: string[];
}

@Injectable({ providedIn: 'root' })
export class loaderService {
  public meta: MetaSchema | null;

  constructor() {
    this.meta = null;
  }

  public async load(): Promise<any> {
    this.meta = await this.loadMeta();
    console.log(this.meta.$teamsRef);
  }

  async loadMeta(): Promise<MetaSchema> {
    const yaml: any = await this.loadYaml('./assets/YAML/meta.yaml');

    return yaml;
  }

  async loadYaml(url: string): Promise<any> {
    const response: Response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch the YAML file: ${response.statusText}`);
    }
    const yamlText: string = await response.text();

    return parse(yamlText);
  }
}

import { Injectable } from '@angular/core';
import { YamlService } from '../yaml-loader/yaml-loader.service';
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
export class LoaderService {
  public meta: MetaSchema | null;

  constructor(private yamlService: YamlService) {
    this.meta = null;
  }

  public async load(): Promise<any> {
    this.meta = await this.loadMeta();
    console.log(this.meta.$teamsRef);
  }

  async loadMeta(): Promise<MetaSchema> {
    const yaml: any = await this.yamlService.load('./assets/YAML/meta.yaml');
    await this.fetchYamlRefs(yaml);

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

  async fetchYamlRefs(yaml: any): Promise<any> {
    return yaml;
  }
}

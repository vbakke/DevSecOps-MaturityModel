import { YamlService } from "../service/yaml-loader/yaml-loader.service";
import { ProgressDefinition, TeamNames, TeamGroups } from "./types";
import { perfNow } from 'src/app/util/util';

export interface MetaStrings {
  allTeamsGroupName: string;
  labels: string[];
  maturityLevels: string[];
  knowledgeLabels: string[];
}

const LOCALSTORAGE_KEY: string = 'meta';

export class MetaStore {
  private yamlService: YamlService = new YamlService();

  checkForDsommUpdates: boolean = false;
  lang: string = 'en';
  strings: Record<string, MetaStrings> = {};
  progressDefinition: ProgressDefinition = {};
  teamGroups: TeamGroups = {};
  teams: TeamNames = [];
  activityFiles: string[] = [];
  teamProgressFile: string = '';

  public init(metaData: any): void {
    if (metaData) {
      this.checkForDsommUpdates = metaData.checkForDsommUpdates || this.checkForDsommUpdates || false;
      this.lang = metaData.lang || this.lang || 'en';
      this.strings = metaData.strings || this.strings || {};
      this.progressDefinition = metaData.progressDefinition ||this.progressDefinition || {};
      this.teamGroups = metaData.teamGroups || this.teamGroups || {};
      this.teams = metaData.teams || this.teams || [];
      this.activityFiles = metaData.activityFiles || this.activityFiles || [];
      this.teamProgressFile = metaData.teamProgressFile || this.teamProgressFile || '';
    }
  }

  public updateTeamsAndGroups(teams: TeamNames, teamGroups: TeamGroups): void {
    this.teams = teams;
    this.teamGroups = teamGroups;
    this.saveToLocalStorage();
  }

  public saveToLocalStorage() {
    let yamlStr: string = this.yamlService.stringify({teams: this.teams, teamGroups: this.teamGroups});
    console.log(`${perfNow()}: Saved meta.team: ${yamlStr}`);
    localStorage.setItem(LOCALSTORAGE_KEY, yamlStr);
  }

  public loadStoredMeta(): void {
    let storedMeta: string | null = localStorage.getItem(LOCALSTORAGE_KEY);
    if (storedMeta) {
      try {
        let metaData = this.yamlService.parse(storedMeta);
        this.init(metaData);
        console.log('Loaded stored meta from localStorage');
      } catch (error) {
        console.error('Failed to load stored meta from localStorage:', error);
      }
    }
  }
}


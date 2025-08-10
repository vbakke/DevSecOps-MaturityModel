import { Component, OnInit } from '@angular/core';
import { DialogInfo, ModalMessageComponent } from 'src/app/component/modal-message/modal-message.component';
import { SelectionChangedEvent, TeamsGroupsChangedEvent } from 'src/app/component/teams-groups-editor/teams-groups-editor.component';
import { DataStore, } from 'src/app/model/data-store';
import { TeamGroups, TeamNames } from 'src/app/model/types';
import { LoaderService } from 'src/app/service/loader/data-loader.service';
import { downloadYamlFile } from 'src/app/util/download';
import { isEmptyObj, perfNow } from 'src/app/util/util';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.css'],
})
export class TeamsComponent implements OnInit {
  dataStore: DataStore = new DataStore();
  canEdit: boolean = false;
  teams: TeamNames = [];
  teamGroups: TeamGroups = {};

  infoTitle: string = '';
  infoTeams: TeamNames = [];

  constructor(
        private loader: LoaderService,
        public modal: ModalMessageComponent    
  ) {}

  ngOnInit(): void {
    console.log(`${perfNow()}: Teams: Loading yamls...`);
    this.loader
      .load()
      .then((dataStore: DataStore) => {
        this.setYamlData(dataStore);
        console.log(`${perfNow()}: Page loaded: Teams`);
      })
      .catch(err => {
        this.displayMessage(new DialogInfo(err.message, 'An error occurred'));
        if (err.hasOwnProperty('stack')) {
          console.warn(err);
        }
      });
  }

  
  displayMessage(dialogInfo: DialogInfo) {
    this.modal.openDialog(dialogInfo);
  }

  setYamlData(dataStore: DataStore) {
    this.dataStore = dataStore;
    if (this.dataStore.meta) {
      this.canEdit = this.dataStore.meta.allowChangeTeamNameInBrowser;
    }

    this.teams = dataStore?.meta?.teams || [];
    this.teamGroups = dataStore?.meta?.teamGroups || {};
  }

  onSelectionChanged(event: SelectionChangedEvent) {
    console.log(`${perfNow()}: Selection changed: ${JSON.stringify(event)}`);
    if (event.selectedTeam) {
      this.infoTitle = event.selectedTeam;
      this.infoTeams = [ event.selectedTeam ];
    } else if (event.selectedGroup) {
      this.infoTitle = event.selectedGroup;
      this.infoTeams = this.teamGroups[event.selectedGroup] || [];
    }
  }

  onTeamsChanged(event: TeamsGroupsChangedEvent) {
    console.log(`${perfNow()}: Saving teams: ${JSON.stringify(event.teams)}`);
    console.log(`${perfNow()}: Saving groups: ${JSON.stringify(event.teamGroups)}`);
    this.dataStore?.meta?.updateTeamsAndGroups(event.teams, event.teamGroups);
    if (!isEmptyObj(event.teamsRenamed)) {
      for (let oldName in event.teamsRenamed) {
        this.dataStore?.progressStore?.renameTeam(oldName, event.teamsRenamed[oldName]);
      }
      this.dataStore?.progressStore?.saveToLocalStorage();
    }
    this.setYamlData(this.dataStore);
  }

  onResetTeamGroups() {
    console.log(`${perfNow()}: Remove teams and groups from localStorage`);
    localStorage.removeItem('meta');
  }

  onExportTeamGroups() {
    console.log(`${perfNow()}: Exporting teams and groups`);
    const yamlStr: string = localStorage.getItem('meta') || '';
    downloadYamlFile(yamlStr, 'teams.yaml');
  } 
}

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


  onExportTeamGroups() {
    console.log(`${perfNow()}: Exporting teams and groups`);
    const yamlStr: string | undefined = this?.dataStore?.meta?.asStorableYamlString();

    if (!yamlStr) {
      this.displayMessage(new DialogInfo('No team and groups names stored locally in the browser', 'Export Error'));
      return;
    }

    downloadYamlFile(yamlStr, 'teams.yaml');
  } 

  async onResetTeamGroups() {
    let buttonClicked: string = await this.displayDeleteBrowserTeamsDialog();
    
    if (buttonClicked === 'Delete') {
      this.dataStore?.meta?.deleteLocalStorage();
      location.reload(); // Make sure all load routines are initialized
    }
  }

  displayDeleteBrowserTeamsDialog(): Promise<string> {
    return new Promise((resolve, reject) => {
      let title: string = 'Delete local browser data';
      let message: string =
        'Do you want to reset all team and group names?' +
        '\n\nThis will revert the names to the names stored in the yaml file on the server.';
      let buttons: string[] = ['Cancel', 'Delete'];
      this.modal
        .openDialog({ title, message, buttons, template: '' })
        .afterClosed()
        .subscribe(data => {
          resolve(data);
        });      
      }); 
  }


}

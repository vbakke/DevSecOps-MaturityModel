import { Component, OnInit } from '@angular/core';
import { DialogInfo, ModalMessageComponent } from 'src/app/component/modal-message/modal-message.component';
import { DataStore } from 'src/app/model/data-store';
import { TeamGroups, TeamNames } from 'src/app/model/meta';
import { LoaderService } from 'src/app/service/loader/data-loader.service';
import { perfNow } from 'src/app/util/util';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.css'],
})
export class TeamsComponent implements OnInit {
  dataStore: DataStore = new DataStore();
  teams: TeamNames = [];
  teamGroups: TeamGroups = {};

  selectedTeamId: string | null = null;
  selectedGroupId: string | null = null;
  highlightedTeams: string[] = [];
  highlightedGroups: string[] = [];

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
    this.teams = dataStore?.meta?.teams || [];
    this.teamGroups = dataStore?.meta?.teamGroups || {};
  }

  unsorted() {
    return 0;
  }

  // onTeamsChanged(event: {newTeams: string[], newGroups: string[], teamsRenamed: {old: string, new: string}[]}) {
  onTeamsChanged(event: {teams: TeamNames, teamGroups: TeamGroups}) {
  // onTeamsChanged(event: string) {
    console.warn(`PAGE: OnSave -- ToDo`);
    console.warn(`Updated teams: ${event.teams},`);
    console.warn(`Updated groups: ${Object.keys(event.teamGroups)}`);

    // this.teams = event.teams;
    // this.groups = event.newGroups;
    // this.teamGroups = {};
    // event.newGroups.forEach(group => {
    //   this.teamGroups[group] = [];
    // });
    // event.teamsRenamed.forEach(({old, new: newName}) => {
    //   if (this.teams.includes(old)) {
    //     const index = this.teams.indexOf(old);
    //     if (index !== -1) {
    //       this.teams[index] = newName;
    //     }
    //   }
    //   Object.keys(this.teamGroups).forEach(group => {
    //     this.teamGroups[group] = this.teamGroups[group].map(team => team === old ? newName : team);
    //   });
    // });
  }

  onEditorBackgroundClick() {
    this.selectedTeamId = null;
    this.selectedGroupId = null;
    this.highlightedTeams = [];
    this.highlightedGroups = [];
  }
}

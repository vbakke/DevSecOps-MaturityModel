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
  highlightedTeamIds: string[] = [];
  highlightedGroupIds: string[] = [];

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

  OBSOLETE_onTeamSelected(teamName: string) {
    console.warn(`OBSOLETE Team selected: ${teamName}`);
    this.selectedTeamId = teamName;
    this.selectedGroupId = null;
    // this.highlightedGroupIds = this.groups.filter(group => (this.teamGroups[group] || []).includes(teamName));
    this.highlightedTeamIds = [];
  }
  OBSOLETE_onGroupSelected(groupName: string) {
    // this.selectedGroupId = groupName;
    // this.selectedTeamId = null;
    // this.highlightedTeamIds = (this.teamGroups[groupName] || []);
    // this.highlightedGroupIds = [];
  }
  OBSOLETE_onAddTeam() {
    console.warn(`OBSOLETE Team Added `);
    // Handle add team logic
  }
  OBSOLETE_onRenameTeam(event: {oldName: string, newName: string}) {
    console.warn(`OBSOLETE Team renames: ${event.oldName} -> ${event.newName}`);

    // Update team name in teams array
    const index = this.teams.indexOf(event.oldName);
    if (index !== -1) {
      this.teams[index] = event.newName;
      // Update references in teamGroups
      Object.keys(this.teamGroups).forEach(group => {
        this.teamGroups[group] = this.teamGroups[group].map(t => t === event.oldName ? event.newName : t);
      });
    }
  }
  OBSOLETE_onDeleteTeam(teamId: string) {
    // Handle delete team logic
  }
  OBSOLETE_onAddGroup() {
    // Handle add group logic
  }
  OBSOLETE_onRenameGroup(event: {oldName: string, newName: string}) {
    console.warn(`OBSOLETE Group renames: ${event.oldName} -> ${event.newName}`);
    // Update group name in groups array
    // const index = this.groups.indexOf(event.oldName);
    // if (index !== -1) {
    //   this.groups[index] = event.newName;
    //   // Update key in teamGroups
    //   if (this.teamGroups[event.oldName]) {
    //     this.teamGroups[event.newName] = this.teamGroups[event.oldName];
    //     delete this.teamGroups[event.oldName];
    //   }
    // }
  }
  OBSOLETE_onDeleteGroup(groupId: string) {
    // Handle delete group logic
  }
  onEditorBackgroundClick() {
    this.selectedTeamId = null;
    this.selectedGroupId = null;
    this.highlightedTeamIds = [];
    this.highlightedGroupIds = [];
  }
}

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
  teams: string[] = [];
  groups: string[] = [];
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
    this.groups = Object.keys(dataStore?.meta?.teamGroups || {});
    this.teamGroups = dataStore?.meta?.teamGroups || {};
  }

  unsorted() {
    return 0;
  }

  onTeamSelected(teamName: string) {
    this.selectedTeamId = teamName;
    this.selectedGroupId = null;
    this.highlightedGroupIds = this.groups.filter(group => (this.teamGroups[group] || []).includes(teamName));
    this.highlightedTeamIds = [];
  }
  onGroupSelected(groupName: string) {
    this.selectedGroupId = groupName;
    this.selectedTeamId = null;
    this.highlightedTeamIds = (this.teamGroups[groupName] || []);
    this.highlightedGroupIds = [];
  }
  onAddTeam() {
    // Handle add team logic
  }
  onRenameTeam(event: {oldName: string, newName: string}) {
    // Update team name in teams array
    const idx = this.teams.indexOf(event.oldName);
    if (idx !== -1) {
      this.teams[idx] = event.newName;
      // Update references in teamGroups
      Object.keys(this.teamGroups).forEach(group => {
        this.teamGroups[group] = this.teamGroups[group].map(t => t === event.oldName ? event.newName : t);
      });
    }
  }
  onDeleteTeam(teamId: string) {
    // Handle delete team logic
  }
  onAddGroup() {
    // Handle add group logic
  }
  onRenameGroup(event: {oldName: string, newName: string}) {
    // Update group name in groups array
    const idx = this.groups.indexOf(event.oldName);
    if (idx !== -1) {
      this.groups[idx] = event.newName;
      // Update key in teamGroups
      if (this.teamGroups[event.oldName]) {
        this.teamGroups[event.newName] = this.teamGroups[event.oldName];
        delete this.teamGroups[event.oldName];
      }
    }
  }
  onDeleteGroup(groupId: string) {
    // Handle delete group logic
  }
  onEditorBackgroundClick() {
    this.selectedTeamId = null;
    this.selectedGroupId = null;
    this.highlightedTeamIds = [];
    this.highlightedGroupIds = [];
  }
}

import { Component, OnInit } from '@angular/core';
import { DialogInfo, ModalMessageComponent } from 'src/app/component/modal-message/modal-message.component';
import { DataStore } from 'src/app/model/data-store';
import { TeamGroups, TeamNames } from 'src/app/model/meta';
import { LoaderService } from 'src/app/service/loader/data-loader.service';
import { perfNow } from 'src/app/util/util';
import { SelectableListItem } from '../../component/teams-groups-editor/selectable-list.component';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.css'],
})
export class TeamsComponent implements OnInit {
  dataStore: DataStore = new DataStore();
  teams: SelectableListItem[] = [];
  groups: SelectableListItem[] = [];
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
    this.teams = (dataStore?.meta?.teams || []).map((name: string, idx: number) => ({ id: name, name }));
    this.groups = Object.keys(dataStore?.meta?.teamGroups || {}).map((name, idx) => ({ id: name, name }));
    this.teamGroups = dataStore?.meta?.teamGroups || {};
  }

  unsorted() {
    return 0;
  }

  onTeamSelected(teamId: string) {
    this.selectedTeamId = teamId;
    this.selectedGroupId = null; // Reset group selection
    this.highlightedGroupIds = this.groups
      .filter(group => (this.teamGroups[group.id] || []).includes(teamId))
      .map(group => group.id);
    this.highlightedTeamIds = []; // Clear highlighted teams
  }
  onGroupSelected(groupId: string) {
    this.selectedGroupId = groupId;
    this.selectedTeamId = null; // Reset team selection
    this.highlightedTeamIds = (this.teamGroups[groupId] || []);
    this.highlightedGroupIds = []; // Clear highlighted groups
  }
  onAddTeam() {
    // Handle add team logic
  }
  onRenameTeam(event: {id: string, name: string}) {
    // Find and update the team name in the teams array
    const idx = this.teams.findIndex(t => t.id === event.id);
    if (idx !== -1) {
      this.teams[idx].name = event.name;
      this.teams[idx].id = event.name;
      // Also update in teamGroups
      Object.keys(this.teamGroups).forEach(group => {
        this.teamGroups[group] = this.teamGroups[group].map(t => t === event.id ? event.name : t);
      });
    }
  }
  onDeleteTeam(teamId: string) {
    // Handle delete team logic
  }
  onAddGroup() {
    // Handle add group logic
  }
  onRenameGroup(event: {id: string, name: string}) {
    // Find and update the group name in the groups array
    const idx = this.groups.findIndex(g => g.id === event.id);
    if (idx !== -1) {
      this.groups[idx].name = event.name;
      this.groups[idx].id = event.name;
      // Also update key in teamGroups
      if (this.teamGroups[event.id]) {
        this.teamGroups[event.name] = this.teamGroups[event.id];
        delete this.teamGroups[event.id];
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

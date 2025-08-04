// Main container for teams/groups editing
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TeamGroups, TeamName, TeamNames } from 'src/app/model/meta';

@Component({
  selector: 'teams-groups-editor',
  templateUrl: './teams-groups-editor.component.html',
  styleUrls: ['./teams-groups-editor.component.css']
})
export class TeamsGroupsEditorComponent {
  @Input() teams: TeamNames = [];
  @Input() teamGroups: TeamGroups = {};
  @Input() highlightedTeamIds: string[] = [];
  @Input() highlightedGroupIds: string[] = [];
  @Output() changed = new EventEmitter<{teams: TeamNames, teamGroups: TeamGroups}>();
  @Output() OBSOLETE_teamSelected = new EventEmitter<string>();
  @Output() OBSOLETE_groupSelected = new EventEmitter<string>();
  @Output() OBSOLETE_addTeam = new EventEmitter<void>();
  @Output() OBSOLETE_renameTeam = new EventEmitter<{ oldName: string, newName: string }>();
  @Output() OBSOLETE_deleteTeam = new EventEmitter<string>();
  @Output() OBSOLETE_addGroup = new EventEmitter<void>();
  @Output() OBSOLETE_renameGroup = new EventEmitter<{ oldName: string, newName: string }>();
  @Output() OBSOLETE_deleteGroup = new EventEmitter<string>();
  editMode = false;
  selectedTeamId: string | null = null;
  selectedGroupId: string | null = null;
  teamsEditMode = false;
  groupsEditMode = false;
  localCopyTeams: TeamNames = [];
  localCopyTeamGroups: TeamGroups = {};
  localCopyGroupNames: string[] = [];


  
  ngOnChanges() {
    this.makeLocalCopy();
    console.log('EDitor: ngOnChanges(): groupNames: ', this.localCopyGroupNames);
    if (this.teams.length > 0) {
      this.onTeamSelected(this.teams[0]);
    }
  }

  ngOnInit() {
  }

  makeLocalCopy() {
    this.localCopyTeams = this.teams.slice();
    this.localCopyTeamGroups = this.cloneTeamGroups(this.teamGroups);
    this.localCopyGroupNames = Object.keys(this.teamGroups);
  }
  saveLocalCopy() {
    this.teams = this.localCopyTeams.slice();
    this.teamGroups = this.cloneTeamGroups(this.localCopyTeamGroups);
  }
  cloneTeamGroups(original: TeamGroups): TeamGroups {
    let clone: TeamGroups = {};
    for (let group in original) {
      clone[group] = original[group].slice();
    }
    return clone;
  }


  isTeamInGroupFn = (group: string) => {
    if (!this.selectedTeamId) return false;
    return (this.teamGroups[group] || []).includes(this.selectedTeamId);
  };

  isGroupForTeamFn = (team: string) => {
    if (!this.selectedGroupId) return false;
    return (this.teamGroups[this.selectedGroupId] || []).includes(team);
  };

  onTeamsEditModeChange(editing: boolean) {
    this.teamsEditMode = editing;
    if (editing) this.groupsEditMode = false;
  }

  onGroupsEditModeChange(editing: boolean) {
    this.groupsEditMode = editing;
    if (editing) this.teamsEditMode = false;
  }

  onTeamGroupToggle(team: string | null, group: string | null) {
    if (!team || !group) return;
    const members = this.localCopyTeamGroups[group] || [];
    if (members.includes(team)) {
      this.localCopyTeamGroups[group] = members.filter(t => t !== team);
    } else {
      this.localCopyTeamGroups[group] = [...members, team];
    }
  }

  onTeamSelected(teamId: string) {
    this.selectedGroupId = null; 
    this.highlightedTeamIds = []; 
    this.selectedTeamId = teamId;
    this.highlightedGroupIds = this.localCopyGroupNames.filter(group => (this.localCopyTeamGroups[group] || []).includes(teamId));
  }
  onGroupSelected(groupId: string) {
    this.selectedTeamId = null;
    this.highlightedGroupIds = [];
    this.selectedGroupId = groupId;
    this.highlightedTeamIds = this.localCopyTeamGroups[groupId] || [];
  }
  onAddTeam() { 
    let newName: string = `Team ${this.localCopyTeams.length + 1}`;
    this.localCopyTeams.push(newName);
    this.onTeamSelected(newName);
   }
  onRenameTeam(event: { oldName: string, newName: string }) { 
    this.localCopyTeams = this.localCopyTeams.map(team => team === event.oldName ? event.newName : team);
    for (let group in this.localCopyTeamGroups) {
      this.localCopyTeamGroups[group].map(team => team == event.oldName ? event.newName : team);
    }
  }
  onDeleteTeam(teamId: TeamName) { 
    this.localCopyTeams = this.localCopyTeams.filter(team => team !== teamId);
    this.onTeamSelected('');
  }
  onAddGroup() { 
    let newName: string = `Group ${this.localCopyGroupNames.length + 1}`;
    this.localCopyGroupNames.push(newName);
    this.localCopyTeamGroups[newName] = [];
    this.onGroupSelected(newName);    
   }
  onRenameGroup(event: { oldName: string, newName: string }) { 
    this.localCopyGroupNames = this.localCopyGroupNames.map(group => group === event.oldName ? event.newName : group);
    this.localCopyTeamGroups[event.newName] = this.localCopyTeamGroups[event.oldName] || [];
    delete this.localCopyTeamGroups[event.oldName];
  }
  onDeleteGroup(groupId: string) { 
    delete this.localCopyTeamGroups[groupId];
    this.localCopyGroupNames = this.localCopyGroupNames.filter(group => group !== groupId);
  }

  onSave() {
    this.editMode = false;
    this.teamsEditMode = false;
    this.groupsEditMode = false;
    this.saveLocalCopy();
    this.highlightedTeamIds = [];
    this.highlightedGroupIds = [];
    this.selectedTeamId = null;
    this.selectedGroupId = null;
    this.changed.emit({teams: this.teams, teamGroups: this.teamGroups});
  }

  onCancelEdit() {
    this.editMode = false;
    this.teamsEditMode = false;
    this.groupsEditMode = false;
    this.selectedTeamId = null;
    this.selectedGroupId = null;
    this.highlightedTeamIds = [];
    this.highlightedGroupIds = [];
    this.makeLocalCopy();
  }
}

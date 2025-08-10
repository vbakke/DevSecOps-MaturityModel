// Main container for teams/groups editing
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { GroupName, TeamGroups, TeamName, TeamNames } from 'src/app/model/types';
import { perfNow, renameArrayElement } from 'src/app/util/util';


enum EditMode { NONE, TEAMS, GROUPS};

export class TeamsGroupsChanged {
  teams: TeamNames = [];
  teamGroups: TeamGroups = {};
  teamsRenamed: Record<TeamName, TeamName> = {};
}

@Component({
  selector: 'teams-groups-editor',
  templateUrl: './teams-groups-editor.component.html',
  styleUrls: ['./teams-groups-editor.component.css']
})
export class TeamsGroupsEditorComponent {
  Mode = EditMode;
  @Input() teams: TeamNames = [];
  @Input() teamGroups: TeamGroups = {};
  @Input() highlightedTeams: string[] = [];
  @Input() highlightedGroups: string[] = [];
  @Input() canEdit: boolean = true;
  @Output() changed = new EventEmitter<TeamsGroupsChanged>();

  editMode: EditMode = EditMode.NONE;
  selectedTeam: string | null = null;
  selectedGroup: string | null = null;

  // Make a local copy of parent
  localCopyTeams: TeamNames = [];
  localCopyTeamsRenamed: Record<TeamName, TeamName> = {};
  localCopyTeamGroups: TeamGroups = {};
  localCopyGroupNames: GroupName[] = [];


  
  ngOnChanges() {
    this.makeLocalCopy();
    if (this.teams.length > 0) {
      this.onTeamSelected(this.teams[0]);
    }
  }

  // Makes a local copy to allow editing without affecting the original data
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

  onTeamsEditModeChange(editing: boolean) {
    this.editMode = editing ? EditMode.TEAMS : EditMode.NONE;
  }

  onGroupsEditModeChange(editing: boolean) {
    this.editMode = editing ? EditMode.GROUPS : EditMode.NONE;
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

  onTeamSelected(team: string) {
    console.log(`${perfNow()}: Selecting team: ${team}`);
    this.selectedGroup = null; 
    this.highlightedTeams = []; 
    this.selectedTeam = team;
    this.highlightedGroups = this.localCopyGroupNames.filter(group => (this.localCopyTeamGroups[group] || []).includes(team));
  }

  onGroupSelected(group: string) {
    console.log(`${perfNow()}: Selecting group: ${group}`);
    this.selectedTeam = null;
    this.highlightedGroups = [];
    this.selectedGroup = group;
    this.highlightedTeams = this.localCopyTeamGroups[group] || [];
  }

  onAddTeam() { 
    let newName: string = `Team ${this.localCopyTeams.length + 1}`;
    this.localCopyTeams.push(newName);
    this.onTeamSelected(newName);
  }

  onRenameTeam(event: { oldName: string, newName: string }) { 
    console.log(`${perfNow()}: Rename team: ${event.oldName} to ${event.newName}`);

    if (this.localCopyTeams.includes(event.newName)) {
      alert("Cannot have duplicate names\n\n(todo: make this alert pretty)");
      this.onTeamSelected(event.oldName);
      return;
    } else if (this.teams.includes(event.newName)) {
      alert("Cannot have old names either. Please accept the changes one by one\n\n(todo: make this alert pretty)");
      this.onTeamSelected(event.oldName);
      return;
    } 

    this.localCopyTeams = renameArrayElement(this.localCopyTeams, event.oldName, event.newName);
    for (let group in this.localCopyTeamGroups) {
      this.localCopyTeamGroups[group] = renameArrayElement(this.localCopyTeamGroups[group], event.oldName, event.newName);
    }
    this.onTeamSelected(event.newName);
  
  }

  onDeleteTeam(team: TeamName) { 
    this.localCopyTeams = this.localCopyTeams.filter(team => team !== team);
    for (let group in this.localCopyTeamGroups) {
      this.localCopyTeamGroups[group] = this.localCopyTeamGroups[group].filter(team => team !== team);
    }

    this.onTeamSelected('');
  }

  onAddGroup() { 
    let newName: string = `Group ${this.localCopyGroupNames.length + 1}`;
    this.localCopyGroupNames.push(newName);
    this.localCopyTeamGroups[newName] = [];
    this.onGroupSelected(newName);    
  }

  onRenameGroup(event: { oldName: string, newName: string }) { 
    console.log(`${perfNow()}: Rename team: ${event.oldName} to ${event.newName}`);
    this.localCopyGroupNames = renameArrayElement(this.localCopyGroupNames, event.oldName, event.newName);
    this.localCopyTeamGroups[event.newName] = this.localCopyTeamGroups[event.oldName] || [];
    delete this.localCopyTeamGroups[event.oldName];
  }
  
  onDeleteGroup(group: string) { 
    delete this.localCopyTeamGroups[group];
    this.localCopyGroupNames = this.localCopyGroupNames.filter(group => group !== group);
  }

  onSave() {
    console.log(`${perfNow()}: Saving teams and groups`);

    // Identify the teams that have changed names
    let teamsRenamed: Record<TeamName, TeamName> = {};
    for (let i = 0; i < this.teams.length; i++) {
      if (this.teams[i] !== this.localCopyTeams[i]) {
        teamsRenamed[this.teams[i]] = this.localCopyTeams[i];
      }
    }

    this.editMode = EditMode.NONE;
    this.highlightedTeams = [];
    this.highlightedGroups = [];
    this.selectedTeam = null;
    this.selectedGroup = null;
    
    // Copy the local copy to the main data
    this.saveLocalCopy();

    this.changed.emit(
      {teams: this.teams, teamGroups: this.teamGroups, teamsRenamed: teamsRenamed}
    );
  }

  onCancelEdit() {
    console.log(`${perfNow()}: Cancel editing teams and groups`);
    this.editMode = EditMode.NONE;
    this.selectedTeam = null;
    this.selectedGroup = null;
    this.highlightedTeams = [];
    this.highlightedGroups = [];
    
    // Recreate the local copy from original values
    this.makeLocalCopy(); 
  }
}

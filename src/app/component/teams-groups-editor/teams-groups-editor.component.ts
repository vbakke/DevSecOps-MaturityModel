// Main container for teams/groups editing
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { GroupName, TeamGroups, TeamName, TeamNames } from 'src/app/model/meta';
import { perfNow, renameArrayElement } from 'src/app/util/util';


enum EditMode { NONE, TEAMS, GROUPS};


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
  @Output() changed = new EventEmitter<{teams: TeamNames, teamGroups: TeamGroups}>();
  editMode: EditMode = EditMode.NONE;
  selectedTeamId: string | null = null;
  selectedGroupId: string | null = null;
  // Make a local copy of parent
  localCopyTeams: TeamNames = [];
  localCopyTeamGroups: TeamGroups = {};
  localCopyGroupNames: GroupName[] = [];


  
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

  onTeamSelected(teamId: string) {
    this.selectedGroupId = null; 
    this.highlightedTeams = []; 
    this.selectedTeamId = teamId;
    this.highlightedGroups = this.localCopyGroupNames.filter(group => (this.localCopyTeamGroups[group] || []).includes(teamId));
  }
  onGroupSelected(groupId: string) {
    this.selectedTeamId = null;
    this.highlightedGroups = [];
    this.selectedGroupId = groupId;
    this.highlightedTeams = this.localCopyTeamGroups[groupId] || [];
  }
  onAddTeam() { 
    let newName: string = `Team ${this.localCopyTeams.length + 1}`;
    this.localCopyTeams.push(newName);
    this.onTeamSelected(newName);
   }
  onRenameTeam(event: { oldName: string, newName: string }) { 
    console.log(`${perfNow()}: Rename team: ${event.oldName} to ${event.newName}`);
    this.localCopyTeams = renameArrayElement(this.localCopyTeams, event.oldName, event.newName);
    for (let group in this.localCopyTeamGroups) {
      this.localCopyTeamGroups[group] = renameArrayElement(this.localCopyTeamGroups[group], event.oldName, event.newName);
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
    console.log(`${perfNow()}: Rename team: ${event.oldName} to ${event.newName}`);
    this.localCopyGroupNames = renameArrayElement(this.localCopyGroupNames, event.oldName, event.newName);
    this.localCopyTeamGroups[event.newName] = this.localCopyTeamGroups[event.oldName] || [];
    delete this.localCopyTeamGroups[event.oldName];
  }
  onDeleteGroup(groupId: string) { 
    delete this.localCopyTeamGroups[groupId];
    this.localCopyGroupNames = this.localCopyGroupNames.filter(group => group !== groupId);
  }

  onSave() {
    console.log(`${perfNow()}: Saving teams and groups`);
    this.editMode = EditMode.NONE;
    this.saveLocalCopy();
    this.highlightedTeams = [];
    this.highlightedGroups = [];
    this.selectedTeamId = null;
    this.selectedGroupId = null;
    this.changed.emit({teams: this.teams, teamGroups: this.teamGroups});
  }

  onCancelEdit() {
    console.log(`${perfNow()}: Cancel editing teams and groups`);
    this.editMode = EditMode.NONE;
    this.makeLocalCopy(); // Make a _new_ local copy of the original values
    this.selectedTeamId = null;
    this.selectedGroupId = null;
    this.highlightedTeams = [];
    this.highlightedGroups = [];
  }
}

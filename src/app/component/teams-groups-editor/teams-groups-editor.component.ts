// Main container for teams/groups editing
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-teams-groups-editor',
  templateUrl: './teams-groups-editor.component.html',
  styleUrls: ['./teams-groups-editor.component.css']
})
export class TeamsGroupsEditorComponent {
  @Input() teams: string[] = [];
  @Input() groups: string[] = [];
  @Input() highlightedTeamIds: string[] = [];
  @Input() highlightedGroupIds: string[] = [];
  @Output() teamSelected = new EventEmitter<string>();
  @Output() groupSelected = new EventEmitter<string>();
  @Output() addTeam = new EventEmitter<void>();
  @Output() renameTeam = new EventEmitter<{ oldName: string, newName: string }>();
  @Output() deleteTeam = new EventEmitter<string>();
  @Output() addGroup = new EventEmitter<void>();
  @Output() renameGroup = new EventEmitter<{ oldName: string, newName: string }>();
  @Output() deleteGroup = new EventEmitter<string>();
  editMode = false;
  selectedTeamId: string | null = null;
  selectedGroupId: string | null = null;

  onTeamSelected(teamId: string) {
    this.selectedTeamId = teamId;
    this.selectedGroupId = null; // Remove selection from group list
    this.teamSelected.emit(teamId);
    // Update highlightedGroupIds based on team-group membership
  }
  onGroupSelected(groupId: string) {
    this.selectedGroupId = groupId;
    this.selectedTeamId = null; // Remove selection from team list
    this.groupSelected.emit(groupId);
    // Update highlightedTeamIds based on group-team membership
  }
  onAddTeam() { this.addTeam.emit(); }
  onRenameTeam(event: { oldName: string, newName: string }) { this.renameTeam.emit(event); }
  onDeleteTeam(teamId: string) { this.deleteTeam.emit(teamId); }
  onAddGroup() { this.addGroup.emit(); }
  onRenameGroup(event: { oldName: string, newName: string }) { this.renameGroup.emit(event); }
  onDeleteGroup(groupId: string) { this.deleteGroup.emit(groupId); }
}

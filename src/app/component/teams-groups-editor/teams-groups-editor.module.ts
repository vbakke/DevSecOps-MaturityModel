import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamsGroupsEditorComponent } from './teams-groups-editor.component';
import { SelectableListComponent } from './selectable-list.component';

@NgModule({
  declarations: [TeamsGroupsEditorComponent, SelectableListComponent],
  imports: [CommonModule],
  exports: [TeamsGroupsEditorComponent]
})
export class TeamsGroupsEditorModule {}

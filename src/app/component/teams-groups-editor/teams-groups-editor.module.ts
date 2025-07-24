import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamsGroupsEditorComponent } from './teams-groups-editor.component';
import { SelectableListComponent } from './selectable-list.component';
import { MaterialModule } from '../../material/material.module';

@NgModule({
  declarations: [TeamsGroupsEditorComponent, SelectableListComponent],
  imports: [CommonModule, MaterialModule],
  exports: [TeamsGroupsEditorComponent]
})
export class TeamsGroupsEditorModule {}

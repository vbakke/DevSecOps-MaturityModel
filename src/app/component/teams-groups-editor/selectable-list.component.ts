import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-selectable-list',
  templateUrl: './selectable-list.component.html',
  styleUrls: ['./selectable-list.component.css']
})
export class SelectableListComponent {
  @Input() items: string[] = [];
  @Input() selectedItemId: string | null = null;
  @Input() highlightedItemIds: string[] = [];
  @Input() editMode = false;
  @Input() addLabel = 'Add';
  @Input() typeLabel = '';
  @Output() itemSelected = new EventEmitter<string>();
  @Output() addItem = new EventEmitter<void>();
  @Output() renameItem = new EventEmitter<{oldName: string, newName: string}>();
  @Output() deleteItem = new EventEmitter<string>();

  editingId: string | null = null;
  editingName: string = '';

  startEdit(name: string) {
    this.editingId = name;
    this.editingName = name;
  }

  saveEdit(name: string) {
    if (this.editingId && this.editingName.trim() && this.editingName !== name) {
      this.renameItem.emit({ oldName: this.editingId, newName: this.editingName.trim() });
    }
    this.editingId = null;
    this.editingName = '';
  }
} 

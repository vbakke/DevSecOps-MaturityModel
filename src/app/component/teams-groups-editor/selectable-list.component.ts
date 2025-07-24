import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface SelectableListItem {
  id: string;
  name: string;
}

@Component({
  selector: 'app-selectable-list',
  templateUrl: './selectable-list.component.html',
  styleUrls: ['./selectable-list.component.css']
})
export class SelectableListComponent {
  @Input() items: SelectableListItem[] = [];
  @Input() selectedItemId: string | null = null;
  @Input() highlightedItemIds: string[] = [];
  @Input() editMode = false;
  @Input() addLabel = 'Add';
  @Input() typeLabel = '';
  @Output() itemSelected = new EventEmitter<string>();
  @Output() addItem = new EventEmitter<void>();
  @Output() renameItem = new EventEmitter<{id: string, name: string}>();
  @Output() deleteItem = new EventEmitter<string>();

  editingId: string | null = null;
  editingName: string = '';

  startEdit(item: SelectableListItem) {
    this.editingId = item.id;
    this.editingName = item.name;
  }

  saveEdit(item: SelectableListItem) {
    if (this.editingId && this.editingName.trim() && this.editingName !== item.name) {
      this.renameItem.emit({ id: this.editingId, name: this.editingName.trim() });
    }
    this.editingId = null;
    this.editingName = '';
  }
}

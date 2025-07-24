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
  @Output() renameItem = new EventEmitter<string>();
  @Output() deleteItem = new EventEmitter<string>();
}

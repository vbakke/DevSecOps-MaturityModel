import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router, NavigationExtras } from '@angular/router';
import { stringify } from 'qs';
import { LoaderService } from 'src/app/service/loader/data-loader.service';
import { Activity, ActivityStore, Data } from 'src/app/model/activity-store';
import { UntilDestroy } from '@ngneat/until-destroy';
import { MatChip, MatChipList } from '@angular/material/chips';
import { deepCopy } from 'src/app/util/util';
import {
  ModalMessageComponent,
  DialogInfo,
} from '../modal-message/modal-message.component';

export interface MatrixRow {
  Category: string;
  Dimension: string;
  level1: Activity[];
  level2: Activity[];
  level3: Activity[];
  level4: Activity[];
  level5: Activity[];
}
type LevelKey = keyof Pick<
  MatrixRow,
  'level1' | 'level2' | 'level3' | 'level4' | 'level5'
>;

@UntilDestroy()
@Component({
  selector: 'app-matrix',
  templateUrl: './matrix.component.html',
  styleUrls: ['./matrix.component.css'],
})
export class MatrixComponent implements OnInit {
  Routing: string = '/activity-description';
  activities: ActivityStore = new ActivityStore();
  data: Data = {};
  levels: Partial<Record<LevelKey, string>> = {};
  filtersTag: Record<string, boolean> = {};
  filtersDim: Record<string, boolean> = {};
  columnNames: string[] = [];
  allCategoryNames: string[] = [];
  allDimensionNames: string[] = [];
  MATRIX_DATA: MatrixRow[] = [];
  dataSource: any = new MatTableDataSource<MatrixRow>(this.MATRIX_DATA);

  constructor(
    private loader: LoaderService,
    private router: Router,
    public modal: ModalMessageComponent
  ) {}

  reset() {
    for (let dim in this.filtersDim) {
      this.filtersDim[dim] = false;
    }
    for (let tag in this.filtersTag) {
      this.filtersTag[tag] = false;
    }
    this.updateActivitiesBeingDisplayed();
  }

  ngOnInit(): void {
    this.loader
      .load()
      .then((activityStore: ActivityStore) => {
        this.setYamlData(activityStore);
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

  setYamlData(activityStore: ActivityStore) {
    this.activities = activityStore;
    this.data = this.activities.getData();
    this.allCategoryNames = this.activities.getAllCategoryNames();
    this.allDimensionNames = this.activities.getAllDimensionNames();

    this.MATRIX_DATA = this.buildMatrixData(this.activities);
    this.levels = this.buildLevels(this.loader.getLevels());
    this.filtersTag = this.buildFiltersForTag(this.activities.getAllActivities());  // eslint-disable-line
    this.filtersDim = this.buildFiltersForDim(this.MATRIX_DATA);
    this.columnNames = ['Category', 'Dimension'];
    this.columnNames.push(...Object.keys(this.levels));

    this.dataSource.data = deepCopy(this.MATRIX_DATA);
  }

  buildFiltersForTag(activities: Activity[]): Record<string, boolean> {
    let tags: Record<string, boolean> = {};
    for (let activity of activities) {
      if (activity.tags) {
        for (let tag of activity.tags) {
          tags[tag] = false;
        }
      }
    }
    return tags;
  }

  buildFiltersForDim(matrixData: MatrixRow[]): Record<string, boolean> {
    let dimensions: Record<string, boolean> = {};
    for (let item of matrixData) {
      if (item.Dimension) {
        dimensions[item.Dimension] = false;
      }
    }
    return dimensions;
  }

  buildLevels(levelNames: string[]): Record<string, string> {
    let levels: Record<string, string> = {};
    let i: number = 1;
    for (let name of levelNames) {
      levels['level' + i] = name;
      i++;
    }
    return levels;
  }

  buildMatrixData(activityStore: ActivityStore): MatrixRow[] {
    let matrixData: MatrixRow[] = [];
    for (let dim of this.allDimensionNames) {
      let matrixRow: Partial<MatrixRow> = {};
      for (let level = 1; level <= 5; level++) {
        let activities: Activity[] = activityStore.getActivities(dim, level);
        let levelLabel: LevelKey = `level${level}` as LevelKey;
        matrixRow[levelLabel] = activities;
        if (activities.length > 0 && !matrixRow.Category) {
          matrixRow['Category'] = activities[0].category;
          matrixRow['Dimension'] = activities[0].dimension;
        }
      }
      matrixData.push(matrixRow as MatrixRow);
    }
    return matrixData;
  }

  @ViewChild(MatChipList)
  chipsControl = new FormControl(['chipsControl']);
  chipList!: MatChipList;

  toggleTagFilters(chip: MatChip) {
    chip.toggleSelected();
    this.filtersTag[chip.value] = chip.selected;
    this.updateActivitiesBeingDisplayed();
  }

  toggleDimensionFilters(chip: MatChip) {
    chip.toggleSelected();
    this.filtersDim[chip.value] = chip.selected;
    this.updateActivitiesBeingDisplayed();
  }

  @ViewChild('rowInput') rowInput!: ElementRef<HTMLInputElement>;
  @ViewChild('activityInput') activityInput!: ElementRef<HTMLInputElement>;

  updateActivitiesBeingDisplayed(): void {
    let hasDimFilter = Object.values(this.filtersDim).some(v => v === true);
    let hasTagFilter = Object.values(this.filtersTag).some(v => v === true);

    if (!hasTagFilter && !hasDimFilter) {
      this.dataSource.data = this.MATRIX_DATA;
      return;
    }

    // Apply dimension filters
    let itemsStage1: MatrixRow[] = [];
    if (!hasDimFilter) {
      itemsStage1 = this.MATRIX_DATA;
    } else {
      for (let srcItem of this.MATRIX_DATA) {
        if (this.filtersDim[srcItem.Dimension]) {
          itemsStage1.push(srcItem as MatrixRow);
        }
      }
    }

    // Apply tag filters
    let itemsStage2: MatrixRow[];
    if (!hasTagFilter) {
      itemsStage2 = itemsStage1;
    } else {
      itemsStage2 = [];
      for (let srcItem of itemsStage1) {
        let hasContent = false;

        let trgItem: Partial<MatrixRow> = {};
        if (hasTagFilter) {
          // Include activities withing each level, that match the tag filter

          // If tag filter is active, filter activities by tags
          for (let lvl of Object.keys(this.levels) as LevelKey[]) {
            let tmp: Activity[];
            tmp = srcItem[lvl].filter(activity => this.hasTag(activity));
            if (tmp.length > 0) {
              trgItem[lvl] = tmp;
              hasContent = true;
            }
          }

          // Only include the row if it has any activities after tag filtering
          if (hasContent) {
            // Copy metadata, since the element has remaining activities after filtering
            trgItem.Category = srcItem.Category;
            trgItem.Dimension = srcItem.Dimension;

            itemsStage2.push(trgItem as MatrixRow);
          }
        }
      }
    }
    this.dataSource.data = itemsStage2;
  }

  hasTag(activity: Activity): boolean {
    if (activity.tags) {
      for (let tagName of activity.tags) {
        if (this.filtersTag[tagName]) return true;
      }
    }
    return false;
  }

  hasFilterValues(filter: Record<string, boolean>): boolean {
    let lastValue: boolean | null = null;
    for (let value of Object.values(filter)) {
      if (lastValue == null) {
        lastValue = value;
      } else {
        if (value != lastValue) return true;
      }
    }
    return false;
  }

  // activity description routing + providing parameters
  navigate(uuid: string) {
    let navigationExtras: NavigationExtras = {
      queryParams: { uuid: uuid },
    };
    return `${this.Routing}?${stringify(navigationExtras.queryParams)}`;
  }
}

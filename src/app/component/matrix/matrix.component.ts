import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { Router, NavigationExtras } from '@angular/router';
import { stringify } from 'qs';
import { LoaderService } from 'src/app/service/loader/data-loader.service';
import { Activity, ActivityStore, Data } from 'src/app/model/activity-store';


import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { MatChip, MatChipList } from '@angular/material/chips';
import { deepCopy } from 'src/app/util/util';

export interface MatrixElement {
  Category: string;
  Dimension: string;
  level1: Activity[];
  level2: Activity[];
  level3: Activity[];
  level4: Activity[];
  level5: Activity[];
}
type LevelKey = keyof Pick<MatrixElement, 'level1' | 'level2' | 'level3' | 'level4' | 'level5'>;

@UntilDestroy()
@Component({
  selector: 'app-matrix',
  templateUrl: './matrix.component.html',
  styleUrls: ['./matrix.component.css'],
})
export class MatrixComponent implements OnInit {
  // OLD_MATRIX_DATA: MatrixElement[] = [];

  Routing: string = '/activity-description';

  // OLD_YamlObject: any;

  // OLD_displayedColumns: string[] = ['Dimension', 'SubDimension'];
  // OLD_displayedColumns: string[] = Object(new MatrixElement()).keys;


  OLD_lvlColumn: string[] = [];
  OLD_allRows: string[] = [];
  // OLD_dataSource: any = new MatTableDataSource<MatrixElement>(this.OLD_MATRIX_DATA);
  OLD_subDimensionVisible: string[] = [];
  OLD_activityVisible: string[] = [];
  OLD_allDimensionNames: string[] = [];
  OLD_listSubDimension:  string[] = [];
  OLD_listTags: string[] = [];
  
  activities: ActivityStore = new ActivityStore();
  data: Data = {};
  levels: Partial<Record<LevelKey, string>> = {};
  filtersTag:  Record<string, boolean> = {};
  filtersDim: Record<string, boolean> = {};
  columnNames:  string[] = [];
  allCategoryNames:  string[] = [];
  allDimensionNames:  string[] = [];
  MATRIX_DATA: MatrixElement[] = [];
  matrix_data: MatrixElement[] = [];
  dataSource: any = new MatTableDataSource<MatrixElement>(this.MATRIX_DATA);

  constructor(private loader: LoaderService, private router: Router) {
  }

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
    // Function sets column header
    this.loader.load().then((activityStore: ActivityStore) => {
      this.activities = activityStore;
      this.data = this.activities.getData();
      this.allCategoryNames = this.activities.getAllCategoryNames();
      this.allDimensionNames = this.activities.getAllDimensionNames();
      console.log('getAllDimensionNames()', this.allDimensionNames);
      
      this.MATRIX_DATA = this.buildMatrixData(this.activities);
      this.levels = this.buildLevels(this.loader.getLevels());
      this.filtersTag = this.buildTags(this.activities.getAllActivities());
      this.filtersDim = this.buildDimensions(this.MATRIX_DATA);
      this.columnNames = ['Category', 'Dimension'];
      this.columnNames.push(...Object.keys(this.levels));

      this.dataSource.data = deepCopy(this.MATRIX_DATA);
    });
  }

  buildTags(activities: Activity[]): Record<string, boolean> {
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

  buildLevels(levelNames: string[]): Record<string, string> {
    let levels: Record<string, string> = {};
    let i: number = 1;
    for (let name of levelNames) {
      levels['level' + i++] = name;
    }
    return levels;
  }
  
  buildMatrixData(activityStore: ActivityStore): MatrixElement[] {
    let matrixData: MatrixElement[] = [];
    for (let dimName of this.allDimensionNames) {
      let matrixRow:any = {};
      for (let level = 1; level <= 5; level++) {
        let activities: Activity[] = activityStore.getActivities(dimName, level);
        let levelLabel = `level${level}`;
        matrixRow[levelLabel] = activities;

        if (activities.length > 0 && !matrixRow.Category) {
          matrixRow['Category'] = activities[0].category;
          matrixRow['Dimension'] = activities[0].dimension;
        }
      }
      matrixData.push(matrixRow);
    }
    return matrixData;
  }

  buildDimensions(matrixData: MatrixElement[]): Record<string, boolean> {
    let dimensions: Record<string, boolean> = {};
    for (let item of matrixData) {
      if (item.Dimension) {
        dimensions[item.Dimension] = false; // Initially none are selected
      }
    }
    return dimensions;
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

  //chips
  separatorKeysCodes: number[] = [ENTER, COMMA];
  rowCtrl = new FormControl('');
  rowCtrlActivity = new FormControl('');
  // filteredSubDimension: Observable<string[]>;
  // filteredActivities: Observable<string[]>;
  autoCompeteResults: string[] = [];
  autoCompleteActivityResults: string[] = [];

  @ViewChild('rowInput') rowInput!: ElementRef<HTMLInputElement>;
  @ViewChild('activityInput') activityInput!: ElementRef<HTMLInputElement>;

  updateActivitiesBeingDisplayed(): void {
    let hasDimFilter = Object.values(this.filtersDim).some(v => v === true);
    let hasTagFilter = Object.values(this.filtersTag).some(v => v === true);

    if (!hasTagFilter && !hasDimFilter) {
      this.dataSource.data = this.MATRIX_DATA;
      return;
    }

    // Apply filters
    let items: MatrixElement[] = [];
    for (let srcItem of this.MATRIX_DATA) {
      // Skip dimension that are not selected
      if (hasDimFilter && !this.filtersDim[srcItem.Dimension]) {
        continue;
      }

      // Include activities withing each level, that match the tag filter
      let trgItem: Partial<MatrixElement> = {};
      
      // If tag filter is active, filter activities by tags
      for (let lvl of (Object.keys(this.levels) as LevelKey[])) {
        trgItem[lvl] = hasTagFilter ? 
          srcItem[lvl].filter(activity => this.hasTag(activity)) :
          srcItem[lvl];
      }

      // Only include the row if it has any activities after tag filtering
      if (hasTagFilter && Object.keys(this.levels).every(lvl => (trgItem[lvl as LevelKey] as Activity[]).length === 0)) {
        continue;
      }

      // Copy metadata, since the element has remaining activities after filtering
      trgItem.Category = srcItem.Category;
      trgItem.Dimension = srcItem.Dimension;
      // trgItem.Dimension = srcItem.Dimension;

      items.push(trgItem as MatrixElement);
    }

    this.dataSource.data = deepCopy(items);
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

  private filterDimension(value: string): string[] {
    return this.autoCompeteResults.filter(
      row => row.toLowerCase().indexOf(value.toLowerCase()) === 0
    );
  }
  private filterActivity(value: string): string[] {
    return this.autoCompleteActivityResults.filter(
      activity => activity.toLowerCase().indexOf(value.toLowerCase()) === 0
    );
  }

  // activity description routing + providing parameters

  navigate(
    uuid: string,
    // dim: string,
    // subdim: string,
    // lvl: Number,
    // activityName: string
  ) {
    let navigationExtras: NavigationExtras = {
      queryParams: {
        uuid: uuid,
        // dimension: dim,
        // subDimension: subdim,
        // level: lvl,
        // activityName: activityName,
      },
    };
    return `${this.Routing}?${stringify(navigationExtras.queryParams)}`;
  }
}

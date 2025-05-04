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
  SubDimension: string;
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
  OLD_MATRIX_DATA: MatrixElement[] = [];

  Routing: string = '/activity-description';

  OLD_YamlObject: any;

  OLD_displayedColumns: string[] = ['Dimension', 'SubDimension'];
  // OLD_displayedColumns: string[] = Object(new MatrixElement()).keys;


  OLD_lvlColumn: string[] = [];
  OLD_allRows: string[] = [];
  OLD_dataSource: any = new MatTableDataSource<MatrixElement>(this.OLD_MATRIX_DATA);
  OLD_subDimensionVisible: string[] = [];
  OLD_activityVisible: string[] = [];
  OLD_allDimensionNames: string[] = [];
  OLD_listSubDimension:  string[] = [];
  OLD_listTags: string[] = [];
  
  activities: ActivityStore = new ActivityStore();
  data: Data = {};
  levels: Partial<Record<LevelKey, string>> = {};
  filtersTag:  Record<string, boolean> = {};
  columnNames:  string[] = [];
  allCategoryNames:  string[] = [];
  allDimensionNames:  string[] = [];
  MATRIX_DATA: MatrixElement[] = [];
  matrix_data: MatrixElement[] = [];
  dataSource: any = new MatTableDataSource<MatrixElement>(this.MATRIX_DATA);

  constructor(private loader: LoaderService, private router: Router) {
    this.filteredSubDimension = this.rowCtrl.valueChanges.pipe(
      startWith(null),
      map((row: string | null) =>
        row ? this.filterSubDimension(row) : this.autoCompeteResults.slice()
      )
    );
    this.filteredActivities = this.rowCtrlActivity.valueChanges.pipe(
      startWith(null),
      map((activity: string | null) =>
        activity
          ? this.filterActivity(activity)
          : this.autoCompleteActivityResults.slice()
      )
    );
  }
  reset() {
    for (let tag in this.filtersTag) {
      this.filtersTag[tag] = false;
    }
    this.updateActivitiesBeingDisplayed();
  }
  // function to initialize if level columns exists

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
      this.columnNames = ['Dimension', 'SubDimension'];
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

        if (activities.length > 0 && !matrixRow.Dimension) {
          matrixRow['Dimension'] = activities[0].category;
          matrixRow['SubDimension'] = activities[0].dimension;
        }
      }
      matrixData.push(matrixRow);
    }
    return matrixData;
  }

/*
  OLD_ngOnInit(): void {
    this.loader.load().then(() => {
  //     this.OLD_YamlObject = this.loader.activities.data;
      // Levels header
      // this.levels = this.loader.getLevels();
      // pushes Levels in displayed column
      // for (let k = 1; k <= this.levels.length; k++) {
      //   this.OLD_displayedColumns.push('level' + k);
      //   this.OLD_lvlColumn.push('level' + k);
      // }

      var activitySet = new Set();

      //gets value from generated folder
      // Function sets data
      this.OLD_YamlObject = this.loader.activities.data;

      this.OLD_allDimensionNames = Object.keys(this.OLD_YamlObject);

      for (let i = 0; i < this.OLD_allDimensionNames.length; i++) {
        var subdimensionsInCurrentDimension = Object.keys(
          this.OLD_YamlObject[this.OLD_allDimensionNames[i]]
        );

        for (let j = 0; j < subdimensionsInCurrentDimension.length; j++) {
          var temp: any = {
            Dimension: this.OLD_allDimensionNames[i],
            SubDimension: subdimensionsInCurrentDimension[j],
          };

          // for (let k = 0; k < this.levels.length; k++) {
          //   temp = {
          //     ...temp,
          //     [this.OLD_lvlColumn[k] as keyof number]: [],
          //   };
          // }

          var activityInCurrentSubDimension: string[] = Object.keys(
            this.OLD_YamlObject[this.OLD_allDimensionNames[i]][
              subdimensionsInCurrentDimension[j]
            ]
          );

          for (let a = 0; a < activityInCurrentSubDimension.length; a++) {
            var currentActivityName = activityInCurrentSubDimension[a];
            var tagsInCurrentActivity: string[] =
              this.OLD_YamlObject[this.OLD_allDimensionNames[i]][
                subdimensionsInCurrentDimension[j]
              ][currentActivityName].tags;
            if (tagsInCurrentActivity) {
              for (let curr = 0; curr < tagsInCurrentActivity.length; curr++) {
                activitySet.add(tagsInCurrentActivity[curr]);
              }
            }

            try {
              var lvlOfActivity: number =
                this.OLD_YamlObject[this.OLD_allDimensionNames[i]][
                  subdimensionsInCurrentDimension[j]
                ][currentActivityName]['level'];

              (
                temp[
                  this.OLD_lvlColumn[lvlOfActivity - 1] as keyof number
                ] as unknown as string[]
              ).push(currentActivityName);
            } catch {
              console.log('Level for activity does not exist');
            }
          }
          console.log('MATRIX_DATA, Adding: ', temp);
          this.OLD_MATRIX_DATA.push(temp);
        }
      }
      this.OLD_dataSource.data = JSON.parse(JSON.stringify(this.OLD_MATRIX_DATA));
      this.dataSource.data = JSON.parse(JSON.stringify(this.MATRIX_DATA));
      this.createSubDimensionList();
      this.createActivityTags(activitySet);
      console.log('MATRIX_DATA', this.MATRIX_DATA);
      console.log('OLD_MATRIX_DATA', this.OLD_MATRIX_DATA);
      console.log('OLD_displayedColumns', this.OLD_displayedColumns);
      console.log('OLD_lvlColumn', this.OLD_lvlColumn);
      });
    this.OLD_dataSource.data = JSON.parse(JSON.stringify(this.OLD_MATRIX_DATA));
    this.dataSource.data = JSON.parse(JSON.stringify(this.MATRIX_DATA));
    this.createSubDimensionList();

  }
    */

  @ViewChild(MatChipList)
  chipsControl = new FormControl(['chipsControl']);
  chipList!: MatChipList;

  // @ViewChild(MatChip)
  // currentTags: string[] = [];
  // createActivityTags(activitySet: Set<any>): void {
  //   activitySet.forEach(tag => {
  //     // this.listTags.push(tag);
  //     this.OLD_activityVisible.push(tag);
  //     this.currentTags.push(tag);
  //   });
  //   this.updateActivitesBeingDisplayed();
  // }

  toggleTagFilters(chip: MatChip) {
    chip.toggleSelected();
    this.filtersTag[chip.value] = chip.selected;
    this.updateActivitiesBeingDisplayed();
  }

  // OLD_listSubDimension: string[] = [];
  oLD_currentSubDimensions: string[] = [];
  OLD_createSubDimensionList(): void {
    let i = 0;
    while (i < this.OLD_MATRIX_DATA.length) {
      if (!this.OLD_allRows.includes(this.OLD_MATRIX_DATA[i].SubDimension)) {
        this.OLD_allRows.push(this.OLD_MATRIX_DATA[i].SubDimension);
        this.OLD_subDimensionVisible.push(this.OLD_MATRIX_DATA[i].SubDimension);
        // this.OLD_listSubDimension.push(this.MATRIX_DATA[i].SubDimension);
        this.oLD_currentSubDimensions.push(this.OLD_MATRIX_DATA[i].SubDimension);
      }
      i++;
    }
    console.log('OLD_listSubDimension', this.OLD_listSubDimension);
  }

  toggleSubDimensionSelection(chip: MatChip) {
    chip.toggleSelected();
    if (chip.selected) {
      this.oLD_currentSubDimensions = [...this.oLD_currentSubDimensions, chip.value];
      this.OLD_subDimensionVisible = this.oLD_currentSubDimensions;
      this.OLD_selectedSubDimension(chip.value);
    } else {
      this.oLD_currentSubDimensions = this.oLD_currentSubDimensions.filter(
        o => o !== chip.value
      );
      this.OLD_subDimensionVisible = this.oLD_currentSubDimensions;
      this.OLD_removeSubDimensionFromFilter(chip.value);
    }
  }

  //chips
  separatorKeysCodes: number[] = [ENTER, COMMA];
  rowCtrl = new FormControl('');
  rowCtrlActivity = new FormControl('');
  filteredSubDimension: Observable<string[]>;
  filteredActivities: Observable<string[]>;
  autoCompeteResults: string[] = [];
  autoCompleteActivityResults: string[] = [];

  @ViewChild('rowInput') rowInput!: ElementRef<HTMLInputElement>;
  @ViewChild('activityInput') activityInput!: ElementRef<HTMLInputElement>;

  updateActivitiesBeingDisplayed(): void {
    let hasFilter:Boolean = this.hasFilterValues(this.filtersTag);
    if (!hasFilter) {
      this.dataSource.data = this.MATRIX_DATA;
    } else {
      let items: MatrixElement[] = [];

      for (let srcItem of this.MATRIX_DATA) {
        let trgItem: Partial<MatrixElement> = {};
        for (let lvl of (Object.keys(this.levels) as LevelKey[])) {
          trgItem[lvl] = srcItem[lvl].filter(activity => this.hasTag(activity))
        }
        trgItem.Category = srcItem.Category;
        trgItem.Dimension = srcItem.Dimension;
        trgItem.SubDimension = srcItem.SubDimension;

        items.push(trgItem as MatrixElement);
      }

      this.dataSource.data = deepCopy(items);
    }
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

  OLD_updateActivitesBeingDisplayed(): void {
    // Iterate over all objects and create new MATRIX_DATA
    var updatedActivities: any = [];

    for (let i = 0; i < this.OLD_allDimensionNames.length; i++) {
      var subdimensionsInCurrentDimension = Object.keys(
        this.OLD_YamlObject[this.OLD_allDimensionNames[i]]
      );

      for (let j = 0; j < subdimensionsInCurrentDimension.length; j++) {
        var temp: any = {
          Dimension: this.OLD_allDimensionNames[i],
          SubDimension: subdimensionsInCurrentDimension[j],
        };
        // for (let k = 0; k < this.levels.length; k++) {
        //   temp = {
        //     ...temp,
        //     [this.OLD_lvlColumn[k] as keyof number]: [],
        //   };
        // }
        var activityInCurrentSubDimension: string[] = Object.keys(
          this.OLD_YamlObject[this.OLD_allDimensionNames[i]][
            subdimensionsInCurrentDimension[j]
          ]
        );
        for (let a = 0; a < activityInCurrentSubDimension.length; a++) {
          var currentActivityName = activityInCurrentSubDimension[a];
          var tagsInCurrentActivity: string[] =
            this.OLD_YamlObject[this.OLD_allDimensionNames[i]][
              subdimensionsInCurrentDimension[j]
            ][currentActivityName].tags;
          let flag = 0;
          if (tagsInCurrentActivity) {
            for (let curr = 0; curr < tagsInCurrentActivity.length; curr++) {
              if (this.OLD_activityVisible.includes(tagsInCurrentActivity[curr])) {
                flag = 1;
              }
            }
          }
          if (flag === 1) {
            try {
              var lvlOfActivity: number =
                this.OLD_YamlObject[this.OLD_allDimensionNames[i]][
                  subdimensionsInCurrentDimension[j]
                ][currentActivityName]['level'];

              (
                temp[
                  this.OLD_lvlColumn[lvlOfActivity - 1] as keyof number
                ] as unknown as string[]
              ).push(currentActivityName);
            } catch {
              console.log('Level for Activity does not exist');
            }
          }
        }
        if (this.OLD_subDimensionVisible.includes(temp.SubDimension)) {
          updatedActivities.push(temp);
        }
      }
    }

    this.OLD_dataSource.data = JSON.parse(JSON.stringify(updatedActivities));
  }

  OLD_removeSubDimensionFromFilter(row: string): void {
    let index = this.OLD_subDimensionVisible.indexOf(row);
    if (index >= 0) {
      this.OLD_subDimensionVisible.splice(index, 1);
    }
    this.autoCompeteResults.push(row);
    this.OLD_updateActivitesBeingDisplayed();
  }

  //Add chips
  OLD_selectedSubDimension(value: string): void {
    this.OLD_subDimensionVisible.push(value);
    this.OLD_updateActivitesBeingDisplayed();
  }

  private filterSubDimension(value: string): string[] {
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

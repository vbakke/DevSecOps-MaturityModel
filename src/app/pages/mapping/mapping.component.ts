import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ymlService } from '../../service/yaml-parser/yaml-parser.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
import * as XLSX from 'xlsx';
import { LoaderService } from 'src/app/service/loader/data-loader.service';
import { DialogInfo, ModalMessageComponent } from 'src/app/component/modal-message/modal-message.component';
import { DataStore } from 'src/app/model/data-store';

export interface MappingRow {
  dimension: string;
  subDimension: string;
  activityName: string;
  samm2: string[] | string;
  ISO17: string[] | string;
  ISO22: string[] | string;
  description?: string;
  risk?: string;
  measure?: string;
  knowledge?: string;
  resources?: string;
  time?: string;
  usefulness?: string;
  dependsOn?: string[];
  comments?: string;
  assessment?: string;
  level?: number;
  implementation?: any;
  teamImplementation?: { [key: string]: boolean };
  teamsEvidence?: { [key: string]: string };
}

// Enum for sort mode
enum SortMode {
  Activity = 'sortByActivity',
  SAMM = 'sortBySAMM',
  ISO17 = 'sortByISO',
  ISO22 = 'sortByISO22',
}

@Component({
  selector: 'app-mapping',
  templateUrl: './mapping.component.html',
  styleUrls: ['./mapping.component.css'],
})
export class MappingComponent implements OnInit, AfterViewInit {
  allMappings: MappingRow[] = [];
  dataSource = new MatTableDataSource<MappingRow>([]);
  currentSort: SortMode = SortMode.Activity;

  //labels
  knowledgeLabels: string[] = [];
  generalLabels: string[] = [];

  allTeams: string[] = [];
  displayedColumns: string[] = [
    'dimension',
    'subDimension',
    'activityName',
    'samm2',
    'ISO17',
    'ISO22',
  ];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  SortCtrl = new FormControl(SortMode.Activity);

  @ViewChild('chipInput') chipInput!: ElementRef<HTMLInputElement>;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;

  dataStore: DataStore = new DataStore();

  constructor(
    private yaml: ymlService,
    private loader: LoaderService,
    public modal: ModalMessageComponent
  ) {}

  ngOnInit(): void {
    this.loader
      .load()
      .then((dataStore: DataStore) => {
        this.setYamlData(dataStore);
        this.allMappings = this.transformDataStore(dataStore);
        this.updateDataSource();
      })
      .catch(err => {
        this.displayMessage(new DialogInfo(err.message, 'An error occurred'));
        if (err.hasOwnProperty('stack')) {
          console.warn(err);
        }
      });

    this.SortCtrl.valueChanges.subscribe((sort: SortMode) => {
      this.currentSort = sort;
      this.updateDataSource();
    });
  }

  ngAfterViewInit() {
    if (this.sort) {
      this.dataSource.sort = this.sort;
      this.dataSource.sortingDataAccessor = (item: MappingRow, property: string) => {
        const value = (item as any)[property];
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value;
      };
    }
  }

  displayMessage(dialogInfo: DialogInfo) {
    this.modal.openDialog(dialogInfo);
  }

  setYamlData(dataStore: DataStore) {
    this.dataStore = dataStore;
  }

  // Transform DataStore to MappingRow[]
  transformDataStore(dataStore: DataStore): MappingRow[] {
    if (!dataStore.activityStore) {
      return [];
    }

    return dataStore.activityStore.getAllActivities().map(activity => {
      return {
        dimension: activity.category || '',
        subDimension: activity.dimension || '',
        activityName: activity.name || '',
        samm2: activity?.references?.samm2 || [],
        ISO17: activity?.references?.iso27001_2017 || [],
        ISO22: activity?.references?.iso27001_2022 || [],
        description: activity.description || '',
        risk: activity.risk || '',
        measure: activity.measure || '',
        knowledge: dataStore.getMetaString('knowledgeLabels', activity.knowledge),
        resources: dataStore.getMetaString('labels', activity.resources),
        time: dataStore.getMetaString('labels', activity.time),
        usefulness: dataStore.getMetaString('labels', activity.usefulness),
        dependsOn: activity.dependsOn || [],
        comments: activity.comments || '',
        assessment: activity.assessment || '',
        level: activity.level || 0,
        implementation: activity.implementation || {},
        // teamsEvidence: activity.teamsEvidence || {},
      };
    });
  }

  // Filtering and sorting logic
  updateDataSource() {
    let data = this.allMappings;
    this.dataSource.data = data;
  }

  exportToExcel() {
    let element = document.getElementById('excel-table');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Planned-Activities-Sorted-By-ISO17.xlsx');
  }
}

import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DialogInfo, ModalMessageComponent } from 'src/app/component/modal-message/modal-message.component';
import { SelectionChangedEvent, TeamsGroupsChangedEvent } from 'src/app/component/teams-groups-editor/teams-groups-editor.component';
import { Activity } from 'src/app/model/activity-store';
import { DataStore, } from 'src/app/model/data-store';
import { TeamActivityProgress as progressStoreMapping } from 'src/app/model/progress-store';
import { TeamGroups, TeamName, TeamNames, TeamProgress, Uuid } from 'src/app/model/types';
import { LoaderService } from 'src/app/service/loader/data-loader.service';
import { downloadYamlFile } from 'src/app/util/download';
import { isEmptyObj, perfNow, dateStr, uniqueCount } from 'src/app/util/util';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.css'],
})
export class TeamsComponent implements OnInit {
  dateStr = dateStr;
  dataStore: DataStore = new DataStore();
  canEdit: boolean = false;
  teams: TeamNames = [];
  teamGroups: TeamGroups = {};

  infoTitle: string = '';
  infoTeams: TeamNames = [];
  info: Record<string, TeamSummary> = {};

  dataSource: MatTableDataSource<TeamActivityProgress> = new MatTableDataSource<TeamActivityProgress>([]);
  allColumnNames: string[] = [];
  progressColumnNames: string[] = [];
  @ViewChild(MatSort, { static: false }) sort!: MatSort;

  constructor(
        private loader: LoaderService,
        public modal: ModalMessageComponent    
  ) {}

  ngOnInit(): void {
    console.log(`${perfNow()}: Teams: Loading yamls...`);
    this.loader
      .load()
      .then((dataStore: DataStore) => {
        this.setYamlData(dataStore);
        console.log(`${perfNow()}: Page loaded: Teams`);
      })
      .catch(err => {
        this.displayMessage(new DialogInfo(err.message, 'An error occurred'));
        if (err.hasOwnProperty('stack')) {
          console.warn(err);
        }
      });
  }

  
    ngAfterViewInit() {
    if (this.sort) {
      this.dataSource.sort = this.sort;
      this.dataSource.sortingDataAccessor = (item: TeamActivityProgress, property: string) => {
          if (property === 'Team') {
            return item.team;
          }
          if (property === 'Activity') {
            return item.activity?.name || '';
          }
          // For progress columns, sort by date string or timestamp
          if (this.progressColumnNames.includes(property)) {
            // If your progress is a date string, you may want to convert to Date for proper sorting
            const value = item.progress?.[property];
            return value ? new Date(value).getTime() : 0;
          }
          return ''; 
     };
    }
  }
  
  
  displayMessage(dialogInfo: DialogInfo) {
    this.modal.openDialog(dialogInfo);
  }

  setYamlData(dataStore: DataStore) {
    this.dataStore = dataStore;
    if (this.dataStore.meta) {
      this.canEdit = this.dataStore.meta.allowChangeTeamNameInBrowser;
    }

    this.teams = dataStore?.meta?.teams || [];
    this.teamGroups = dataStore?.meta?.teamGroups || {};

    this.progressColumnNames = this.dataStore?.progressStore?.getInProgressTitles() || [];
    this.allColumnNames = ['Team', 'Activity', ...this.progressColumnNames];
  }

  onSelectionChanged(event: SelectionChangedEvent) {
    console.log(`${perfNow()}: Selection changed: ${JSON.stringify(event)}`);
    if (event.selectedTeam) {
      this.infoTitle = event.selectedTeam;
      this.infoTeams = [ event.selectedTeam ];
    } else if (event.selectedGroup) {
      this.infoTitle = event.selectedGroup;
      this.infoTeams = this.teamGroups[event.selectedGroup] || [];
    }

    if (!this.info[this.infoTitle]) {
      this.info[this.infoTitle] = this.makeTeamSummary(this.infoTitle, this.infoTeams);
    }
    this.dataSource.data = this?.info[this.infoTitle]?.activitiesInProgress || [];
  }

  onTeamsChanged(event: TeamsGroupsChangedEvent) {
    console.log(`${perfNow()}: Saving teams: ${JSON.stringify(event.teams)}`);
    console.log(`${perfNow()}: Saving groups: ${JSON.stringify(event.teamGroups)}`);
    this.dataStore?.meta?.updateTeamsAndGroups(event.teams, event.teamGroups);
    if (!isEmptyObj(event.teamsRenamed)) {
      for (let oldName in event.teamsRenamed) {
        this.dataStore?.progressStore?.renameTeam(oldName, event.teamsRenamed[oldName]);
        delete this.info?.[oldName];
        delete this.info?.[event.teamsRenamed[oldName]];
      }
      this.dataStore?.progressStore?.saveToLocalStorage();
    }
    this.info[this.infoTitle] = this.makeTeamSummary(this.infoTitle, this.infoTeams);
    this.dataSource.data = this?.info[this.infoTitle]?.activitiesInProgress || [];
    
    this.setYamlData(this.dataStore);
  }


  onExportTeamGroups() {
    console.log(`${perfNow()}: Exporting teams and groups`);
    const yamlStr: string | undefined = this?.dataStore?.meta?.asStorableYamlString();

    if (!yamlStr) {
      this.displayMessage(new DialogInfo('No team and groups names stored locally in the browser', 'Export Error'));
      return;
    }

    downloadYamlFile(yamlStr, 'teams.yaml');
  } 

  async onResetTeamGroups() {
    let buttonClicked: string = await this.displayDeleteBrowserTeamsDialog();
    
    if (buttonClicked === 'Delete') {
      this.dataStore?.meta?.deleteLocalStorage();
      location.reload(); // Make sure all load routines are initialized
    }
  }

  displayDeleteBrowserTeamsDialog(): Promise<string> {
    return new Promise((resolve, reject) => {
      let title: string = 'Delete local browser data';
      let message: string =
        'Do you want to reset all team and group names?' +
        '\n\nThis will revert the names to the names stored in the yaml file on the server.';
      let buttons: string[] = ['Cancel', 'Delete'];
      this.modal
        .openDialog({ title, message, buttons, template: '' })
        .afterClosed()
        .subscribe(data => {
          resolve(data);
        });      
      }); 
  }


  makeTeamSummary(name: string, teams: TeamNames): TeamSummary {
    let activitiesCompleted: progressStoreMapping[] = this.dataStore?.progressStore?.getActivitiesCompletedForTeams(teams) || [];
    let activitiesInProgress: progressStoreMapping[] = this.dataStore?.progressStore?.getActivitiesInProgressForTeams(teams) || [];

    let summary: TeamSummary = {
      teams,
      lastUpdated: new Date(),
      activitiesCompleted: [], activitiesInProgress: [],
      uniqueActivitiesCompletedCount: 0, uniqueActivitiesInProgressCount: 0,
    };
    var _self = this;
    summary.activitiesCompleted = activitiesCompleted.map(activityProgress => _self.mapIncludeActivity(activityProgress));
    summary.activitiesInProgress = activitiesInProgress.map(activityProgress => _self.mapIncludeActivity(activityProgress));
    summary.uniqueActivitiesCompletedCount = uniqueCount(summary.activitiesCompleted.map(item => item.activity.uuid));
    summary.uniqueActivitiesInProgressCount = uniqueCount(summary.activitiesInProgress.map(item => item.activity.uuid));
    return summary;
  }

  mapIncludeActivity(input: progressStoreMapping): TeamActivityProgress {
    return {
      team: input.team,
      activity: this.dataStore?.activityStore?.getActivityByUuid(input.activityUuid) || {} as Activity,
      progress: input.progress,
    };
  }
}

export interface TeamSummary {
  teams: TeamNames;
  lastUpdated: Date;
  activitiesCompleted: TeamActivityProgress[];
  activitiesInProgress: TeamActivityProgress[];
  uniqueActivitiesCompletedCount: number;
  uniqueActivitiesInProgressCount: number;
}


export interface TeamActivityProgress {
  team: TeamName;
  activity: Activity;
  progress: TeamProgress;
}
import { Component, OnInit } from '@angular/core';
import { DialogInfo, ModalMessageComponent } from 'src/app/component/modal-message/modal-message.component';
import { DataStore } from 'src/app/model/data-store';
import { TeamGroups, TeamNames } from 'src/app/model/meta';
import { LoaderService } from 'src/app/service/loader/data-loader.service';
import { perfNow } from 'src/app/util/util';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.css'],
})
export class TeamsComponent implements OnInit {
  dataStore: DataStore = new DataStore();
  teams: TeamNames = [];
  teamGroups: TeamGroups = {};

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

  
  displayMessage(dialogInfo: DialogInfo) {
    this.modal.openDialog(dialogInfo);
  }

  setYamlData(dataStore: DataStore) {
    this.dataStore = dataStore;
    this.teams = dataStore?.meta?.teams || [];
    this.teamGroups = dataStore?.meta?.teamGroups || {};
  }

  unsorted() {
    return 0;
  }
}

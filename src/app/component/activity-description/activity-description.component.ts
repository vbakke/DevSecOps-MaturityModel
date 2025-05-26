import { Component, ViewChildren, QueryList, OnInit } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../service/loader/data-loader.service';
import * as md from 'markdown-it';
import { Activity, ActivityStore } from '../../model/activity-store';

@Component({
  selector: 'app-activity-description',
  templateUrl: './activity-description.component.html',
  styleUrls: ['./activity-description.component.css'],
})
export class ActivityDescriptionComponent implements OnInit {
  markdown: md = md();
  currentActivity: Partial<Activity> = {};

  TimeLabel: string = '';
  KnowledgeLabel: string = '';
  ResourceLabel: string = '';
  UsefullnessLabel: string = '';
  SAMMVersion: string = 'OWASP SAMM VERSION 2';
  ISOVersion: string = 'ISO 27001:2017';
  ISO22Version: string = 'ISO 27001:2022';
  openCREVersion: string = 'OpenCRE';
  @ViewChildren(MatAccordion) accordion!: QueryList<MatAccordion>;

  constructor(private route: ActivatedRoute, private loader: LoaderService) {}

  ngOnInit() {
    let name: string, uuid: string;
    this.route.queryParams.subscribe(params => {
      uuid = params['uuid'];
      name = params['activityName'];
    });

    // Load data
    this.loader
      .load()
      .then((activityStore: ActivityStore) => {
        // Find the activity with matching UUID (or potentially name)
        let activity: Activity = activityStore.getActivity(uuid, name);
        if (!activity) {
          throw new Error('Activity not found');
        }

        // Get meta data
        const meta = this.loader.getMetaStrings();
        this.currentActivity = activity;
        this.KnowledgeLabel = meta.knowledgeLabels[activity.difficultyOfImplementation.knowledge];
        this.TimeLabel = meta.labels[activity.difficultyOfImplementation.time];
        this.ResourceLabel = meta.labels[activity.difficultyOfImplementation.resources];
        this.UsefullnessLabel = meta.labels[activity.usefulness];

        this.openall();
      })
      .catch(err => {
        console.error('Error loading activity data:', err);
      });
  }

  // Expand all function
  openall(): void {
    this.accordion.forEach(element => {
      element.openAll();
    });
  }

  // Close all function
  closeall(): void {
    this.accordion.forEach(element => {
      element.closeAll();
    });
  }
}

import {
  Component,
  OnInit,
  ViewChildren,
  QueryList,
  ChangeDetectorRef,
} from '@angular/core';
import { ymlService } from 'src/app/service/yaml-parser/yaml-parser.service';
import { equalArray } from 'src/app/util/util';
import { LoaderService } from 'src/app/service/loader/data-loader.service';
import * as d3 from 'd3';
import * as yaml from 'js-yaml';
import { Router } from '@angular/router';
import { MatChip } from '@angular/material/chips';
import * as md from 'markdown-it';
import {
  ModalMessageComponent,
  DialogInfo,
} from '../modal-message/modal-message.component';
import { Activity, ActivityStore } from 'src/app/model/activity-store';
import { Uuid, ProgressDefinition, TeamName, ProgressTitle } from 'src/app/model/meta';
import { SectorService } from '../../service/sector-service';
import { DataStore } from 'src/app/model/data-store';
import { Sector } from 'src/app/model/sector';
import { perfNow } from 'src/app/util/util';

@Component({
  selector: 'app-circular-heatmap',
  templateUrl: './circular-heatmap.component.html',
  styleUrls: ['./circular-heatmap.component.css'],
})
export class CircularHeatmapComponent implements OnInit {
  Routing: string = '/activity-description';
  markdown: md = md();
  maxLevelOfMaturity: number = -1;
  showOverlay: boolean = false;
  showFilters: boolean = true;
  showActivityCard: any = null;

  showActivityDetails: Activity | null = null;
  TimeLabel: string = '';
  KnowledgeLabel: string = '';
  ResourceLabel: string = '';
  UsefulnessLabel: string = '';


  dataStore: DataStore | null = null;

  // New properties for refactored data
  dimLabels: string[] = [];
  filtersTeams: Record<string, boolean> = {};
  filtersTeamGroups: Record<string, boolean> = {};
  hasTeamsFilter: boolean = false;
  maxLevel: number = 0;
  dimensionLabels: string[] = [];
  progressStates: string[] = [];
  allSectors: Sector[] = [];
  selectedSector: Sector | null = null;

  constructor(
    private loader: LoaderService,
    private sectorService: SectorService,
    private router: Router,
    public modal: ModalMessageComponent
  ) { }


  ngOnInit(): void {
    console.log(`${perfNow()}s: ngOnInit`);
    // Ensure that Levels and Teams load before MaturityData
    // using promises, since ngOnInit does not support async/await
    this.loader.load()
      .then((dataStore: DataStore) => {
        if (!dataStore.activityStore) {
          throw Error("TODO: Ooops! Dette må håndteres");
        }
        if (!dataStore.progressStore) {
          throw Error("TODO: Ooops! Dette må håndteres");
        }

        this.filtersTeams = this.buildFilters(dataStore.meta?.teams as string[]);
        this.filtersTeamGroups = this.buildFilters(Object.keys(dataStore.meta?.teamGroups || {}));
        this.filtersTeamGroups['All'] = true;

        let progressDefinition: ProgressDefinition = dataStore.meta?.progressDefinition || {};
        this.sectorService.init(dataStore.progressStore, dataStore.meta?.teams || [], dataStore?.progressStore?.getProgressData() || {}, progressDefinition);
        this.progressStates = this.sectorService.getProgressStates();

        this.setYamlData(dataStore);

        // For now, just draw the sectors (no activities yet)
        this.loadCircularHeatMap(
          '#chart',
          this.allSectors,
          this.dimensionLabels,
          this.maxLevel
        );
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
    this.maxLevel = dataStore.getMaxLevel();
    this.dimensionLabels = dataStore?.activityStore?.getAllDimensionNames() || [];
    
    // Prepare all sectors: one for each (dimension, level) pair
    this.allSectors = [];
    for (let level = 1; level <= this.maxLevel; level++) {
      for (let dimName of this.dimensionLabels) {
        const activities: Activity[] = dataStore?.activityStore?.getActivities(dimName, level) || [];
        this.allSectors.push({
          dimension: dimName,
          level: level,
          activities: activities,
          });
      }
    }
  }    

  buildFilters(names: string[]): Record<string, boolean> {
    let filters: Record<string, boolean> = {};
    if (names) {
      for (let name of names) {
          filters[name] = false;
      }
    }
    return filters;
  }

  toggleTeamGroupFilter(chip: MatChip) {
    let teamGroup = chip.value.trim();
    if (!chip.selected) {
      chip.toggleSelected();
      console.log(`${perfNow()}: Heat: Chip flip Group '${teamGroup}: ${chip.selected}`);
  
      // Update the team selections based on the team group selection
      let selectedTeams: TeamName[] = [];
      Object.keys(this.filtersTeams).forEach(key => {
        this.filtersTeams[key] = this.dataStore?.meta?.teamGroups[teamGroup]?.includes(key) || false;
        if (this.filtersTeams[key]) {
          selectedTeams.push(key);
        }
        this.sectorService.setVisibleTeams(selectedTeams);
      });
      this.hasTeamsFilter = Object.values(this.filtersTeams).some(v => v === true);
      this.reColorHeatmap();
    } else {
      console.log(`${perfNow()}: Heat: Chip flip Group '${teamGroup}: already on`);
    }
  }
  
  toggleTeamFilter(chip: MatChip) {
    chip.toggleSelected();
    this.filtersTeams[chip.value.trim()] = chip.selected;
    console.log(`${perfNow()}: Heat: Chip flip Team '${chip.value}: ${chip.selected}`);
    
    this.hasTeamsFilter = Object.values(this.filtersTeams).some(v => v === true);
      
    let selectedTeams: string[] = Object.keys(this.filtersTeams).filter(key => this.filtersTeams[key]);
    this.sectorService.setVisibleTeams(selectedTeams);

    // Update team group filter, if one matches selection
    Object.keys(this.dataStore?.meta?.teamGroups || {}).forEach(group => {
      let match: boolean = equalArray(selectedTeams, this.dataStore?.meta?.teamGroups[group]);
      this.filtersTeamGroups[group] = match;
    });

    this.reColorHeatmap()
  }

  getTeamProgressState(activityUuid: string, teamName: string): string {
    return this.dataStore?.progressStore?.getTeamActivityTitle(activityUuid, teamName) || '';
  }

  getBackedupTeamProgressState(activityUuid: string, teamName: string): string {
    return this.dataStore?.progressStore?.getTeamActivityTitle(activityUuid, teamName, true) || '';
  }

  onProgressChange(
    activityUuid: Uuid,
    teamName: TeamName,
    newProgress: ProgressTitle)
  {
    if (!this.dataStore || !this.dataStore.progressStore || !this.dataStore.activityStore) {
      throw Error('Data store or progress store is not initialized.');
    }

    this.dataStore.progressStore.setTeamActivityProgressState(
      activityUuid,
      teamName,
      newProgress);
    let activity: Activity = this.dataStore.activityStore.getActivityByUuid(activityUuid);   
    let index = this.dimensionLabels.indexOf(activity.dimension)
      + this.dimensionLabels.length * (activity.level -1) ;

    this.recolorSector(index);
  }

  getSectorProgress(sector: Sector): number {
    return this.sectorService.getSectorProgress(sector.activities);
  }

  loadCircularHeatMap(
    dom_element_to_append_to: string,
    dataset: any,
    dimLabels: string[],
    maxLevel: number
  ) {
    let _self = this;
    var imageWidth = 1200;
    var marginAll = 5;
    var margin = {
      top: marginAll,
      right: marginAll,
      bottom: marginAll,
      left: marginAll,
    };
    var bbWidth = imageWidth - Math.max(margin.left+margin.right, margin.top+margin.bottom)*2;  // bounding box
    var segmentLabelHeight = bbWidth * 0.0155;  // Fuzzy number, to match the longest label within one sector
    var outerRadius = bbWidth / 2 - segmentLabelHeight; 
    var innerRadius = outerRadius / 5; 
    var segmentHeight = (outerRadius -  innerRadius) / maxLevel;
    
    var curr: any;
    var chart = this.circularHeatChart(dimLabels.length)
      .margin(margin)
      .innerRadius(innerRadius)
      .segmentHeight(segmentHeight)
      .domain([0, 1])
      .range(['white', 'green'])
      // .radialLabels(radial_labels)
      .segmentLabels(dimLabels)
      .segmentLabelHeight(segmentLabelHeight);

    chart.accessor(function (sector: Sector) {
      return _self.getSectorProgress(sector);
    });

    var svg = d3
      .select(dom_element_to_append_to)
      .selectAll('svg')
      .data([dataset])
      .enter()
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${imageWidth} ${imageWidth}`)
      .append('g')
      .attr(
        'transform',
        `translate(${margin.left + segmentLabelHeight}, ${margin.top + segmentLabelHeight})`
      )
      .call(chart);

    svg
      .selectAll('path')
      .on('click', function () {
        var clickedId = d3.select(this).attr('id');
        _self.setSectorCursor(svg, '#selected', clickedId);
        var index = parseInt(clickedId.replace('index-', ''));
        _self.selectedSector = dataset[index]; // Store selected sector for details
        // Assign showActivityCard to the sector if it has activities, else null
        if (_self.selectedSector && _self.selectedSector.activities && _self.selectedSector.activities.length > 0) {
          _self.showActivityCard = _self.selectedSector;
        } else {
          _self.showActivityCard = null;
        }
      })
      .on('mouseover', function () {
        var hoveredId = d3.select(this).attr('id');
        _self.setSectorCursor(svg, '#hover', hoveredId);
      })
      .on('mouseout', function () {
        _self.setSectorCursor(svg, '#hover', '');
      });
  }

  circularHeatChart(num_of_segments: number) {
    var margin = {
        top: 20,
        right: 50,
        bottom: 50,
        left: 20,
      },
      innerRadius = 20,
      numSegments = num_of_segments,
      segmentHeight = 20,
      segmentLabelHeight = 12,
      domain: any = null,
      range = ['white', 'red'],
      accessor = function (d: any) {
        return d;
      };
    var radialLabels = [];
    var segmentLabels: any[] = [];

    function chart(selection: any) {
      selection.each(function (this: any, data: any) {
        var svg = d3.select(this);

        var offset =
          innerRadius + Math.ceil(data.length / numSegments) * segmentHeight;
        var g = svg
          .append('g')
          .classed('circular-heat', true)
          .attr(
            'transform',
            'translate(' +
              (margin.left + offset) +
              ',' +
              (margin.top + offset) +
              ')'
          );

        var autoDomain = false;
        if (domain === null) {
          domain = d3.extent(data, accessor);
          autoDomain = true;
        }
        var color = d3
          .scaleLinear<string, string>()
          .domain(domain)
          .range(range);
        if (autoDomain) domain = null;

        g.selectAll('path')
          .data(data)
          .enter()
          .append('path')
          .attr('class', function (d: any) {
            return 'segment-' + d.dimension.replace(/ /g, '-');
          })
          .attr('id', function (d: any, i: number) {
            return 'index-' + i;
          })
          .attr(
            'd',
            d3
              .arc<any>()
              .innerRadius(ir)
              .outerRadius(or)
              .startAngle(sa)
              .endAngle(ea)
          )
          .attr('stroke', '#252525')
          .attr('fill', function (d: any) {
            if (!d.activities || d.activities.length === 0) {
              return '#DCDCDC';
            }
            return color(accessor(d));
          });
          
        // Unique id so that the text path defs are unique - is there a better way to do this?
        // console.log(d3.selectAll(".circular-heat")["_groups"][0].length)
        var id = 1;

        //Segment labels
        var segmentLabelFontSize = segmentLabelHeight * 2/3;
        var segmentLabelOffset = segmentLabelHeight * 1/3;
        var r =
          innerRadius +
          Math.ceil(data.length / numSegments) * segmentHeight +
          segmentLabelOffset;
        var labels = svg
          .append('g')
          .classed('labels', true)
          .classed('segment', true)
          .attr(
            'transform',
            'translate(' +
              (margin.left + offset) +
              ',' +
              (margin.top + offset) +
              ')'
          );

        labels
          .append('def')
          .append('path')
          .attr('id', 'segment-label-path-' + id)
          .attr('d', 'm0 -' + r + ' a' + r + ' ' + r + ' 0 1 1 -1 0');

        labels
          .selectAll('text')
          .data(segmentLabels)
          .enter()
          .append('text')
          .append('textPath')
          .attr('text-anchor', 'middle')
          .attr('xlink:href', '#segment-label-path-' + id)
          .style('font-size', segmentLabelFontSize)
          .attr('startOffset', function (d, i) {
            return ((i+.5) * 100) / numSegments + '%';   // shift ½ segment to center
          })
          .text(function (d: any) {
            return d;
          });
        var cursors = svg
          .append('g')
          .classed('cursors', true)
          .attr(
            'transform',
            'translate(' +
              (margin.left + offset) +
              ',' +
              (margin.top + offset) +
              ')'
          );
        cursors
          .append('path')
          .attr('id', 'hover')
          .attr('pointer-events', 'none')
          .attr('stroke', 'green')
          .attr('stroke-width', '7')
          .attr('fill', 'transparent');
        cursors
          .append('path')
          .attr('id', 'selected')
          .attr('pointer-events', 'none')
          .attr('stroke', '#232323')
          .attr('stroke-width', '4')
          .attr('fill', 'transparent');
      });
    }

    /* Arc functions */
    var ir = function (d: any, i: number) {
      return innerRadius + Math.floor(i / numSegments) * segmentHeight;
    };
    var or = function (d: any, i: number) {
      return (
        innerRadius +
        segmentHeight +
        Math.floor(i / numSegments) * segmentHeight
      );
    };
    var sa = function (d: any, i: number) {
      return (i * 2 * Math.PI) / numSegments;
    };
    var ea = function (d: any, i: number) {
      return ((i + 1) * 2 * Math.PI) / numSegments;
    };

    /* Configuration getters/setters */
    chart.margin = function (_: any) {
      margin = _;
      return chart;
    };

    chart.innerRadius = function (_: any) {
      innerRadius = _;
      return chart;
    };

    chart.numSegments = function (_: any) {
      numSegments = _;
      return chart;
    };

    chart.segmentHeight = function (_: any) {
      segmentHeight = _;
      return chart;
    };

    chart.segmentLabelHeight = function (_: any) {
      segmentLabelHeight = _;
      return chart;
    };

    chart.domain = function (_: any) {
      domain = _;
      return chart;
    };

    chart.range = function (_: any) {
      range = _;
      return chart;
    };

    chart.radialLabels = function (_: any) {
      if (_ == null) _ = [];
      radialLabels = _;
      return chart;
    };

    chart.segmentLabels = function (_: any) {
      if (_ == null) _ = [];
      segmentLabels = _;
      return chart;
    };

    chart.accessor = function (_: any) {
      if (!arguments.length) return accessor;
      accessor = _;
      return chart;
    };

    return chart;
  }

  setSectorCursor(svg: any, cursor: string, targetId: string): void {
    let element = svg.select(cursor);
    let path: string = '';
    if (targetId) {
      if (targetId[0] != '#') targetId = '#' + targetId;
      path = svg.select(targetId).attr('d');
    }

    svg.select(cursor).attr('d', path);
  }

  defineStringValues(
    dataToCheck: string,
    valueOfDataIfUndefined: string
  ): string {
    try {
      return this.markdown.render(dataToCheck);
    } catch {
      return valueOfDataIfUndefined;
    }
  }

  onPanelOpened(activity: any) {
    console.log(`${perfNow()}: Heat: Card Panel opened: '${activity.name}'`);
  }
  onPanelClosed(activity: any) {
    console.log(`${perfNow()}: Heat: Card Panel closed: '${activity.name}'`);
  }
  
  openActivityDetails(dimension: string, activityName: string) {
    // Find the activity in the selected sector
    console.log(`${perfNow()}: Heat: Open Overlay: '${activityName}'`);
    if (!this.dataStore) { 
      console.error(`Data store is not initialized. Cannot open activity ${activityName}`);
      return;
    }
    if (!this.showActivityCard || !this.showActivityCard.activities) {
      this.showOverlay = true;
      return;
    }
    const activity = this.showActivityCard.activities.find(
      (a: any) => a.activityName === activityName || a.name === activityName
    );
    if (!activity) {
      this.showOverlay = true;
      return;
    }
    // Prepare navigationExtras and details
    this.showActivityDetails = activity;
    this.KnowledgeLabel = this.dataStore.getMetaString('knowledgeLabels', activity.difficultyOfImplementation.knowledge);
    this.TimeLabel = this.dataStore.getMetaString('labels', activity.difficultyOfImplementation.time);
    this.ResourceLabel = this.dataStore.getMetaString('labels', activity.difficultyOfImplementation.resources);
    this.UsefulnessLabel = this.dataStore.getMetaString('labels', activity.usefulness);
    this.showOverlay = true;
  }

  closeOverlay() {
    this.showOverlay = false;
    // console.log(`${perfNow()}: Heat: Close Overlay:  '${this.old_activityDetails.name}'`);
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  exportTeamProgress() {
    // Remove focus from the button that becomes aria unavailable (avoids ugly console error message)
    const buttonElement = document.activeElement as HTMLElement;
    buttonElement.blur();
    
    let yamlStr: string | null = this.dataStore?.progressStore?.asYamlString() || null;
    if (!yamlStr) {
      this.displayMessage(new DialogInfo('No team progress data available', 'Export Error'));
      return;
    }
    
    let file = new Blob([yamlStr], { type: 'application/yaml; charset=utf-8' });
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(file);
    link.download = this.dataStore?.meta?.teamProgressFile?.split('/')?.pop() || 'team-progress.yaml';

    link.click();
    link.remove();
  }

  recolorSector(index: number) {
    // console.log('recolorSector', index);
    var colorSector = d3
      .scaleLinear<string, string>()
      .domain([0, 1])
      .range(['white', 'green']);

    let progressValue: number = this.sectorService.getSectorProgress(this.allSectors[index].activities);
    d3.select('#index-' + index).attr(
      'fill',
      isNaN(progressValue) ? '#DCDCDC' : colorSector(progressValue)
    );
    // console.log(`Recolor sector ${index} with progress ${(progressValue*100).toFixed(1)}%`);
  }

  reColorHeatmap() {
    for (let index = 0; index < this.allSectors.length; index++) {
      this.recolorSector(index);
    }
  }

  deleteLocalTeamsProgress() {
    // Remove focus from the button that becomes aria unavailable (avoids ugly console error message)
    const buttonElement = document.activeElement as HTMLElement;
    buttonElement.blur();

    let title: string = 'Delete local browser data';
    let message: string =
      'Do you want to delete all progress for each team?' +
      '\n\nThis deletes all progress stored in your local browser, but does ' +
      'not change any progress stored in the yaml file on the server.';
    let buttons: string[] = ['Cancel', 'Delete'];
    this.modal
      .openDialog({ title, message, buttons, template: '' })
      .afterClosed()
      .subscribe(data => {
        if (data === 'Delete') {
          this.dataStore?.progressStore?.deleteBrowserStoredTeamProgress();
          location.reload(); // Make sure all load routines are initialized
        }
      });
  }

  getDatasetFromBrowserStorage(): any {
    console.log(`${perfNow()}s: getDatasetFromBrowserStorage() ####`);
    // @ts-ignore
    if (this.old_ALL_CARD_DATA?.length && this.old_ALL_CARD_DATA[0]?.Task != null) {
      console.log('Found outdated dataset, removing');
      localStorage.removeItem('dataset');
    }

    var content = localStorage.getItem('dataset');
    if (content != null) {
      return JSON.parse(content);
    }
    return null;
  }

  unsorted() {
    return 0;
  }
}

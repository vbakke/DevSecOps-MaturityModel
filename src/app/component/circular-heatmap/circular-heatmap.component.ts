import {
  Component,
  OnInit,
  ViewChildren,
  QueryList,
  ChangeDetectorRef,
} from '@angular/core';
import { ymlService } from 'src/app/service/yaml-parser/yaml-parser.service';
import { hasData } from 'src/app/util/util';
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
import { ActivityStore } from 'src/app/model/activity-store';

export interface old_activitySchema {
  uuid: string;
  activityName: string;
  teamsImplemented: any;
}

export interface old_cardSchema {
  Dimension: string;
  SubDimension: string;
  Level: string;
  'Done%': number;
  Activity: old_activitySchema[];
}

type old_ProjectData = {
  Activity: old_activitySchema[];
  Dimension: string;
  Done: number;
  Level: string;
  SubDimension: string;
}[];

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
  old_cardHeader: string = '';
  old_cardSubheader: string = '';
  old_currentDimension: string = '';
  old_activityData: any[] = [];
  old_ALL_CARD_DATA: old_cardSchema[] = [];
  old_radial_labels: string[] = [];
  old_YamlObject: any;
  old_teamList: any;
  old_teamGroups: any;
  old_selectedTeamChips: string[] = ['All'];
  old_teamVisible: string[] = [];
  old_segment_labels: string[] = [];
  old_activityDetails: any;
  
  @ViewChildren(MatChip) chips!: QueryList<MatChip>;
  matChipsArray: MatChip[] = [];
  
  // New properties for refactored data
  dimLabels: string[] = [];
  maxLevel: number = 0;
  allSectors: any[] = [];
  dimensionLabels: string[] = [];
  selectedSector: any = null;

  constructor(
    private old_yaml: ymlService,
    private loader: LoaderService,
    private router: Router,
    public modal: ModalMessageComponent
  ) { }


  ngOnInit(): void {
    console.log(`${this.perfNow()}s: ngOnInit`);
    // Ensure that Levels and Teams load before MaturityData
    // using promises, since ngOnInit does not support async/await
    this.OBSOLETE_LoadMaturityLevels()
      .then(() => this.OBSOLETE_LoadTeamsFromMetaYaml())
      .then(() => this.OBSOLETE_LoadMaturityDataFromGeneratedYaml())
      .then(() => this.loader.load())
      .then((activityStore: ActivityStore) => {
        console.log(`${this.perfNow()}s: set filters: ${this.chips?.length}`);
        this.matChipsArray = this.chips.toArray();

        this.setYamlData(activityStore);

        // For now, just draw the sectors (no activities yet)
        this.loadCircularHeatMap(
          '#chart',
          this.allSectors,
          this.dimensionLabels,
          this.maxLevel
        );


        // console.log('--- LOADED COMPLETE (old & new) ---');
        // this.old_YamlObject = activityStore.data;
        // for (let c in this.old_YamlObject) {
        //   console.log(' - ' + c);
        //   for (let d in this.old_YamlObject[c]) {
        //     console.log('    - ' + d);
        //     // for (let a in data[c][d]) {
        //     //   console.log(`       - (${data[c][d][a]?.level}) ${a}`);
        //     // }
        //   }
        // }
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

  consolelog(message: string) {
    console.log(message);
  }

  setYamlData(activityStore: ActivityStore) {
    this.maxLevel = this.loader.getMaxLevel();
    this.dimensionLabels = activityStore.getAllDimensionNames();
    
    // Prepare all sectors: one for each (dimension, level) pair
    this.allSectors = [];
    for (let lvl = 1; lvl <= this.maxLevel; lvl++) {
      for (let dimName of this.dimensionLabels) {
        const activities = activityStore.getActivities(dimName, lvl);
        this.allSectors.push({
          dimension: dimName,
          level: 'Level ' + lvl,
          activities: activities,
          progress: 0,
        });
      }
    }
  }    

  private OBSOLETE_LoadMaturityDataFromGeneratedYaml() {
    return new Promise<void>((resolve, reject) => {
      console.log(`${this.perfNow()}s: LoadMaturityData Fetch`);
      this.old_yaml.setURI('./assets/YAML/generated/generated.yaml');
      this.old_yaml.getJson().subscribe(async data => {
        console.log(`${this.perfNow()}s: LoadMaturityData Downloaded`);
        const activityStore: ActivityStore = await this.loader.load();
        this.old_YamlObject = activityStore.data;
        this.OBSOLETE_AddSegmentLabels(this.old_YamlObject);
        const localStorageData = this.getDatasetFromBrowserStorage();

        // Initialize the card array
        let segmentTotalCount = this.old_segment_labels.length;
        let cardTotalCount = segmentTotalCount * this.maxLevelOfMaturity;
        this.old_ALL_CARD_DATA = new Array(cardTotalCount).fill(null);

        // Process each card / sector
        let subdimCount = -1;
        for (let dim in this.old_YamlObject) {
          for (let subdim in this.old_YamlObject[dim]) {
            subdimCount++;
            console.log(subdimCount, subdim);
            let activities: Map<number, old_activitySchema[]> =
              this.OBSOLETE_processActivities(
                this.old_YamlObject[dim][subdim],
                localStorageData
              );

            for (
              let level: number = 1;
              level <= this.maxLevelOfMaturity;
              level++
            ) {
              // Create and store each card (with activities for that level)
              var cardSchemaData: old_cardSchema = {
                Dimension: dim,
                SubDimension: subdim,
                Level: 'Level ' + level,
                'Done%': -1,
                Activity: activities.get(level) || [],
              };

              // Store cards in sequential slots, by dimension then level
              let levelIndex = (level - 1) * segmentTotalCount;
              this.old_ALL_CARD_DATA[levelIndex + subdimCount] = cardSchemaData;
            }
          }
        }

        console.log('ALL CARD DATA', this.old_ALL_CARD_DATA);
        // this.loadCircularHeatMap(
        //   this.old_ALL_CARD_DATA,
        //   '#chart',
        //   this.old_radial_labels,
        //   this.old_segment_labels
        // );
        // this.noActivitytoGrey();
        console.log(`${this.perfNow()}s: LoadMaturityData End`);
        resolve();
      });
    });
  }

  /**
   * Returns activities of one subdimension, separated by maturity level.
   * Source of activities is the cards from the server.
   *
   * Status of Team Implementation is merged from both server status and
   * locally stored changes.
   */
  private OBSOLETE_processActivities(
    card: any,
    localStorageData: any
  ): Map<number, old_activitySchema[]> {
    let activities: Map<number, old_activitySchema[]> = new Map();
    for (let activityName in card) {
      let currentActivity: any = card[activityName];
      let level: number = currentActivity.level;
      var uuid = currentActivity?.uuid;

      // Initialize a status for all genuine teams
      let genuineTeams: any = {};
      this.old_teamList.forEach((singleTeam: string) => {
        genuineTeams[singleTeam] = false;
      });

      // Read server and locally stored teams statuses as well
      var teamsFromYaml: any = currentActivity.teamsImplemented;
      var teamsFromLocalstorage: any = this.OBSOLETE_getTeamImplementedFromJson(
        localStorageData,
        activityName
      );

      // Combine the lot, where local changes takes priority
      var combinedTeamsImplemented = Object.assign(
        {},
        genuineTeams,
        teamsFromYaml,
        teamsFromLocalstorage
      );

      // Store each activity, split by maturity level
      if (!activities.has(level)) activities.set(level, []);
      activities.get(level)?.push({
        uuid: uuid,
        activityName: activityName,
        teamsImplemented: combinedTeamsImplemented,
      });
    }
    return activities;
  }

  private OBSOLETE_getTeamImplementedFromJson(
    data: old_ProjectData,
    activityName: string
  ): any | undefined {
    if (data) {
      // Find the activity in data that matches the activityName
      const card = data.find(project =>
        project.Activity.find(
          activity => activity.activityName === activityName
        )
      );

      if (card) {
        return card.Activity.find(
          activity => activity.activityName === activityName
        )?.teamsImplemented;
      }
    }

    return undefined;
  }

  private OBSOLETE_AddSegmentLabels(yampObject: any[]) {
    for (let dim in yampObject) {
      for (let subdim in yampObject[dim]) {
        this.old_segment_labels.push(subdim);
      }
    }
    console.log(this.old_segment_labels);
  }

  private OBSOLETE_LoadTeamsFromMetaYaml() {
    return new Promise<void>((resolve, reject) => {
      console.log(`${this.perfNow()}s: LoadTeamsFromMetaYaml Fetch`);
      this.old_yaml.setURI('./assets/YAML/meta.yaml');
      this.old_yaml.getJson().subscribe(data => {
        console.log(`${this.perfNow()}s: LoadTeamsFromMetaYaml Downloaded`);
        this.old_YamlObject = data;

        this.old_teamList = this.old_YamlObject['old_teams']; // Genuine teams (the true source)
        this.old_teamGroups = this.old_YamlObject['old_teamGroups'];
        this.old_teamVisible = [...this.old_teamList];

        // Ensure that all team names in the groups are genuine team names
        for (let team in this.old_teamGroups) {
          this.old_teamGroups[team] = this.old_teamGroups[team].filter((t: string) =>
            this.old_teamList.includes(t)
          );
          if (this.old_teamGroups[team].length == 0) delete this.old_teamGroups[team];
        }
        resolve();
      });
    });
  }

  private OBSOLETE_LoadMaturityLevels() {
    return new Promise<void>((resolve, reject) => {
      console.log(`${this.perfNow()}s: LoadMaturityLevels Fetch`);
      this.old_yaml.setURI('./assets/YAML/meta.yaml');
      // Function sets column header
      this.old_yaml.getJson().subscribe(data => {
        console.log(`${this.perfNow()}s: LoadMaturityLevels Downloaded`);
        this.old_YamlObject = data;

        // Levels header
        for (let x in this.old_YamlObject['strings']['en']['maturityLevels']) {
          var y = parseInt(x) + 1;
          this.old_radial_labels.push('Level ' + y);
          this.maxLevelOfMaturity = y;
        }
        resolve();
      });
    });
  }

  toggleTeamGroupSelection(chip: MatChip) {
    chip.toggleSelected();
    let currChipValue = chip.value.trim();

    if (chip.selected) {
      this.old_selectedTeamChips = [currChipValue];
      if (currChipValue == 'All') {
        this.old_teamVisible = [...this.old_teamList];
      } else {
        this.old_teamVisible = [];

        (
          Object.keys(this.old_teamGroups) as (keyof typeof this.old_teamGroups)[]
        ).forEach((key, index) => {
          if (key === currChipValue) {
            console.log('group selected');
            this.old_teamVisible = [...this.old_teamGroups[key]];
          }
        });
      }
    } else {
      this.old_selectedTeamChips = this.old_selectedTeamChips.filter(
        o => o !== currChipValue
      );
    }
    console.log('Selected Chips', this.old_selectedTeamChips);
    console.log('Team Visible', this.old_teamVisible);
    console.log('All chips', this.matChipsArray);

    // Update heatmap based on selection
    this.updateChips(true);
  }

  toggleTeamSelection(chip: MatChip) {
    chip.toggleSelected();
    let currChipValue = chip.value.trim();
    let prevSelectedChip = this.old_selectedTeamChips;
    if (chip.selected) {
      this.old_teamVisible.push(currChipValue);
      this.old_selectedTeamChips = [];
    } else {
      this.old_selectedTeamChips = [];
      this.old_teamVisible = this.old_teamVisible.filter(o => o !== currChipValue);
    }
    console.log('Selected Chips', this.old_selectedTeamChips);
    console.log('Team Visible', this.old_teamVisible);
    console.log('Team List', this.old_teamList);
    console.log('All chips', this.matChipsArray);
    // Update heatmap based on selection
    this.updateChips(prevSelectedChip);
  }

  updateChips(fromTeamGroup: any) {
    console.log('updating chips', fromTeamGroup);
    // Re select chips
    this.matChipsArray.forEach(chip => {
      let currChipValue = chip.value.trim();

      if (this.old_teamVisible.includes(currChipValue)) {
        console.log(currChipValue);
        chip.selected = true;
      } else {
        if (!this.old_selectedTeamChips.includes(currChipValue)) {
          chip.selected = false;
        }
      }
    });
    this.reColorHeatmap();
  }
  // Team Filter ENDS

  teamCheckbox(activityIndex: number, teamKey: any) {
    let _self = this;
    var index = 0;
    for (var i = 0; i < this.old_ALL_CARD_DATA.length; i++) {
      if (
        this.old_ALL_CARD_DATA[i]['SubDimension'] === this.old_cardHeader &&
        this.old_ALL_CARD_DATA[i]['Level'] === this.old_cardSubheader
      ) {
        index = i;
        break;
      }
    }
    this.old_ALL_CARD_DATA[index]['Activity'][activityIndex]['teamsImplemented'][
      teamKey
    ] =
      !this.old_ALL_CARD_DATA[index]['Activity'][activityIndex]['teamsImplemented'][
        teamKey
      ];

    this.saveDataset();
    this.reColorHeatmap();
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

    chart.accessor(function (d: any) {
      return d.progress;
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

  noActivitytoGrey(): void {
    for (var x = 0; x < this.old_ALL_CARD_DATA.length; x++) {
      if (this.old_ALL_CARD_DATA[x]['Done%'] == -1) {
        d3.select('#index-' + x).attr('fill', '#DCDCDC');
      }
    }
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

  openActivityDetails(dimension: string, activityName: string) {
    // Find the activity in the selected sector
    if (!this.showActivityCard || !this.showActivityCard.activities) {
      this.old_activityDetails = null;
      this.showOverlay = true;
      return;
    }
    const activity = this.showActivityCard.activities.find(
      (a: any) => a.activityName === activityName || a.name === activityName
    );
    if (!activity) {
      this.old_activityDetails = null;
      this.showOverlay = true;
      return;
    }
    // Prepare navigationExtras and details
    let navigationExtras = {
      dimension: this.showActivityCard.dimension,
      level: this.showActivityCard.levelName,
      activityName: activity.activityName || activity.name,
    };
    this.old_activityDetails = {
      ...activity,
      navigationExtras,
      description: this.defineStringValues(activity.description, activity.description),
      risk: this.defineStringValues(activity.risk, activity.risk),
      measure: this.defineStringValues(activity.measure, activity.measure),
    };
    this.showOverlay = true;
  }

  closeOverlay() {
    this.showOverlay = false;
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  saveEditedYAMLfile() {
    this.setTeamsStatus(this.old_YamlObject, this.old_teamList, this.old_ALL_CARD_DATA);
    let yamlStr = yaml.dump(this.old_YamlObject);

    let file = new Blob([yamlStr], { type: 'text/csv;charset=utf-8' });
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(file);
    link.download = 'generated.yaml';
    link.click();
    link.remove();
  }

  setTeamsStatus(yamlObject: any, teamList: string[], card_data: old_cardSchema[]) {
    // Loop through all activities from the card_data
    for (let card of card_data) {
      for (let activity of card.Activity) {
        let dim: string = card.Dimension;
        let subdim: string = card.SubDimension;
        let activityName: string = activity.activityName;
        let teamsImplemented: any = {};

        // Get the state for all genuine teams of the activity
        for (let team of teamList) {
          teamsImplemented[team] = activity?.teamsImplemented[team] || false;
        }
        // Save the teams' state to the yaml object
        yamlObject[dim][subdim][activityName].teamsImplemented =
          teamsImplemented;
      }
    }
  }

  reColorHeatmap() {
    console.log('recolor');
    var teamsCount = this.old_teamVisible.length;

    for (var index = 0; index < this.old_ALL_CARD_DATA.length; index++) {
      var activities = this.old_ALL_CARD_DATA[index]['Activity'];
      let cntAll: number = teamsCount * activities.length;
      let cntTrue: number = 0;
      var _self = this;
      for (var i = 0; i < activities.length; i++) {
        for (var teamname of this.old_teamVisible) {
          if (activities[i]['teamsImplemented'][teamname]) {
            cntTrue++;
            // console.log(`Counting ${activities[i].activityName}: ${teamname} (${cntTrue})`);
          }
        }
      }

      var colorSector = d3
        .scaleLinear<string, string>()
        .domain([0, 1])
        .range(['white', 'green']);

      if (cntAll !== 0) {
        this.old_ALL_CARD_DATA[index]['Done%'] = cntTrue / cntAll;
        // console.log(`${this.ALL_CARD_DATA[index].SubDimension} ${this.ALL_CARD_DATA[index].Level} Done: ${cntTrue}/${cntAll} = ${(cntTrue / cntAll*100).toFixed(1)}%`);
        d3.select('#index-' + index).attr('fill', function (p) {
          return colorSector(_self.old_ALL_CARD_DATA[index]['Done%']);
        });
      } else {
        this.old_ALL_CARD_DATA[index]['Done%'] = -1;
        // console.log(`${this.ALL_CARD_DATA[index].SubDimension} ${this.ALL_CARD_DATA[index].Level} None`);
        d3.select('#index-' + index).attr('fill', '#DCDCDC');
      }
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
          localStorage.removeItem('dataset');
          location.reload(); // Make sure all load routines are initialized
        }
      });
  }

  saveDataset() {
    localStorage.setItem('dataset', JSON.stringify(this.old_ALL_CARD_DATA));
  }

  loadDataset() {
    var content = this.getDatasetFromBrowserStorage();
    if (content != null) {
      this.old_ALL_CARD_DATA = content;
    }
  }

  getDatasetFromBrowserStorage(): any {
    console.log(`${this.perfNow()}s: getDatasetFromBrowserStorage() ####`);
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

  perfNow(): string {
    return (performance.now() / 1000).toFixed(3);
  }

  unsorted() {
    return 0;
  }
}

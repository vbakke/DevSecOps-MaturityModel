import {
  Component,
  OnInit,
  ViewChildren,
  QueryList,
  ChangeDetectorRef,
} from '@angular/core';
import { ymlService } from '../../service/yaml-parser/yaml-parser.service';
import * as d3 from 'd3';
import * as yaml from 'js-yaml';
import { Router } from '@angular/router';
import { MatChip } from '@angular/material/chips';
import * as md from 'markdown-it';

export interface activitySchema {
  uuid: string;
  activityName: string;
  teamsImplemented: any;
}

export interface cardSchema {
  Dimension: string;
  SubDimension: string;
  Level: string;
  'Done%': number;
  Activity: activitySchema[];
}

type ProjectData = {
  Activity: activitySchema[];
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
  maxLevelOfActivities: number = -1;
  showActivityCard: boolean = false;
  cardHeader: string = '';
  cardSubheader: string = '';
  currentDimension: string = '';
  activityData: any[] = [];
  ALL_CARD_DATA: cardSchema[] = [];
  radial_labels: string[] = [];
  YamlObject: any;
  teamList: any;
  teamGroups: any;
  selectedTeamChips: string[] = ['All'];
  teamVisible: string[] = [];
  segment_labels: string[] = [];
  activityDetails: any;
  showOverlay: boolean;
  showFilters: boolean;
  markdown: md = md();

  constructor(
    private yaml: ymlService,
    private router: Router,
    private changeDetector: ChangeDetectorRef
  ) {
    this.showOverlay = false;
    this.showFilters = true;
  }

  ngOnInit(): void {
    console.log(`${this.perfNow()}s: ngOnInit`);
    // Ensure that Levels and Teams load before MaturityData
    // Using promises, since ngOnInit does not support async/await
    this.LoadMaturityLevels()
      .then(() => this.LoadTeamsFromMetaYaml())
      .then(() => this.LoadMaturityDataFromGeneratedYaml())
      .then(() => {
        console.log(`${this.perfNow()}s: set filters: ${this.chips?.length}`);
        this.matChipsArray = this.chips.toArray();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  @ViewChildren(MatChip) chips!: QueryList<MatChip>;
  matChipsArray: MatChip[] = [];

  private LoadMaturityDataFromGeneratedYaml() {
    return new Promise<void>((resolve, reject) => {
      console.log(`${this.perfNow()}s: LoadMaturityDataFromGeneratedYaml Fetch`);
      this.yaml.setURI('./assets/YAML/generated/generated.yaml');

      this.yaml.getJson().subscribe(
        (data) => {
          console.log(`${this.perfNow()}s: LoadMaturityDataFromGeneratedYaml Downloaded`);
        this.YamlObject = data;
        var allDimensionNames = Object.keys(this.YamlObject);
        var totalTeamsImplemented: number = 0;
        var totalActivityTeams: number = 0;

        this.AddSegmentLabels(allDimensionNames);

        for (var l = 0; l < this.maxLevelOfActivities; l++) {
          for (var d = 0; d < allDimensionNames.length; d++) {
            var allSubDimensionInThisDimension = Object.keys(
              this.YamlObject[allDimensionNames[d]]
            );
            for (var s = 0; s < allSubDimensionInThisDimension.length; s++) {
              var allActivityInThisSubDimension = Object.keys(
                this.YamlObject[allDimensionNames[d]][
                  allSubDimensionInThisDimension[s]
                ]
              );
              var level = 'Level ' + (l + 1);
              var activity: activitySchema[] = [];
              var activityCompletionStatus: number = -1;

            for (var a = 0; a < allActivityInThisSubDimension.length; a++) {
              try {
                var currentActivity:any =
                  this.YamlObject[allDimensionNames[d]][
                    allSubDimensionInThisDimension[s]
                  ][allActivityInThisSubDimension[a]];

                var lvlOfCurrentActivity = currentActivity['level'];
                var uuid = currentActivity['uuid'];

                  if (lvlOfCurrentActivity == l + 1) {
                    var nameOfActivity: string = allActivityInThisSubDimension[a];
                    var teamStatus: { [key: string]: boolean } = {};
                    const teams = this.teamList;

                    totalActivityTeams += 1;

                    teams.forEach((singleTeam: any) => {
                      teamStatus[singleTeam] = false;
                    });

                  var teamsImplemented: any =
                    currentActivity.teamsImplemented;

                    if (teamsImplemented) {
                      teamStatus = teamsImplemented;
                    }

                    var localStorageData = this.getFromBrowserState();
                  if (localStorageData && localStorageData.length > 0) {
                    var combinedTeamsImplemented = Object.assign(
                      {},
                      teamsImplemented,
                      this.getTeamImplementedFromJson(
                        localStorageData,
                        allActivityInThisSubDimension[a]
                      ));
                  }

                  (
                    Object.keys(teamStatus) as (keyof typeof teamStatus)[]
                  ).forEach((key, index) => {
                    totalActivityTeams += 1;
                    if (teamStatus[key] === true) {
                      totalTeamsImplemented += 1;
                    }
                  });

                  activity.push({
                    uuid: uuid,
                    activityName: nameOfActivity,
                    teamsImplemented: teamStatus,
                  });
                }

                if (totalActivityTeams > 0) {
                  activityCompletionStatus =
                    totalTeamsImplemented / totalActivityTeams;
                }
              } catch {
                console.log('level for activity does not exist');
              }
            }

              var cardSchemaData: cardSchema = {
                Dimension: allDimensionNames[d],
                SubDimension: allSubDimensionInThisDimension[s],
                Level: level,
                'Done%': activityCompletionStatus,
                Activity: activity,
              };

              this.ALL_CARD_DATA.push(cardSchemaData);
            }
          }
        }

        console.log('ALL CARD DATA', this.ALL_CARD_DATA);
        this.loadState();
        this.loadCircularHeatMap(
          this.ALL_CARD_DATA,
          '#chart',
          this.radial_labels,
          this.segment_labels
        );
        this.noActivitytoGrey();
        console.log(`${this.perfNow()}s: LoadMaturityDataFromGeneratedYaml End`);
        resolve();
      },
      (error) => {
        reject(error?.message);
      });
    });
  }

  private getTeamImplementedFromJson(
    data: ProjectData,
    activityName: string
  ): any | undefined {
    const activity = data.find(project =>
      project.Activity.find(activity => activity.activityName === activityName)
    );

    if (activity) {
      return activity.Activity.find(
        activity => activity.activityName === activityName
      )?.teamsImplemented;
    }

    return undefined;
  }

  private AddSegmentLabels(allDimensionNames: string[]) {
    console.log(allDimensionNames);
    for (var i = 0; i < allDimensionNames.length; i++) {
      var allSubDimensionInThisDimension = Object.keys(
        this.YamlObject[allDimensionNames[i]]
      );
      for (var j = 0; j < allSubDimensionInThisDimension.length; j++) {
        this.segment_labels.push(allSubDimensionInThisDimension[j]);
      }
    }
    console.log(this.segment_labels);
  }

  private LoadTeamsFromMetaYaml() {
    return new Promise<void>((resolve, reject) => {

      console.log((performance.now()/1000).toFixed(3) + 's: LoadTeamsFromMetaYaml STARTUP');
      this.yaml.setURI('./assets/YAML/vb_teams.yaml');
      this.yaml.getJson().subscribe(
        data => { 
          console.log('LoadTeamsFromMetaYaml')
          console.log((performance.now()/1000).toFixed(3) + 's: LoadTeamsFromMetaYaml RECEIVED');
          
          this.YamlObject = data;
        
          this.teamList = this.YamlObject['teams'];
          this.teamGroups = this.YamlObject['teamGroups'];
          this.teamVisible = [...this.teamList];
          console.log('Teams: ', this.teamList);
          console.log('Teams vis: ', this.teamVisible);
          console.log('Teams groups: ', this.teamGroups);
          console.log((performance.now()/1000).toFixed(3) + 's: LoadTeamsFromMetaYaml END');
          resolve();
        },
        (error) => {
          reject(error.message);
        });
    });
  }
  
  private LoadMaturityLevels() {
    return new Promise<void>((resolve, reject) => {
      console.log((performance.now()/1000).toFixed(3) + 's: LoadMaturityLevels STARTUP');
      this.yaml.setURI('./assets/YAML/meta.yaml');
      // Function sets column header
      this.yaml.getJson().subscribe(
        (data) => { 
          console.log((performance.now()/1000).toFixed(3) + 's: LoadMaturityLevels RECEIVED');
          this.YamlObject = data;

          // Levels header
          for (let x in this.YamlObject['strings']['en']['maturity_levels']) {
            var y = parseInt(x) + 1;
            this.radial_labels.push('Level ' + y);
            this.maxLevelOfActivities = y;
          }
          console.log((performance.now()/1000).toFixed(3) + 's: LoadMaturityLevels END');
          resolve();
        },
        (error) => {
          reject(error.message);
        });
    });
  }

  toggleTeamGroupSelection(chip: MatChip) {
    chip.toggleSelected();
    let currChipValue = chip.value.trim();

    if (chip.selected) {
      this.selectedTeamChips = [currChipValue];
      if (currChipValue == 'All') {
        this.teamVisible = [...this.teamList];
      } else {
        var teamGroup:any = this.teamGroups[currChipValue];
        this.teamVisible = this.teamList.filter(
          (teamname:string) =>  teamGroup.includes(teamname)
        );
      }
    } else {
      this.selectedTeamChips = this.selectedTeamChips.filter(
        (teamname:string) => teamname !== currChipValue
      );
    }
    console.log('Selected Chips', this.selectedTeamChips);
    console.log('Team Visible', this.teamVisible);
    console.log('All chips', this.matChipsArray);

    // Update heatmap based on selection
    this.updateChips(true);
  }

  toggleTeamSelection(chip: MatChip) {
    chip.toggleSelected();
    let currChipValue = chip.value.trim();
    let prevSelectedChip = this.selectedTeamChips;
    if (chip.selected) {
      this.teamVisible.push(currChipValue);
      this.selectedTeamChips = [];
    } else {
      this.selectedTeamChips = [];
      this.teamVisible = this.teamVisible.filter(o => o !== currChipValue);
    }
    console.log('Selected Chips', this.selectedTeamChips);
    console.log('Team Visible', this.teamVisible);
    console.log('Team List', this.teamList);
    console.log('All chips', this.matChipsArray);
    // Update heatmap based on selection
    this.updateChips(prevSelectedChip);
  }

  ngAfterViewInit() {
    // Putting all the chips inside an array

    setTimeout(() => {
      this.matChipsArray = this.chips.toArray();
      this.updateChips(true);
      this.reColorHeatmap();
    }, 100);
  }

  updateChips(fromTeamGroup: any) {
    console.log('updating chips', fromTeamGroup);
    // Re select chips
    this.matChipsArray.forEach(chip => {
      let currChipValue = chip.value.trim();

      if (this.teamVisible.includes(currChipValue)) {
        console.log(currChipValue);
        chip.selected = true;
      } else {
        if (!this.selectedTeamChips.includes(currChipValue)) {
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
    for (var i = 0; i < this.ALL_CARD_DATA.length; i++) {
      if (
        this.ALL_CARD_DATA[i]['SubDimension'] === this.cardHeader &&
        this.ALL_CARD_DATA[i]['Level'] === this.cardSubheader
      ) {
        index = i;
        break;
      }
    }
    this.ALL_CARD_DATA[index]['Activity'][activityIndex]['teamsImplemented'][
      teamKey
    ] =
      !this.ALL_CARD_DATA[index]['Activity'][activityIndex]['teamsImplemented'][
        teamKey
      ];
    console.log(`teamCheckbox(${teamKey}); Changed into: ${this.ALL_CARD_DATA[index]['Activity'][activityIndex]['teamsImplemented'][teamKey]}`);
    this.saveState();
    this.reColorHeatmap();
  }

  loadCircularHeatMap(
    dataset: any,
    dom_element_to_append_to: string,
    radial_labels: string[],
    segment_labels: string[]
  ) {
    //console.log(segment_labels)
    //d3.select(dom_element_to_append_to).selectAll('svg').exit()
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
    // segmentLabelHeight = 50;
    var outerRadius = bbWidth / 2 - segmentLabelHeight; 
    var innerRadius = outerRadius / 7; 
    var segmentHeight = (outerRadius -  innerRadius) / radial_labels.length;
    
    console.log(`Outer width: ${imageWidth}, inner radius: ${innerRadius},  outer radius: ${outerRadius}`);
    console.log(`segmentHeight: ${segmentHeight}, labelHeight: ${segmentLabelHeight}, margin: ${(margin.left + margin.right + margin.top + margin.bottom) / 4}`);
    
    var curr: any;
    var chart = this.circularHeatChart(segment_labels.length)
      .margin(margin)
      .innerRadius(innerRadius)
      .segmentHeight(segmentHeight)
      .domain([0, 1])
      .range(['white', 'green'])
      .radialLabels(radial_labels)
      .segmentLabels(segment_labels)
      .segmentLabelHeight(segmentLabelHeight)

    chart.accessor(function (d: any) {
      return d['Done%'];
    });
    
    var svg = d3
      .select(dom_element_to_append_to)
      .selectAll('svg')
      .data([dataset])
      .enter()
      .append('svg')
      // .attr('width', imageWidth)
      // .attr('height', imageWidth)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${imageWidth} ${imageWidth}`) 
      .append('g')
      .attr(
        'transform',
        `translate(${margin.left + segmentLabelHeight}, ${margin.top + segmentLabelHeight})`
      )
      .call(chart);

    function cx() {
      var e = window.event as MouseEvent;
      return e.clientX;
    }
    function cy() {
      var e = window.event as MouseEvent;
      return e.clientY;
    }

    svg
      .selectAll('path')
      .on('click', function (d) {
        _self.console_log_event('click', d);
        _self.setSectorCursor(svg, '#hover', '');

        var clickedId = d.currentTarget.id;
        var index = parseInt(clickedId.replace('index-', ''));
        curr = _self.ALL_CARD_DATA[index];
        console.log('index', curr['Activity']);

        if (curr['Done%'] == -1) {
          _self.showActivityCard = false;          
          _self.setSectorCursor(svg, '#selected', '');
        } else {
          _self.showActivityCard = true;
          _self.currentDimension = curr.Dimension;
          _self.cardSubheader = curr.Level;
          _self.activityData = curr.Activity;
          _self.cardHeader = curr.SubDimension;
          
          _self.setSectorCursor(svg, '#selected', clickedId);
          }
      })
      .on('mouseover', function (d) {
        _self.console_log_event('mouseover', d);
        curr = d.currentTarget.__data__;

        if (curr && curr['Done%'] != -1) {
          var clickedId = d.srcElement.id;
          _self.setSectorCursor(svg, '#hover', clickedId);
        }
      })

      .on('mouseout', function (d) {
        _self.console_log_event('mouseout', d);
        _self.setSectorCursor(svg, '#hover', '');
      });
    this.reColorHeatmap();
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

    //console.log(segmentLabels)

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
          // .attr("class","segment")
          .attr('class', function (d: any) {
            return 'segment-' + d.SubDimension.replace(/ /g, '-');
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
          .attr('fill', function (d) {
            return color(accessor(d));
          });

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
          .attr('id', 'segment-label-path')
          .attr('d', 'm0 -' + r + ' a' + r + ' ' + r + ' 0 1 1 -1 0');

        labels
          .selectAll('text')
          .data(segmentLabels)
          .enter()
          .append('text')
          .append('textPath')
          .attr('text-anchor', 'middle')
          .attr('xlink:href', '#segment-label-path')
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
      //if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.innerRadius = function (_: any) {
      // if (!arguments.length) return innerRadius;
      innerRadius = _;
      return chart;
    };

    chart.numSegments = function (_: any) {
      //if (!arguments.length) return numSegments;
      numSegments = _;
      return chart;
    };

    chart.segmentHeight = function (_: any) {
      // if (!arguments.length) return segmentHeight;
      segmentHeight = _;
      return chart;
    };

    chart.segmentLabelHeight = function (_: any) {
      // if (!arguments.length) return segmentLabelHeight;
      segmentLabelHeight = _;
      return chart;
    };

    chart.domain = function (_: any) {
      //if (!arguments.length) return domain;
      domain = _;
      return chart;
    };

    chart.range = function (_: any) {
      // if (!arguments.length) return range;
      range = _;
      return chart;
    };

    chart.radialLabels = function (_: any) {
      // if (!arguments.length) return radialLabels;
      if (_ == null) _ = [];
      radialLabels = _;
      return chart;
    };

    chart.segmentLabels = function (_: any) {
      // if (!arguments.length) return segmentLabels;
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

  setSectorCursor(svg:any, cursor:string, targetId:string): void {
    let element = svg.select(cursor);
    let path:string = '';
    if (targetId) {
      if (targetId[0] != '#') targetId = '#' + targetId;
      path = svg.select(targetId).attr('d');
    }

    svg.select(cursor).attr('d', path);
  }

  noActivitytoGrey(): void {
    for (var x = 0; x < this.ALL_CARD_DATA.length; x++) {
      if (this.ALL_CARD_DATA[x]['Done%'] == -1) {
        d3.select('#index-'+ x).attr('fill', '#DCDCDC');
      }
    }
  }

  openActivityDetails(dim: string, subdim: string, activityName: string) {
    let navigationExtras = {
      dimension: dim,
      subDimension: subdim,
      activityName: activityName,
    };
    this.activityDetails = Object.assign(
      {},
      this.YamlObject[dim][subdim][activityName]
    );

    if (this.activityDetails) {
      this.activityDetails.navigationExtras = navigationExtras;
    }
    console.log(this.activityDetails);
    this.showOverlay = true;
  }

  closeOverlay() {
    this.showOverlay = false;
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  saveEditedYAMLfile() {
    this.setTeamsStatus(this.YamlObject, this.teamList, this.ALL_CARD_DATA);
    let yamlStr = yaml.dump(this.YamlObject);

    let file = new Blob([yamlStr], { type: 'text/csv;charset=utf-8' });
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(file);
    link.download = 'generated.yaml';
    link.click();
    link.remove();
  }

  setTeamsStatus(yamlObject:any, teamList:string[], card_data:cardSchema[]) {
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
    var teamsCount = this.teamVisible.length;

    for (var index = 0; index < this.ALL_CARD_DATA.length; index++) {
      var activities = this.ALL_CARD_DATA[index]['Activity'];
      let cntAll: number = teamsCount * activities.length;
      let cntTrue: number = 0;
      var _self = this;
      for (var i = 0; i < activities.length; i++) {
        for (var teamname of this.teamVisible) {
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
        this.ALL_CARD_DATA[index]['Done%'] = cntTrue / cntAll;
        // console.log(`${this.ALL_CARD_DATA[index].SubDimension} ${this.ALL_CARD_DATA[index].Level} Done: ${cntTrue}/${cntAll} = ${(cntTrue / cntAll*100).toFixed(1)}%`);
        d3.select('#index-' + index).attr('fill', function (p) {
          return colorSector(_self.ALL_CARD_DATA[index]['Done%']);
        });
      } else {
        this.ALL_CARD_DATA[index]['Done%'] = -1;
        // console.log(`${this.ALL_CARD_DATA[index].SubDimension} ${this.ALL_CARD_DATA[index].Level} None`);
        d3.select('#index-'+ index).attr('fill', '#DCDCDC');
      }
    }
  }

  ResetIsImplemented() {
    localStorage.removeItem('dataset');
    this.loadState();
  }

  saveState() {
    localStorage.setItem('dataset', JSON.stringify(this.ALL_CARD_DATA));
  }

  loadState() {
    var content = localStorage.getItem('dataset');
    // @ts-ignore
    if (this.ALL_CARD_DATA[0]['Task'] != null) {
      console.log('Found outdated dataset, removing');
      localStorage.removeItem('dataset');
    }
    if (content != null) {
      this.ALL_CARD_DATA = JSON.parse(content);
    }
  }

  getFromBrowserState(): any {
    var content = localStorage.getItem('dataset');
    if (content != null) {
      return JSON.parse(content);
    }
  }

  perfNow(): string {
    return (performance.now() / 1000).toFixed(3);
  }

  unsorted() {
    return 0;
  }

  console_log_event(type:string, event:any) {
    console.log(this.perfNow() + ': --- ' + type + ' ---');
    console.log(this.perfNow() + ': ' + type + this.event_to_str('currentTarget', event));
    console.log(this.perfNow() + ': data:' + event?.currentTarget?.__data__);
    console.log(this.perfNow() + ': ' + type + this.event_to_str('explicitOriginalTarget', event));
    console.log(this.perfNow() + ': ' + type + this.event_to_str('relatedTarget', event));
    // console.log(this.perfNow() + ': ' + type + this.event_to_str('originalTarget', event));
    // console.log(this.perfNow() + ': ' + type + this.event_to_str('target', event));
    console.log(this.perfNow() + ': ' + type + this.event_to_str('srcElement', event));
    console.log(this.perfNow() + ': ' + type + this.event_to_str('toElement', event));
    // console.log(_self.perfNow() + ': mouseover', d);
  }
  event_to_str(name:string, event:any): string {
    let str:string = ': ' + name + ': ';
    if (event[name]) {
      str += `<${event[name]?.localName} id="${event[name]?.id}" class="${event[name]?.classList?.toString()}">` ;
     } else {
      str += event[name];
     }

    return str;
  }
}

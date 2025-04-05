import { E, Y } from "@angular/cdk/keycodes";

export type Category = Record<string, Dimension>;
export type Dimension = Record<string, Activity>;
export interface Activity {
  uuid: string;
  category: string;
  dimension: string;
  level: number;
  name: string;
  description: string;
}



// export interface activityDescription {
//   level: string;
//   tags: string[];
//   activityName: string;
//   uuid: string;
//   description: string;
//   risk: string;
//   measure: string;
//   implementatonGuide: string;
//   iso: string[];
//   iso22: string[];
//   samm: string[];
//   openCRE: string[];
//   knowledge: number;
//   resources: number;
//   time: number;
//   dependsOn: string[];
//   implementation: Implementation[];
//   usefulness: number;
//   evidence: string;
//   teamsEvidence: Object;
//   assessment: string;
//   comments: string;
//   // isImplemented: boolean;
//   // teamsImplemented: Record<string, any>;
// }
// export interface Implementation {
//   name: string;
//   tags: string[];
//   url: string;
//   description: string;
// }



export class Activities {
  public data: Category[] = [];

  // constructor(yaml:any) {
  // }
  addActivityFile(yaml:any) {
    this.data = this._build(yaml);
  }

  _build(yaml: Category[]): Category[] {
    // let data: Category[] = yaml;
    let errors: string[] = [];

    for (let categoryName in yaml) {
      let category = yaml[categoryName];
      if (categoryName == 'ignore') { continue; }
      for (let dimName in category) {
        if (dimName == 'ignore') { continue; }
        let dimension: Dimension = category[dimName];
        for (let activityName in dimension) {
          if (activityName == 'ignore') { continue; }
          console.log(`${categoryName} -- ${dimName} -- ${activityName}`);
          let activity: Activity = dimension[activityName];
          activity.category = categoryName;
          activity.dimension = dimName;

          if (!activity.level) errors.push(`Activity '${activityName}' is missing level`);
          // category[categoryName] = yaml[categoryName];
        }
      }
    }

    if (errors.length) {
      for (let error of errors)
        console.error(error);
      throw Error(errors.toString());
    }

    return yaml;
  }

  _buildActivityByName() {
  }
  _buildActivityByUuid() {
  }
}
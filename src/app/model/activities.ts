export type Data = Record<string, Categories>;
export type Categories = Record<string, Dimensions>;
export type Dimensions = Record<string, Activity>;
export interface Activity {
  ignore: boolean;
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
  public data: Data = {};
  private _activityList: Activity[] = [];
  private _activityByUuid: Record<string, Activity> = {};
  private _activityByName: Record<string, Activity> = {};

  public getActivityByName() {
  }
  public getActivityByUuid() {
  }

  public addActivityFile(yaml:any, errors: string[]) {
    let requireUuid: boolean = this._activityList.length == 0;
    let activityList: Activity[] = this.prepareActivities(yaml, requireUuid, errors);
    if (this._activityList.length == 0) {
      //this._ensureNoDuplicateIds(...)
      this._activityList = activityList;
      this.buildLookups(
        activityList,
        this._activityByName,
        this._activityByUuid, errors
      );
      this.data = yaml;
      this.buildDataHierarchy(this._activityList);
    } else {
      // let activityByName: Record<string, Activity> = {};
      // let activityByUuid: Record<string, Activity> = {};
      //this._ensureNoDuplicateIds(...)
      //this.buildLookups(activityList, activityByName, activityByUuid,errors);
      this.mergeActivities(activityList, this._activityList, errors);
      // TODO: Remove ignored activities, dimension, categories and levels

      // Reset lookup tables after merge
      this._activityByName = {};
      this._activityByUuid = {};
      this.buildLookups(
        this._activityList,
        this._activityByName,
        this._activityByUuid, errors
      );
      this.buildDataHierarchy(this._activityList);
    }

  }


  buildDataHierarchy(activityList: Activity[]) {
    this.data = {};
    let data: Data = this.data;
    let categories: Categories;
    let dimensions: Dimensions;

    for (let activity of activityList) {
      if (!data.hasOwnProperty(activity.category))
        data[activity.category] = {};

      categories = data[activity.category];
      if (!categories.hasOwnProperty(activity.dimension))
        categories[activity.dimension] = {};

      dimensions = categories[activity.dimension];

      dimensions[activity.name] = activity;

    }
  }

  prepareActivities(yaml: Data, requireUuid:boolean, errors: string[]): Activity[] {
    let activityList: Activity[] = [];

    for (let categoryName in yaml) {
      let category = yaml[categoryName];
      if (categoryName == 'ignore') { continue; }
      for (let dimName in category) {
        if (dimName == 'ignore') { continue; }
        let dimension: Dimensions = category[dimName];
        for (let activityName in dimension) {
          let activity: Activity = dimension[activityName];
          if (activityName == 'ignore' || activity.ignore) { continue; }

          console.log(`${categoryName} -- ${dimName} -- ${activityName}`);
          activity.category = categoryName;
          activity.dimension = dimName;
          activity.name = activityName;

          if (requireUuid && !activity.uuid) errors.push(`Activity '${activityName}' is missing the 'uuid' attribute`);         // eslint-disable-line
          else if (requireUuid && !activity.level) errors.push(`Activity '${activityName}' is missing the 'level' attribute`);  // eslint-disable-line
          else activityList.push(activity);
        }
      }
    }
    return activityList;
  }

  buildLookups(activityList: Activity[],
    activityByName: Record<string, Activity>,
    activityByUuid: Record<string, Activity>,
    errors: string[]
  ) {
    for (let activity of activityList) {
      this.addActivityLookup(activity, activityByName, activityByUuid, errors);
    }
  }

  addActivityLookup(
    activity: Activity,
    activityByName: Record<string, Activity>,
    activityByUuid: Record<string, Activity>,
    errors: string[]
  ): boolean {
    let nameExists = activityByName.hasOwnProperty(activity.name);
    let uuidExists = activityByUuid.hasOwnProperty(activity.uuid);

    if (nameExists && uuidExists) {
      // eslint-disable-next-line
      errors.push(`Duplicate activity '${activity.name}' (${activity.uuid}). Please remove one from your activity yaml files.`)
    } else if (nameExists) {
      // eslint-disable-next-line
      errors.push(`Duplicate activity name '${activity.name}' (${activity.uuid} and ${activityByName[activity.name].uuid}).`)
    } else if (uuidExists) {
      // eslint-disable-next-line
      errors.push(`Duplicate activity uuid '${activity.uuid}' ('${activity.name}' and '${activityByUuid[activity.uuid].name}').`)
    } else {
      activityByName[activity.name] = activity;
      activityByUuid[activity.uuid] = activity;
      return true;
    }
    return false;
  }

  mergeActivities(
    newActivities: Activity[],
    existingData: Activity[],
    errors: string[]
  ) {
    for (let newActivity of newActivities) {
      /*  name  uuid
          name + no uuid: Lookup previous uuid
               - No uuid: Add
               - Has uuid: Update
          name + uuid match: Override
          !name, uuid: Override uuid activity, using new name
          name, !uuid: Error
          !name, !uuid: New activity

      */

      let existingActivity: Activity | null = null;
      // If newActivity lacks uuid, identify by name
      if (!newActivity.uuid) {
        if (this._activityByName.hasOwnProperty(newActivity.name)) {
          existingActivity = this._activityByName[newActivity.name];
        }
      } else {
        if (this._activityByUuid.hasOwnProperty(newActivity.uuid)) {
          existingActivity = this._activityByUuid[newActivity.uuid];
        } else {
          // The UUID is new, but verify that the name is also new
          if (this._activityByName.hasOwnProperty(newActivity.name)) {
            errors.push(
              `The activity '${newActivity.name} is exists with different uuids ` +          // eslint-disable-line
                `(${newActivity.uuid} and ${this._activityByName[newActivity.name].uuid})`   // eslint-disable-line
            );
          }
        }
      }

      if (existingActivity == null) {
        this.addActivity(newActivity, existingData);
      } else {
        this.updateActivity(newActivity, existingActivity);
      }
    }
  }

  addActivity(newActivity: Activity, existingData: Activity[]) {
    this._activityByName[newActivity.name] = newActivity;
    this._activityByUuid[newActivity.uuid] = newActivity;

    existingData.push(newActivity);
  }
  updateActivity(newActivity: Activity, existingActivity: Activity) {
    if (newActivity.name != existingActivity.name)
      this._activityByName[newActivity.name] = existingActivity;
    if (newActivity.uuid != existingActivity.uuid)
      this._activityByUuid[newActivity.uuid] = existingActivity;

    Object.assign(existingActivity, newActivity);
  }
}

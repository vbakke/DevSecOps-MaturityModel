import { IgnoreList } from './ignore-list';

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
  tags: string[];
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

export class ActivityStore {
  public data: Data = {};
  private _activityList: Activity[] = [];
  private _activityByUuid: Record<string, Activity> = {};
  private _activityByName: Record<string, Activity> = {};

  public getActivityByName(name: string): Activity {
    return this._activityByName[name];
  }
  public getActivityByUuid(uuid: string): Activity {
    return this._activityByUuid[uuid];
  }

  public addActivityFile(yaml: Data, errors: string[]) {
    // let requireUuid: boolean = this._activityList.length == 0;
    let activityList: Activity[] = [];
    let ignoreList: IgnoreList = new IgnoreList();
    this.prepareActivities(yaml, activityList, ignoreList);
    if (this._activityList.length == 0) {
      this._activityList = activityList;
      this.buildLookups(
        activityList,
        this._activityByName,
        this._activityByUuid,
        errors
      );
      this.data = yaml;
      this.buildDataHierarchy(this._activityList);
    } else {
      this.removeIgnoredActivities(ignoreList, this._activityList);
      // let activityByName: Record<string, Activity> = {};
      // let activityByUuid: Record<string, Activity> = {};
      //this._ensureNoDuplicateIds(...)
      //this.buildLookups(activityList, activityByName, activityByUuid,errors);
      this.mergeActivities(activityList, this._activityList, errors);

      // Reset lookup tables after merge
      this._activityByName = {};
      this._activityByUuid = {};
      this.buildLookups(
        this._activityList,
        this._activityByName,
        this._activityByUuid,
        errors
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
      if (!data.hasOwnProperty(activity.category)) {
        data[activity.category] = {};
      }

      categories = data[activity.category];
      if (!categories.hasOwnProperty(activity.dimension)) {
        categories[activity.dimension] = {};
      }

      dimensions = categories[activity.dimension];
      dimensions[activity.name] = activity;
    }
  }

  /**
   * Prepare activities loaded from a YAML file.
   *  - Add category, dimension and activity name to activity object
   *  - unless ignored, then add it to the ignoreList
   */
  prepareActivities(
    yaml: Data,
    activityList: Activity[],
    ignoreList: IgnoreList
  ): void {
    for (let categoryName in yaml) {
      let category = yaml[categoryName];
      for (let dimName in category) {
        if (dimName == 'ignore') {
          ignoreList.add('category', categoryName);
          continue;
        }

        let dimension: Dimensions = category[dimName];
        for (let activityName in dimension) {
          if (activityName == 'ignore') {
            ignoreList.add('dimension', dimName);
            continue;
          }
          let activity: Activity = dimension[activityName];
          if (activity.ignore === true) {
            if (activity.uuid) {
              ignoreList.add('uuid', activity.uuid);
            } else {
              ignoreList.add('name', activityName);
            }
            continue;
          }

          console.log(`  - ${categoryName} -- ${dimName} -- ${activityName}`);
          activity.category = categoryName;
          activity.dimension = dimName;
          activity.name = activityName;

          activityList.push(activity);
        }
      }
    }
  }

  removeIgnoredActivities(ignoreList: IgnoreList, activityList: Activity[]) {
    if (ignoreList.isEmpty()) return;

    let i: number = activityList.length - 1;

    // Loop backwards to not tamper with index when removing items
    while (i >= 0) {
      if (ignoreList.hasActivity(activityList[i])) {
        activityList.splice(i, 1); // Remove item from list
      }
      i--;
    }
  }

  buildLookups(
    activityList: Activity[],
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
      errors.push(`Duplicate activity name '${activity.name}' (${activity.uuid} and ${activityByName[activity.name].uuid}). Please remove or rename one of the activities.`)
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

  /**
   * Merge new activities into list of existing activities.
   * Override property by property if the new activity already exists.
   * Identify existing by UUID (if present), otherwise by Name.
   *
   * If any errors are detected, return this by the error list.
   */
  mergeActivities(
    newActivities: Activity[],
    existingData: Activity[],
    errors: string[]
  ) {
    for (let newActivity of newActivities) {
      let foundExistingActivity: Activity | null = null;

      // If newActivity lacks uuid, identify by name
      if (!newActivity.uuid) {
        if (this._activityByName.hasOwnProperty(newActivity.name)) {
          foundExistingActivity = this._activityByName[newActivity.name];
        }
      } else {
        // Identify by uuid
        if (this._activityByUuid.hasOwnProperty(newActivity.uuid)) {
          foundExistingActivity = this._activityByUuid[newActivity.uuid];
        } else {
          // The uuid is new, but verify that the name does not exist (i.e. double uuids)
          if (this._activityByName.hasOwnProperty(newActivity.name)) {
            errors.push(
              `The activity '${newActivity.name}' exists with different uuids ` +          // eslint-disable-line
                `(${newActivity.uuid} and ${this._activityByName[newActivity.name].uuid})`   // eslint-disable-line
            );
          }
        }
      }

      if (foundExistingActivity == null) {
        this.addActivity(newActivity, existingData);
      } else {
        this.updateActivity(newActivity, foundExistingActivity);
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

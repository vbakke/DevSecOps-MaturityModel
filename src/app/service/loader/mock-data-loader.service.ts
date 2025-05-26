  // Create mock LoaderService
  import { ActivityStore, Data } from 'src/app/model/activity-store';

  export class MockLoaderService {
    private MOCK_DATA: Data;

    constructor(MOCK_DATA: Data) {
      this.MOCK_DATA = MOCK_DATA;
    }
    load() {
      console.log('MOCK loader service');
      let activityStore = new ActivityStore();
      let errors: string[] = [];
      activityStore.addActivityFile(this.MOCK_DATA, errors);
      console.log('MOCK activityStore:', activityStore);
      return Promise.resolve(activityStore);
    }
    getLevels() {
      return ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];
    }
  };


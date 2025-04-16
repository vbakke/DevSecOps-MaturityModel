import { TestBed } from '@angular/core/testing';
import { ActivityStore, Data } from './activity-store';
// import { LoaderService } from 'src/app/service/data-loader.service';
// import { YamlService } from '../yaml-loader/yaml-loader.service';

let baseYaml: Data;

describe('ActivityStore', () => {
  let store: ActivityStore;
  let errors: string[];
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ActivityStore],
    });
    store = TestBed.inject(ActivityStore);
    errors = [];
    baseYaml = JSON.parse(JSON.stringify(baseYaml_original));
  });

  afterEach(() => {
    if (errors.length > 0) {
      console.warn('--- Error messages: ---');
      for (let err of errors) console.log(err);
    }
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  // prettier-ignore
  it('load base yaml', () => {
    store.addActivityFile(baseYaml, errors);

    expect(errors.length).toBe(0);
    expect(store.getActivityByUuid('00000000-1111-1111-1111-000000000000')).toBeTruthy();
    expect(store.getActivityByUuid('00000000-1111-1111-1111-000000000000')?.name).toBe('Activity 111');
    expect(store.getActivityByName('Activity 111')?.level).toBe(1);
    expect(store.getActivityByName('Activity 121')?.uuid).toBe('00000000-1111-2222-1111-000000000000');
  });

  // prettier-ignore
  it('override base yaml', () => {
    store.addActivityFile(baseYaml, errors);
    store.addActivityFile(extraYaml, errors);

    expect(errors.length).toBe(0);
    expect(store.getActivityByName('Activity 111')).toBeUndefined(); // Changed name, to:
    expect(store.getActivityByName('OVERRIDE 111')?.uuid).toBe('00000000-1111-1111-1111-000000000000');
    expect(store.getActivityByName('OVERRIDE 111')?.description).toBe('OVERRIDE DESC AND LEVEL');
    expect(store.getActivityByName('OVERRIDE 111')?.level).toBe(2);

    expect(store.getActivityByName('Activity 112')?.description).toBe('OVERRIDE: BASED ON NAME'); 
    expect(store.getActivityByName('Activity 121')).toBeUndefined(); // Ignored
    expect(store.getActivityByName('New Activity 311')).toBeTruthy();
  });
});

// -----------
//  Test data
// -----------
const baseYaml_original: any = {
  'Category 1': {
    'Dimension 11': {
      'Activity 111': {
        uuid: '00000000-1111-1111-1111-000000000000',
        level: 1,
        description: 'Description from base yaml',
      },
      'Activity 112': {
        uuid: '00000000-1111-1111-2222-000000000000',
        level: 1,
        description: 'Description from base yaml',
      },
    },
    'Dimension 12': {
      'Activity 121': {
        uuid: '00000000-1111-2222-1111-000000000000',
        level: 1,
        description: 'Description from base yaml',
      },
      'Activity 122': {
        uuid: '00000000-1111-2222-2222-000000000000',
        level: 1,
        description: 'Description from base yaml',
      },
    },
  },
  'Category 2': {
    'Dimension 21': {
      'Activity 211': {
        uuid: '00000000-2222-1111-1111-000000000000',
        level: 1,
        description: 'Description from base yaml',
      },
    },
  },
};

const extraYaml: any = {
  'Category 1': {
    'Dimension 11': {
      'OVERRIDE 111': {
        uuid: '00000000-1111-1111-1111-000000000000',
        level: 2,
        description: 'OVERRIDE DESC AND LEVEL',
      },
      'Activity 112': {
        description: 'OVERRIDE: BASED ON NAME',
      },
    },
    'Dimension 12': {
      'Activity 121': {
        ignore: true,
      },
    },
  },
  'Category 2': {
    'Dimension 21': {
      ignore: true,
    },
  },
  'Category 3': {
    'Dimension 31': {
      'New Activity 311': {
        uuid: '00000000-3333-1111-1111-000000000000',
        level: 3,
      },
    },
  },
};

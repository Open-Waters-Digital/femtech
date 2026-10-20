import * as migration_20261019_094038_initial from './20261019_094038_initial';
import * as migration_20261020_075708_social_profiles from './20261020_075708_social_profiles';
import * as migration_20261020_081732_member_job_details from './20261020_081732_member_job_details';
import * as migration_20261020_083711_signup_page_copy from './20261020_083711_signup_page_copy';

export const migrations = [
  {
    up: migration_20261019_094038_initial.up,
    down: migration_20261019_094038_initial.down,
    name: '20261019_094038_initial',
  },
  {
    up: migration_20261020_075708_social_profiles.up,
    down: migration_20261020_075708_social_profiles.down,
    name: '20261020_075708_social_profiles',
  },
  {
    up: migration_20261020_081732_member_job_details.up,
    down: migration_20261020_081732_member_job_details.down,
    name: '20261020_081732_member_job_details',
  },
  {
    up: migration_20261020_083711_signup_page_copy.up,
    down: migration_20261020_083711_signup_page_copy.down,
    name: '20261020_083711_signup_page_copy'
  },
];

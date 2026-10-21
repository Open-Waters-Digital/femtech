import * as migration_20261019_094038_initial from './20261019_094038_initial';
import * as migration_20261020_075708_social_profiles from './20261020_075708_social_profiles';
import * as migration_20261020_081732_member_job_details from './20261020_081732_member_job_details';
import * as migration_20261020_083711_signup_page_copy from './20261020_083711_signup_page_copy';
import * as migration_20261020_084351_events from './20261020_084351_events';
import * as migration_20261020_115235_site_contact_email from './20261020_115235_site_contact_email';
import * as migration_20261020_115428_event_registrations from './20261020_115428_event_registrations';

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
    name: '20261020_083711_signup_page_copy',
  },
  {
    up: migration_20261020_084351_events.up,
    down: migration_20261020_084351_events.down,
    name: '20261020_084351_events',
  },
  {
    up: migration_20261020_115235_site_contact_email.up,
    down: migration_20261020_115235_site_contact_email.down,
    name: '20261020_115235_site_contact_email',
  },
  {
    up: migration_20261020_115428_event_registrations.up,
    down: migration_20261020_115428_event_registrations.down,
    name: '20261020_115428_event_registrations'
  },
];

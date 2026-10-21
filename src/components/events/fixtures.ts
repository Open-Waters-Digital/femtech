import type { EventCardEvent } from '@/components/events/EventCard'

/**
 * Sample events for the showcase and the tests: every variant and state the
 * card has. Not seed data; the seed holds the real engagements.
 */
const BASE: EventCardEvent = {
  title: 'Field Service Europe 2026',
  slug: 'field-service-europe-2026',
  kind: 'speaking',
  status: 'published',
  startsAt: '2026-10-26T10:40:00.000Z',
  startsAt_tz: 'Europe/Amsterdam',
  endsAt: null,
  allDay: false,
  venue: null,
  city: 'Amsterdam',
  country: 'Netherlands',
  online: false,
  speakers: [{ id: 'tanya', name: 'Tanya AH Singh', role: 'panel' }],
  sessionTitle:
    'Panel: Evolving the Service Value Proposition to Turn Capability into Scalable Growth',
  organiserUrl: 'https://fieldserviceeu.wbresearch.com/speakers/tanya-singh',
  summary: null,
}

export const SAMPLE_EVENTS = {
  speaking: BASE,
  speakingNoLink: {
    ...BASE,
    title: 'Revive ME Global Longevity & Health Tech Summit',
    startsAt: '2026-11-11T05:00:00.000Z',
    endsAt: '2026-11-12T14:00:00.000Z',
    startsAt_tz: 'Asia/Dubai',
    allDay: true,
    venue: 'ADNEC',
    city: 'Abu Dhabi',
    country: 'United Arab Emirates',
    speakers: [{ id: 'tanya', name: 'Tanya AH Singh', role: 'tbc' }],
    sessionTitle: null,
    organiserUrl: null,
    summary: 'UAE’s Premier Longevity And Health Tech Exhibition & Conference',
  },
  hosted: {
    ...BASE,
    title: 'Winter Speakeasy',
    slug: 'winter-speakeasy',
    kind: 'hosted',
    startsAt: '2026-12-03T18:30:00.000Z',
    endsAt: '2026-12-03T21:30:00.000Z',
    startsAt_tz: 'Europe/London',
    venue: 'A members’ club',
    city: 'London',
    country: null,
    speakers: [{ id: 'tanya', name: 'Tanya AH Singh', role: 'talk' }],
    sessionTitle: null,
    organiserUrl: null,
    summary: 'A relaxed evening to meet peers and share ideas.',
  },
  online: {
    ...BASE,
    title: 'Investment pitch evening',
    slug: 'investment-pitch-evening',
    kind: 'hosted',
    online: true,
    city: null,
    country: null,
    organiserUrl: null,
    speakers: [
      { id: 'a', name: 'Tanya AH Singh', role: 'keynote' },
      { id: 'b', name: 'A guest investor', role: 'panel' },
    ],
  },
  past: {
    ...BASE,
    title: 'Revive ME 2025',
    startsAt: '2025-11-26T05:00:00.000Z',
    endsAt: '2025-11-27T14:00:00.000Z',
    startsAt_tz: 'Asia/Dubai',
    allDay: true,
    city: 'Abu Dhabi',
    country: 'United Arab Emirates',
    sessionTitle: null,
  },
} satisfies Record<string, EventCardEvent>

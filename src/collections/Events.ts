import { APIError, type CollectionConfig, type Where } from 'payload'

import { slugify, validateOrganiserUrl, validateSlug } from '@/lib/events/slug'
import { DEFAULT_EVENT_TIMEZONE, EVENT_TIMEZONES } from '@/lib/events/timezones'
import { revalidateSite } from '@/lib/revalidate'

/**
 * Every event the site lists, of two kinds:
 *
 *   speaking  someone from the network speaking at another organiser's event.
 *             Booked on the organiser's site, so it links out and has no page.
 *   hosted    the network's own event, with a page here and RSVP.
 *
 * One collection rather than two, because /events interleaves both by date and
 * one query with one sort is simpler than merging two. `status` rather than
 * Payload's drafts: drafts add a versions table and autosave for a small record,
 * and "cancelled" is a public state drafts cannot express.
 */
export const EVENT_KINDS = ['speaking', 'hosted'] as const
export const EVENT_STATUSES = ['draft', 'published', 'cancelled'] as const
export const SPEAKER_ROLES = ['keynote', 'panel', 'talk', 'tbc'] as const

/** What the public may read: published events, and cancelled ones by link. */
const PUBLIC_EVENTS: Where = { status: { in: ['published', 'cancelled'] } }

const hostedOnly = (_: unknown, siblingData: { kind?: string } | undefined) =>
  siblingData?.kind === 'hosted'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'startsAt', 'status'],
    description:
      'Speaking engagements (someone from the network at another organiser’s event) and the network’s own hosted events, which take RSVPs. Only published events appear on the site.',
  },
  defaultSort: 'startsAt',
  access: {
    read: ({ req }) => (req.user ? true : PUBLIC_EVENTS),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    // An event with registrations is cancelled, not deleted: deleting it would
    // orphan people's places (the database refuses), and the team loses the
    // record of who was coming.
    beforeDelete: [
      async ({ id, req }) => {
        const { totalDocs } = await req.payload.count({
          collection: 'event-registrations',
          where: { event: { equals: id } },
          req,
        })
        if (totalDocs > 0) {
          throw new APIError(
            `This event has ${totalDocs} registration${totalDocs === 1 ? '' : 's'}. Set its status to Cancelled instead of deleting it.`,
            400,
            undefined,
            true,
          )
        }
      },
    ],
    afterChange: [revalidateSite],
    afterDelete: [revalidateSite],
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 160 },
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          defaultValue: 'speaking',
          options: [
            { label: 'Speaking (at another organiser’s event)', value: 'speaking' },
            { label: 'Hosted (the network’s own, with RSVP)', value: 'hosted' },
          ],
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'draft',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
          admin: {
            description:
              'Only published events are listed. A cancelled hosted event says so on its page.',
          },
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'The address: /events/<slug>. Made from the title if left empty.',
      },
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) =>
            value || typeof siblingData?.title !== 'string' ? value : slugify(siblingData.title),
        ],
      },
      validate: (value: string | null | undefined) => validateSlug(value),
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startsAt',
          label: 'Starts',
          type: 'date',
          required: true,
          timezone: {
            required: true,
            supportedTimezones: EVENT_TIMEZONES,
            defaultTimezone: DEFAULT_EVENT_TIMEZONE,
          },
          admin: { date: { pickerAppearance: 'dayAndTime', timeIntervals: 5 } },
        },
        {
          name: 'endsAt',
          label: 'Ends',
          type: 'date',
          timezone: {
            supportedTimezones: EVENT_TIMEZONES,
            defaultTimezone: DEFAULT_EVENT_TIMEZONE,
          },
          admin: {
            date: { pickerAppearance: 'dayAndTime', timeIntervals: 5 },
            description: 'Optional. Set it for an event over several days.',
          },
          validate: (
            value: Date | string | null | undefined,
            { siblingData }: { siblingData: { startsAt?: Date | string | null } },
          ) => {
            if (!value || !siblingData.startsAt) return true
            return new Date(value) >= new Date(siblingData.startsAt) || 'Ends before it starts.'
          },
        },
      ],
    },
    {
      name: 'allDay',
      label: 'Show dates only, no time',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'For engagements known by their dates only, such as a two-day summit.',
      },
    },
    {
      type: 'row',
      fields: [
        { name: 'venue', type: 'text', maxLength: 160 },
        { name: 'city', type: 'text', maxLength: 80 },
        { name: 'country', type: 'text', maxLength: 80 },
      ],
    },
    {
      name: 'online',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Shown as "Online" in place of a venue.' },
    },
    {
      name: 'speakers',
      type: 'array',
      minRows: 1,
      defaultValue: [{ name: 'Tanya AH Singh', role: 'tbc' }],
      admin: { description: 'Who from the network is speaking.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', required: true, maxLength: 120 },
            {
              name: 'role',
              type: 'select',
              required: true,
              defaultValue: 'tbc',
              options: [
                { label: 'Keynote', value: 'keynote' },
                { label: 'Panel', value: 'panel' },
                { label: 'Talk', value: 'talk' },
                { label: 'To be confirmed', value: 'tbc' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'sessionTitle',
      label: 'Session title',
      type: 'text',
      maxLength: 240,
      admin: { description: 'Leave empty and the site says "Topic to be confirmed".' },
    },
    {
      name: 'organiserUrl',
      label: 'Organiser’s page',
      type: 'text',
      admin: {
        description:
          'Where to book or read more, on the organiser’s site. Optional: without it the event is listed but not linked.',
      },
      validate: (value: string | null | undefined) => validateOrganiserUrl(value),
    },
    {
      name: 'summary',
      type: 'textarea',
      maxLength: 400,
      admin: { description: 'One or two lines for the listing.' },
    },
    {
      name: 'confirmedPlaces',
      label: 'Confirmed places',
      type: 'number',
      // Not stored: counted when an editor opens the event. Public reads skip
      // it (no user), so the listing costs no extra query per event.
      virtual: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: hostedOnly,
        description: 'Confirmed RSVPs, against the capacity below. Withdrawals do not count.',
      },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!req.user || data?.kind !== 'hosted' || typeof data.id !== 'number') return null
            const { totalDocs } = await req.payload.count({
              collection: 'event-registrations',
              where: { event: { equals: data.id }, status: { equals: 'confirmed' } },
              req,
            })
            return totalDocs
          },
        ],
      },
    },
    {
      name: 'registrations',
      type: 'join',
      collection: 'event-registrations',
      on: 'event',
      defaultLimit: 50,
      defaultSort: '-createdAt',
      access: { read: ({ req }) => Boolean(req.user) },
      admin: {
        condition: hostedOnly,
        defaultColumns: ['email', 'firstName', 'lastName', 'status', 'createdAt'],
        description: 'Everyone who has RSVPd, including withdrawals. Filter by status in the list.',
      },
    },
    {
      type: 'collapsible',
      label: 'Hosted event: page and RSVP',
      admin: { condition: hostedOnly },
      fields: [
        {
          name: 'description',
          type: 'textarea',
          admin: {
            condition: hostedOnly,
            description: 'The event’s page. Paragraphs on blank lines.',
          },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: { condition: hostedOnly },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'capacity',
              type: 'number',
              min: 1,
              admin: {
                condition: hostedOnly,
                step: 1,
                description: 'Places available. Empty for no limit.',
              },
              validate: (value: number | null | undefined) =>
                value === null ||
                value === undefined ||
                (Number.isInteger(value) && value > 0) ||
                'A whole number of places, at least one.',
            },
            {
              name: 'rsvpClosesAt',
              label: 'RSVP closes',
              type: 'date',
              admin: {
                condition: hostedOnly,
                date: { pickerAppearance: 'dayAndTime', timeIntervals: 15 },
                description: 'Optional. Otherwise RSVP closes when the event starts.',
              },
            },
          ],
        },
      ],
    },
  ],
}

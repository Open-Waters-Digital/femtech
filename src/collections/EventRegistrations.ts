import type { CollectionConfig } from 'payload'

import { SIGNUP_LIMITS } from '@/lib/signup/schema'

/**
 * A place reserved at a hosted event: one row per event per email address.
 *
 * Personal data, so admin only, as `members` is. The public way in is
 * POST /events/[slug]/rsvp, which runs its layers and then writes with
 * overrideAccess, and the way out is POST /events/withdraw with a signed token.
 * Opening `create` here would be a path around both.
 *
 * A withdrawal is kept as a row marked withdrawn rather than deleted, so the
 * team can see who dropped out, and a later RSVP from the same address
 * reactivates the row instead of creating a second one.
 *
 * RSVPing does not add anyone to the members list: joining needs the sign-up
 * form's own consent. `member` links the two when the addresses match.
 */
export const EventRegistrations: CollectionConfig = {
  slug: 'event-registrations',
  labels: { singular: 'Event registration', plural: 'Event registrations' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'event', 'status', 'createdAt'],
    description:
      'Places reserved at the network’s own events. Withdrawn places are kept, marked withdrawn, and no longer count.',
    listSearchableFields: ['email', 'firstName', 'lastName'],
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  indexes: [{ fields: ['event', 'email'], unique: true }],
  fields: [
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
      index: true,
      filterOptions: { kind: { equals: 'hosted' } },
    },
    {
      type: 'row',
      fields: [
        { name: 'firstName', type: 'text', required: true, maxLength: SIGNUP_LIMITS.name },
        { name: 'lastName', type: 'text', required: true, maxLength: SIGNUP_LIMITS.name },
      ],
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
      hooks: {
        // The route lower-cases before it gets here; this covers a place added
        // by hand, so the unique index means one person, one place.
        beforeValidate: [
          ({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
        ],
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'confirmed',
      options: [
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Withdrawn', value: 'withdrawn' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'withdrawnAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => data?.status === 'withdrawn',
      },
    },
    {
      name: 'member',
      type: 'relationship',
      relationTo: 'members',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'The member with the same email address, if there is one.',
      },
    },
    {
      name: 'confirmation',
      type: 'select',
      options: [
        { label: 'Emailed to them', value: 'sent' },
        { label: 'Email failed', value: 'failed' },
        { label: 'Email not configured', value: 'unconfigured' },
        { label: 'Not emailed (development)', value: 'skipped' },
      ],
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Whether their confirmation email went. Re-sent on a repeat RSVP.',
      },
    },
  ],
}

import type { CollectionConfig } from 'payload'

import { INDUSTRIES, SIGNUP_LIMITS } from '@/lib/signup/schema'

/**
 * Everyone who has signed up on the site.
 *
 * For now this is an email list. It is a collection of people rather than of
 * submissions because that is what it will grow into: membership tiers, event
 * bookings and profiles all hang off a member, not off the form they first
 * filled in. So one row per person, keyed on a unique, lower-cased email, and a
 * second sign-up from the same address does not create a second row.
 *
 * Nobody outside the admin can read or write it. The public way in is POST /join,
 * which runs its validation layers and then writes with overrideAccess. Opening
 * `create` here would be a second path that skips them.
 */
export const Members: CollectionConfig = {
  slug: 'members',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'jobTitle', 'industry', 'createdAt'],
    description:
      'Everyone who has signed up on the website. Add someone by hand here if they joined another way.',
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
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
      unique: true,
      index: true,
      hooks: {
        // The form lower-cases before it gets here. This covers a member added
        // by hand in the admin, so the unique index means one person, one row.
        beforeValidate: [
          ({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
        ],
      },
    },
    { name: 'phone', type: 'text', maxLength: SIGNUP_LIMITS.phone },
    // Not `required`, though the form requires them: members who joined before
    // these were asked, and members added here by hand, have none. A NOT NULL
    // column would also fail the migration on the rows already there.
    {
      type: 'row',
      fields: [
        { name: 'jobTitle', type: 'text', maxLength: SIGNUP_LIMITS.jobTitle },
        { name: 'organisation', type: 'text', maxLength: SIGNUP_LIMITS.organisation },
      ],
    },
    {
      name: 'industry',
      type: 'select',
      options: INDUSTRIES.map(({ value, label }) => ({ value, label })),
    },
    {
      name: 'message',
      type: 'textarea',
      // The old form's limit. Kept so an existing message still saves.
      maxLength: 2000,
      admin: {
        description: 'From the old sign-up form. No longer asked for.',
        // Only shown on members who have one.
        condition: (data) => Boolean(data?.message),
      },
    },
    {
      name: 'emailUpdates',
      label: 'Happy to receive emails',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Every sign-up from the website has this ticked: the form requires it. Members added by hand may not. Only email people about the network if this is ticked.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'notification',
      type: 'select',
      options: [
        { label: 'Emailed to the team', value: 'sent' },
        { label: 'Email failed', value: 'failed' },
        { label: 'Email not configured', value: 'unconfigured' },
        { label: 'Not emailed (development)', value: 'skipped' },
      ],
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Whether the team was emailed about this sign-up.',
      },
    },
  ],
}

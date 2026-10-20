import type { GlobalConfig } from 'payload'

import { revalidateSite } from '@/lib/revalidate'

/**
 * Copy that belongs to the site rather than to one page: the footer on every
 * page, and the sign-up page.
 *
 * Globals rather than a `pages` collection with a block builder. The site has
 * three fixed pages, and a page builder would be a lot of scaffold whose only
 * user can also ask for a route. luxury-gardens has one because it has a dozen
 * pages and an editor adding more.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  hooks: { afterChange: [revalidateSite] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Footer',
          fields: [
            {
              name: 'footerHeading',
              type: 'textarea',
              required: true,
              admin: { description: 'The invitation above the sign-up button on every page.' },
            },
            { name: 'footerCtaLabel', type: 'text', required: true },
            {
              name: 'copyrightHolder',
              type: 'text',
              required: true,
              admin: { description: 'Shown as "© <this> <year>".' },
            },
          ],
        },
        {
          label: 'Sign-up page',
          fields: [
            { name: 'signupTitle', type: 'text', required: true },
            { name: 'signupLead', type: 'textarea' },
            {
              name: 'signupThanks',
              type: 'textarea',
              required: true,
              admin: { description: 'Shown once someone has signed up.' },
            },
          ],
        },
      ],
    },
  ],
}

import type { GlobalConfig } from 'payload'

import { revalidateSite } from '@/lib/revalidate'
import {
  PLATFORM_LABELS,
  SOCIAL_PLATFORMS,
  type SocialPlatform,
  isPlatformUrl,
  platformUrlMessage,
} from '@/lib/social'

/**
 * Copy that belongs to the site rather than to one page: the footer on every
 * page, the sign-up page, and the network's social profiles.
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
              name: 'contactEmail',
              label: 'Public contact email',
              type: 'email',
              admin: {
                description:
                  'Optional. Given on a hosted event’s page to visitors without JavaScript, who cannot use the RSVP form.',
              },
            },
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
          // Optional apart from the title and the thanks, so the migration that
          // added them left the existing row valid. Each section of the page is
          // shown only when it has content.
          fields: [
            {
              name: 'signupEyebrow',
              type: 'text',
              admin: { description: 'The small line above the title, such as "Sign Up".' },
            },
            { name: 'signupTitle', type: 'text', required: true },
            { name: 'signupLead', type: 'textarea' },
            {
              type: 'collapsible',
              label: 'What membership means',
              fields: [
                { name: 'signupBenefitsHeading', label: 'Heading', type: 'text' },
                { name: 'signupBenefitsIntro', label: 'Introduction', type: 'textarea' },
                {
                  name: 'signupBenefits',
                  label: 'Benefits',
                  type: 'array',
                  admin: {
                    description:
                      'Each is shown as "Title: description". Remove them all to hide the section.',
                  },
                  fields: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'description', type: 'textarea', required: true },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Coming soon',
              fields: [
                { name: 'signupComingSoonHeading', label: 'Heading', type: 'text' },
                {
                  name: 'signupComingSoonBody',
                  label: 'Text',
                  type: 'textarea',
                  admin: { description: 'Leave empty to hide the section.' },
                },
              ],
            },
            {
              name: 'signupFormHeading',
              type: 'text',
              admin: { description: 'Above the form, such as "Join the Network".' },
            },
            {
              type: 'collapsible',
              label: 'Thank-you message',
              fields: [
                {
                  name: 'signupThanksHeading',
                  label: 'Heading',
                  type: 'text',
                  admin: { description: 'Shown once someone has signed up.' },
                },
                {
                  name: 'signupThanks',
                  label: 'Message',
                  type: 'textarea',
                  required: true,
                  admin: {
                    description:
                      'Paragraphs on blank lines. The LinkedIn invitation follows it when a LinkedIn profile is set under Social profiles.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Social profiles',
          description:
            'The network’s own profiles, shown as marks in the footer. The first LinkedIn profile is also linked from the sign-up thank-you message. Tanya’s personal LinkedIn is on the About page instead.',
          fields: [
            {
              name: 'social',
              label: 'Profiles',
              type: 'array',
              admin: { initCollapsed: false },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'platform',
                      type: 'select',
                      required: true,
                      options: SOCIAL_PLATFORMS.map((value) => ({
                        label: PLATFORM_LABELS[value],
                        value,
                      })),
                    },
                    {
                      name: 'href',
                      label: 'Profile URL',
                      type: 'text',
                      required: true,
                      validate: (
                        value: string | null | undefined,
                        { siblingData }: { siblingData: Partial<{ platform: SocialPlatform }> },
                      ) => {
                        const platform = siblingData.platform
                        if (!value) return 'Enter the profile’s address.'
                        if (!platform) return true
                        return isPlatformUrl(platform, value) || platformUrlMessage(platform)
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

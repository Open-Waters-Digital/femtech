import type { GlobalConfig } from 'payload'

import { revalidateSite } from '@/lib/revalidate'

export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Home page',
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
          label: 'Hero',
          fields: [
            {
              name: 'heroTitle',
              type: 'text',
              required: true,
              admin: { description: 'The largest word on the site.' },
            },
            {
              name: 'heroLeadStrong',
              type: 'textarea',
              required: true,
              admin: { description: 'The first sentence under the title, set in bold.' },
            },
            {
              name: 'heroLead',
              type: 'textarea',
              admin: { description: 'The rest of the paragraph, after the bold sentence.' },
            },
            {
              name: 'heroPoster',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: {
                description:
                  'Shown before the video plays, to anyone who prefers reduced motion, and if the video cannot load. Use a still from the video.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'heroVideoMp4',
                  label: 'Hero video (MP4)',
                  type: 'upload',
                  relationTo: 'videos',
                  admin: { description: 'Short, muted and looping. Keep it under 5 MB.' },
                },
                {
                  name: 'heroVideoWebm',
                  label: 'Hero video (WebM)',
                  type: 'upload',
                  relationTo: 'videos',
                  admin: { description: 'Optional. The same clip as WebM.' },
                },
              ],
            },
            { name: 'discoverLabel', type: 'text', required: true },
          ],
        },
        {
          label: 'Coming soon',
          fields: [
            { name: 'comingSoonEyebrow', type: 'text', required: true },
            { name: 'comingSoonStatement', type: 'textarea', required: true },
            {
              name: 'comingSoonPhotos',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              minRows: 1,
              maxRows: 3,
              required: true,
              admin: {
                description:
                  'Up to three photographs, stacked one over the next as the visitor scrolls. Landscape works best.',
              },
            },
          ],
        },
        {
          label: 'Community',
          fields: [
            { name: 'communityEyebrow', type: 'text', required: true },
            { name: 'communityStatement', type: 'textarea', required: true },
            {
              name: 'communityCards',
              type: 'array',
              minRows: 1,
              maxRows: 4,
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'body', type: 'textarea', required: true },
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}

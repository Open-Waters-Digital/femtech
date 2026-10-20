import type { Field, GlobalConfig } from 'payload'

import { revalidateSite } from '@/lib/revalidate'

const PARAGRAPHS = 'Leave a blank line between paragraphs.'

/** A label beside its copy. The shape of every row in "What we do" and "What we stand for". */
const rows = (name: string): Field => ({
  name,
  type: 'array',
  minRows: 1,
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
  ],
})

export const About: GlobalConfig = {
  slug: 'about',
  label: 'About page',
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
          label: 'Introduction',
          fields: [
            { name: 'heroEyebrow', type: 'text', required: true },
            {
              name: 'heroTitle',
              type: 'textarea',
              required: true,
              admin: { description: 'The statement the page opens on.' },
            },
            { name: 'heroLead', type: 'textarea', admin: { description: PARAGRAPHS } },
            { name: 'missionLabel', type: 'text', required: true },
            { name: 'mission', type: 'textarea', required: true },
          ],
        },
        {
          label: 'Why we exist',
          fields: [
            { name: 'whyLabel', type: 'text', required: true },
            {
              name: 'whyStatement',
              type: 'textarea',
              required: true,
              admin: { description: 'The short line set large.' },
            },
            {
              name: 'whyBody',
              type: 'textarea',
              required: true,
              admin: { description: PARAGRAPHS },
            },
          ],
        },
        {
          label: 'What we do',
          fields: [{ name: 'doLabel', type: 'text', required: true }, rows('doRows')],
        },
        {
          label: 'What we stand for',
          fields: [{ name: 'valuesLabel', type: 'text', required: true }, rows('values')],
        },
        {
          label: 'Founder',
          fields: [
            { name: 'founderEyebrow', type: 'text', required: true },
            {
              type: 'row',
              fields: [
                { name: 'founderName', type: 'text', required: true },
                { name: 'founderRole', type: 'text', required: true },
              ],
            },
            { name: 'founderImage', type: 'upload', relationTo: 'media', required: true },
            {
              name: 'founderBio',
              type: 'textarea',
              required: true,
              admin: { description: PARAGRAPHS },
            },
            {
              name: 'founderSections',
              type: 'array',
              admin: { description: 'Headed sections after the introduction.' },
              fields: [
                { name: 'heading', type: 'text', required: true },
                {
                  name: 'body',
                  type: 'textarea',
                  required: true,
                  admin: { description: PARAGRAPHS },
                },
              ],
            },
            {
              name: 'founderLinkedIn',
              label: 'LinkedIn profile URL',
              type: 'text',
              validate: (value: string | null | undefined) =>
                !value || /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\//.test(value)
                  ? true
                  : 'Use the full profile address, starting https://www.linkedin.com/',
              admin: {
                description:
                  'The "Connect on LinkedIn" button only appears once this is filled in.',
              },
            },
          ],
        },
        {
          label: 'Join',
          fields: [
            { name: 'joinTitle', type: 'text', required: true },
            { name: 'joinBody', type: 'textarea', required: true },
            { name: 'joinCtaLabel', type: 'text', required: true },
          ],
        },
      ],
    },
  ],
}

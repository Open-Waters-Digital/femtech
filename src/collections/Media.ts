import type { CollectionConfig } from 'payload'

import { revalidateSite } from '@/lib/revalidate'

/**
 * Every image an editor uploads: photographs, the hero's poster, the founder's
 * portrait. Videos are a separate collection so they never reach next/image.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    // The globals embed their images, so the cached pages carry this document's
    // alt text and focal point. Editing either changes no global.
    afterChange: [revalidateSite],
    afterDelete: [revalidateSite],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'What the image shows, for someone who cannot see it. "Four women in conversation at a conference", not "photo1".',
      },
    },
  ],
  upload: {
    // Named types rather than image/*, which admits SVG: a document that can
    // carry script, served from our own origin.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    imageSizes: [
      { name: 'card', width: 1200, height: undefined, position: 'centre' },
      { name: 'hero', width: 2400, height: undefined, position: 'centre' },
    ],
    focalPoint: true,
  },
}

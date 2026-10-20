import type { CollectionConfig } from 'payload'

import { revalidateSite } from '@/lib/revalidate'

/**
 * Background video, at present only the home page's hero.
 *
 * Its own collection rather than a mime type on `media`, so a video can never be
 * handed to next/image (see uploads.ts) and `media` keeps its required alt text,
 * which a muted decorative loop has no use for.
 */
export const Videos: CollectionConfig = {
  slug: 'videos',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [revalidateSite],
    afterDelete: [revalidateSite],
  },
  fields: [
    {
      name: 'description',
      type: 'text',
      admin: { description: 'For editors only: what the clip shows. Not shown on the site.' },
    },
  ],
  upload: {
    // Payload checks the bytes, not just the extension, and reads an MP4
    // exported from Apple's tools as video/x-m4v. Same container, same browser
    // support, so it is allowed rather than making an editor re-export.
    mimeTypes: ['video/mp4', 'video/x-m4v', 'video/webm'],
  },
}

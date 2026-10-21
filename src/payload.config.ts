import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { EventRegistrations } from './collections/EventRegistrations'
import { Events } from './collections/Events'
import { Media } from './collections/Media'
import { Members } from './collections/Members'
import { Users } from './collections/Users'
import { Videos } from './collections/Videos'
import { About } from './globals/About'
import { Home } from './globals/Home'
import { SiteSettings } from './globals/SiteSettings'
import { storagePlugins } from './lib/storage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // Light only: the site has no dark palette for a dark admin to borrow.
    theme: 'light',
    meta: {
      titleSuffix: ' – FemTech Healthcare Network',
      defaultOGImageType: 'off',
      // robots.txt stops /admin being crawled, but not a linked URL being
      // indexed. This is the part that keeps it out.
      robots: { index: false, follow: false },
    },
  },
  collections: [Members, Events, EventRegistrations, Media, Videos, Users],
  globals: [Home, About, SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Migrations are generated, committed, and applied by Railway's pre-deploy
    // step. Never on container start, where replicas would race.
    push: false,
  }),
  sharp,
  // Payload has no per-collection ceiling, so this is the global one. Sized for
  // the hero video, the largest thing an editor uploads.
  upload: {
    limits: { fileSize: 32 * 1024 * 1024 },
  },
  // Registered in every environment and enabled only where a bucket is
  // configured, so the schema is the same everywhere. See storage.ts.
  plugins: storagePlugins(),
})

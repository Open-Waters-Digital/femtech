import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { CACHE_TAGS } from '@/lib/revalidate'
import type { About, Home, SiteSetting } from '@/payload-types'

/**
 * Every read the public pages make.
 *
 * Through the Local API with no user, so access control applies as it does over
 * REST. Cached under the tags the globals' hooks invalidate, so a page render
 * is a cache read until an editor saves. `depth: 1` resolves an upload to its
 * document; at depth 0 it is an id and PayloadImage renders nothing, silently.
 *
 * The pages that call these render per request rather than at build time, so
 * `next build` never opens a database connection. See AGENTS.md, "Rendering".
 */
async function client() {
  return getPayload({ config: await configPromise })
}

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSetting> =>
    (await client()).findGlobal({ slug: 'site-settings', depth: 1 }),
  ['site-settings'],
  { tags: [CACHE_TAGS.site] },
)

export const getHome = unstable_cache(
  async (): Promise<Home> => (await client()).findGlobal({ slug: 'home', depth: 1 }),
  ['home'],
  { tags: [CACHE_TAGS.home] },
)

export const getAbout = unstable_cache(
  async (): Promise<About> => (await client()).findGlobal({ slug: 'about', depth: 1 }),
  ['about'],
  { tags: [CACHE_TAGS.about] },
)

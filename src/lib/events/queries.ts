import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { CACHE_TAGS } from '@/lib/revalidate'
import type { Event } from '@/payload-types'

/**
 * The public reads of events, cached under the `events` tag the collection's
 * hooks invalidate. As in content.ts: the Local API with access applied as
 * for an anonymous visitor (`overrideAccess: false`), so a draft can never
 * reach a public page even if a filter here were wrong.
 *
 * Not cached: anything about places. A cached count would show a full event
 * as open, so the count is read per request (`lib/events/places.ts`).
 */
async function client() {
  return getPayload({ config: await configPromise })
}

/** Published events, both kinds, soonest first. The upcoming/past split is per request. */
export const getPublishedEvents = unstable_cache(
  async (): Promise<Event[]> => {
    const result = await (
      await client()
    ).find({
      collection: 'events',
      where: { status: { equals: 'published' } },
      sort: 'startsAt',
      depth: 1,
      limit: 200,
      pagination: false,
      overrideAccess: false,
      // The registrations join is the admin's; the public pages never read it.
      joins: false,
    })
    return result.docs
  },
  ['events-published'],
  { tags: [CACHE_TAGS.events] },
)

/** A hosted event by its slug, published or cancelled. Null for a draft or a speaking event. */
export const getHostedEventBySlug = unstable_cache(
  async (slug: string): Promise<Event | null> => {
    const result = await (
      await client()
    ).find({
      collection: 'events',
      where: {
        slug: { equals: slug },
        kind: { equals: 'hosted' },
        status: { in: ['published', 'cancelled'] },
      },
      depth: 1,
      limit: 1,
      overrideAccess: false,
      // The registrations join is the admin's; the public pages never read it.
      joins: false,
    })
    return result.docs[0] ?? null
  },
  ['events-hosted-by-slug'],
  { tags: [CACHE_TAGS.events] },
)

import type { MetadataRoute } from 'next'

import { isPast } from '@/lib/events/format'
import { getPublishedEvents } from '@/lib/events/queries'
import { siteUrl } from '@/lib/site-env'

/**
 * Per request, not at build time: it reads events, and the build never opens a
 * database connection (AGENTS.md, "Rendering").
 */
export const dynamic = 'force-dynamic'

/**
 * The public, indexable pages, and each upcoming hosted event. Speaking
 * engagements have no page of their own; the sign-up outcome pages and the
 * showcase are noindex.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const hosted = (await getPublishedEvents()).filter(
    (event) => event.kind === 'hosted' && event.slug && !isPast(event),
  )
  return [
    { url: `${base}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/about-us`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/events`, changeFrequency: 'weekly', priority: 0.7 },
    ...hosted.map((event) => ({
      url: `${base}/events/${event.slug}`,
      lastModified: event.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    { url: `${base}/sign-up`, changeFrequency: 'yearly', priority: 0.6 },
  ]
}

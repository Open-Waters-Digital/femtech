import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/site-env'

/** The public, indexable pages. The sign-up outcome pages and the showcase are noindex. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  return [
    { url: `${base}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/about-us`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/sign-up`, changeFrequency: 'yearly', priority: 0.6 },
  ]
}

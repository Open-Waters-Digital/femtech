import type { MetadataRoute } from 'next'

import { isIndexable, siteUrl } from '@/lib/site-env'

/**
 * Everything is disallowed outside production, so the Railway subdomain never
 * competes with the real domain. In production the admin and the API are kept
 * out; the admin also sends its own noindex.
 */
/** Per request, so it reads SITE_ENV at runtime rather than whatever the build had. */
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/join', '/design-system'] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}

/**
 * Facts about the running instance that more than one place needs.
 *
 * SITE_ENV, not NODE_ENV, tells production from a preview: NODE_ENV is
 * `production` in every built container, including the Railway subdomain the
 * site runs on before the domain cuts over.
 */
export type SiteEnv = 'production' | 'preview' | 'development'

export function siteEnv(): SiteEnv {
  const value = process.env.SITE_ENV
  return value === 'production' || value === 'preview' ? value : 'development'
}

/**
 * Whether search engines may index this instance. Production only, so the
 * Railway subdomain never builds a search reputation the real domain then has
 * to compete with.
 */
export function isIndexable(): boolean {
  return siteEnv() === 'production'
}

/** The site's own origin, no trailing slash, for absolute URLs in the head. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

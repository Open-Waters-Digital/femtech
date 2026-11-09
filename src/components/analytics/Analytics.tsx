'use client'

import { initAnalytics, pageChanged } from '@open-waters-digital/analytics/browser'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Starts the Open Waters analytics once, on the public site only, and tells it
 * about client-side navigation (the site links with next/link, so a page change
 * is not a document load). Renders nothing.
 *
 * A client component because it attaches document listeners and follows the
 * pathname. Everything it loads (posthog-js) arrives by dynamic import after
 * the page is idle, never with the page; the cost is measured in AGENTS.md.
 *
 * It starts only when every gate holds, so a developer's machine, the Railway
 * preview and an editor's preview send nothing:
 *
 * - a production build
 * - a project key and a proxy host, both public and inlined at build
 * - an indexable instance: SITE_ENV=production, decided on the server (where
 *   SITE_ENV can be read) and passed in, the rule that closes previews to
 *   search engines reused so there is nothing extra to configure or forget
 * - not framed, as a page is inside the Payload admin
 * - the page not marked noindex: a page that asks not to be indexed is not
 *   measured either, with no list of such pages to keep
 *
 * The visitor's objection is checked inside the package.
 */
export function shouldStartAnalytics(indexable: boolean): boolean {
  if (process.env.NODE_ENV !== 'production') return false
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || !process.env.NEXT_PUBLIC_POSTHOG_HOST) return false
  if (!indexable) return false
  if (typeof window === 'undefined' || window.self !== window.top) return false
  return !isNoindex()
}

/** Whether the document carries `<meta name="robots" content="noindex…">`. */
export function isNoindex(): boolean {
  if (typeof document === 'undefined') return false
  return [...document.querySelectorAll<HTMLMetaElement>('meta[name="robots"]')].some((meta) =>
    /\bnoindex\b/i.test(meta.content),
  )
}

export function Analytics({ indexable }: { indexable: boolean }): null {
  const pathname = usePathname()
  const firstRender = useRef(true)
  const started = useRef(false)

  useEffect(() => {
    if (!shouldStartAnalytics(indexable)) return
    started.current = true
    initAnalytics({
      site: 'femtech',
      key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      apiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      spa: true,
      // A community, not a healthcare provider, and no page shows personal
      // data: the client's call (onboarding checklist §1), recorded in the
      // add-analytics design. The forms are ph-no-capture either way.
      regulated: false,
      heatmaps: false,
    })
  }, [indexable])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    // A client navigation to a noindex page (the thank-you page) is not a
    // measured page view, as a document load of it would not be.
    if (started.current && !isNoindex()) pageChanged()
  }, [pathname])

  return null
}

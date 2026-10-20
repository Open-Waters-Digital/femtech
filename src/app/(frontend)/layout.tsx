import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { RevealObserver } from '@/components/layout/RevealObserver'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SITE_DESCRIPTION, SITE_NAME, THEME_COLOR } from '@/lib/brand-constants'
import { isIndexable, siteUrl } from '@/lib/site-env'

import '@/styles/globals.css'

/**
 * Every public page renders per request, reading its copy through the cached
 * Local API (content.ts). The trade, and why it was made:
 *
 * Prerendering would need the database at build time, and Railway's private
 * network does not exist during a build. fionacorbett and luxury-gardens solve
 * that with the Postgres public URL as a build argument and a migration inside
 * the build. Rendering per request deletes that whole category: the build never
 * touches Postgres, and an editor's save is live on the next request rather
 * than after a revalidation. The cost is a server render on each visit, which
 * for three pages whose data is a cache hit is a few milliseconds.
 */
export const dynamic = 'force-dynamic'

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: `${SITE_NAME}: supporting women in healthcare technology`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    robots: isIndexable() ? undefined : { index: false, follow: false },
    openGraph: {
      type: 'website',
      locale: 'en_GB',
      siteName: SITE_NAME,
      description: SITE_DESCRIPTION,
    },
    twitter: { card: 'summary_large_image' },
  }
}

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
}

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        {/* Both faces are on the critical path: Zodiak sets the hero's wordmark,
            which is the largest thing on the first screen, and Cabinet Grotesk
            everything else. Two variable files, one each. */}
        <link
          rel="preload"
          href="/fonts/Zodiak-Variable.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/CabinetGrotesk-Variable.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        {/* Without JavaScript nothing marks a statement as revealed, so its
            words would stay invisible. Unlayered, so it beats the components
            layer. */}
        <noscript>
          <style>{`[data-reveal] .split-piece{opacity:1;transition:none}`}</style>
        </noscript>
      </head>
      <body>
        <a
          href="#main"
          className="z-menu sr-only rounded-button bg-surface-inverse px-4 py-3 text-text-inverse focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Skip to content
        </a>
        {children}
        <SiteFooter />
        <RevealObserver />
      </body>
    </html>
  )
}

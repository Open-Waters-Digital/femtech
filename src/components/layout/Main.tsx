import type { PageType } from '@open-waters-digital/analytics/browser'
import type { ReactNode } from 'react'

/**
 * Every page's `<main>`: the skip link's target, carrying the page's type for
 * analytics. `pageType` is required, so a new page that forgets to say what it
 * is fails the typecheck rather than being reported as nothing.
 *
 * The types are the Open Waters event list's; this site's mapping is in the
 * add-analytics design (Decision 4).
 */
export function Main({
  pageType,
  className,
  children,
}: {
  pageType: PageType
  className?: string
  children: ReactNode
}) {
  return (
    <main id="main" data-page-type={pageType} className={className}>
      {children}
    </main>
  )
}

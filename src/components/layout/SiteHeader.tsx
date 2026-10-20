import NextLink from 'next/link'

import { MobileMenu } from '@/components/layout/MobileMenu'
import { NAV_ITEMS, SIGN_UP_PATH, isCurrent } from '@/components/layout/navigation'
import { Button } from '@/components/primitives/Button'
import { RollingLabel } from '@/components/primitives/RollingLabel'
import { Container } from '@/components/primitives/Container'

/**
 * The header, laid over the top of the page as on the Webflow site rather than
 * fixed: it scrolls away with the hero.
 *
 * `tone` follows what it sits on. `light` is cream type for the hero video and
 * the about page's sage band; `dark` is ink on the cream ground.
 */
export function SiteHeader({
  tone,
  pathname,
  intro = false,
}: {
  tone: 'light' | 'dark'
  /** The current path, for aria-current. Passed by the page, which knows it. */
  pathname: string
  /**
   * Drop in two seconds after load, with the home page's opening. Home only:
   * Webflow ran it on every page, which held the navigation back for two
   * seconds on pages with no opening to wait for.
   */
  intro?: boolean
}) {
  const light = tone === 'light'
  return (
    <header
      className={[
        'absolute inset-x-0 top-0 z-header pt-5 md:pt-10',
        light ? 'ground-dark text-text-inverse' : 'text-text',
        intro ? 'intro-header' : '',
      ].join(' ')}
    >
      <Container className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <NextLink
            href="/"
            aria-current={pathname === '/' ? 'page' : undefined}
            className="wordmark flex min-h-11 items-center text-2xl no-underline"
          >
            femtech
          </NextLink>
          <span
            aria-hidden="true"
            className={[
              'hidden h-4 w-px md:block',
              light ? 'bg-text-inverse/20' : 'bg-text/20',
            ].join(' ')}
          />
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  {item.href ? (
                    <NextLink
                      href={item.href}
                      aria-current={isCurrent(item.href, pathname) ? 'page' : undefined}
                      className="roll-host flex min-h-11 items-center px-2 font-medium no-underline"
                    >
                      <RollingLabel text={item.label} by="chars" />
                    </NextLink>
                  ) : (
                    <span className="flex min-h-11 items-center px-2 font-medium opacity-70">
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {/* On the sign-up page itself the button would point at the page it
              is on, so the Webflow site faded it out. Here it is not drawn. */}
          {/* Wrapped, because `hidden` beside the recipe's own `inline-flex`
              on one element is decided by stylesheet order, and it lost. */}
          {isCurrent(SIGN_UP_PATH, pathname) ? null : (
            <div className="hidden md:block">
              <Button href={SIGN_UP_PATH} size="sm">
                Sign Up
              </Button>
            </div>
          )}
          <MobileMenu tone={tone} pathname={pathname} />
        </div>
      </Container>
    </header>
  )
}

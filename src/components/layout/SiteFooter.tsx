import NextLink from 'next/link'

import { NAV_ITEMS, SIGN_UP_PATH } from '@/components/layout/navigation'
import { Button } from '@/components/primitives/Button'
import { Container } from '@/components/primitives/Container'
import { Sparkle } from '@/components/primitives/Sparkle'
import { SocialLinks } from '@/components/social/SocialLinks'
import { getSiteSettings } from '@/lib/content'

/**
 * The footer: the wordmark and sparkle as a lockup at the head, a rule under
 * it, then the invitation and sign-up button beside the navigation, and the
 * copyright line at the foot with the network's social profiles. Laid out after luxury-gardens' footer. Webflow
 * set the wordmark across the full width at the foot of a screen-tall band,
 * which outweighed everything above it; here it is sized with the rest.
 *
 * It also carries the navigation, so a visitor without JavaScript on a phone,
 * where the header's links are behind the menu button, can still reach every
 * page.
 */
export async function SiteFooter() {
  const settings = await getSiteSettings()
  const year = new Date().getFullYear()

  return (
    <footer>
      <Container className="py-14 md:py-20">
        {/* The wordmark is the brand, not a heading or a link: the logo in the
            header is the link home. */}
        <div aria-hidden="true" className="flex items-center gap-2 md:gap-3">
          <span className="wordmark text-4xl leading-none">femtech</span>
          <Sparkle className="size-6 md:size-10" />
        </div>

        <div className="mt-8 border-t border-line pt-10 md:mt-10 md:pt-14">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="flex max-w-[48ch] flex-col items-start gap-8">
              {/* Both are required in the admin, but absent until Site settings
                  is first saved: a fresh database, before the seed. */}
              {settings.footerHeading ? (
                <p className="font-display text-2xl leading-normal text-balance">
                  {settings.footerHeading}
                </p>
              ) : null}
              {settings.footerCtaLabel ? (
                <Button href={SIGN_UP_PATH}>{settings.footerCtaLabel}</Button>
              ) : null}
            </div>
            <nav aria-label="Footer">
              <ul className="flex flex-wrap gap-x-6 text-sm md:flex-col md:items-end">
                <li>
                  <NextLink href="/" className="flex min-h-11 items-center">
                    Home
                  </NextLink>
                </li>
                {NAV_ITEMS.flatMap((item) =>
                  item.href
                    ? [
                        <li key={item.label}>
                          <NextLink href={item.href} className="flex min-h-11 items-center">
                            {item.label}
                          </NextLink>
                        </li>,
                      ]
                    : [],
                )}
                <li>
                  <NextLink href={SIGN_UP_PATH} className="flex min-h-11 items-center">
                    Sign up
                  </NextLink>
                </li>
              </ul>
            </nav>
          </div>

          {/* The copyright line, with the social marks at its far end from md
              and under it on a phone. The marks' 44px boxes set the row's
              height, so the copyright is centred on them rather than on its
              own baseline. */}
          <div className="mt-12 flex flex-col items-start gap-2 md:mt-16 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-text-muted">
              © {settings.copyrightHolder} {year}.
            </p>
            <SocialLinks social={settings.social} />
          </div>
        </div>
      </Container>
    </footer>
  )
}

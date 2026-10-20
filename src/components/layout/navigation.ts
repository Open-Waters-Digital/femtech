/**
 * The site's navigation, defined once for the header, the mobile menu and the
 * footer.
 *
 * `href: null` is an item announced but not yet live. The Webflow site linked
 * "Events (coming soon)" to `#`, a link that goes nowhere; here it is text, so
 * nobody clicks it expecting a page.
 */
export type NavItem = { label: string; href: string | null }

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'About Us', href: '/about-us' },
  { label: 'Events (coming soon)', href: null },
]

export const SIGN_UP_PATH = '/sign-up'

/**
 * The privacy page, once it exists (delivery item 10). Null until then, and
 * everything that links to it checks first rather than linking to a 404.
 */
export const PRIVACY_PATH: string | null = null

/** Which item is current. Exact match, plus the sign-up page's sub-pages. */
export function isCurrent(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

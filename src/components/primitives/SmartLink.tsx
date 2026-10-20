import NextLink from 'next/link'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

/**
 * Navigation for hrefs that come from the CMS, where an editor may enter an
 * internal path, an external URL, or a tel: or mailto: link.
 *
 * Internal paths go through next/link so navigation is client-side. Everything
 * else stays a plain anchor: wrapping mailto: in a router link does nothing
 * useful, and an external link should be a full page load.
 */
export function SmartLink({
  href,
  children,
  ...rest
}: { href: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const isInternal = href.startsWith('/') && !href.startsWith('//')

  if (isInternal) {
    return (
      <NextLink href={href} {...rest}>
        {children}
      </NextLink>
    )
  }

  const isExternalHttp = href.startsWith('http')

  return (
    <a
      href={href}
      {...(isExternalHttp ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
      {...rest}
    >
      {children}
    </a>
  )
}

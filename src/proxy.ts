import { type NextRequest, NextResponse } from 'next/server'

import { contentSecurityPolicy, createNonce } from '@/lib/security-headers'
import { siteEnv } from '@/lib/site-env'

/**
 * The Content Security Policy, with a fresh nonce per request.
 *
 * The policy goes on the request as well as the response: Next.js reads the
 * nonce from the request's header while it renders and puts it on every
 * script it writes. Covers the admin as well as the public site; leaves out
 * Payload's JSON API and the static and optimised files, which carry no
 * markup. See lib/security-headers.ts for the policy itself.
 */
export function proxy(request: NextRequest): NextResponse {
  const policy = contentSecurityPolicy({
    nonce: createNonce(),
    development: siteEnv() === 'development' && process.env.NODE_ENV === 'development',
    https: siteEnv() !== 'development',
  })

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('Content-Security-Policy', policy)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', policy)
  return response
}

export const config = {
  matcher: [
    {
      source: '/((?!api/|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)',
      // Prefetches render nothing a browser runs, so they need no policy.
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}

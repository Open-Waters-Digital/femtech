/**
 * The site's security headers. The Content Security Policy is built per
 * request by `src/proxy.ts`, because it carries a fresh nonce; the rest never
 * vary and are set for every path in `next.config.ts`.
 *
 * Why a nonce rather than 'unsafe-inline' for scripts: every page already
 * renders per request (AGENTS.md, "Rendering"), so a nonce costs nothing, and
 * Next.js puts it on its own scripts by itself once it finds it in the
 * request's CSP header. With 'strict-dynamic', a script the nonce admits may
 * load others, which is how RsvpForm brings in Turnstile.
 *
 * Why styles are not nonced: the markup carries style attributes on purpose
 * (SplitText's per-letter timings, PayloadImage's focal point, next/image's
 * own), and a nonce cannot admit an attribute. Allowing inline styles is far
 * less dangerous than allowing inline scripts, and it is the fallback Next.js
 * documents.
 */

/** Cloudflare Turnstile: its script, and the iframe it draws the check in. */
export const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com'

export type CspOptions = {
  nonce: string
  /** `next dev`: React needs eval for its error overlays. Never in a build. */
  development: boolean
  /** Served over https (a deployment): ask the browser to upgrade any http subresource. */
  https: boolean
  /**
   * `NEXT_PUBLIC_POSTHOG_HOST`, the analytics proxy. Its origin is admitted for
   * scripts and connections; unset or invalid, nothing is added.
   */
  analyticsHost?: string | undefined
}

/**
 * The analytics host's origin, from `NEXT_PUBLIC_POSTHOG_HOST`. Null when it is
 * unset or not an http(s) URL, so a site with analytics dormant names no host
 * and the policy cannot disagree with the loader about which one.
 */
export function analyticsOrigin(host: string | undefined): string | null {
  if (!host) return null
  try {
    const url = new URL(host)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.origin
  } catch {
    return null
  }
}

export function contentSecurityPolicy({
  nonce,
  development,
  https,
  analyticsHost,
}: CspOptions): string {
  const analytics = analyticsOrigin(analyticsHost)
  // The package's own chunk is same-origin and admitted by 'strict-dynamic';
  // this covers what posthog-js loads from the proxy, and browsers without
  // 'strict-dynamic'.
  const extra = analytics ? [analytics] : []
  const directives: [string, ...string[]][] = [
    ['default-src', "'self'"],
    [
      'script-src',
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      // Ignored by browsers that honour 'strict-dynamic'; the allow-list for
      // those that do not.
      TURNSTILE_ORIGIN,
      ...extra,
      ...(development ? ["'unsafe-eval'"] : []),
    ],
    ['style-src', "'self'", "'unsafe-inline'"],
    // Media are served from this origin (/api/<collection>/file/…), through
    // Payload even when they live in the bucket; data: and blob: for the
    // admin's previews.
    ['img-src', "'self'", 'data:', 'blob:'],
    ['media-src', "'self'", 'blob:'],
    ['font-src', "'self'"],
    ['connect-src', "'self'", ...extra],
    ['frame-src', TURNSTILE_ORIGIN],
    ['worker-src', "'self'", 'blob:'],
    ['object-src', "'none'"],
    ['base-uri', "'self'"],
    ['form-action', "'self'"],
    // Nobody frames the site but itself (the admin may preview within it).
    ['frame-ancestors', "'self'"],
  ]
  if (https) directives.push(['upgrade-insecure-requests'])
  return directives.map((directive) => directive.join(' ')).join('; ')
}

/** A fresh, unguessable nonce, base64 as CSP expects. */
export function createNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}

/**
 * Set on every response, by next.config.ts.
 *
 * HSTS without includeSubDomains or preload: the Microsoft 365 and GoDaddy
 * webmail names under the domain are not ours to promise https for, and a
 * preload is hard to take back.
 */
export const STATIC_SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
]

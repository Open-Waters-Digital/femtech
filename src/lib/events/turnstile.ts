import { siteEnv } from '@/lib/site-env'

/**
 * Cloudflare Turnstile, in front of the RSVP form.
 *
 * The confirmation email goes to the address someone types, so without this a
 * bot could use the form to send our mail to strangers (AGENTS.md backlog).
 * Turnstile is free, mostly invisible, and sets no tracking cookie.
 *
 * Configuration:
 *   TURNSTILE_SITE_KEY    public; passed to the form as a prop, not as a
 *                         NEXT_PUBLIC_ variable, so the image is not rebuilt
 *                         per environment
 *   TURNSTILE_SECRET_KEY  server only
 *
 * In development without keys, Cloudflare's published always-pass test keys
 * are used, so the flow can be exercised. Anywhere else without a secret,
 * including a preview (it is public, and its emails are real), verification is
 * `unavailable` and the RSVP fails closed.
 */

/** https://developers.cloudflare.com/turnstile/troubleshooting/testing/ */
export const TURNSTILE_TEST_KEYS = {
  siteKey: '1x00000000000000000000AA',
  secret: '1x0000000000000000000000000000000AA',
} as const

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const TIMEOUT_MS = 5_000

export type TurnstileConfig = { siteKey: string; secret: string }

export function turnstileConfig(): TurnstileConfig | null {
  const siteKey = process.env.TURNSTILE_SITE_KEY
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (siteKey && secret) return { siteKey, secret }
  return siteEnv() === 'development' ? { ...TURNSTILE_TEST_KEYS } : null
}

export type TurnstileResult = 'pass' | 'fail' | 'unavailable'

/**
 * Verifies a widget's token with Cloudflare. `fetch` and `config` are seams for
 * tests. A token that is missing or rejected is `fail`; Cloudflare unreachable,
 * slow, or answering oddly is `unavailable`. Both refuse the RSVP; only the
 * second is logged as an error, because only it means the defence is down.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  ip: string,
  {
    fetch: doFetch = fetch,
    config = turnstileConfig(),
  }: { fetch?: typeof fetch; config?: TurnstileConfig | null } = {},
): Promise<TurnstileResult> {
  if (!config) return 'unavailable'
  if (!token || token.length > 2048) return 'fail'

  const body = new FormData()
  body.append('secret', config.secret)
  body.append('response', token)
  if (ip && ip !== 'unknown') body.append('remoteip', ip)

  try {
    const response = await doFetch(VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) return 'unavailable'
    const result: unknown = await response.json()
    if (!result || typeof result !== 'object' || !('success' in result)) return 'unavailable'
    return result.success === true ? 'pass' : 'fail'
  } catch {
    return 'unavailable'
  }
}

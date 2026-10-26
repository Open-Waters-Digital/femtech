import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { withdraw } from '@/lib/events/withdraw'
import { clientIp, rateLimit } from '@/lib/rate-limit'

/**
 * `POST /events/withdraw/confirm`: the one write behind the withdraw link.
 *
 * Authorised by the signed token alone (lib/events/withdraw-token.ts), so it
 * needs neither Turnstile nor a dwell token: a bot without a token can change
 * nothing, and a token frees one place, its own. Rate-limited all the same.
 *
 * Always answers with a redirect back to the page, which reads the outcome
 * from the token. The token is never logged.
 */
export const dynamic = 'force-dynamic'

const back = (token: string | null) =>
  new Response(null, {
    status: 303,
    headers: {
      location: token ? `/events/withdraw?token=${encodeURIComponent(token)}` : '/events/withdraw',
    },
  })

export async function POST(request: Request): Promise<Response> {
  if (!rateLimit(`withdraw:${clientIp(request.headers)}`).allowed) {
    console.warn('[withdraw] rejected at rate-limit')
    return new Response('Too many requests. Please try again shortly.', { status: 429 })
  }

  let token: string | null = null
  try {
    const value = (await request.formData()).get('token')
    token = typeof value === 'string' && value.length <= 200 ? value : null
  } catch {
    console.warn('[withdraw] rejected at malformed-body')
    return back(null)
  }

  try {
    const payload = await getPayload({ config: await configPromise })
    const outcome = await withdraw(payload, token)
    if (outcome === 'invalid') console.warn('[withdraw] rejected at token')
    return back(token)
  } catch (error) {
    console.error('[withdraw] failed', error instanceof Error ? error.message : error)
    return new Response('Something went wrong. Please try again in a moment.', { status: 500 })
  }
}

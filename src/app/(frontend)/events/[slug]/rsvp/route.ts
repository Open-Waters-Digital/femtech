import configPromise from '@payload-config'
import { after } from 'next/server'
import { getPayload } from 'payload'

import { verifyDwellToken } from '@/lib/dwell-token'
import { sendConfirmation } from '@/lib/events/confirm'
import { reservePlace } from '@/lib/events/reserve'
import { rsvpFieldErrors, rsvpInput, rsvpSchema } from '@/lib/events/rsvp-schema'
import { CLOSED_MESSAGES } from '@/lib/events/rsvp-state'
import { verifyTurnstile } from '@/lib/events/turnstile'
import { clientIp, rateLimit } from '@/lib/rate-limit'

/**
 * `POST /events/[slug]/rsvp`: a place at a hosted event, for anyone.
 *
 * The second public write, after /join, and the first that emails the address
 * typed in, so it has one layer /join does not: Turnstile. Layers, cheapest
 * first:
 *
 *   1. IP rate limit       its own window ("rsvp:"), so sign-ups and RSVPs
 *                          from one office do not use up each other's
 *   2. Honeypot            the off-screen `website` field
 *   3. Signed dwell token  minted into the page as it renders
 *   4. Zod                 the same schema the form ran
 *   5. Turnstile           the only layer that costs an outbound call
 *   6. The event           published, hosted, open (rsvp-state.ts)
 *   7. Reserve             one transaction, one lock per event (reserve.ts)
 *   8. Confirm             email the registrant, after the response
 *
 * JSON only: the form needs JavaScript anyway, because Turnstile does.
 * Bot rejections (honeypot, a forged dwell token) answer as success does. A
 * failed Turnstile check is told to try again, because a person can fail it.
 */
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ slug: string }> }

const ok = () => Response.json({ ok: true }, { status: 200 })
const refuse = (message: string, status: number, extra: Record<string, unknown> = {}) =>
  Response.json({ ok: false, message, ...extra }, { status })

/** The layer and the outcome only. Never a name or an address. */
function logRejection(layer: string, detail?: string): void {
  console.warn(`[rsvp] rejected at ${layer}${detail ? `: ${detail}` : ''}`)
}

export async function POST(request: Request, { params }: Params): Promise<Response> {
  const ip = clientIp(request.headers)

  if (!rateLimit(`rsvp:${ip}`).allowed) {
    logRejection('rate-limit')
    return refuse('Several RSVPs in quick succession. Please try again shortly.', 429)
  }

  if (!(request.headers.get('accept') ?? '').includes('application/json')) {
    logRejection('not-json')
    return refuse('RSVP needs JavaScript.', 415)
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    logRejection('malformed-body')
    return ok()
  }

  const honeypot = form.get('website')
  if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
    logRejection('honeypot')
    return ok()
  }

  const token = form.get('dwell')
  const dwell = typeof token === 'string' ? verifyDwellToken(token) : 'malformed'
  if (dwell !== 'valid') {
    logRejection('dwell', dwell)
    if (dwell === 'expired') {
      return refuse(
        'This page has been open a while. Please send it again; nothing you typed has been lost.',
        409,
        { expired: true },
      )
    }
    return ok()
  }

  const parsed = rsvpSchema.safeParse(rsvpInput(form))
  if (!parsed.success) {
    logRejection('schema')
    return Response.json({ ok: false, fields: rsvpFieldErrors(parsed.error) }, { status: 400 })
  }

  const challenge = form.get('cf-turnstile-response')
  const turnstile = await verifyTurnstile(typeof challenge === 'string' ? challenge : null, ip)
  if (turnstile === 'unavailable') {
    // An error, not a warning: the defence is down and nobody can RSVP.
    console.error('[rsvp] turnstile unavailable')
    return refuse('We can’t take RSVPs right now. Please try again in a few minutes.', 503)
  }
  if (turnstile === 'fail') {
    logRejection('turnstile')
    return refuse('Please complete the check above the button and try again.', 400, {
      turnstile: true,
    })
  }

  try {
    const payload = await getPayload({ config: await configPromise })
    const { slug } = await params
    const event = (
      await payload.find({
        collection: 'events',
        where: { slug: { equals: slug }, kind: { equals: 'hosted' } },
        limit: 1,
        depth: 0,
        joins: false,
        overrideAccess: false,
      })
    ).docs[0]
    if (!event) {
      logRejection('event', 'not-found')
      return refuse(CLOSED_MESSAGES.closed, 404)
    }

    const reserved = await reservePlace(payload, event, parsed.data)
    if (reserved.outcome === 'full') {
      logRejection('capacity', 'full')
      return refuse(CLOSED_MESSAGES.full, 409, { state: 'full' })
    }
    if (reserved.outcome === 'closed') {
      logRejection('state', 'closed')
      return refuse(
        event.status === 'cancelled' ? CLOSED_MESSAGES.cancelled : CLOSED_MESSAGES.closed,
        409,
        { state: 'closed' },
      )
    }

    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    after(() =>
      confirm(
        reserved.registrationId,
        { id: reserved.registrationId, firstName: parsed.data.firstName, email: parsed.data.email },
        event,
        settings.contactEmail ?? null,
      ),
    )

    // The same answer for a new place, a repeat and a reactivation.
    return ok()
  } catch (error) {
    console.error('[rsvp] save failed', error instanceof Error ? error.message : error)
    return refuse('Something went wrong. Please try again in a moment.', 500)
  }
}

async function confirm(
  registrationId: number,
  registration: Parameters<typeof sendConfirmation>[0],
  event: Parameters<typeof sendConfirmation>[1],
  replyTo: string | null,
): Promise<void> {
  const result = await sendConfirmation(registration, event, { replyTo })
  if (result === 'unconfigured' || result === 'failed') {
    console.error(`[rsvp] confirmation ${result} for registration ${registrationId}`)
  }
  try {
    const payload = await getPayload({ config: await configPromise })
    await payload.update({
      collection: 'event-registrations',
      id: registrationId,
      data: { confirmation: result },
      overrideAccess: true,
    })
  } catch (error) {
    console.error(
      '[rsvp] could not record confirmation',
      error instanceof Error ? error.message : error,
    )
  }
}

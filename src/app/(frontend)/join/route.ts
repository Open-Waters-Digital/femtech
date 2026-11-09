import configPromise from '@payload-config'
import { after } from 'next/server'
import { ValidationError, getPayload } from 'payload'

import { leadProperties, sendLead } from '@/lib/analytics/lead'
import { verifyDwellToken } from '@/lib/dwell-token'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { notifyTeam } from '@/lib/signup/notify'
import { type WelcomeOutcome, sendWelcome, welcomeContent } from '@/lib/signup/welcome'
import { verifyTurnstile } from '@/lib/turnstile'
import {
  type Signup,
  type SignupFieldErrors,
  attributionInput,
  attributionSchema,
  signupInput,
  signupSchema,
  toFieldErrors,
} from '@/lib/signup/schema'

/**
 * `POST /join`: the only way a member gets into the database from outside the
 * admin. The collection's `create` access requires a signed-in user, so every
 * layer below is mandatory rather than advisory.
 *
 * Layers, cheapest first:
 *
 *   1. IP rate limit       in-memory fixed window, a blunt backstop
 *   2. Honeypot            an off-screen input bots fill and people never see
 *   3. Signed dwell token  HMAC(timestamp) minted on mount, verified here
 *   4. Zod validation      the same schema the form used
 *   5. Save                one row per email; a repeat sign-up changes nothing
 *   6. Welcome             after the response: a new member whose Turnstile
 *                          check passed is emailed a welcome
 *   7. Notify              email the team, saying how the welcome went
 *   8. Lead                a new member is counted in analytics, with the
 *                          channel classified from `ow_attribution`
 *
 * Turnstile gates the welcome and nothing else. The welcome is the one email
 * that goes to the address someone typed, so without the check anyone could
 * use the form to send our mail to strangers. But a failed or missing check
 * does not refuse the sign-up: the form works without JavaScript, which
 * Turnstile needs, and a person whose browser blocks Cloudflare is still a
 * person. They are saved, the team is told, and no welcome is sent. A bot that
 * gets this far can fill the list, as before, but cannot send mail with it.
 *
 * Bot rejections answer exactly as success does. Telling a scraper which layer
 * caught it is free tuning information, and a person never trips them.
 *
 * Not under /api, which Payload owns.
 */
export const dynamic = 'force-dynamic'

/**
 * Two kinds of caller. The enhanced form asks for JSON and shows the answer in
 * place. The form without JavaScript posts natively and must get a page back,
 * because a browser would simply display a JSON body.
 */
type Reply = {
  accepted: () => Response
  invalid: (fields: SignupFieldErrors) => Response
  failed: (reason: 'busy' | 'expired' | 'error', message: string, status: number) => Response
}

const see = (path: string): Response =>
  new Response(null, { status: 303, headers: { location: path } })

const nativeReply: Reply = {
  accepted: () => see('/sign-up/thank-you'),
  // No field names or values in the URL: they would sit in access logs.
  invalid: () => see('/sign-up/not-sent?reason=check'),
  failed: (reason) => see(`/sign-up/not-sent?reason=${reason}`),
}

const jsonReply: Reply = {
  accepted: () => Response.json({ ok: true }, { status: 200 }),
  invalid: (fields) => Response.json({ ok: false, fields }, { status: 400 }),
  failed: (_reason, message, status) => Response.json({ ok: false, message }, { status }),
}

function wantsJson(request: Request): boolean {
  return (request.headers.get('accept') ?? '').includes('application/json')
}

/** The layer and the outcome only. Never a name, an address or a message. */
function logRejection(layer: string, detail?: string): void {
  console.warn(`[join] rejected at ${layer}${detail ? `: ${detail}` : ''}`)
}

export async function POST(request: Request): Promise<Response> {
  const reply = wantsJson(request) ? jsonReply : nativeReply

  // 1. Rate limit. A real person can hit this from a shared office address, so
  //    they are told rather than silently dropped.
  const ip = clientIp(request.headers)
  if (!rateLimit(`join:${ip}`).allowed) {
    logRejection('rate-limit')
    return reply.failed(
      'busy',
      'Several sign-ups in quick succession. Please try again shortly.',
      429,
    )
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    logRejection('malformed-body')
    return reply.accepted()
  }

  // 2. Honeypot. Off-screen, aria-hidden and out of the tab order.
  const honeypot = form.get('website')
  if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
    logRejection('honeypot')
    return reply.accepted()
  }

  // 3. Dwell token. Expired is the one outcome a person reaches (the page left
  //    open for hours), so it gets words; the form fetches a fresh token.
  const token = form.get('dwell')
  const dwell = typeof token === 'string' ? verifyDwellToken(token) : 'malformed'
  if (dwell !== 'valid') {
    logRejection('dwell', dwell)
    if (dwell === 'expired') {
      return reply.failed(
        'expired',
        'This page has been open a while. Please send it again; nothing you typed has been lost.',
        409,
      )
    }
    return reply.accepted()
  }

  // 4. Schema. The attribution is validated apart from the sign-up, so it
  //    cannot ride along into the member, an email or a log.
  const parsed = signupSchema.safeParse(signupInput(form))
  if (!parsed.success) {
    logRejection('schema')
    return reply.invalid(toFieldErrors(parsed.error))
  }
  const attribution = attributionSchema.safeParse(attributionInput(form))
  if (!attribution.success) {
    logRejection('schema', 'attribution')
    return reply.invalid({})
  }

  // 5. Save.
  let saved: { id: number; repeat: boolean }
  try {
    saved = await saveMember(parsed.data)
  } catch (error) {
    console.error('[join] save failed', error instanceof Error ? error.message : error)
    return reply.failed('error', 'Something went wrong. Please try again in a moment.', 500)
  }

  // 6 and 7. Welcome and notify, once the visitor has their answer. The member
  //    is saved, so a slow check or a failed email costs them nothing. The
  //    widget writes its token into the form; without JavaScript there is none.
  const challenge = form.get('cf-turnstile-response')
  after(() =>
    followUp(
      parsed.data,
      saved,
      typeof challenge === 'string' ? challenge : null,
      ip,
      attribution.data,
    ),
  )

  // The same answer whether or not they were already a member, so the form
  // cannot be used to find out who is on the list.
  return reply.accepted()
}

/**
 * One row per email. A repeat sign-up does not overwrite the existing row: an
 * unauthenticated request must not be able to change someone else's details by
 * typing their address. The team is told, and can update it by hand.
 */
async function saveMember(signup: Signup): Promise<{ id: number; repeat: boolean }> {
  const payload = await getPayload({ config: await configPromise })

  const existing = await payload.find({
    collection: 'members',
    where: { email: { equals: signup.email } },
    limit: 1,
    depth: 0,
    // No user on this request, and `read` requires one. Safe because nothing
    // read here is returned to the caller.
    overrideAccess: true,
  })
  const found = existing.docs[0]
  if (found) return { id: found.id, repeat: true }

  try {
    const created = await payload.create({
      collection: 'members',
      data: { ...signup, status: 'active' },
      // `create` requires a user; every layer above has run, which is what
      // makes the override safe here and only here.
      overrideAccess: true,
    })
    return { id: created.id, repeat: false }
  } catch (error) {
    // Two submissions for the same address at once: the unique index refuses
    // the second, which is then a repeat like any other.
    if (!(error instanceof ValidationError)) throw error
    const again = await payload.find({
      collection: 'members',
      where: { email: { equals: signup.email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const winner = again.docs[0]
    if (!winner) throw error
    return { id: winner.id, repeat: true }
  }
}

/**
 * Welcome a new member if their check passed. Never throws: anything that goes
 * wrong is an outcome, recorded on the member and told to the team.
 */
async function welcome(
  signup: Signup,
  memberId: number,
  challenge: string | null,
  ip: string,
): Promise<WelcomeOutcome> {
  if (!challenge) {
    console.warn(`[join] no welcome for member ${memberId}: no turnstile token`)
    return 'unverified'
  }
  const check = await verifyTurnstile(challenge, ip)
  if (check === 'unavailable') {
    // An error: either the keys are missing or Cloudflare is down, and nobody
    // is being welcomed until it is fixed.
    console.error(`[join] turnstile unavailable; no welcome for member ${memberId}`)
    return 'unverified'
  }
  if (check === 'fail') {
    console.warn(`[join] no welcome for member ${memberId}: turnstile check failed`)
    return 'unverified'
  }

  let content
  try {
    const payload = await getPayload({ config: await configPromise })
    content = welcomeContent(await payload.findGlobal({ slug: 'site-settings', depth: 0 }))
  } catch (error) {
    console.error(
      '[join] could not read the welcome copy',
      error instanceof Error ? error.message : error,
    )
    return 'failed'
  }

  const result = await sendWelcome(signup, content)
  if (result === 'unconfigured' || result === 'failed') {
    console.error(`[join] welcome ${result} for member ${memberId}`)
  }
  return result
}

async function followUp(
  signup: Signup,
  saved: { id: number; repeat: boolean },
  challenge: string | null,
  ip: string,
  attribution: string | undefined,
): Promise<void> {
  // A repeat is never welcomed again: one welcome per address, ever, so the
  // form cannot be used to send the same person the email over and over.
  const welcomed = saved.repeat ? undefined : await welcome(signup, saved.id, challenge, ip)

  const result = await notifyTeam(
    { ...signup, id: saved.id },
    { repeat: saved.repeat, welcome: welcomed },
  )
  if (result === 'unconfigured' || result === 'failed') {
    // An error, not a warning: in production nobody is being told about
    // sign-ups. The member is saved and marked, so nothing is lost.
    console.error(`[join] team notification ${result} for member ${saved.id}`)
  }
  // A repeat keeps the first sign-up's record of how those emails went.
  if (saved.repeat) return

  try {
    const payload = await getPayload({ config: await configPromise })
    await payload.update({
      collection: 'members',
      id: saved.id,
      data: { notification: result, welcomeEmail: welcomed },
      overrideAccess: true,
    })
  } catch (error) {
    console.error(
      '[join] could not record how the emails went',
      error instanceof Error ? error.message : error,
    )
  }

  // 8. Counted last, so nothing analytics does can hold up or alter the emails
  //    or the member's record. A new member only: a repeat saves nothing, so
  //    it is not a new lead. sendLead never throws and gives up within five
  //    seconds; the catch is for anything around it.
  try {
    await sendLead(leadProperties({ ow_attribution: attribution }))
  } catch (error) {
    console.error('[join] lead event failed', error instanceof Error ? error.name : 'unknown')
  }
}

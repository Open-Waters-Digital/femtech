import {
  type Message,
  type NotifyResult,
  type Send,
  plain,
  resendSender,
  sendWithTimeout,
} from '@/lib/email'
import { renderEmail } from '@/lib/email-layout'
import { type EventTiming, formatEventWhen } from '@/lib/events/format'
import { mintWithdrawToken } from '@/lib/events/withdraw-token'
import { isIndexable, siteUrl } from '@/lib/site-env'

/**
 * The email that confirms a place at a hosted event, sent to the registrant
 * and nobody else, with a link to withdraw.
 *
 * The registration is saved before this runs, so a failed or unconfigured send
 * loses nobody's place: the row is in the admin, marked with how the email
 * went. The wording was written here, not supplied (AGENTS.md, open questions).
 */

const TIMEOUT_MS = 10_000

export type ConfirmationRegistration = { id: number; firstName: string; email: string }

export type ConfirmationEvent = EventTiming & {
  title: string
  slug?: string | null
  venue?: string | null
  city?: string | null
  country?: string | null
  online?: boolean | null
}

function where(event: ConfirmationEvent): string | null {
  if (event.online) return 'Online'
  const parts = [event.venue, event.city, event.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

export function withdrawUrl(registrationId: number): string {
  return `${siteUrl()}/events/withdraw?token=${mintWithdrawToken(registrationId)}`
}

export function buildConfirmation(
  registration: ConfirmationRegistration,
  event: ConfirmationEvent,
  options: { from: string; replyTo?: string | null },
): Message {
  const when = formatEventWhen(event)
  const place = where(event)
  const page = event.slug ? `${siteUrl()}/events/${event.slug}` : null
  const withdraw = withdrawUrl(registration.id)
  // `plain` strips line breaks, so nothing an editor or a visitor typed can
  // reach a second header line.
  const subject = `You’re booked: ${plain(event.title)}`

  const { html, text } = renderEmail({
    subject,
    preheader: `${plain(when)}${place ? `, ${plain(place)}` : ''}`,
    heading: 'You’re booked',
    blocks: [
      { kind: 'paragraph', parts: [`Hello ${registration.firstName},`] },
      {
        kind: 'paragraph',
        size: 'lead',
        parts: ['Your place at ', { strong: event.title }, ' is confirmed.'],
      },
      {
        kind: 'table',
        rows: [['When', when], ...(place ? [['Where', place] as [string, string]] : [])],
      },
      ...(page ? [{ kind: 'button' as const, label: 'The event’s page', href: page }] : []),
      { kind: 'divider' },
      {
        kind: 'smallprint',
        parts: [
          'Can’t make it? ',
          { text: 'Withdraw', href: withdraw },
          ' and we’ll free your place for someone else.',
        ],
      },
    ],
    footerNote: 'You’re receiving this because you booked a place on our website.',
  })

  return {
    from: options.from,
    to: [registration.email],
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    subject,
    html,
    text,
  }
}

/**
 * Email the registrant. `send` is a seam for tests; without it, Resend is used
 * when the API key and the sending address are set.
 */
export async function sendConfirmation(
  registration: ConfirmationRegistration,
  event: ConfirmationEvent,
  options: { replyTo?: string | null; send?: Send } = {},
): Promise<NotifyResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.SIGNUP_FROM_EMAIL ?? ''

  const sender = options.send ?? (apiKey && from ? resendSender(apiKey) : null)
  if (!sender) return isIndexable() ? 'unconfigured' : 'skipped'

  return sendWithTimeout(
    sender,
    buildConfirmation(registration, event, { from, replyTo: options.replyTo }),
    TIMEOUT_MS,
  )
}

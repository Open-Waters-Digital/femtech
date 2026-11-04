import {
  type Message,
  type NotifyResult,
  type Send,
  plain,
  resendSender,
  sendWithTimeout,
} from '@/lib/email'
import { renderEmail } from '@/lib/email-layout'
import { type Signup, industryLabel } from '@/lib/signup/schema'
import type { WelcomeOutcome } from '@/lib/signup/welcome'
import { isIndexable, siteUrl } from '@/lib/site-env'

/**
 * The email that tells the team someone has signed up.
 *
 * The member is saved before this runs, so a failed or unconfigured send loses
 * nobody: the row is in the admin either way, marked with how the email went.
 * Production with no mail settings is reported as `unconfigured` and logged as
 * an error by the caller, because a silent gap there means nobody knows people
 * are joining.
 */

export type { Message, NotifyResult, Send } from '@/lib/email'
export { safe } from '@/lib/email'

const TIMEOUT_MS = 8_000

/** SIGNUP_NOTIFY_EMAIL may name several people, separated by commas. */
export function recipients(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean)
}

/**
 * What the team is told about the welcome, so a member who did not get one
 * can be written to by hand.
 */
export function welcomeLine(welcome: WelcomeOutcome | undefined, repeat: boolean): string {
  if (repeat) return 'Not sent: already a member'
  switch (welcome) {
    case 'sent':
      return 'Sent'
    case 'failed':
      return 'Failed to send. Worth writing to them yourself.'
    case 'unverified':
      return 'Not sent: the spam check did not pass (no JavaScript, or it was blocked). Worth writing to them yourself.'
    case 'unconfigured':
      return 'Not sent: email is not configured'
    case 'skipped':
      return 'Not sent (development)'
    case undefined:
      return '—'
  }
}

export function buildMessage(
  member: Signup & { id: number },
  options: { from: string; to: string[]; repeat: boolean; welcome?: WelcomeOutcome },
): Message {
  const name = `${member.firstName} ${member.lastName}`
  const admin = `${siteUrl()}/admin/collections/members/${member.id}`
  const rows: [string, string][] = [
    ['Name', name],
    ['Email', member.email],
    ['Phone', member.phone || '—'],
    ['Job title', member.jobTitle],
    ['Organisation', member.organisation || '—'],
    ['Industry', industryLabel(member.industry) ?? '—'],
    ['Happy to receive emails', member.emailUpdates ? 'Yes' : 'No'],
    ['Welcome email', welcomeLine(options.welcome, options.repeat)],
  ]
  const subject = options.repeat
    ? `Sign-up again from ${plain(name)} (already a member)`
    : `New sign-up: ${plain(name)}`

  const { html, text } = renderEmail({
    subject,
    preheader: `${plain(member.jobTitle)}, ${plain(industryLabel(member.industry) ?? '')}`,
    heading: subject,
    blocks: [
      ...(options.repeat
        ? [
            {
              kind: 'paragraph' as const,
              parts: [
                'This email address was already on the members list, so nothing was changed. These are the details they entered this time.',
              ],
            },
          ]
        : []),
      { kind: 'table', rows },
      { kind: 'button', label: 'Open the member in the admin', href: admin },
    ],
    footerNote: 'Sent by the sign-up form on the website.',
  })

  return {
    from: options.from,
    to: options.to,
    // Reply goes to the member, so the team can answer without copying the
    // address out of the body. CR and LF are already impossible here: the
    // schema refused any email containing them.
    replyTo: member.email,
    subject,
    html,
    text,
  }
}

/**
 * Email the team. `send` is a seam for tests; without it, Resend is used when
 * all three settings are present.
 */
export async function notifyTeam(
  member: Signup & { id: number },
  { repeat, welcome }: { repeat: boolean; welcome?: WelcomeOutcome },
  send?: Send,
): Promise<NotifyResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.SIGNUP_FROM_EMAIL ?? ''
  const to = recipients(process.env.SIGNUP_NOTIFY_EMAIL)

  const sender = send ?? (apiKey && from && to.length > 0 ? resendSender(apiKey) : null)
  if (!sender) return isIndexable() ? 'unconfigured' : 'skipped'

  // Every outbound call gets a timeout. A hung mail provider must not hang
  // the visitor's request; the member is already saved.
  return sendWithTimeout(sender, buildMessage(member, { from, to, repeat, welcome }), TIMEOUT_MS)
}

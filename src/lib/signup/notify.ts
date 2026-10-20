import { Resend } from 'resend'

import { type Signup, industryLabel } from '@/lib/signup/schema'
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

export type NotifyResult = 'sent' | 'skipped' | 'unconfigured' | 'failed'

export type Message = {
  from: string
  to: string[]
  replyTo: string
  subject: string
  html: string
  text: string
}

export type Send = (message: Message) => Promise<{ error: unknown }>

const TIMEOUT_MS = 8_000

/**
 * Escapes HTML and strips CR and LF. The line breaks matter more than the angle
 * brackets: a newline in a value that reaches a header turns the subject line
 * into a header-injection vector.
 */
export function safe(value: string): string {
  return value
    .replace(/[\r\n]+/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim()
}

/** The same, for the plain-text part, where only the line breaks are a hazard. */
function plain(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

/** SIGNUP_NOTIFY_EMAIL may name several people, separated by commas. */
export function recipients(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean)
}

export function buildMessage(
  member: Signup & { id: number },
  options: { from: string; to: string[]; repeat: boolean },
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
  ]
  const subject = options.repeat
    ? `Sign-up again from ${plain(name)} (already a member)`
    : `New sign-up: ${plain(name)}`

  const html = [
    `<h2>${safe(subject)}</h2>`,
    options.repeat
      ? '<p>This email address was already on the members list, so nothing was changed. These are the details they entered this time.</p>'
      : '',
    '<table cellpadding="6">',
    ...rows.map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${safe(v)}</td></tr>`),
    '</table>',
    `<p><a href="${safe(admin)}">Open the member in the admin</a></p>`,
  ].join('')

  const text = [
    subject,
    '',
    ...rows.map(([k, v]) => `${k}: ${plain(v)}`),
    '',
    `Open the member in the admin: ${admin}`,
  ].join('\n')

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

const resendSender =
  (apiKey: string): Send =>
  async (message) => {
    const { error } = await new Resend(apiKey).emails.send(message)
    return { error }
  }

/**
 * Email the team. `send` is a seam for tests; without it, Resend is used when
 * all three settings are present.
 */
export async function notifyTeam(
  member: Signup & { id: number },
  repeat: boolean,
  send?: Send,
): Promise<NotifyResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.SIGNUP_FROM_EMAIL ?? ''
  const to = recipients(process.env.SIGNUP_NOTIFY_EMAIL)

  const sender = send ?? (apiKey && from && to.length > 0 ? resendSender(apiKey) : null)
  if (!sender) return isIndexable() ? 'unconfigured' : 'skipped'

  try {
    // Every outbound call gets a timeout. A hung mail provider must not hang
    // the visitor's request; the member is already saved.
    const { error } = await Promise.race([
      sender(buildMessage(member, { from, to, repeat })),
      new Promise<{ error: unknown }>((resolve) =>
        setTimeout(() => resolve({ error: 'timeout' }), TIMEOUT_MS),
      ),
    ])
    return error ? 'failed' : 'sent'
  } catch {
    return 'failed'
  }
}

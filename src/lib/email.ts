import { Resend } from 'resend'

/**
 * What every email the site sends shares: the message shape, the send seam,
 * the escaping and the timeout. The team's sign-up notification and an RSVP's
 * confirmation both go through here, so neither can forget to escape a value
 * or wait forever on the mail provider.
 */

export type NotifyResult = 'sent' | 'skipped' | 'unconfigured' | 'failed'

export type Message = {
  from: string
  to: string[]
  replyTo?: string
  subject: string
  html: string
  text: string
}

export type Send = (message: Message) => Promise<{ error: unknown }>

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
export function plain(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

export const resendSender =
  (apiKey: string): Send =>
  async (message) => {
    const { error } = await new Resend(apiKey).emails.send(message)
    return { error }
  }

/** Sends, and reports `failed` rather than waiting past `timeoutMs` or throwing. */
export async function sendWithTimeout(
  send: Send,
  message: Message,
  timeoutMs: number,
): Promise<'sent' | 'failed'> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const { error } = await Promise.race([
      send(message),
      new Promise<{ error: unknown }>((resolve) => {
        timer = setTimeout(() => resolve({ error: 'timeout' }), timeoutMs)
      }),
    ])
    return error ? 'failed' : 'sent'
  } catch {
    return 'failed'
  } finally {
    clearTimeout(timer)
  }
}

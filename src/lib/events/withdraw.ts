import type { Payload } from 'payload'

import { isPast } from '@/lib/events/format'
import { readWithdrawToken } from '@/lib/events/withdraw-token'
import type { Event } from '@/payload-types'

/**
 * Withdrawing from a hosted event, by the signed link in the confirmation
 * email. Two steps, so that opening the link changes nothing:
 *
 *   readWithdrawal   GET /events/withdraw?token=…   what the page shows
 *   withdraw         POST /events/withdraw/confirm  the one write
 *
 * Mail scanners follow links to check them. If opening the link withdrew, every
 * registrant behind such a scanner would lose their place on receipt.
 *
 * The token is the only authority: no name or address is asked for, and the
 * page shows nothing about the registrant, only the event, so a forwarded link
 * reveals no more than the email it came in.
 */
export type WithdrawalEvent = Pick<
  Event,
  'title' | 'slug' | 'startsAt' | 'startsAt_tz' | 'endsAt' | 'allDay'
>

export type Withdrawal =
  | { state: 'invalid' }
  | { state: 'past'; event: WithdrawalEvent }
  | { state: 'confirmed'; event: WithdrawalEvent; registrationId: number }
  | { state: 'withdrawn'; event: WithdrawalEvent }

function eventOf(event: Event): WithdrawalEvent {
  const { title, slug, startsAt, startsAt_tz, endsAt, allDay } = event
  return { title, slug, startsAt, startsAt_tz, endsAt, allDay }
}

/** Read-only: what the link points at, and whether it can still be used. */
export async function readWithdrawal(
  payload: Payload,
  token: string | null | undefined,
  now: Date = new Date(),
): Promise<Withdrawal> {
  const registrationId = readWithdrawToken(token)
  if (registrationId === null) return { state: 'invalid' }

  const registration = await payload
    .findByID({
      collection: 'event-registrations',
      id: registrationId,
      depth: 1,
      overrideAccess: true,
      disableErrors: true,
    })
    .catch(() => null)
  const event = registration?.event
  if (!registration || !event || typeof event !== 'object') return { state: 'invalid' }

  const shown = eventOf(event)
  if (registration.status === 'withdrawn') return { state: 'withdrawn', event: shown }
  if (isPast(event, now)) return { state: 'past', event: shown }
  return { state: 'confirmed', event: shown, registrationId }
}

/**
 * The write. Idempotent: withdrawing twice answers as withdrawing once. An
 * event that is over is left alone: there is no place left to free.
 */
export async function withdraw(
  payload: Payload,
  token: string | null | undefined,
  now: Date = new Date(),
): Promise<Withdrawal['state']> {
  const current = await readWithdrawal(payload, token, now)
  if (current.state !== 'confirmed') return current.state

  await payload.update({
    collection: 'event-registrations',
    id: current.registrationId,
    data: { status: 'withdrawn', withdrawnAt: now.toISOString() },
    overrideAccess: true,
  })
  return 'withdrawn'
}

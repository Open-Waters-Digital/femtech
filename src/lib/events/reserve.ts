import {
  type Payload,
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
} from 'payload'

import type { Rsvp } from '@/lib/events/rsvp-schema'
import { type RsvpEvent, rsvpState } from '@/lib/events/rsvp-state'

/**
 * Reserving a place: the part of an RSVP that has to be right when two people
 * press the button for the last place at once.
 *
 * The count and the write run inside one transaction, behind a lock per event.
 * The lock is what makes it correct, and it is in-process, which is correct
 * only while the service runs one replica (the same constraint as the rate
 * limiter; AGENTS.md, "Pre-launch hardening"). The transaction keeps the write
 * atomic if anything in it fails.
 */

const locks = new Map<number, Promise<unknown>>()

/** Runs `task` after every earlier task for the same event has settled. */
export async function withEventLock<T>(eventId: number, task: () => Promise<T>): Promise<T> {
  const previous = locks.get(eventId) ?? Promise.resolve()
  const run = previous.then(task, task)
  const tail = run.catch(() => undefined)
  locks.set(eventId, tail)
  try {
    return await run
  } finally {
    // The last one out removes the entry, so the map does not grow per event forever.
    if (locks.get(eventId) === tail) locks.delete(eventId)
  }
}

export type ReserveOutcome =
  | { outcome: 'confirmed' | 'reactivated' | 'repeat'; registrationId: number }
  | { outcome: 'full' }
  | { outcome: 'closed' }

/**
 * One registration per event per email:
 *
 *   - new address, places left    a confirmed registration (`confirmed`)
 *   - already confirmed           nothing changes (`repeat`); the caller resends
 *   - withdrawn, places left      confirmed again (`reactivated`)
 *   - no places, or RSVP closed   `full` or `closed`, for everyone alike
 *
 * Full and closed are answered the same whether or not the address already has
 * a place, so the form cannot be used to find out who is attending. The stored
 * names are never changed: an anonymous request must not be able to edit
 * someone else's registration by typing their address.
 */
export async function reservePlace(
  payload: Payload,
  event: RsvpEvent & { id: number },
  rsvp: Rsvp,
  now: Date = new Date(),
): Promise<ReserveOutcome> {
  return withEventLock(event.id, async () => {
    const req = await createLocalReq({}, payload)
    await initTransaction(req)
    try {
      const outcome = await reserveInTransaction(payload, req, event, rsvp, now)
      await commitTransaction(req)
      return outcome
    } catch (error) {
      await killTransaction(req)
      throw error
    }
  })
}

async function reserveInTransaction(
  payload: Payload,
  req: Awaited<ReturnType<typeof createLocalReq>>,
  event: RsvpEvent & { id: number },
  rsvp: Rsvp,
  now: Date,
): Promise<ReserveOutcome> {
  const { totalDocs: confirmed } = await payload.count({
    collection: 'event-registrations',
    where: { event: { equals: event.id }, status: { equals: 'confirmed' } },
    overrideAccess: true,
    req,
  })
  const state = rsvpState(event, confirmed, now)
  if (state.state === 'full') return { outcome: 'full' }
  if (state.state !== 'open') return { outcome: 'closed' }

  const existing = (
    await payload.find({
      collection: 'event-registrations',
      where: { event: { equals: event.id }, email: { equals: rsvp.email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
  ).docs[0]

  if (existing?.status === 'confirmed') {
    return { outcome: 'repeat', registrationId: existing.id }
  }

  if (existing) {
    await payload.update({
      collection: 'event-registrations',
      id: existing.id,
      data: { status: 'confirmed', withdrawnAt: null },
      overrideAccess: true,
      req,
    })
    return { outcome: 'reactivated', registrationId: existing.id }
  }

  const member = (
    await payload.find({
      collection: 'members',
      where: { email: { equals: rsvp.email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
  ).docs[0]

  const created = await payload.create({
    collection: 'event-registrations',
    data: {
      event: event.id,
      firstName: rsvp.firstName,
      lastName: rsvp.lastName,
      email: rsvp.email,
      status: 'confirmed',
      ...(member ? { member: member.id } : {}),
    },
    // `create` requires a user; every layer of the route has run, which is
    // what makes the override safe here and only here.
    overrideAccess: true,
    req,
  })
  return { outcome: 'confirmed', registrationId: created.id }
}

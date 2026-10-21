import { type EventTiming, hasStarted } from '@/lib/events/format'
import type { EventBadge } from '@/styles/variants'

/**
 * Whether a hosted event takes RSVPs right now, and if not, why. One rule,
 * read by the listing's badge, the event page and the RSVP route, so the page
 * can never offer a form the route would refuse.
 */
export type RsvpEvent = EventTiming & {
  status: 'draft' | 'published' | 'cancelled'
  capacity?: number | null
  rsvpClosesAt?: string | null
}

export type RsvpState =
  | { state: 'open'; remaining: number | null }
  | { state: 'full' }
  | { state: 'closed'; reason: 'started' | 'deadline' | 'unpublished' }
  | { state: 'cancelled' }

export function rsvpState(event: RsvpEvent, confirmed: number, now: Date = new Date()): RsvpState {
  if (event.status === 'cancelled') return { state: 'cancelled' }
  if (event.status !== 'published') return { state: 'closed', reason: 'unpublished' }
  if (hasStarted(event, now)) return { state: 'closed', reason: 'started' }
  if (event.rsvpClosesAt && now.getTime() >= new Date(event.rsvpClosesAt).getTime()) {
    return { state: 'closed', reason: 'deadline' }
  }
  if (event.capacity) {
    const remaining = event.capacity - confirmed
    return remaining > 0 ? { state: 'open', remaining } : { state: 'full' }
  }
  return { state: 'open', remaining: null }
}

export function rsvpBadge(state: RsvpState): EventBadge {
  return state.state
}

/** What the event page says when there is no form. */
export const CLOSED_MESSAGES: Record<Exclude<RsvpState['state'], 'open'>, string> = {
  full: 'This event is full.',
  closed: 'RSVP for this event has closed.',
  cancelled: 'This event has been cancelled.',
}

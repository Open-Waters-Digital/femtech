import type { Event } from '@/payload-types'
import type { EventBadge } from '@/styles/variants'

/** How a speaker's role is shown. "To be confirmed" is the organiser's to settle. */
export const ROLE_LABELS: Record<NonNullable<Event['speakers']>[number]['role'], string> = {
  keynote: 'Keynote',
  panel: 'Panel',
  talk: 'Talk',
  tbc: 'Role to be confirmed',
}

export const BADGE_LABELS: Record<EventBadge, string> = {
  open: 'RSVP open',
  full: 'Full',
  closed: 'RSVP closed',
  cancelled: 'Cancelled',
}

/** "ADNEC, Abu Dhabi, United Arab Emirates", or "Online", or nothing. */
export function eventWhere(
  event: Pick<Event, 'venue' | 'city' | 'country' | 'online'>,
): string | null {
  if (event.online) return 'Online'
  const parts = [event.venue, event.city, event.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

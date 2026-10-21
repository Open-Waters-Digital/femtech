import NextLink from 'next/link'

import { BADGE_LABELS, ROLE_LABELS, eventWhere } from '@/components/events/labels'
import { Eyebrow } from '@/components/primitives/Eyebrow'
import { formatEventWhen } from '@/lib/events/format'
import type { Event } from '@/payload-types'
import { type EventBadge, eventBadgeClasses, eventCardClasses } from '@/styles/variants'

export type EventCardEvent = Pick<
  Event,
  | 'title'
  | 'slug'
  | 'kind'
  | 'status'
  | 'startsAt'
  | 'startsAt_tz'
  | 'endsAt'
  | 'allDay'
  | 'venue'
  | 'city'
  | 'country'
  | 'online'
  | 'speakers'
  | 'sessionTitle'
  | 'organiserUrl'
  | 'summary'
>

/**
 * One event in the listing.
 *
 * A speaking engagement links out to the organiser when a page is set, opening
 * in a new tab (it is someone else's site, and booking happens there). A hosted
 * event links to its own page, with its RSVP state as a badge. Without
 * anywhere to go, the card is plain text rather than a link to nothing.
 *
 * The whole card is the target: the title's link stretches over it with an
 * ::after, so there is one link per card for a screen reader, not three.
 */
export function EventCard({
  event,
  past = false,
  badge,
  headingLevel = 3,
}: {
  event: EventCardEvent
  past?: boolean
  /** Hosted events only: open, full, closed or cancelled. */
  badge?: EventBadge
  headingLevel?: 2 | 3
}) {
  const Heading = `h${headingLevel}` as const
  const hosted = event.kind === 'hosted'
  const href = hosted ? (event.slug ? `/events/${event.slug}` : null) : event.organiserUrl || null
  const where = eventWhere(event)
  const speakers = event.speakers ?? []

  const stretched = 'after:absolute after:inset-0 after:rounded-frame no-underline'

  return (
    <article className={eventCardClasses(past ? 'past' : 'upcoming', Boolean(href))}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow tone={past ? 'subtle' : 'sage'}>
          {hosted ? 'Network event' : 'Speaking engagement'}
          {past ? ' · Past' : ''}
        </Eyebrow>
        {badge ? <span className={eventBadgeClasses(badge)}>{BADGE_LABELS[badge]}</span> : null}
      </div>

      <Heading className="font-display text-2xl leading-snug text-balance">
        {href && hosted ? (
          <NextLink href={href} className={stretched}>
            {event.title}
          </NextLink>
        ) : href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={stretched}>
            {event.title}
            <span className="sr-only"> (the organiser’s site, opens in a new tab)</span>
          </a>
        ) : (
          event.title
        )}
      </Heading>

      <dl className="flex flex-col gap-1 font-body text-base">
        <div>
          <dt className="sr-only">When</dt>
          <dd>
            <time dateTime={event.startsAt}>{formatEventWhen(event)}</time>
          </dd>
        </div>
        {where ? (
          <div>
            <dt className="sr-only">Where</dt>
            <dd className={past ? undefined : 'text-text-muted'}>{where}</dd>
          </div>
        ) : null}
      </dl>

      {speakers.length > 0 ? (
        <ul className="flex flex-col gap-1 font-body text-sm">
          {speakers.map((speaker) => (
            <li key={speaker.id ?? speaker.name}>
              <span className="font-medium">{speaker.name}</span>
              <span className={past ? undefined : 'text-text-muted'}>
                {' · '}
                {ROLE_LABELS[speaker.role]}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="font-body text-sm">
        {event.sessionTitle ? (
          <>
            <span className="sr-only">Session: </span>“{event.sessionTitle}”
          </>
        ) : (
          <span className={past ? undefined : 'text-text-subtle'}>Topic to be confirmed</span>
        )}
      </p>

      {event.summary ? (
        <p className={['font-body text-sm', past ? '' : 'text-text-muted'].join(' ')}>
          {event.summary}
        </p>
      ) : null}

      {href ? (
        // Decorative: the title is the link and already says where it goes.
        <p aria-hidden="true" className="mt-auto pt-2 font-body text-sm font-medium">
          {hosted ? 'Details and RSVP →' : 'On the organiser’s site ↗'}
        </p>
      ) : null}
    </article>
  )
}

import { RsvpForm } from '@/components/events/RsvpForm'
import { Heading } from '@/components/primitives/Heading'
import { Text } from '@/components/primitives/Text'
import { CLOSED_MESSAGES, type RsvpState } from '@/lib/events/rsvp-state'
import type { Event } from '@/payload-types'

/**
 * The RSVP side of a hosted event's page. With RSVP closed it says why and
 * shows no form, so nobody fills in something the route would refuse.
 */
export function RsvpPanel({
  event,
  state,
  contactEmail,
  siteKey,
  dwellToken,
}: {
  event: Pick<Event, 'id' | 'slug' | 'title'>
  state: RsvpState
  contactEmail: string | null
  /** Turnstile's site key, or null where it is not configured (RSVP is then refused). */
  siteKey: string | null
  dwellToken: string
}) {
  if (state.state !== 'open') {
    return (
      <>
        <Heading level={2} size="md">
          RSVP
        </Heading>
        <Text>{CLOSED_MESSAGES[state.state]}</Text>
      </>
    )
  }

  return (
    <>
      <Heading level={2} size="md">
        Reserve your place
      </Heading>
      {state.remaining !== null ? (
        <Text tone="muted">
          {state.remaining === 1 ? 'One place left.' : `${state.remaining} places left.`}
        </Text>
      ) : null}
      <noscript>
        <Text>
          RSVP needs JavaScript, which is switched off in this browser.
          {contactEmail ? (
            <>
              {' '}
              Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a> and we’ll reserve your
              place.
            </>
          ) : null}
        </Text>
      </noscript>
      {siteKey && event.slug ? (
        <RsvpForm slug={event.slug} siteKey={siteKey} initialToken={dwellToken} />
      ) : (
        // Turnstile is not configured: the route would refuse every RSVP, so
        // the page says so rather than offering the form.
        <Text>
          RSVP is not available right now.
          {contactEmail ? (
            <>
              {' '}
              Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a> and we’ll reserve your
              place.
            </>
          ) : null}
        </Text>
      )}
    </>
  )
}

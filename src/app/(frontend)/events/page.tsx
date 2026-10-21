import type { Metadata } from 'next'

import { EventCard } from '@/components/events/EventCard'
import { SIGN_UP_PATH } from '@/components/layout/navigation'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { Button } from '@/components/primitives/Button'
import { Container } from '@/components/primitives/Container'
import { Heading } from '@/components/primitives/Heading'
import { Text } from '@/components/primitives/Text'
import { splitEvents } from '@/lib/events/format'
import { confirmedCounts } from '@/lib/events/places'
import { getPublishedEvents } from '@/lib/events/queries'
import { rsvpBadge, rsvpState } from '@/lib/events/rsvp-state'

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Where to find FemTech Healthcare Network: the network’s own events, and the stages its founder is speaking on.',
  alternates: { canonical: '/events' },
}

/**
 * Every published event, upcoming soonest first, then past ones. Which is which
 * is decided here, per request, so an event moves to the past list on its own
 * once it is over.
 */
export default async function EventsPage() {
  const now = new Date()
  const { upcoming, past } = splitEvents(await getPublishedEvents(), now)

  const hostedIds = upcoming.filter((event) => event.kind === 'hosted').map((event) => event.id)
  const counts = await confirmedCounts(hostedIds)

  return (
    <>
      <SiteHeader tone="dark" pathname="/events" />
      <main id="main" className="pt-36 pb-16 md:pt-48">
        <Container className="flex flex-col gap-16">
          <div className="flex max-w-statement flex-col gap-6">
            <Heading level={1} size="2xl">
              Events
            </Heading>
            <Text size="lead">
              The network’s own gatherings, and the stages where you can hear from us.
            </Text>
          </div>

          {upcoming.length > 0 ? (
            <section aria-labelledby="upcoming-heading" className="flex flex-col gap-8">
              <Heading level={2} size="lg" id="upcoming-heading">
                Upcoming
              </Heading>
              <ul className="grid gap-6 md:grid-cols-2">
                {upcoming.map((event) => (
                  <li key={event.id}>
                    <EventCard
                      event={event}
                      badge={
                        event.kind === 'hosted'
                          ? rsvpBadge(rsvpState(event, counts.get(event.id) ?? 0, now))
                          : undefined
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section
              aria-labelledby="coming-soon-heading"
              className="flex flex-col items-start gap-6 rounded-frame bg-surface-raised p-8 md:p-12"
            >
              <Heading level={2} size="lg" id="coming-soon-heading">
                Events – coming soon.
              </Heading>
              <Text>Sign up and you’ll be the first to hear when the next one is announced.</Text>
              <Button href={SIGN_UP_PATH}>Sign Up</Button>
            </section>
          )}

          {past.length > 0 ? (
            <section aria-labelledby="past-heading" className="flex flex-col gap-8">
              <Heading level={2} size="lg" id="past-heading">
                Past events
              </Heading>
              <ul className="grid gap-6 md:grid-cols-2">
                {past.map((event) => (
                  <li key={event.id}>
                    <EventCard event={event} past />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </Container>
      </main>
    </>
  )
}

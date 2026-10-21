import type { Metadata } from 'next'
import NextLink from 'next/link'
import { notFound } from 'next/navigation'

import { ROLE_LABELS, eventWhere } from '@/components/events/labels'
import { RsvpPanel } from '@/components/events/RsvpPanel'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { Container } from '@/components/primitives/Container'
import { Eyebrow } from '@/components/primitives/Eyebrow'
import { Heading } from '@/components/primitives/Heading'
import { Paragraphs } from '@/components/primitives/Paragraphs'
import { PayloadImage } from '@/components/primitives/PayloadImage'
import { Text } from '@/components/primitives/Text'
import { getSiteSettings } from '@/lib/content'
import { mintDwellToken } from '@/lib/dwell-token'
import { formatEventWhen } from '@/lib/events/format'
import { confirmedCounts } from '@/lib/events/places'
import { getHostedEventBySlug } from '@/lib/events/queries'
import { rsvpState } from '@/lib/events/rsvp-state'
import { turnstileConfig } from '@/lib/events/turnstile'

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const event = await getHostedEventBySlug((await params).slug)
  if (!event) return {}
  return {
    title: event.title,
    description: event.summary || `${event.title}: ${formatEventWhen(event)}.`,
    alternates: { canonical: `/events/${event.slug}` },
    // A cancelled event keeps its page for anyone holding the link, but is
    // no longer something to find.
    ...(event.status === 'cancelled' ? { robots: { index: false, follow: true } } : {}),
  }
}

/**
 * A hosted event's page: its details, its description and its RSVP.
 *
 * Hosted only. A speaking engagement is booked on the organiser's site and has
 * no page here, and a draft has no page at all: both are a 404.
 */
export default async function EventPage({ params }: Params) {
  const { slug } = await params
  const event = await getHostedEventBySlug(slug)
  if (!event) notFound()

  const [settings, counts] = await Promise.all([getSiteSettings(), confirmedCounts([event.id])])
  const state = rsvpState(event, counts.get(event.id) ?? 0)
  const where = eventWhere(event)

  return (
    <>
      <SiteHeader tone="dark" pathname={`/events/${event.slug}`} />
      <main id="main" className="pt-36 pb-16 md:pt-48">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="flex flex-col gap-8 lg:col-span-7">
            <NextLink href="/events" className="font-body text-sm text-text-muted hover:text-text">
              ← All events
            </NextLink>
            <div className="flex flex-col gap-6">
              <Eyebrow tone="sage">Network event</Eyebrow>
              <Heading level={1} size="2xl">
                {event.title}
              </Heading>
              <dl className="flex flex-col gap-1 font-body text-lead">
                <div>
                  <dt className="sr-only">When</dt>
                  <dd>
                    <time dateTime={event.startsAt}>{formatEventWhen(event)}</time>
                  </dd>
                </div>
                {where ? (
                  <div>
                    <dt className="sr-only">Where</dt>
                    <dd className="text-text-muted">{where}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            {event.image ? (
              <PayloadImage
                media={event.image}
                sizes="(min-width: 64rem) 58vw, 100vw"
                className="h-auto w-full rounded-photo"
              />
            ) : null}

            {event.summary ? <Text size="lead">{event.summary}</Text> : null}
            {event.description ? (
              <Paragraphs text={event.description} className="text-lg leading-relaxed" />
            ) : null}

            {(event.speakers ?? []).length > 0 ? (
              <section aria-labelledby="speakers-heading" className="flex flex-col gap-3">
                <Heading level={2} size="md" id="speakers-heading">
                  Speaking
                </Heading>
                <ul className="flex flex-col gap-1 font-body text-base">
                  {(event.speakers ?? []).map((speaker) => (
                    <li key={speaker.id ?? speaker.name}>
                      <span className="font-medium">{speaker.name}</span>
                      <span className="text-text-muted"> · {ROLE_LABELS[speaker.role]}</span>
                    </li>
                  ))}
                </ul>
                <Text size="sm" tone="muted">
                  {event.sessionTitle ? `“${event.sessionTitle}”` : 'Topic to be confirmed'}
                </Text>
              </section>
            ) : null}
          </div>

          <aside className="lg:col-span-5">
            <div className="flex flex-col gap-6 rounded-frame bg-surface-raised p-6 md:p-8 lg:sticky lg:top-8">
              <RsvpPanel
                event={event}
                state={state}
                contactEmail={settings.contactEmail ?? null}
                siteKey={turnstileConfig()?.siteKey ?? null}
                // Minted per request, as on the sign-up page.
                dwellToken={mintDwellToken()}
              />
            </div>
          </aside>
        </Container>
      </main>
    </>
  )
}

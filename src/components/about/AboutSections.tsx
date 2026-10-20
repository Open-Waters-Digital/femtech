import { Button } from '@/components/primitives/Button'
import { Container } from '@/components/primitives/Container'
import { Eyebrow } from '@/components/primitives/Eyebrow'
import { Heading } from '@/components/primitives/Heading'
import { Paragraphs } from '@/components/primitives/Paragraphs'
import { PayloadImage } from '@/components/primitives/PayloadImage'
import { Section } from '@/components/primitives/Section'
import { Sparkle } from '@/components/primitives/Sparkle'
import { SplitText } from '@/components/primitives/SplitText'
import type { About } from '@/payload-types'

/**
 * The about page, band by band.
 *
 * After luxury-gardens' about page: large Zodiak statements given a screen's
 * worth of room, a label set against its copy, and one dark band for contrast.
 * Every band is a section with its own heading, so the outline reads as the
 * page does: mission, why, what we do, what we stand for, the founder, join.
 * The two large statements fade in word by word, as the home page's do.
 */

/** The opening band, on the sage the Webflow about page used. */
export function AboutHero({ about }: { about: About }) {
  return (
    <section
      aria-labelledby="about-title"
      className="ground-dark flex min-h-[90svh] items-end bg-surface-sage pt-36 pb-16 text-text-inverse md:pb-24"
    >
      <Container className="grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="flex flex-col gap-6 lg:col-span-9">
          <Eyebrow tone="inverse">{about.heroEyebrow}</Eyebrow>
          <Heading level={1} size="2xl" id="about-title">
            {about.heroTitle}
          </Heading>
        </div>
        <Paragraphs
          text={about.heroLead}
          className="text-lead leading-relaxed lg:col-span-6 lg:col-start-7"
        />
      </Container>
    </section>
  )
}

/** The mission as a statement, its label beside it. */
export function Mission({ about }: { about: About }) {
  return (
    <Section aria-labelledby="mission-label">
      <Container className="grid gap-8 lg:grid-cols-12">
        <h2
          id="mission-label"
          className="font-display text-2xl text-text-sage lg:col-span-4 lg:pt-3"
        >
          {about.missionLabel}
        </h2>
        <p
          data-reveal="pending"
          className="font-display text-4xl leading-tight text-balance lg:col-span-8"
        >
          <SplitText text={about.mission} by="words" />
        </p>
      </Container>
    </Section>
  )
}

/** Why we exist: a hairline down into a centred statement, then the case for it. */
export function WhyWeExist({ about }: { about: About }) {
  return (
    <Section aria-labelledby="why-label" className="pt-0 md:pt-0">
      <Container className="flex flex-col items-center gap-10 text-center">
        <span aria-hidden="true" className="h-24 w-px bg-line-strong" />
        <Eyebrow tone="sage">
          <span id="why-label">{about.whyLabel}</span>
        </Eyebrow>
        <p
          data-reveal="pending"
          className="max-w-[18ch] font-display text-5xl leading-tight tracking-tight text-balance"
        >
          <SplitText text={about.whyStatement} by="words" />
        </p>
      </Container>
      <Container width="content" className="mt-16 md:mt-24">
        <Paragraphs
          text={about.whyBody}
          className="mx-auto max-w-statement text-lead leading-relaxed text-text-muted md:columns-2 md:gap-16 [&>p]:break-inside-avoid"
        />
      </Container>
    </Section>
  )
}

/** What we do: numbered rows, the label in Zodiak against its copy. */
export function WhatWeDo({ about }: { about: About }) {
  const rows = about.doRows ?? []
  return (
    <Section tone="sunken" aria-labelledby="do-title">
      <Container>
        <Heading level={2} size="2xl" id="do-title">
          {about.doLabel}
        </Heading>
        <ol className="mt-12 md:mt-20">
          {rows.map((row, index) => (
            <li
              key={row.id ?? row.title}
              className="grid gap-3 border-t border-line-strong py-8 md:grid-cols-12 md:gap-8 md:py-10"
            >
              <span aria-hidden="true" className="text-sm text-text-subtle md:col-span-1 md:pt-2">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display text-3xl leading-snug md:col-span-5">{row.title}</h3>
              <p className="text-lead leading-relaxed text-text-muted md:col-span-6 md:pt-1">
                {row.body}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  )
}

/** What we stand for: the one dark band. */
export function Values({ about }: { about: About }) {
  const values = about.values ?? []
  return (
    <Section tone="inverse" aria-labelledby="values-title">
      <Container>
        <Heading level={2} size="2xl" id="values-title" className="max-w-[12ch]">
          {about.valuesLabel}
        </Heading>
        <ul className="mt-12 grid gap-x-12 gap-y-14 md:mt-20 md:grid-cols-2 lg:grid-cols-3">
          {values.map((value) => (
            <li
              key={value.id ?? value.title}
              className="flex flex-col gap-4 border-t border-line-inverse pt-6"
            >
              <Sparkle className="size-4 text-ornament" />
              <h3 className="font-display text-3xl leading-snug">{value.title}</h3>
              <p className="text-lead leading-relaxed text-text-inverse-muted">{value.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}

/** The founder: the photograph held in view beside the biography. */
export function Founder({ about }: { about: About }) {
  const sections = about.founderSections ?? []
  return (
    <Section aria-labelledby="founder-name">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <div className="relative aspect-4/5 overflow-hidden rounded-photo bg-surface-sunken lg:sticky lg:top-8">
            <PayloadImage media={about.founderImage} fill sizes="(min-width: 64rem) 40vw, 100vw" />
          </div>
        </div>
        <div className="flex flex-col gap-10 lg:col-span-6 lg:col-start-7">
          <div className="flex flex-col gap-4">
            <Eyebrow tone="sage">{about.founderEyebrow}</Eyebrow>
            <Heading level={2} size="2xl" id="founder-name">
              {about.founderName}
            </Heading>
            <p className="text-lead text-text-subtle">{about.founderRole}</p>
          </div>
          <Paragraphs text={about.founderBio} className="text-lg leading-relaxed text-text-muted" />
          {sections.map((section) => (
            <div
              key={section.id ?? section.heading}
              className="flex flex-col gap-4 border-t border-line pt-8"
            >
              <Heading level={3} size="md">
                {section.heading}
              </Heading>
              <Paragraphs text={section.body} className="text-lg leading-relaxed text-text-muted" />
            </div>
          ))}
          {about.founderLinkedIn ? (
            <div>
              <Button
                href={about.founderLinkedIn}
                variant="secondary"
                rel="noopener noreferrer"
                target="_blank"
              >
                Connect on LinkedIn
              </Button>
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  )
}

/** The invitation, on the sage again, so the page ends where it began. */
export function Join({ about }: { about: About }) {
  return (
    <Section tone="sage" aria-labelledby="join-title">
      <Container width="statement" className="flex flex-col items-center gap-8 text-center">
        <Heading level={2} size="2xl" id="join-title">
          {about.joinTitle}
        </Heading>
        <p className="max-w-measure text-lead leading-relaxed text-balance">{about.joinBody}</p>
        <Button href="/sign-up" surface="inverse" size="lg">
          {about.joinCtaLabel}
        </Button>
      </Container>
    </Section>
  )
}

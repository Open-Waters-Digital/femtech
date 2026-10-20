import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { SiteHeader } from '@/components/layout/SiteHeader'
import { Button } from '@/components/primitives/Button'
import { Container } from '@/components/primitives/Container'
import { Eyebrow } from '@/components/primitives/Eyebrow'
import { Field } from '@/components/primitives/Field'
import { Heading } from '@/components/primitives/Heading'
import { Paragraphs } from '@/components/primitives/Paragraphs'
import { RollingLabel } from '@/components/primitives/RollingLabel'
import { Section } from '@/components/primitives/Section'
import { Sparkle } from '@/components/primitives/Sparkle'
import { SplitText } from '@/components/primitives/SplitText'
import { Text } from '@/components/primitives/Text'

/**
 * The living showcase: every token and every primitive, with every variant,
 * size and state. A component is not done until it is here (AGENTS.md).
 *
 * Swatch classes are written out in full: Tailwind only generates classes it
 * finds as literal text.
 */
export const metadata: Metadata = {
  title: 'Design system',
  robots: { index: false, follow: false },
}

const SWATCHES = [
  { name: 'surface', className: 'bg-surface' },
  { name: 'surface-sunken', className: 'bg-surface-sunken' },
  { name: 'surface-raised', className: 'bg-surface-raised' },
  { name: 'surface-inverse', className: 'bg-surface-inverse' },
  { name: 'surface-sage', className: 'bg-surface-sage' },
  { name: 'text', className: 'bg-text' },
  { name: 'text-muted', className: 'bg-text-muted' },
  { name: 'text-subtle', className: 'bg-text-subtle' },
  { name: 'text-inverse-muted', className: 'bg-text-inverse-muted' },
  { name: 'line', className: 'bg-line' },
  { name: 'line-strong', className: 'bg-line-strong' },
  { name: 'line-control', className: 'bg-line-control' },
  { name: 'ornament', className: 'bg-ornament' },
  { name: 'danger', className: 'bg-danger' },
  { name: 'danger-soft', className: 'bg-danger-soft' },
  { name: 'success', className: 'bg-success' },
] as const

function ShowcaseSection({
  title,
  path,
  children,
}: {
  title: string
  path: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-6 border-t border-line py-12">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-3xl">{title}</h2>
        <code className="text-sm text-text-subtle">{path}</code>
      </div>
      {children}
    </section>
  )
}

function Row({ axis, children }: { axis: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs text-text-subtle">{axis}</span>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  )
}

export default function DesignSystemPage() {
  return (
    <>
      <SiteHeader tone="dark" pathname="/design-system" />
      <main id="main" className="pt-36 pb-16">
        <Container>
          <Heading level={1} size="2xl">
            Design system
          </Heading>
          <Text size="lead" className="mt-4 max-w-measure">
            Tokens live in src/styles/tokens.css and recipes in src/styles/variants.ts.
          </Text>

          <ShowcaseSection title="Colour" path="src/styles/tokens.css">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
              {SWATCHES.map((swatch) => (
                <div key={swatch.name} className="flex flex-col gap-2">
                  <div className={`h-16 rounded-frame border border-line ${swatch.className}`} />
                  <code className="text-xs">{swatch.name}</code>
                </div>
              ))}
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="Type" path="--font-display / --font-body">
            <p className="wordmark text-6xl">femtech</p>
            <p className="font-display text-5xl">text-5xl Zodiak</p>
            <p className="font-display text-4xl">text-4xl Zodiak</p>
            <p className="font-display text-3xl">text-3xl Zodiak</p>
            <p className="font-display text-2xl">text-2xl Zodiak</p>
            <p className="text-3xl">text-3xl Cabinet Grotesk, the home page statements</p>
            <p className="text-lead">text-lead Cabinet Grotesk</p>
            <p className="text-lg">text-lg Cabinet Grotesk</p>
            <p className="text-base">text-base Cabinet Grotesk</p>
            <p className="text-sm">text-sm Cabinet Grotesk</p>
          </ShowcaseSection>

          <ShowcaseSection title="Heading" path="@/components/primitives/Heading">
            <Row axis="size (face display)">
              <div className="flex flex-col gap-4">
                <Heading level={2} size="display">
                  display
                </Heading>
                <Heading level={2} size="2xl">
                  2xl
                </Heading>
                <Heading level={2} size="xl">
                  xl
                </Heading>
                <Heading level={2} size="lg">
                  lg
                </Heading>
                <Heading level={2} size="md">
                  md
                </Heading>
                <Heading level={2} size="sm">
                  sm
                </Heading>
              </div>
            </Row>
            <Row axis="face body">
              <Heading level={3} size="md" face="body">
                A heading that labels
              </Heading>
            </Row>
          </ShowcaseSection>

          <ShowcaseSection title="Text and Eyebrow" path="@/components/primitives/Text, Eyebrow">
            <Row axis="size">
              <div className="flex flex-col gap-3">
                <Text size="statement" tone="default">
                  statement
                </Text>
                <Text size="lead">lead</Text>
                <Text size="lg">lg</Text>
                <Text size="base">base</Text>
                <Text size="sm">sm</Text>
              </div>
            </Row>
            <Row axis="tone (on surface)">
              <Text tone="default">default</Text>
              <Text tone="muted">muted</Text>
              <Text tone="subtle">subtle</Text>
              <Text tone="sage">sage</Text>
              <Text tone="danger">danger</Text>
            </Row>
            <Row axis="eyebrow">
              <Eyebrow>Coming soon</Eyebrow>
              <Eyebrow tone="sage">Meet our founder</Eyebrow>
            </Row>
            <Row axis="Paragraphs (a CMS textarea)">
              <Paragraphs
                text={'First paragraph.\n\nSecond paragraph, after a blank line.'}
                className="text-lg text-text-muted"
              />
            </Row>
          </ShowcaseSection>

          <ShowcaseSection title="Button" path="@/components/primitives/Button">
            <Row axis="variant">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="link">Link</Button>
            </Row>
            <Row axis="size">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Row>
            <Row axis="state">
              <Button disabled>Disabled</Button>
              <Button href="/sign-up">As a link</Button>
            </Row>
          </ShowcaseSection>
        </Container>

        <Section tone="inverse" className="mt-4">
          <Container className="flex flex-col gap-6">
            <Row axis="Button, surface inverse (on ink)">
              <Button surface="inverse">Primary</Button>
              <Button surface="inverse" variant="secondary">
                Secondary
              </Button>
              <Button surface="inverse" variant="link">
                Link
              </Button>
            </Row>
            <Row axis="Text tones on ink">
              <Text tone="inverse">inverse</Text>
              <Text tone="inverse-muted">inverse-muted</Text>
            </Row>
          </Container>
        </Section>
        <Section tone="sage">
          <Container className="flex flex-col gap-6">
            <Row axis="Button, surface inverse (on sage)">
              <Button surface="inverse">Primary</Button>
              <Button surface="inverse" variant="secondary">
                Secondary
              </Button>
            </Row>
            <Row axis="Section tones">
              <Text tone="inverse">default · sunken · inverse · sage</Text>
            </Row>
          </Container>
        </Section>

        <Container>
          <ShowcaseSection title="Field" path="@/components/primitives/Field">
            <div className="grid max-w-content gap-6 md:grid-cols-3">
              <Field name="showcase-default" label="Default" required>
                {(props) => <input {...props} type="text" />}
              </Field>
              <Field
                name="showcase-hint"
                label="With hint, optional"
                hint="Guidance before anything goes wrong."
              >
                {(props) => <input {...props} type="text" />}
              </Field>
              <Field
                name="showcase-invalid"
                label="Invalid"
                required
                error="Please tell us your first name."
              >
                {(props) => <input {...props} type="text" />}
              </Field>
            </div>
          </ShowcaseSection>

          <ShowcaseSection
            title="Motion: RollingLabel, SplitText, reveal"
            path="@/components/primitives/RollingLabel, SplitText; styles/components.css"
          >
            <Row axis="RollingLabel by chars (nav link): hover it">
              <a href="#motion" className="roll-host flex min-h-11 items-center font-medium">
                <RollingLabel text="About Us" by="chars" />
              </a>
            </Row>
            <Row axis="RollingLabel by words (every Button): hover it">
              <a href="#motion" className="roll-host flex min-h-11 items-center font-medium">
                <RollingLabel text="Join the network" by="words" />
              </a>
            </Row>
            <Row axis="SplitText by words inside data-reveal: fades in word by word on entering the screen">
              <p data-reveal="pending" className="max-w-measure text-3xl">
                <SplitText
                  text="Women supporting women across every stage of their careers."
                  by="words"
                />
              </p>
            </Row>
            <Row axis="Home only, not shown here">
              <Text size="sm">
                The opening on load (intro-*), the hero receding (hero-recede) and the pinned
                photographs (coming-soon-*) need the home page around them.
              </Text>
            </Row>
          </ShowcaseSection>

          <ShowcaseSection title="Sparkle" path="@/components/primitives/Sparkle">
            <Row axis="size and colour follow the text">
              <Sparkle className="size-3" />
              <Sparkle className="size-6 text-ornament" />
              <Sparkle className="size-12 text-text-sage" />
            </Row>
          </ShowcaseSection>
        </Container>
      </main>
    </>
  )
}

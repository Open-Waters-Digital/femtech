import type { Metadata } from 'next'

import { SiteHeader } from '@/components/layout/SiteHeader'
import { Container } from '@/components/primitives/Container'
import { Eyebrow } from '@/components/primitives/Eyebrow'
import { Heading } from '@/components/primitives/Heading'
import { Paragraphs } from '@/components/primitives/Paragraphs'
import { Text } from '@/components/primitives/Text'
import { SignupForm } from '@/components/signup/SignupForm'
import { getSiteSettings } from '@/lib/content'
import { mintDwellToken } from '@/lib/dwell-token'
import { linkedInUrl } from '@/lib/social'

export const metadata: Metadata = {
  title: 'Sign Up',
  description:
    'Become a member of FemTech Healthcare Network, free: the global community of women shaping the future of healthcare technology.',
  alternates: { canonical: '/sign-up' },
}

/**
 * The sign-up page: what membership means on one side, the form on the other.
 * On a phone the copy comes first and the form after it, in reading order.
 *
 * Every piece of copy is from site settings, and a section whose content an
 * editor has emptied is not drawn at all, heading included.
 */
export default async function SignUpPage() {
  const settings = await getSiteSettings()
  const benefits = settings.signupBenefits ?? []

  return (
    <>
      <SiteHeader tone="dark" pathname="/sign-up" />
      <main id="main" className="pt-36 pb-16 md:pt-48">
        <Container className="grid gap-16 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-12 lg:col-span-5">
            <div className="flex flex-col gap-6">
              {settings.signupEyebrow ? <Eyebrow>{settings.signupEyebrow}</Eyebrow> : null}
              <Heading level={1} size="2xl">
                {settings.signupTitle}
              </Heading>
              {settings.signupLead ? <Text size="lead">{settings.signupLead}</Text> : null}
            </div>

            {benefits.length > 0 ? (
              <section aria-labelledby="membership-heading" className="flex flex-col gap-4">
                <Heading level={2} size="md" id="membership-heading">
                  {settings.signupBenefitsHeading || 'What membership means'}
                </Heading>
                {settings.signupBenefitsIntro ? <Text>{settings.signupBenefitsIntro}</Text> : null}
                <ul className="flex flex-col gap-3 border-l border-line pl-5">
                  {benefits.map((benefit) => (
                    <li
                      key={benefit.id ?? benefit.title}
                      className="font-body text-base leading-relaxed text-text-muted"
                    >
                      <strong className="font-medium text-text">{benefit.title}:</strong>{' '}
                      {benefit.description}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {settings.signupComingSoonBody ? (
              <section aria-labelledby="coming-soon-heading" className="flex flex-col gap-4">
                <Heading level={2} size="md" id="coming-soon-heading">
                  {settings.signupComingSoonHeading || 'Coming soon'}
                </Heading>
                <Paragraphs
                  text={settings.signupComingSoonBody}
                  className="text-base leading-relaxed text-text-muted"
                />
              </section>
            ) : null}
          </div>

          <section
            aria-labelledby={settings.signupFormHeading ? 'form-heading' : undefined}
            className="flex flex-col gap-8 lg:col-span-7"
          >
            {settings.signupFormHeading ? (
              <Heading level={2} size="lg" id="form-heading">
                {settings.signupFormHeading}
              </Heading>
            ) : null}
            {/* Minted here, per request, so the form works without JavaScript:
                a native post carries it in a hidden field. */}
            <SignupForm
              thanks={{
                heading: settings.signupThanksHeading || 'You’re signed up',
                message: settings.signupThanks,
                linkedIn: linkedInUrl(settings.social),
              }}
              initialToken={mintDwellToken()}
            />
          </section>
        </Container>
      </main>
    </>
  )
}

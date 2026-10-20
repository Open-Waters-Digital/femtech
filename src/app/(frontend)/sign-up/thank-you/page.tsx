import type { Metadata } from 'next'

import { SiteHeader } from '@/components/layout/SiteHeader'
import { Button } from '@/components/primitives/Button'
import { Container } from '@/components/primitives/Container'
import { SignupThanks } from '@/components/signup/SignupThanks'
import { getSiteSettings } from '@/lib/content'
import { linkedInUrl } from '@/lib/social'

/** Where a sign-up sent without JavaScript lands. The enhanced form shows the same words in place. */
export const metadata: Metadata = {
  title: 'Thank you',
  robots: { index: false, follow: false },
}

export default async function ThankYouPage() {
  const settings = await getSiteSettings()
  return (
    <>
      <SiteHeader tone="dark" pathname="/sign-up/thank-you" />
      <main id="main" className="pt-36 pb-16 md:pt-48">
        <Container width="statement" className="flex flex-col items-start gap-10">
          <SignupThanks
            headingLevel={1}
            content={{
              heading: settings.signupThanksHeading || 'You’re signed up',
              message: settings.signupThanks,
              linkedIn: linkedInUrl(settings.social),
            }}
          />
          <Button href="/" variant="secondary">
            Back to the home page
          </Button>
        </Container>
      </main>
    </>
  )
}

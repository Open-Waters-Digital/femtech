import type { Metadata } from 'next'

import { SiteHeader } from '@/components/layout/SiteHeader'
import { Container } from '@/components/primitives/Container'
import { Heading } from '@/components/primitives/Heading'
import { Text } from '@/components/primitives/Text'
import { SignupForm } from '@/components/signup/SignupForm'
import { getSiteSettings } from '@/lib/content'
import { mintDwellToken } from '@/lib/dwell-token'

export const metadata: Metadata = {
  title: 'Sign Up',
  description:
    'Join FemTech Healthcare Network, the global community for women shaping the future of healthcare technology.',
  alternates: { canonical: '/sign-up' },
}

export default async function SignUpPage() {
  const settings = await getSiteSettings()
  return (
    <>
      <SiteHeader tone="dark" pathname="/sign-up" />
      <main id="main" className="pt-36 pb-16 md:pt-48">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <Heading level={1} size="2xl">
              {settings.signupTitle}
            </Heading>
            {settings.signupLead ? <Text size="lead">{settings.signupLead}</Text> : null}
          </div>
          <div className="lg:col-span-7">
            {/* Minted here, per request, so the form works without JavaScript:
                a native post carries it in a hidden field. */}
            <SignupForm thanks={settings.signupThanks} initialToken={mintDwellToken()} />
          </div>
        </Container>
      </main>
    </>
  )
}

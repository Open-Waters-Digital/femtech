import type { Metadata } from 'next'

import { SiteHeader } from '@/components/layout/SiteHeader'
import { Button } from '@/components/primitives/Button'
import { Container } from '@/components/primitives/Container'
import { Heading } from '@/components/primitives/Heading'
import { Text } from '@/components/primitives/Text'

/**
 * Where a sign-up sent without JavaScript lands when it was not accepted. The
 * reason is a fixed word in the query, never anything the visitor typed. Going
 * back restores what they entered in every browser that matters.
 */
export const metadata: Metadata = {
  title: 'Not sent',
  robots: { index: false, follow: false },
}

const REASONS = {
  check: 'Some details were missing or not quite right. Please go back and check the form.',
  busy: 'Several sign-ups arrived from your connection in quick succession. Please wait a few minutes and try again.',
  expired: 'The page had been open a while. Please go back and send it again.',
  error: 'Something went wrong on our side. Please try again in a moment.',
} as const

export default async function NotSentPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  // Own keys only: `?reason=toString` must not reach Object.prototype.
  const message =
    reason && Object.hasOwn(REASONS, reason)
      ? REASONS[reason as keyof typeof REASONS]
      : REASONS.error
  return (
    <>
      <SiteHeader tone="dark" pathname="/sign-up/not-sent" />
      <main id="main" className="pt-36 pb-16 md:pt-48">
        <Container width="statement" className="flex flex-col items-start gap-6">
          <Heading level={1} size="2xl">
            Not signed up yet
          </Heading>
          <Text size="lead">{message}</Text>
          <Button href="/sign-up" variant="secondary">
            Back to the form
          </Button>
        </Container>
      </main>
    </>
  )
}

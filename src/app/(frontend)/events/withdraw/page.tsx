import configPromise from '@payload-config'
import type { Metadata } from 'next'
import NextLink from 'next/link'
import { getPayload } from 'payload'

import { SiteHeader } from '@/components/layout/SiteHeader'
import { Button } from '@/components/primitives/Button'
import { Container } from '@/components/primitives/Container'
import { Heading } from '@/components/primitives/Heading'
import { Text } from '@/components/primitives/Text'
import { formatEventWhen } from '@/lib/events/format'
import { readWithdrawal } from '@/lib/events/withdraw'

/**
 * Where the withdraw link in an RSVP confirmation lands. Reading only: the
 * button posts to /events/withdraw/confirm, which does the one write and sends
 * the visitor back here, where the same token now reads as withdrawn.
 *
 * A static segment, so it wins over /events/[slug]; `withdraw` is also refused
 * as an event slug (lib/events/slug.ts).
 */
export const metadata: Metadata = {
  title: 'Withdraw from an event',
  robots: { index: false, follow: false },
}

type Props = { searchParams: Promise<{ token?: string | string[] }> }

export default async function WithdrawPage({ searchParams }: Props) {
  const { token: raw } = await searchParams
  const token = typeof raw === 'string' ? raw : null
  const payload = await getPayload({ config: await configPromise })
  const withdrawal = await readWithdrawal(payload, token)

  return (
    <>
      <SiteHeader tone="dark" pathname="/events/withdraw" />
      <main id="main" className="pt-36 pb-16 md:pt-48">
        <Container width="statement" className="flex flex-col items-start gap-6">
          {withdrawal.state === 'invalid' ? (
            <>
              <Heading level={1} size="xl">
                This link is not valid
              </Heading>
              <Text size="lead">
                It may have been copied only in part. Open the link from your confirmation email
                again, or reply to that email and we’ll withdraw your place for you.
              </Text>
            </>
          ) : (
            <>
              <Heading level={1} size="xl">
                {withdrawal.state === 'withdrawn'
                  ? 'You’ve withdrawn'
                  : withdrawal.state === 'past'
                    ? 'This event has taken place'
                    : 'Withdraw your place?'}
              </Heading>
              <div className="flex flex-col gap-1">
                <Text size="lead">{withdrawal.event.title}</Text>
                <Text tone="muted">
                  <time dateTime={withdrawal.event.startsAt}>
                    {formatEventWhen(withdrawal.event)}
                  </time>
                </Text>
              </div>

              {withdrawal.state === 'confirmed' ? (
                <>
                  <Text>
                    Your place will be freed for someone else. You can RSVP again later if places
                    remain.
                  </Text>
                  {/* A plain form, so it works without JavaScript. */}
                  <form action="/events/withdraw/confirm" method="post">
                    <input type="hidden" name="token" value={token ?? ''} />
                    <Button type="submit">Withdraw</Button>
                  </form>
                </>
              ) : withdrawal.state === 'withdrawn' ? (
                <Text>Your place has been freed. Thank you for letting us know.</Text>
              ) : (
                <Text>There is no place left to withdraw.</Text>
              )}
            </>
          )}

          <NextLink href="/events" className="font-body text-base underline underline-offset-4">
            All events
          </NextLink>
        </Container>
      </main>
    </>
  )
}

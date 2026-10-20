import type { Metadata } from 'next'

import { SiteHeader } from '@/components/layout/SiteHeader'
import { Button } from '@/components/primitives/Button'
import { Container } from '@/components/primitives/Container'
import { Heading } from '@/components/primitives/Heading'
import { Text } from '@/components/primitives/Text'

export const metadata: Metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <>
      <SiteHeader tone="dark" pathname="/404" />
      <main id="main" className="pt-36 pb-16 md:pt-48">
        <Container width="statement" className="flex flex-col items-start gap-6">
          <Heading level={1} size="2xl">
            Page not found
          </Heading>
          <Text size="lead">That page does not exist, or it has moved.</Text>
          <Button href="/" variant="secondary">
            Back to the home page
          </Button>
        </Container>
      </main>
    </>
  )
}

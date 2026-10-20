import type { Ref } from 'react'

import { Heading } from '@/components/primitives/Heading'
import { Paragraphs } from '@/components/primitives/Paragraphs'
import { SmartLink } from '@/components/primitives/SmartLink'
import { Text } from '@/components/primitives/Text'

export type SignupThanksContent = {
  heading: string
  message: string
  /** The network's LinkedIn profile. Without one, the invitation is not shown. */
  linkedIn: string | null
}

/**
 * What a new member sees: in place of the form with JavaScript, and on
 * /sign-up/thank-you without it. One component, so the two cannot drift apart.
 *
 * No hooks, so the server page can render it too. The form passes `headingRef`
 * to move focus to the heading, so a screen reader announces the confirmation.
 */
export function SignupThanks({
  content,
  headingLevel = 2,
  headingRef,
}: {
  content: SignupThanksContent
  /** 1 on the thank-you page, where it is the page's heading. */
  headingLevel?: 1 | 2
  headingRef?: Ref<HTMLHeadingElement>
}) {
  return (
    <div className="flex flex-col gap-6">
      <Heading
        level={headingLevel}
        size={headingLevel === 1 ? '2xl' : 'lg'}
        tabIndex={-1}
        ref={headingRef}
      >
        {content.heading}
      </Heading>
      <Paragraphs text={content.message} className="text-lead leading-relaxed text-text" />
      {content.linkedIn ? (
        <Text size="lead">
          In the meantime, follow us on{' '}
          <SmartLink href={content.linkedIn} className="underline underline-offset-4">
            LinkedIn
          </SmartLink>{' '}
          to stay connected.
        </Text>
      ) : null}
    </div>
  )
}

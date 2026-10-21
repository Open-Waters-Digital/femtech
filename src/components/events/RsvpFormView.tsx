import type { FormEventHandler, Ref } from 'react'

import { Button } from '@/components/primitives/Button'
import { Field } from '@/components/primitives/Field'
import { Heading } from '@/components/primitives/Heading'
import { Text } from '@/components/primitives/Text'
import type { RsvpFieldErrors } from '@/lib/events/rsvp-schema'
import { SIGNUP_LIMITS } from '@/lib/signup/schema'

export type RsvpStatus =
  | { kind: 'editing' }
  | { kind: 'sending' }
  | { kind: 'confirmed'; email: string }
  | { kind: 'failed'; message: string }

/**
 * The RSVP form as it looks in each state, with no state of its own: `RsvpForm`
 * drives it in the page, and the showcase draws every state from it directly.
 *
 * The Turnstile widget mounts into `challengeRef`. Without a ref (the
 * showcase), a placeholder of the widget's size stands in.
 */
export function RsvpFormView({
  status,
  errors = {},
  dwellToken,
  onSubmit,
  challengeRef,
  confirmedHeadingRef,
}: {
  status: RsvpStatus
  errors?: RsvpFieldErrors
  dwellToken: string
  onSubmit?: FormEventHandler<HTMLFormElement>
  challengeRef?: Ref<HTMLDivElement>
  confirmedHeadingRef?: Ref<HTMLHeadingElement>
}) {
  if (status.kind === 'confirmed') {
    return (
      <div role="status" className="flex flex-col gap-3">
        <Heading level={3} size="md" tabIndex={-1} ref={confirmedHeadingRef}>
          You’re booked
        </Heading>
        <Text>
          We’ve sent the details to {status.email}, with a link to withdraw if you can’t make it.
        </Text>
      </div>
    )
  }

  const sending = status.kind === 'sending'

  return (
    <form
      action="#"
      method="post"
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-5"
      aria-label="RSVP"
    >
      <Field name="firstName" label="First name" required error={errors.firstName}>
        {(props) => (
          <input {...props} type="text" autoComplete="given-name" maxLength={SIGNUP_LIMITS.name} />
        )}
      </Field>
      <Field name="lastName" label="Last name" required error={errors.lastName}>
        {(props) => (
          <input {...props} type="text" autoComplete="family-name" maxLength={SIGNUP_LIMITS.name} />
        )}
      </Field>
      <Field name="email" label="Email address" required error={errors.email}>
        {(props) => (
          <input
            {...props}
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={SIGNUP_LIMITS.email}
          />
        )}
      </Field>

      {/* Honeypot, as on the sign-up form: off-screen, out of the tab order
          and hidden from assistive technology. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="dwell" value={dwellToken} />

      {/* Turnstile draws here, and adds its own hidden cf-turnstile-response
          field to the form. Usually invisible; it shows a checkbox only when
          it needs one. */}
      {challengeRef ? (
        <div ref={challengeRef} className="min-h-0" />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-16 w-full max-w-80 items-center rounded-sm border border-line px-4 text-sm text-text-subtle"
        >
          Turnstile check
        </div>
      )}

      {status.kind === 'failed' ? (
        <p role="alert" className="font-body text-base text-danger">
          {status.message}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={sending}>
          {sending ? 'Sending…' : 'Reserve my place'}
        </Button>
      </div>
    </form>
  )
}

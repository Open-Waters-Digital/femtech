import type { FormEventHandler, Ref } from 'react'

import { PRIVACY_PATH } from '@/components/layout/navigation'
import { Button } from '@/components/primitives/Button'
import { CheckboxField, Field } from '@/components/primitives/Field'
import { SmartLink } from '@/components/primitives/SmartLink'
import { SignupThanks, type SignupThanksContent } from '@/components/signup/SignupThanks'
import { INDUSTRIES, SIGNUP_LIMITS, type SignupFieldErrors } from '@/lib/signup/schema'

export type SignupStatus =
  { kind: 'editing' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'failed'; message: string }

/**
 * The sign-up form as it looks in each state, with no state of its own:
 * `SignupForm` drives it in the page, and the showcase draws every state from
 * it directly.
 *
 * A real <form> posting to /join, so it works before JavaScript arrives or
 * without it. The Turnstile widget mounts into `challengeRef`; in the showcase,
 * `showChallengePlaceholder` draws a box of the widget's size instead.
 */
export function SignupFormView({
  status,
  errors = {},
  dwellToken,
  thanks,
  onSubmit,
  challengeRef,
  showChallengePlaceholder = false,
  thanksHeadingRef,
}: {
  status: SignupStatus
  errors?: SignupFieldErrors
  dwellToken: string
  thanks: SignupThanksContent
  onSubmit?: FormEventHandler<HTMLFormElement>
  challengeRef?: Ref<HTMLDivElement>
  showChallengePlaceholder?: boolean
  thanksHeadingRef?: Ref<HTMLHeadingElement>
}) {
  if (status.kind === 'sent') {
    return (
      <div className="rounded-frame bg-surface-raised p-8 md:p-12" role="status">
        <SignupThanks content={thanks} headingRef={thanksHeadingRef} />
      </div>
    )
  }

  const sending = status.kind === 'sending'

  return (
    <form
      action="/join"
      method="post"
      noValidate
      onSubmit={onSubmit}
      // Named for analytics' form events, and excluded from its automatic
      // capture: nothing typed here is ever recorded.
      data-form-id="signup"
      className="ph-no-capture flex flex-col gap-6"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Field name="firstName" label="First name" required error={errors.firstName}>
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="given-name"
              maxLength={SIGNUP_LIMITS.name}
            />
          )}
        </Field>
        <Field name="lastName" label="Last name" required error={errors.lastName}>
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="family-name"
              maxLength={SIGNUP_LIMITS.name}
            />
          )}
        </Field>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
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
        <Field name="phone" label="Phone number" error={errors.phone}>
          {(props) => (
            <input {...props} type="tel" autoComplete="tel" maxLength={SIGNUP_LIMITS.phone} />
          )}
        </Field>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Field name="jobTitle" label="Job title" required error={errors.jobTitle}>
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="organization-title"
              maxLength={SIGNUP_LIMITS.jobTitle}
            />
          )}
        </Field>
        <Field name="organisation" label="Organisation" error={errors.organisation}>
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="organization"
              maxLength={SIGNUP_LIMITS.organisation}
            />
          )}
        </Field>
      </div>
      <Field name="industry" label="Industry" required control="select" error={errors.industry}>
        {(props) => (
          // An empty first option, so "not chosen" is its own state rather
          // than a silent "Other". Disabled, so it cannot be chosen back.
          <select {...props} defaultValue="">
            <option value="" disabled>
              Choose your industry
            </option>
            {INDUSTRIES.map((industry) => (
              <option key={industry.value} value={industry.value}>
                {industry.label}
              </option>
            ))}
          </select>
        )}
      </Field>

      <CheckboxField
        name="emailUpdates"
        required
        error={errors.emailUpdates}
        label="I’d like to receive updates from FemTech Healthcare Network about events, membership and products. I can unsubscribe at any time."
      />

      {/* Honeypot. Off-screen rather than display:none, which some bots skip;
          out of the tab order and hidden from assistive technology, so no
          person reaches it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="dwell" value={dwellToken} />
      {/* The visit's landing page and referrer, for the sign-up's channel.
          Filled by SignupForm as it sends; empty without JavaScript, which
          counts as an unknown channel. Never stored, emailed or logged. */}
      <input type="hidden" name="ow_attribution" value="" />

      {/* Turnstile draws here, and adds its own hidden cf-turnstile-response
          field to the form. Invisible unless Cloudflare wants a tick. Without
          JavaScript nothing draws, and the sign-up still goes through. */}
      {challengeRef ? (
        <div ref={challengeRef} className="min-h-0" />
      ) : showChallengePlaceholder ? (
        <div
          aria-hidden="true"
          className="flex h-16 w-full max-w-80 items-center rounded-sm border border-line px-4 text-sm text-text-subtle"
        >
          Turnstile check
        </div>
      ) : null}

      {status.kind === 'failed' ? (
        <p role="alert" className="text-base text-danger">
          {status.message}
        </p>
      ) : null}

      <div className="flex flex-col items-start gap-4">
        <Button type="submit" size="lg" disabled={sending}>
          {sending ? 'Sending…' : 'Become a Member'}
        </Button>
        <p className="font-body text-sm text-text-muted">
          We’ll only use your details to keep you updated about FemTech Healthcare Network.
          {/* The link waits for the privacy page (delivery item 10): a link
              to a page that does not exist yet is worse than none. */}
          {PRIVACY_PATH ? (
            <>
              {' '}
              See our{' '}
              <SmartLink href={PRIVACY_PATH} className="underline underline-offset-4">
                Privacy Policy
              </SmartLink>
              .
            </>
          ) : null}
        </p>
      </div>
    </form>
  )
}

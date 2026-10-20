'use client'

import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/primitives/Button'
import { CheckboxField, Field } from '@/components/primitives/Field'
import { SmartLink } from '@/components/primitives/SmartLink'
import { SignupThanks, type SignupThanksContent } from '@/components/signup/SignupThanks'
import { PRIVACY_PATH } from '@/components/layout/navigation'
import {
  INDUSTRIES,
  SIGNUP_LIMITS,
  type SignupFieldErrors,
  signupInput,
  signupSchema,
  toFieldErrors,
} from '@/lib/signup/schema'

type Status =
  { kind: 'editing' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'failed'; message: string }

/**
 * The sign-up form.
 *
 * Its dwell token arrives from the server-rendered page, so the form needs no
 * request of its own before it can be sent.
 *
 * A real <form> posting to /join, so it works before JavaScript arrives or
 * without it: /join answers a native post with a redirect to a page. With
 * JavaScript it validates against the same schema the server uses, posts with
 * fetch, and shows the outcome in place, keeping what was typed if anything
 * goes wrong.
 */
export function SignupForm({
  thanks,
  initialToken,
}: {
  thanks: SignupThanksContent
  initialToken: string
}) {
  const [errors, setErrors] = useState<SignupFieldErrors>({})
  const [status, setStatus] = useState<Status>({ kind: 'editing' })
  // Minted by the page as it rendered. Replaced from /join/token only when the
  // server says it has expired.
  const [token, setToken] = useState(initialToken)
  const thanksHeading = useRef<HTMLHeadingElement>(null)

  const fetchToken = useCallback(async () => {
    try {
      const response = await fetch('/join/token', { cache: 'no-store' })
      const body: unknown = await response.json()
      if (body && typeof body === 'object' && 'token' in body && typeof body.token === 'string') {
        setToken(body.token)
      }
    } catch {
      // The post would carry the expired token and be refused again, so say
      // so now.
      setStatus({
        kind: 'failed',
        message:
          'The form could not be refreshed. Please reload the page; your details will need re-entering.',
      })
    }
  }, [])

  useEffect(() => {
    // Move focus to the confirmation, so a screen reader announces it rather
    // than leaving the reader on a button that no longer exists.
    if (status.kind === 'sent') thanksHeading.current?.focus()
  }, [status.kind])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    const parsed = signupSchema.safeParse(signupInput(data))
    if (!parsed.success) {
      const fields = toFieldErrors(parsed.error)
      setErrors(fields)
      // Focus the first field in error, in the order they appear.
      const first = Object.keys(fields)[0]
      if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }

    setErrors({})
    setStatus({ kind: 'sending' })
    try {
      const response = await fetch('/join', {
        method: 'POST',
        body: data,
        headers: { accept: 'application/json' },
      })
      const body: unknown = await response.json().catch(() => null)
      if (response.ok) {
        setStatus({ kind: 'sent' })
        return
      }
      if (response.status === 400 && body && typeof body === 'object' && 'fields' in body) {
        setErrors(body.fields as SignupFieldErrors)
        setStatus({ kind: 'editing' })
        return
      }
      // An expired token: fetch a fresh one so the next press works.
      if (response.status === 409) void fetchToken()
      const message =
        body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
          ? body.message
          : 'Something went wrong. Please try again in a moment.'
      setStatus({ kind: 'failed', message })
    } catch {
      setStatus({
        kind: 'failed',
        message: 'We could not reach the server. Please check your connection and try again.',
      })
    }
  }

  if (status.kind === 'sent') {
    return (
      <div className="rounded-frame bg-surface-raised p-8 md:p-12" role="status">
        <SignupThanks content={thanks} headingRef={thanksHeading} />
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
      className="flex flex-col gap-6"
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
      <input type="hidden" name="dwell" value={token} />

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

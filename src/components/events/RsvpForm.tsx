'use client'

import { formErrorShown, formSubmitted } from '@open-waters-digital/analytics/browser'
import { type FormEvent, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { type RsvpStatus, RsvpFormView } from '@/components/events/RsvpFormView'
import { useTurnstile } from '@/components/turnstile/useTurnstile'
import { formErrorTypes } from '@/lib/analytics/form-errors'
import {
  type RsvpFieldErrors,
  rsvpFieldErrors,
  rsvpInput,
  rsvpSchema,
} from '@/lib/events/rsvp-schema'

/**
 * The RSVP form's behaviour: validation in place, the Turnstile widget, the
 * post to /events/[slug]/rsvp and the answer shown without leaving the page.
 *
 * A client component for the same reason as SignupForm, and because Turnstile
 * runs only in the browser. Unlike the sign-up form it has no native-post
 * fallback: Turnstile needs JavaScript, so the page says so in a <noscript>
 * instead of offering a form that cannot succeed.
 *
 * The Turnstile script (`useTurnstile`, shared with the sign-up form) loads
 * only once the form is on screen: the site's one third-party script.
 */

/** The form's id in the analytics event list, as on its data-form-id. */
const FORM_ID = 'rsvp'

/**
 * False on the server and during hydration, true once running in the browser.
 * The form renders only then: without JavaScript there is nothing it could do,
 * and the page's <noscript> says so instead of drawing a dead button.
 */
const noSubscription = () => () => undefined
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  )
}

export function RsvpForm({
  slug,
  siteKey,
  initialToken,
}: {
  slug: string
  siteKey: string
  initialToken: string
}) {
  const hydrated = useHydrated()
  const [status, setStatus] = useState<RsvpStatus>({ kind: 'editing' })
  const [errors, setErrors] = useState<RsvpFieldErrors>({})
  const [token, setToken] = useState(initialToken)
  const confirmedHeading = useRef<HTMLHeadingElement>(null)
  const turnstile = useTurnstile(siteKey, hydrated)

  useEffect(() => {
    // Move focus to the confirmation, so a screen reader announces it.
    if (status.kind === 'confirmed') confirmedHeading.current?.focus()
  }, [status.kind])

  const resetChallenge = turnstile.reset

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    const input = rsvpInput(data)
    const parsed = rsvpSchema.safeParse(input)
    if (!parsed.success) {
      const fields = rsvpFieldErrors(parsed.error)
      setErrors(fields)
      for (const [field, type] of formErrorTypes(parsed.error, input)) {
        formErrorShown(FORM_ID, field, type)
      }
      const first = Object.keys(fields)[0]
      if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }

    setErrors({})
    setStatus({ kind: 'sending' })
    try {
      const response = await fetch(`/events/${encodeURIComponent(slug)}/rsvp`, {
        method: 'POST',
        body: data,
        headers: { accept: 'application/json' },
      })
      const body: unknown = await response.json().catch(() => null)
      const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}

      if (response.ok) {
        formSubmitted(FORM_ID)
        setStatus({ kind: 'confirmed', email: parsed.data.email })
        return
      }
      if (response.status === 400 && record.fields && typeof record.fields === 'object') {
        const fields = record.fields as RsvpFieldErrors
        for (const field of Object.keys(fields)) formErrorShown(FORM_ID, field, 'server')
        setErrors(fields)
        setStatus({ kind: 'editing' })
        return
      }
      // A Turnstile token is good for one attempt; anything but success needs a new one.
      resetChallenge()
      if (record.expired === true) await refreshDwellToken()
      setStatus({
        kind: 'failed',
        message:
          typeof record.message === 'string'
            ? record.message
            : 'Something went wrong. Please try again in a moment.',
      })
    } catch {
      resetChallenge()
      setStatus({
        kind: 'failed',
        message: 'We could not reach the server. Please check your connection and try again.',
      })
    }
  }

  async function refreshDwellToken() {
    try {
      const response = await fetch('/join/token', { cache: 'no-store' })
      const body: unknown = await response.json()
      if (body && typeof body === 'object' && 'token' in body && typeof body.token === 'string') {
        setToken(body.token)
      }
    } catch {
      // The message already shown asks them to send again; a reload fixes it.
    }
  }

  if (!hydrated) return null

  // No check, no RSVP: say so in place of the form's own state until it loads.
  const shown: RsvpStatus =
    turnstile.state === 'unavailable' && status.kind === 'editing'
      ? {
          kind: 'failed',
          message:
            'The check that keeps this form free of spam did not load. Please reload the page, or try another browser.',
        }
      : status

  return (
    <RsvpFormView
      status={shown}
      errors={errors}
      dwellToken={token}
      onSubmit={onSubmit}
      challengeRef={turnstile.containerRef}
      confirmedHeadingRef={confirmedHeading}
    />
  )
}

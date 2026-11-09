'use client'

import {
  attributionField,
  formErrorShown,
  formSubmitted,
} from '@open-waters-digital/analytics/browser'
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'

import { type SignupStatus, SignupFormView } from '@/components/signup/SignupFormView'
import type { SignupThanksContent } from '@/components/signup/SignupThanks'
import { useTurnstile } from '@/components/turnstile/useTurnstile'
import { formErrorTypes } from '@/lib/analytics/form-errors'
import {
  type SignupFieldErrors,
  signupInput,
  signupSchema,
  toFieldErrors,
} from '@/lib/signup/schema'

/** The form's id in the analytics event list, as on its data-form-id. */
const FORM_ID = 'signup'

/** How long a quick sender waits for the invisible check before going without it. */
const CHECK_WAIT_MS = 5_000

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
 *
 * With a site key it also carries a Turnstile check, which decides only
 * whether the new member is sent a welcome email. It never stops a sign-up:
 * if the check cannot load, the form goes without it. The one time it holds
 * the form back is when Cloudflare asks the visitor to tick the box, because
 * then they can.
 */
export function SignupForm({
  thanks,
  initialToken,
  siteKey,
}: {
  thanks: SignupThanksContent
  initialToken: string
  /** Turnstile's site key, or null where it is not configured (no welcome is sent). */
  siteKey: string | null
}) {
  const [errors, setErrors] = useState<SignupFieldErrors>({})
  const [status, setStatus] = useState<SignupStatus>({ kind: 'editing' })
  const turnstile = useTurnstile(siteKey)
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

    const input = signupInput(new FormData(form))
    const parsed = signupSchema.safeParse(input)
    if (!parsed.success) {
      const fields = toFieldErrors(parsed.error)
      setErrors(fields)
      for (const [field, type] of formErrorTypes(parsed.error, input)) {
        formErrorShown(FORM_ID, field, type)
      }
      // Focus the first field in error, in the order they appear.
      const first = Object.keys(fields)[0]
      if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }

    setErrors({})
    setStatus({ kind: 'sending' })

    // The invisible check takes a second or two. A visitor quicker than that
    // waits for it; one Cloudflare wants a tick from is asked; anything else
    // (blocked, broken, slow) goes without, and is simply not welcomed.
    if (siteKey && turnstile.state !== 'solved') {
      const check = await turnstile.settle(CHECK_WAIT_MS)
      if (check === 'interactive') {
        setStatus({
          kind: 'failed',
          message: 'Please complete the check above the button, then send the form again.',
        })
        return
      }
    }
    // Read after the wait, so the token the widget wrote is in it.
    const data = new FormData(form)
    // Empty when analytics is dormant or the visitor objected.
    data.set('ow_attribution', attributionField())

    try {
      const response = await fetch('/join', {
        method: 'POST',
        body: data,
        headers: { accept: 'application/json' },
      })
      const body: unknown = await response.json().catch(() => null)
      if (response.ok) {
        formSubmitted(FORM_ID)
        setStatus({ kind: 'sent' })
        return
      }
      if (response.status === 400 && body && typeof body === 'object' && 'fields' in body) {
        const fields = body.fields as SignupFieldErrors
        for (const field of Object.keys(fields)) formErrorShown(FORM_ID, field, 'server')
        setErrors(fields)
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

  return (
    <SignupFormView
      status={status}
      errors={errors}
      dwellToken={token}
      thanks={thanks}
      onSubmit={onSubmit}
      challengeRef={siteKey ? turnstile.containerRef : undefined}
      thanksHeadingRef={thanksHeading}
    />
  )
}

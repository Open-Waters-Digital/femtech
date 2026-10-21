'use client'

import { type FormEvent, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { type RsvpStatus, RsvpFormView } from '@/components/events/RsvpFormView'
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
 * The Turnstile script loads only here, only on a hosted event's page, and
 * only once the form is on screen: the site's one third-party script.
 */

type Turnstile = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      appearance?: 'always' | 'execute' | 'interaction-only'
      'response-field-name'?: string
    },
  ) => string
  reset: (widgetId?: string) => void
  remove: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

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

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/** One script tag, however many times the form mounts. */
function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
    script.addEventListener('load', () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile missing')),
    )
    script.addEventListener('error', () => reject(new Error('turnstile failed to load')))
  })
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
  const challenge = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  const confirmedHeading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!hydrated) return
    let cancelled = false
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !challenge.current || widget.current) return
        widget.current = turnstile.render(challenge.current, {
          sitekey: siteKey,
          appearance: 'interaction-only',
        })
      })
      .catch(() => {
        if (!cancelled) {
          setStatus({
            kind: 'failed',
            message:
              'The check that keeps this form free of spam did not load. Please reload the page, or try another browser.',
          })
        }
      })
    return () => {
      cancelled = true
      if (widget.current) window.turnstile?.remove(widget.current)
      widget.current = null
    }
  }, [hydrated, siteKey])

  useEffect(() => {
    // Move focus to the confirmation, so a screen reader announces it.
    if (status.kind === 'confirmed') confirmedHeading.current?.focus()
  }, [status.kind])

  const resetChallenge = () => {
    if (widget.current) window.turnstile?.reset(widget.current)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    const parsed = rsvpSchema.safeParse(rsvpInput(data))
    if (!parsed.success) {
      const fields = rsvpFieldErrors(parsed.error)
      setErrors(fields)
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
        setStatus({ kind: 'confirmed', email: parsed.data.email })
        return
      }
      if (response.status === 400 && record.fields && typeof record.fields === 'object') {
        setErrors(record.fields as RsvpFieldErrors)
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

  return (
    <RsvpFormView
      status={status}
      errors={errors}
      dwellToken={token}
      onSubmit={onSubmit}
      challengeRef={challenge}
      confirmedHeadingRef={confirmedHeading}
    />
  )
}

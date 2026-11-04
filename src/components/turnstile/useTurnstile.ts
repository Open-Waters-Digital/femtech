'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Cloudflare Turnstile in the browser, for the two forms that email the
 * address someone types: the RSVP form and the sign-up form.
 *
 * The script is the site's one third-party script. It loads only when a form
 * that needs it is on screen (or about to be), once however many forms mount,
 * and the widget draws into `containerRef`, adding its own hidden
 * `cf-turnstile-response` field to the surrounding form, so a `FormData` post
 * carries the token with no further work.
 *
 * The widget is `interaction-only`: invisible unless Cloudflare wants a click.
 *
 * States:
 *   idle         not on screen yet, or no site key
 *   ready        drawn, working on a token
 *   interactive  waiting for the visitor to tick the box
 *   solved       a token is in the form
 *   unavailable  the script did not load, or the widget errored
 */
export type TurnstileState = 'idle' | 'ready' | 'interactive' | 'solved' | 'unavailable'

type RenderOptions = {
  sitekey: string
  appearance?: 'always' | 'execute' | 'interaction-only'
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  'timeout-callback'?: () => void
  'before-interactive-callback'?: () => void
}

type Turnstile = {
  render: (container: HTMLElement, options: RenderOptions) => string
  reset: (widgetId?: string) => void
  remove: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let loading: Promise<Turnstile> | null = null

/** One script tag, however many times a form mounts. A failure can be retried. */
function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (loading) return loading
  loading = new Promise<Turnstile>((resolve, reject) => {
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
  }).catch((error: unknown) => {
    loading = null
    throw error
  })
  return loading
}

/**
 * `enabled` is false until the form's container is in the document (the RSVP
 * form renders nothing before hydration), so the widget mounts once it is.
 */
export function useTurnstile(siteKey: string | null, enabled = true) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  const [state, setStateValue] = useState<TurnstileState>('idle')
  const stateRef = useRef<TurnstileState>('idle')
  const listeners = useRef(new Set<(state: TurnstileState) => void>())

  const setState = useCallback((next: TurnstileState) => {
    stateRef.current = next
    setStateValue(next)
    for (const listener of listeners.current) listener(next)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!siteKey || !enabled || !container) return
    let cancelled = false

    const mount = () => {
      loadTurnstile()
        .then((turnstile) => {
          if (cancelled || widget.current) return
          widget.current = turnstile.render(container, {
            sitekey: siteKey,
            appearance: 'interaction-only',
            callback: () => setState('solved'),
            'expired-callback': () => setState('ready'),
            'timeout-callback': () => setState('ready'),
            'before-interactive-callback': () => setState('interactive'),
            'error-callback': () => setState('unavailable'),
          })
          setState('ready')
        })
        .catch(() => {
          if (!cancelled) setState('unavailable')
        })
    }

    // Only once the form is near the screen: on a phone the sign-up form is
    // below the fold, and most visitors to a page never reach it.
    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver === 'undefined') {
      mount()
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect()
            mount()
          }
        },
        { rootMargin: '400px 0px' },
      )
      observer.observe(container)
    }

    return () => {
      cancelled = true
      observer?.disconnect()
      if (widget.current) window.turnstile?.remove(widget.current)
      widget.current = null
    }
  }, [siteKey, enabled, setState])

  /** A token is good for one attempt: after any answer but success, get another. */
  const reset = useCallback(() => {
    if (!widget.current) return
    window.turnstile?.reset(widget.current)
    setState('ready')
  }, [setState])

  /**
   * Resolves with the state once it settles: `solved`, `interactive` (the
   * visitor has to tick the box) or `unavailable`, or with whatever it is
   * after `timeoutMs`. Lets a form that was sent quickly wait the second or two
   * an invisible check takes.
   */
  const settle = useCallback((timeoutMs: number): Promise<TurnstileState> => {
    const settled = (value: TurnstileState) =>
      value === 'solved' || value === 'interactive' || value === 'unavailable'
    if (settled(stateRef.current)) return Promise.resolve(stateRef.current)
    return new Promise((resolve) => {
      const done = (value: TurnstileState) => {
        clearTimeout(timer)
        listeners.current.delete(listener)
        resolve(value)
      }
      const listener = (value: TurnstileState) => {
        if (settled(value)) done(value)
      }
      const timer = setTimeout(() => done(stateRef.current), timeoutMs)
      listeners.current.add(listener)
    })
  }, [])

  return { containerRef, state, reset, settle }
}

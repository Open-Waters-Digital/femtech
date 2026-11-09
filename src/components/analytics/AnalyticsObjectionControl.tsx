'use client'

import { hasObjected, setAnalyticsObjection } from '@open-waters-digital/analytics/browser'
import { useSyncExternalStore } from 'react'

import { Button } from '@/components/primitives/Button'

export const OBJECT_FALLBACK = 'Don’t measure my visits'
export const WITHDRAW_FALLBACK = 'Measure my visits again'

export const STATUS = {
  measuring: 'Your visits to this site are counted anonymously, with no cookies.',
  objected: 'Your visits are not measured in this browser.',
  noScript: 'This control needs JavaScript. Without it, nothing on this site is measured.',
} as const

// The choice only changes through this button, which reloads the page, so
// there is nothing to subscribe to.
const subscribe = (): (() => void) => () => {}
const onServer = (): null => null

/**
 * The privacy page's "don't measure my visits" control, which the ICO's
 * statistical purposes exception requires beside the page's own words about
 * measurement.
 *
 * Client-side because the objection lives in the visitor's own browser, which
 * the server cannot read. The server renders it disabled, from a null
 * snapshot, with a line saying it needs JavaScript; React swaps in the stored
 * choice after hydration, so a visitor without script sees an honest,
 * unavailable control rather than a button that does nothing. Nothing is
 * stored until the visitor uses it. setAnalyticsObjection reloads the page, so
 * the next load starts with the choice already applied.
 *
 * `preview` draws a state directly, for /design-system only.
 */
export function AnalyticsObjectionControl({
  objectLabel,
  withdrawLabel,
  preview,
}: {
  objectLabel?: string | null
  withdrawLabel?: string | null
  preview?: 'measuring' | 'objected' | 'no-script'
}) {
  const stored = useSyncExternalStore(subscribe, hasObjected, onServer)
  const objected =
    preview === 'no-script'
      ? null
      : preview === 'objected'
        ? true
        : preview === 'measuring'
          ? false
          : stored

  const status = objected === null ? STATUS.noScript : objected ? STATUS.objected : STATUS.measuring

  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        type="button"
        variant="secondary"
        disabled={objected === null}
        aria-pressed={objected ?? undefined}
        onClick={() => {
          if (objected !== null && !preview) setAnalyticsObjection(!objected)
        }}
      >
        {objected ? withdrawLabel || WITHDRAW_FALLBACK : objectLabel || OBJECT_FALLBACK}
      </Button>
      <p role="status" aria-live="polite" className="font-body text-sm text-text-muted">
        {status}
      </p>
    </div>
  )
}

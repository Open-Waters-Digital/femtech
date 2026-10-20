import type { ReactNode } from 'react'

import { fieldClasses } from '@/styles/variants'

/**
 * A labelled form control with its error wiring attached. Four things have to
 * agree for a field to be usable without sight: the label's `for` and the
 * control's `id`, `aria-describedby` on the hint and error, `aria-invalid`, and
 * the error in words. Derived from one `name` here, so none can be forgotten.
 */
export function Field({
  name,
  label,
  hint,
  error,
  required = false,
  children,
}: {
  name: string
  label: string
  /** Guidance shown before anything goes wrong. Optional. */
  hint?: string
  /** The message, when the field failed. Its presence is what marks it invalid. */
  error?: string
  required?: boolean
  /** Receives the wiring; see FieldControlProps. */
  children: (props: FieldControlProps) => ReactNode
}) {
  const hintId = hint ? `${name}-hint` : undefined
  const errorId = error ? `${name}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="font-body text-base font-medium text-text">
        {label}
        {required ? null : (
          // Marking what is optional rather than what is required: "optional"
          // is the label that changes what someone does.
          <span className="text-text-subtle"> (optional)</span>
        )}
      </label>

      {hint ? (
        <p id={hintId} className="font-body text-sm text-text-subtle">
          {hint}
        </p>
      ) : null}

      {children({
        id: name,
        name,
        required,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        className: fieldClasses(error ? 'invalid' : 'default'),
      })}

      {error ? (
        // aria-live, so a message that appears after a failed submit is
        // announced rather than silently painted.
        <p id={errorId} role="alert" className="font-body text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export type FieldControlProps = {
  id: string
  name: string
  required: boolean
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
  className: string
}

import type { ReactNode } from 'react'

import {
  CHECKBOX_INPUT_CLASSES,
  type FieldControl,
  checkboxRowClasses,
  fieldClasses,
} from '@/styles/variants'

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
  control = 'input',
  children,
}: {
  name: string
  label: string
  /** Guidance shown before anything goes wrong. Optional. */
  hint?: string
  /** The message, when the field failed. Its presence is what marks it invalid. */
  error?: string
  required?: boolean
  /** `select` leaves room for, and draws, the chevron. */
  control?: FieldControl
  /** Receives the wiring; see FieldControlProps. */
  children: (props: FieldControlProps) => ReactNode
}) {
  const { hintId, errorId, describedBy } = describedByIds(name, hint, error)

  const rendered = children({
    id: name,
    name,
    required,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    className: fieldClasses(error ? 'invalid' : 'default', control),
  })

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

      {control === 'select' ? (
        // The select draws no arrow of its own (appearance-none), so one is
        // laid over its right edge in the text colour. pointer-events-none, so
        // a click on the chevron still opens the select.
        <div className="relative">
          {rendered}
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            focusable="false"
            className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-text"
          >
            <path d="M3.5 6l4.5 4.5L12.5 6" />
          </svg>
        </div>
      ) : (
        rendered
      )}

      <FieldError id={errorId} error={error} />
    </div>
  )
}

/**
 * A checkbox with its label beside it rather than above, and the same hint
 * and error wiring as `Field`. Required is not marked in the label: the
 * label is the statement being agreed to, and the error says it is needed.
 */
export function CheckboxField({
  name,
  label,
  hint,
  error,
  required = false,
  defaultChecked,
}: {
  name: string
  label: ReactNode
  hint?: string
  error?: string
  required?: boolean
  defaultChecked?: boolean
}) {
  const { hintId, errorId, describedBy } = describedByIds(name, hint, error)

  return (
    <div className="flex flex-col gap-2">
      <div className={checkboxRowClasses(error ? 'invalid' : 'default')}>
        <input
          type="checkbox"
          id={name}
          name={name}
          required={required}
          defaultChecked={defaultChecked}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={CHECKBOX_INPUT_CLASSES}
        />
        <label htmlFor={name} className="font-body text-base text-text">
          {label}
        </label>
      </div>

      {hint ? (
        <p id={hintId} className="font-body text-sm text-text-subtle">
          {hint}
        </p>
      ) : null}

      <FieldError id={errorId} error={error} />
    </div>
  )
}

function describedByIds(name: string, hint: string | undefined, error: string | undefined) {
  const hintId = hint ? `${name}-hint` : undefined
  const errorId = error ? `${name}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return { hintId, errorId, describedBy }
}

function FieldError({ id, error }: { id: string | undefined; error: string | undefined }) {
  if (!error) return null
  return (
    // role="alert", so a message that appears after a failed submit is
    // announced rather than silently painted.
    <p id={id} role="alert" className="font-body text-sm text-danger">
      {error}
    </p>
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

import type { BrowserEvents } from '@open-waters-digital/analytics/browser'
import type { z } from 'zod'

/** The error classes the event list allows on `form_error_shown`. */
export type FormErrorType = BrowserEvents['form_error_shown']['error_type']

/**
 * Each field in error, with its error class, in the order the schema reported
 * them: what the form reports with `formErrorShown` when it shows the
 * messages. Field names and classes only, never a value.
 *
 * An empty or absent value is `required` whatever rule caught it (an empty
 * email fails the email format, an unticked box fails a literal); over a limit
 * is `too_long`; anything else is `format`.
 */
export function formErrorTypes(
  error: z.ZodError,
  input: Record<string, unknown>,
): [field: string, type: FormErrorType][] {
  const seen = new Map<string, FormErrorType>()
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field !== 'string' || seen.has(field)) continue
    seen.set(field, classify(issue, input[field]))
  }
  return [...seen]
}

function classify(issue: z.core.$ZodIssue, value: unknown): FormErrorType {
  const empty =
    value === undefined ||
    value === null ||
    value === false ||
    (typeof value === 'string' && value.trim() === '')
  if (empty) return 'required'
  if (issue.code === 'too_big') return 'too_long'
  return 'format'
}

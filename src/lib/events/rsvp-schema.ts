import { z } from 'zod'

import { SIGNUP_LIMITS } from '@/lib/signup/schema'

/**
 * An RSVP, as the form sends it. One schema for the form and the route, as
 * with the sign-up form, and the same limits for the fields they share.
 */
const required = (message: string, max: number) =>
  z.string().trim().min(1, message).max(max, `Please keep this under ${max} characters.`)

export const rsvpSchema = z.object({
  firstName: required('Please tell us your first name.', SIGNUP_LIMITS.name),
  lastName: required('Please tell us your last name.', SIGNUP_LIMITS.name),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(SIGNUP_LIMITS.email, 'That email address is too long.')
    .pipe(z.email('Please enter a valid email address.')),
})

export type Rsvp = z.infer<typeof rsvpSchema>
export type RsvpField = keyof Rsvp
export type RsvpFieldErrors = Partial<Record<RsvpField, string>>

export function rsvpInput(form: FormData): Record<RsvpField, unknown> {
  const text = (name: string) => {
    const value = form.get(name)
    return typeof value === 'string' ? value : ''
  }
  return { firstName: text('firstName'), lastName: text('lastName'), email: text('email') }
}

/** The first message per field, in the form's order. */
export function rsvpFieldErrors(error: z.ZodError): RsvpFieldErrors {
  const fields: RsvpFieldErrors = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && !(field in fields)) {
      fields[field as RsvpField] = issue.message
    }
  }
  return fields
}

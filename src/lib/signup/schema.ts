import { z } from 'zod'

/**
 * A sign-up, as the form sends it. One schema, read by the form before it posts
 * and by /join before it writes, so the two cannot disagree about what is valid.
 *
 * Every field arrives as a string from FormData. The checkbox arrives as "on"
 * when ticked and not at all when not, so it is read as presence.
 */
const required = (message: string, max: number) =>
  z.string().trim().min(1, message).max(max, `Please keep this under ${max} characters.`)

export const SIGNUP_LIMITS = {
  name: 100,
  email: 254,
  phone: 40,
  message: 2000,
} as const

export const signupSchema = z.object({
  firstName: required('Please tell us your first name.', SIGNUP_LIMITS.name),
  lastName: required('Please tell us your surname.', SIGNUP_LIMITS.name),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(SIGNUP_LIMITS.email, 'That email address is too long.')
    .pipe(z.email('Please enter a valid email address.')),
  phone: z
    .string()
    .trim()
    .max(SIGNUP_LIMITS.phone, 'That phone number is too long.')
    .regex(/^[+()\d\s.-]*$/, 'Please use digits, spaces and + only.'),
  message: z
    .string()
    .trim()
    .max(
      SIGNUP_LIMITS.message,
      `Please keep your message under ${SIGNUP_LIMITS.message} characters.`,
    ),
  emailUpdates: z.boolean(),
})

export type Signup = z.infer<typeof signupSchema>

export type SignupField = keyof Signup

export type SignupFieldErrors = Partial<Record<SignupField, string>>

/** The fields from a FormData, shaped for the schema. */
export function signupInput(form: FormData): Record<SignupField, unknown> {
  const text = (name: string) => {
    const value = form.get(name)
    return typeof value === 'string' ? value : ''
  }
  return {
    firstName: text('firstName'),
    lastName: text('lastName'),
    email: text('email'),
    phone: text('phone'),
    message: text('message'),
    emailUpdates: form.get('emailUpdates') !== null,
  }
}

/** The first message per field, which is all a field has room to show. */
export function toFieldErrors(error: z.ZodError): SignupFieldErrors {
  const fields: SignupFieldErrors = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && !(field in fields)) {
      fields[field as SignupField] = issue.message
    }
  }
  return fields
}

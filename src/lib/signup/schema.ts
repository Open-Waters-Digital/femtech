import { z } from 'zod'

// No compiled validators. Zod otherwise probes `new Function` to see whether it
// may compile them; the Content Security Policy refuses eval, so in a browser
// every form page logged a violation before Zod fell back. Set here because
// every schema in the app imports this module (the RSVP schema reuses its
// limits), so it runs before any of them parses.
z.config({ jitless: true })

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
  jobTitle: 120,
  organisation: 200,
} as const

/**
 * The industries a member chooses from, in the order the form lists them. The
 * value is what is stored, the label what is shown, so rewording a label is
 * not a data migration. Read by the form, the schema, the members collection's
 * select and the team's email.
 */
export const INDUSTRIES = [
  { value: 'clinical', label: 'Healthcare provider / clinical' },
  { value: 'healthtech', label: 'Healthcare technology' },
  { value: 'digital-health', label: 'Digital health / HealthTech startup' },
  { value: 'femtech', label: 'Women’s health / FemTech' },
  { value: 'life-sciences', label: 'Life sciences / pharma / medtech' },
  { value: 'investment', label: 'Investment / venture capital' },
  { value: 'public-sector', label: 'NHS / public sector' },
  { value: 'consulting', label: 'Consulting / advisory' },
  { value: 'academia', label: 'Academia / research' },
  { value: 'other', label: 'Other' },
] as const

export type Industry = (typeof INDUSTRIES)[number]['value']

const INDUSTRY_VALUES = INDUSTRIES.map((industry) => industry.value) as [Industry, ...Industry[]]

export function industryLabel(value: string | null | undefined): string | null {
  return INDUSTRIES.find((industry) => industry.value === value)?.label ?? null
}

const optional = (max: number, message: string) => z.string().trim().max(max, message)

export const signupSchema = z.object({
  firstName: required('Please tell us your first name.', SIGNUP_LIMITS.name),
  lastName: required('Please tell us your last name.', SIGNUP_LIMITS.name),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(SIGNUP_LIMITS.email, 'That email address is too long.')
    .pipe(z.email('Please enter a valid email address.')),
  phone: optional(SIGNUP_LIMITS.phone, 'That phone number is too long.').regex(
    /^[+()\d\s.-]*$/,
    'Please use digits, spaces and + only.',
  ),
  jobTitle: required('Please tell us your job title.', SIGNUP_LIMITS.jobTitle),
  organisation: optional(
    SIGNUP_LIMITS.organisation,
    `Please keep this under ${SIGNUP_LIMITS.organisation} characters.`,
  ),
  industry: z.enum(INDUSTRY_VALUES, { message: 'Please choose your industry.' }),
  // Required: joining is agreeing to the updates, as the client's copy has it.
  // Whether that is valid consent is an open question (AGENTS.md).
  emailUpdates: z.literal(true, { message: 'Please tick this box to become a member.' }),
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
    jobTitle: text('jobTitle'),
    organisation: text('organisation'),
    industry: text('industry'),
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

/**
 * The visit's attribution as the form sends it (`ow_attribution`): its landing
 * page and referring site, as the analytics package records them. Kept apart
 * from `signupSchema` on purpose, so it can never reach the member, an email or
 * a log by riding along with the sign-up. Read only to classify the lead
 * event's channel. Optional, because the form without JavaScript sends it
 * empty; over the limit it is refused like any other over-long field.
 */
export const ATTRIBUTION_MAX = 2048

export const attributionSchema = z
  .string()
  .max(ATTRIBUTION_MAX, `Please keep this under ${ATTRIBUTION_MAX} characters.`)
  .optional()

/** The attribution from a FormData: undefined when absent or not a string. */
export function attributionInput(form: FormData): string | undefined {
  const value = form.get('ow_attribution')
  return typeof value === 'string' ? value : undefined
}

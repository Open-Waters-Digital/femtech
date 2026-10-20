import { describe, expect, it } from 'vitest'

import {
  INDUSTRIES,
  industryLabel,
  signupInput,
  signupSchema,
  toFieldErrors,
} from '@/lib/signup/schema'

function form(fields: Record<string, string>): FormData {
  const data = new FormData()
  for (const [name, value] of Object.entries(fields)) data.append(name, value)
  return data
}

const VALID = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '',
  jobTitle: 'Chief Medical Officer',
  organisation: '',
  industry: 'digital-health',
  emailUpdates: 'on',
}

/** VALID without one field, as a browser sends a form with it left out. */
function without(field: keyof typeof VALID): Record<string, string> {
  const { [field]: _omitted, ...rest } = VALID
  return rest
}

describe('signupSchema', () => {
  it('accepts the smallest valid sign-up: names, email, job title, industry, consent', () => {
    const parsed = signupSchema.safeParse(signupInput(form(VALID)))
    expect(parsed.success).toBe(true)
  })

  it('lower-cases and trims the email, so one person is one member', () => {
    const parsed = signupSchema.parse(signupInput(form({ ...VALID, email: '  Ada@Example.COM ' })))
    expect(parsed.email).toBe('ada@example.com')
  })

  it('reads the checkbox as presence, the way a browser sends it', () => {
    expect(signupSchema.parse(signupInput(form(VALID))).emailUpdates).toBe(true)
  })

  it('refuses a sign-up without the consent box ticked', () => {
    const parsed = signupSchema.safeParse(signupInput(form(without('emailUpdates'))))
    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(toFieldErrors(parsed.error)).toEqual({
      emailUpdates: 'Please tick this box to become a member.',
    })
  })

  it('treats missing optional fields as empty rather than failing', () => {
    const { phone: _phone, organisation: _organisation, ...required } = VALID
    const parsed = signupSchema.safeParse(signupInput(form(required)))
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data.phone).toBe('')
    expect(parsed.data.organisation).toBe('')
  })

  it('names each missing required field in words, in the form’s order', () => {
    const parsed = signupSchema.safeParse(signupInput(form({})))
    expect(parsed.success).toBe(false)
    if (parsed.success) return
    const errors = toFieldErrors(parsed.error)
    expect(errors).toEqual({
      firstName: 'Please tell us your first name.',
      lastName: 'Please tell us your last name.',
      email: 'Please enter a valid email address.',
      jobTitle: 'Please tell us your job title.',
      industry: 'Please choose your industry.',
      emailUpdates: 'Please tick this box to become a member.',
    })
    // The form focuses the first key, so the order is the order on the page.
    expect(Object.keys(errors)).toEqual([
      'firstName',
      'lastName',
      'email',
      'jobTitle',
      'industry',
      'emailUpdates',
    ])
  })

  it('refuses a job title that is missing or too long', () => {
    expect(signupSchema.safeParse(signupInput(form(without('jobTitle')))).success).toBe(false)
    expect(signupSchema.safeParse(signupInput(form({ ...VALID, jobTitle: '  ' }))).success).toBe(
      false,
    )
    expect(
      signupSchema.safeParse(signupInput(form({ ...VALID, jobTitle: 'x'.repeat(120) }))).success,
    ).toBe(true)
    const tooLong = signupSchema.safeParse(
      signupInput(form({ ...VALID, jobTitle: 'x'.repeat(121) })),
    )
    expect(tooLong.success).toBe(false)
    if (tooLong.success) return
    expect(Object.keys(toFieldErrors(tooLong.error))).toEqual(['jobTitle'])
  })

  it('caps the organisation at 200 characters', () => {
    expect(
      signupSchema.safeParse(signupInput(form({ ...VALID, organisation: 'x'.repeat(201) })))
        .success,
    ).toBe(false)
  })

  it('accepts every listed industry and nothing else', () => {
    for (const { value } of INDUSTRIES) {
      expect(signupSchema.safeParse(signupInput(form({ ...VALID, industry: value }))).success).toBe(
        true,
      )
    }
    for (const industry of ['', 'Healthcare technology', 'pharma', 'toString']) {
      expect(signupSchema.safeParse(signupInput(form({ ...VALID, industry }))).success).toBe(false)
    }
  })

  it('labels an industry for people, and nothing for an unknown value', () => {
    expect(industryLabel('femtech')).toBe('Women’s health / FemTech')
    expect(industryLabel('nonsense')).toBeNull()
    expect(industryLabel(null)).toBeNull()
  })

  it('refuses a name that is only whitespace', () => {
    expect(signupSchema.safeParse(signupInput(form({ ...VALID, firstName: '   ' }))).success).toBe(
      false,
    )
  })

  it('refuses an address without a domain', () => {
    expect(signupSchema.safeParse(signupInput(form({ ...VALID, email: 'ada@' }))).success).toBe(
      false,
    )
  })

  it('refuses a header-injection attempt in the email', () => {
    const parsed = signupSchema.safeParse(
      signupInput(form({ ...VALID, email: 'ada@example.com\r\nBcc: victim@example.com' })),
    )
    expect(parsed.success).toBe(false)
  })

  it('accepts an international phone number and refuses letters', () => {
    expect(
      signupSchema.safeParse(signupInput(form({ ...VALID, phone: '+44 (0)20 7946 0958' }))).success,
    ).toBe(true)
    expect(
      signupSchema.safeParse(signupInput(form({ ...VALID, phone: 'call me maybe' }))).success,
    ).toBe(false)
  })

  it('no longer reads a message, even if one is posted', () => {
    const parsed = signupSchema.parse(signupInput(form({ ...VALID, message: 'Hello' })))
    expect(parsed).not.toHaveProperty('message')
  })

  it('reports one message per field', () => {
    const parsed = signupSchema.safeParse(signupInput(form({ ...VALID, email: '' })))
    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(Object.keys(toFieldErrors(parsed.error))).toEqual(['email'])
  })
})

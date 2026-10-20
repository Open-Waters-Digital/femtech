import { describe, expect, it } from 'vitest'

import { signupInput, signupSchema, toFieldErrors } from '@/lib/signup/schema'

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
  message: '',
}

describe('signupSchema', () => {
  it('accepts the smallest valid sign-up: names and an email', () => {
    const parsed = signupSchema.safeParse(signupInput(form(VALID)))
    expect(parsed.success).toBe(true)
  })

  it('lower-cases and trims the email, so one person is one member', () => {
    const parsed = signupSchema.parse(signupInput(form({ ...VALID, email: '  Ada@Example.COM ' })))
    expect(parsed.email).toBe('ada@example.com')
  })

  it('reads the checkbox as presence, the way a browser sends it', () => {
    expect(signupSchema.parse(signupInput(form(VALID))).emailUpdates).toBe(false)
    expect(
      signupSchema.parse(signupInput(form({ ...VALID, emailUpdates: 'on' }))).emailUpdates,
    ).toBe(true)
  })

  it('treats missing optional fields as empty rather than failing', () => {
    const parsed = signupSchema.safeParse(
      signupInput(form({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' })),
    )
    expect(parsed.success).toBe(true)
  })

  it('names each missing required field in words', () => {
    const parsed = signupSchema.safeParse(signupInput(form({})))
    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(toFieldErrors(parsed.error)).toEqual({
      firstName: 'Please tell us your first name.',
      lastName: 'Please tell us your surname.',
      email: 'Please enter a valid email address.',
    })
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

  it('caps the message length', () => {
    const parsed = signupSchema.safeParse(
      signupInput(form({ ...VALID, message: 'x'.repeat(2001) })),
    )
    expect(parsed.success).toBe(false)
  })

  it('reports one message per field', () => {
    const parsed = signupSchema.safeParse(signupInput(form({ ...VALID, email: '' })))
    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(Object.keys(toFieldErrors(parsed.error))).toEqual(['email'])
  })
})

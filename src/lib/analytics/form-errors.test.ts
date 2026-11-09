import { describe, expect, it } from 'vitest'

import { formErrorTypes } from '@/lib/analytics/form-errors'
import { rsvpInput, rsvpSchema } from '@/lib/events/rsvp-schema'
import { signupInput, signupSchema } from '@/lib/signup/schema'

function form(fields: Record<string, string>): FormData {
  const data = new FormData()
  for (const [name, value] of Object.entries(fields)) data.append(name, value)
  return data
}

function signupErrors(fields: Record<string, string>) {
  const input = signupInput(form(fields))
  const parsed = signupSchema.safeParse(input)
  if (parsed.success) throw new Error('expected a failure')
  return Object.fromEntries(formErrorTypes(parsed.error, input))
}

describe('formErrorTypes', () => {
  it('calls every empty required field required, whatever rule caught it', () => {
    expect(signupErrors({})).toEqual({
      firstName: 'required',
      lastName: 'required',
      email: 'required',
      jobTitle: 'required',
      industry: 'required',
      emailUpdates: 'required',
    })
  })

  it('tells a malformed value from a long one', () => {
    const errors = signupErrors({
      firstName: 'x'.repeat(101),
      lastName: 'Lovelace',
      email: 'not-an-email',
      phone: 'call me',
      jobTitle: 'CMO',
      industry: 'not-a-choice',
      emailUpdates: 'on',
    })
    expect(errors).toEqual({
      firstName: 'too_long',
      email: 'format',
      phone: 'format',
      industry: 'format',
    })
  })

  it('reports field names and classes only, never a value', () => {
    const input = rsvpInput(form({ firstName: 'Ada', lastName: '', email: 'ada@@example' }))
    const parsed = rsvpSchema.safeParse(input)
    if (parsed.success) throw new Error('expected a failure')
    const reported = JSON.stringify(formErrorTypes(parsed.error, input))
    expect(reported).toBe('[["lastName","required"],["email","format"]]')
    expect(reported).not.toContain('ada')
  })
})

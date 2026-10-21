import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Message } from '@/lib/email'
import { buildConfirmation, sendConfirmation } from '@/lib/events/confirm'
import { readWithdrawToken } from '@/lib/events/withdraw-token'

const REGISTRATION = { id: 12, firstName: 'Ada', email: 'ada@example.com' }
const EVENT = {
  title: 'Winter Speakeasy',
  slug: 'winter-speakeasy',
  startsAt: '2026-12-03T18:30:00.000Z',
  startsAt_tz: 'Europe/London',
  endsAt: '2026-12-03T21:30:00.000Z',
  venue: 'A members’ club',
  city: 'London',
}

const KEYS = ['RESEND_API_KEY', 'SIGNUP_FROM_EMAIL', 'SITE_ENV', 'PAYLOAD_SECRET']
let saved: Record<string, string | undefined> = {}
beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]))
  process.env.PAYLOAD_SECRET = 'test-secret'
  process.env.SIGNUP_FROM_EMAIL = 'FemTech <hello@example.com>'
  delete process.env.RESEND_API_KEY
  delete process.env.SITE_ENV
})
afterEach(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  vi.useRealTimers()
})

describe('buildConfirmation', () => {
  it('goes to the registrant only, with the event’s details', () => {
    const message = buildConfirmation(REGISTRATION, EVENT, { from: 'f' })
    expect(message.to).toEqual(['ada@example.com'])
    expect(message.subject).toBe('You’re booked: Winter Speakeasy')
    expect(message.text).toContain('Thursday 3 December 2026, 18:30–21:30 GMT')
    expect(message.text).toContain('A members’ club, London')
    expect(message.text).toContain('/events/winter-speakeasy')
  })

  it('carries a withdraw link with a valid token for this registration', () => {
    const message = buildConfirmation(REGISTRATION, EVENT, { from: 'f' })
    const link = message.text.match(/\/events\/withdraw\?token=([A-Za-z0-9_.-]+)/)
    expect(link).not.toBeNull()
    expect(readWithdrawToken(link?.[1])).toBe(12)
    expect(message.html).toContain('/events/withdraw?token=')
  })

  it('shows markup in a name or a title as text', () => {
    const message = buildConfirmation(
      { ...REGISTRATION, firstName: '<img src=x onerror=alert(1)>' },
      { ...EVENT, title: '<script>x</script> night' },
      { from: 'f' },
    )
    expect(message.html).not.toContain('<img')
    expect(message.html).not.toContain('<script>')
    expect(message.html).toContain('&lt;script&gt;')
  })

  it('keeps a line break in the title out of the subject line', () => {
    const message = buildConfirmation(
      REGISTRATION,
      { ...EVENT, title: 'Night\r\nBcc: victim@example.com' },
      { from: 'f' },
    )
    expect(message.subject).not.toMatch(/[\r\n]/)
  })

  it('replies to the contact address only when there is one', () => {
    expect(buildConfirmation(REGISTRATION, EVENT, { from: 'f' })).not.toHaveProperty('replyTo')
    expect(
      buildConfirmation(REGISTRATION, EVENT, { from: 'f', replyTo: 'team@example.com' }).replyTo,
    ).toBe('team@example.com')
  })
})

describe('sendConfirmation', () => {
  it('reports sent when the provider accepts it', async () => {
    const sent: Message[] = []
    const result = await sendConfirmation(REGISTRATION, EVENT, {
      send: async (message) => {
        sent.push(message)
        return { error: null }
      },
    })
    expect(result).toBe('sent')
    expect(sent[0]?.from).toBe('FemTech <hello@example.com>')
  })

  it('reports failed when the provider refuses or throws', async () => {
    expect(
      await sendConfirmation(REGISTRATION, EVENT, { send: async () => ({ error: 'nope' }) }),
    ).toBe('failed')
    expect(
      await sendConfirmation(REGISTRATION, EVENT, {
        send: async () => {
          throw new Error('down')
        },
      }),
    ).toBe('failed')
  })

  it('gives up after ten seconds rather than hanging', async () => {
    vi.useFakeTimers()
    const pending = sendConfirmation(REGISTRATION, EVENT, { send: () => new Promise(() => {}) })
    await vi.advanceTimersByTimeAsync(10_000)
    expect(await pending).toBe('failed')
  })

  it('skips in development and is unconfigured in production without mail settings', async () => {
    expect(await sendConfirmation(REGISTRATION, EVENT)).toBe('skipped')
    process.env.SITE_ENV = 'production'
    expect(await sendConfirmation(REGISTRATION, EVENT)).toBe('unconfigured')
  })
})

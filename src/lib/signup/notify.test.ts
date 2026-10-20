import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Message, buildMessage, notifyTeam, recipients, safe } from '@/lib/signup/notify'

const MEMBER = {
  id: 7,
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '+44 20 7946 0958',
  message: 'Looking forward to it.',
  emailUpdates: true,
}

const ENV_KEYS = ['RESEND_API_KEY', 'SIGNUP_FROM_EMAIL', 'SIGNUP_NOTIFY_EMAIL', 'SITE_ENV']
let saved: Record<string, string | undefined> = {}

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))
  process.env.SIGNUP_FROM_EMAIL = 'FemTech <hello@example.com>'
  process.env.SIGNUP_NOTIFY_EMAIL = 'team@example.com'
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

describe('safe', () => {
  it('escapes markup', () => {
    expect(safe('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    )
  })

  it('strips CR and LF, so nothing can start a new header', () => {
    expect(safe('Ada\r\nBcc: victim@example.com')).toBe('Ada Bcc: victim@example.com')
  })
})

describe('recipients', () => {
  it('splits a comma-separated list and drops blanks', () => {
    expect(recipients(' a@example.com, ,b@example.com ')).toEqual([
      'a@example.com',
      'b@example.com',
    ])
  })

  it('is empty when unset', () => {
    expect(recipients(undefined)).toEqual([])
  })
})

describe('buildMessage', () => {
  it('replies to the member and links to the admin record', () => {
    const message = buildMessage(MEMBER, { from: 'f', to: ['t'], repeat: false })
    expect(message.replyTo).toBe('ada@example.com')
    expect(message.subject).toBe('New sign-up: Ada Lovelace')
    expect(message.html).toContain('/admin/collections/members/7')
    expect(message.text).toContain('Happy to receive emails: Yes')
  })

  it('keeps a hostile name out of the subject line and the markup', () => {
    const message = buildMessage(
      { ...MEMBER, firstName: '<b>Ada\r\nBcc: x@example.com' },
      { from: 'f', to: ['t'], repeat: false },
    )
    expect(message.subject).not.toMatch(/[\r\n]/)
    expect(message.html).not.toContain('<b>Ada')
  })

  it('says so when the address was already a member', () => {
    const message = buildMessage(MEMBER, { from: 'f', to: ['t'], repeat: true })
    expect(message.subject).toContain('already a member')
  })
})

describe('notifyTeam', () => {
  it('sends through the seam and reports sent', async () => {
    const sent: Message[] = []
    const result = await notifyTeam(MEMBER, false, async (message) => {
      sent.push(message)
      return { error: null }
    })
    expect(result).toBe('sent')
    expect(sent[0]?.to).toEqual(['team@example.com'])
  })

  it('reports failed when the provider returns an error', async () => {
    expect(await notifyTeam(MEMBER, false, async () => ({ error: 'nope' }))).toBe('failed')
  })

  it('reports failed when the provider throws', async () => {
    expect(
      await notifyTeam(MEMBER, false, async () => {
        throw new Error('network')
      }),
    ).toBe('failed')
  })

  it('gives up on a provider that hangs', async () => {
    vi.useFakeTimers()
    const pending = notifyTeam(MEMBER, false, () => new Promise(() => {}))
    await vi.advanceTimersByTimeAsync(8_000)
    expect(await pending).toBe('failed')
  })

  it('skips quietly outside production when mail is not configured', async () => {
    expect(await notifyTeam(MEMBER, false)).toBe('skipped')
  })

  it('reports unconfigured in production, so the caller can raise it', async () => {
    process.env.SITE_ENV = 'production'
    expect(await notifyTeam(MEMBER, false)).toBe('unconfigured')
  })
})

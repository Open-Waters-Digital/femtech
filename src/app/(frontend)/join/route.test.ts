import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The route against a stand-in Payload: what it saves, what it refuses and what
 * it answers. Payload, the config and `after()` are replaced; every layer of the
 * route itself (rate limit, honeypot, dwell token, schema) runs for real.
 */
const db = vi.hoisted(() => ({
  members: [] as Record<string, unknown>[],
  create: vi.fn(),
  update: vi.fn(),
  /** What `after()` was handed, so a test can run it. */
  pending: [] as (() => Promise<void>)[],
  turnstile: 'pass' as 'pass' | 'fail' | 'unavailable',
  welcome: vi.fn(async (): Promise<string> => 'sent'),
  notify: vi.fn(async (): Promise<string> => 'sent'),
}))

vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))

vi.mock('next/server', () => ({
  after: (task: () => Promise<void>) => {
    db.pending.push(task)
  },
}))

vi.mock('@/lib/signup/notify', () => ({ notifyTeam: db.notify }))
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: vi.fn(async () => db.turnstile) }))
vi.mock('@/lib/signup/welcome', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/signup/welcome')>()),
  sendWelcome: db.welcome,
}))

vi.mock('payload', () => {
  class ValidationError extends Error {}
  return {
    ValidationError,
    getPayload: async () => ({
      find: async ({ where }: { where: { email: { equals: string } } }) => ({
        docs: db.members.filter((member) => member.email === where.email.equals),
      }),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        db.create(data)
        const row = { ...data, id: db.members.length + 1 }
        db.members.push(row)
        return row
      },
      update: db.update,
      findGlobal: async () => ({ signupThanks: 'Welcome.', social: [] }),
    }),
  }
})

const { POST } = await import('@/app/(frontend)/join/route')
const { mintDwellToken } = await import('@/lib/dwell-token')
const { resetRateLimit } = await import('@/lib/rate-limit')

const VALID = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '',
  jobTitle: 'Chief Medical Officer',
  organisation: 'Analytical Health',
  industry: 'digital-health',
  emailUpdates: 'on',
}

function post(fields: Record<string, string>, accept?: string): Request {
  const body = new FormData()
  // Ten seconds old: past the dwell minimum, well inside its maximum.
  body.append('dwell', mintDwellToken(Date.now() - 10_000))
  for (const [name, value] of Object.entries(fields)) body.append(name, value)
  return new Request('http://localhost/join', {
    method: 'POST',
    body,
    headers: { 'x-forwarded-for': '203.0.113.7', ...(accept ? { accept } : {}) },
  })
}

let secret: string | undefined

beforeEach(() => {
  secret = process.env.PAYLOAD_SECRET
  process.env.PAYLOAD_SECRET = 'test-secret'
  db.members.length = 0
  db.pending.length = 0
  db.turnstile = 'pass'
  db.create.mockClear()
  db.update.mockReset()
  db.welcome.mockReset().mockResolvedValue('sent')
  db.notify.mockReset().mockResolvedValue('sent')
  resetRateLimit()
})

/** Run what the route left for after the response. */
async function runAfter(): Promise<void> {
  for (const task of db.pending.splice(0)) await task()
}

const WITH_TOKEN = { ...VALID, 'cf-turnstile-response': 'token' }

afterEach(() => {
  if (secret === undefined) delete process.env.PAYLOAD_SECRET
  else process.env.PAYLOAD_SECRET = secret
})

describe('POST /join', () => {
  it('saves the new fields and records consent', async () => {
    const response = await POST(post(VALID, 'application/json'))
    expect(response.status).toBe(200)
    expect(db.create).toHaveBeenCalledWith(
      expect.objectContaining({
        jobTitle: 'Chief Medical Officer',
        organisation: 'Analytical Health',
        industry: 'digital-health',
        emailUpdates: true,
        status: 'active',
      }),
    )
    expect(db.create.mock.calls[0]?.[0]).not.toHaveProperty('message')
  })

  it('refuses an unticked consent box with a field error, as JSON', async () => {
    const { emailUpdates: _unticked, ...fields } = VALID
    const response = await POST(post(fields, 'application/json'))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      ok: false,
      fields: { emailUpdates: 'Please tick this box to become a member.' },
    })
    expect(db.create).not.toHaveBeenCalled()
  })

  it('sends a native post without consent to the not-sent page', async () => {
    const { emailUpdates: _unticked, ...fields } = VALID
    const response = await POST(post(fields))
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('/sign-up/not-sent?reason=check')
    expect(db.create).not.toHaveBeenCalled()
  })

  it('refuses an industry outside the list', async () => {
    const response = await POST(post({ ...VALID, industry: 'astrology' }, 'application/json'))
    expect(response.status).toBe(400)
    expect(db.create).not.toHaveBeenCalled()
  })

  it('refuses a post from the old form, which has no job title or industry', async () => {
    const response = await POST(
      post(
        { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', message: 'Hi' },
        'application/json',
      ),
    )
    expect(response.status).toBe(400)
    const body = (await response.json()) as { fields: Record<string, string> }
    expect(Object.keys(body.fields)).toEqual(['jobTitle', 'industry', 'emailUpdates'])
    expect(db.create).not.toHaveBeenCalled()
  })

  it('leaves a repeat sign-up’s stored details untouched and answers as for a new one', async () => {
    await POST(post(VALID, 'application/json'))
    const response = await POST(
      post(
        {
          ...VALID,
          email: 'ADA@example.com',
          jobTitle: 'Chief Executive',
          organisation: 'Somewhere Else',
          industry: 'investment',
        },
        'application/json',
      ),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(db.create).toHaveBeenCalledTimes(1)
    expect(db.update).not.toHaveBeenCalled()
    expect(db.members).toHaveLength(1)
    expect(db.members[0]).toMatchObject({
      jobTitle: 'Chief Medical Officer',
      organisation: 'Analytical Health',
      industry: 'digital-health',
    })
  })
})

describe('POST /join: the welcome email', () => {
  it('welcomes a new member whose check passed, then tells the team it was sent', async () => {
    await POST(post(WITH_TOKEN, 'application/json'))
    await runAfter()
    expect(db.welcome).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Ada', email: 'ada@example.com' }),
      expect.objectContaining({ thanks: 'Welcome.' }),
    )
    expect(db.notify).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), {
      repeat: false,
      welcome: 'sent',
    })
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, data: { notification: 'sent', welcomeEmail: 'sent' } }),
    )
    // Welcome first, so the team's email states the real outcome.
    expect(db.welcome.mock.invocationCallOrder[0]).toBeLessThan(
      db.notify.mock.invocationCallOrder[0] ?? 0,
    )
  })

  it('saves but does not welcome a sign-up with no token, as without JavaScript', async () => {
    const response = await POST(post(VALID))
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('/sign-up/thank-you')
    await runAfter()
    expect(db.members).toHaveLength(1)
    expect(db.welcome).not.toHaveBeenCalled()
    expect(db.notify).toHaveBeenCalledWith(expect.anything(), {
      repeat: false,
      welcome: 'unverified',
    })
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { notification: 'sent', welcomeEmail: 'unverified' } }),
    )
  })

  it('saves but does not welcome a sign-up whose check failed', async () => {
    db.turnstile = 'fail'
    const response = await POST(post(WITH_TOKEN, 'application/json'))
    expect(response.status).toBe(200)
    await runAfter()
    expect(db.members).toHaveLength(1)
    expect(db.welcome).not.toHaveBeenCalled()
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { notification: 'sent', welcomeEmail: 'unverified' } }),
    )
  })

  it('logs an error, and does not welcome, when Turnstile is unavailable', async () => {
    db.turnstile = 'unavailable'
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await POST(post(WITH_TOKEN, 'application/json'))
    await runAfter()
    expect(db.welcome).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith(expect.stringContaining('[join] turnstile unavailable'))
    error.mockRestore()
  })

  it('does not welcome a repeat, and changes nothing on the member', async () => {
    await POST(post(WITH_TOKEN, 'application/json'))
    await runAfter()
    db.welcome.mockClear()
    db.update.mockClear()

    await POST(post({ ...WITH_TOKEN, email: 'ADA@example.com' }, 'application/json'))
    await runAfter()
    expect(db.welcome).not.toHaveBeenCalled()
    expect(db.notify).toHaveBeenLastCalledWith(expect.anything(), {
      repeat: true,
      welcome: undefined,
    })
    expect(db.update).not.toHaveBeenCalled()
  })

  it('still tells the team when the welcome fails, and records it', async () => {
    db.welcome.mockResolvedValue('failed')
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await POST(post(WITH_TOKEN, 'application/json'))
    await runAfter()
    expect(db.notify).toHaveBeenCalledWith(expect.anything(), {
      repeat: false,
      welcome: 'failed',
    })
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { notification: 'sent', welcomeEmail: 'failed' } }),
    )
    expect(error).toHaveBeenCalledWith('[join] welcome failed for member 1')
    error.mockRestore()
  })

  it('logs no name or address on any path', async () => {
    const lines: string[] = []
    const capture = (...args: unknown[]) => {
      lines.push(args.map(String).join(' '))
    }
    const warn = vi.spyOn(console, 'warn').mockImplementation(capture)
    const error = vi.spyOn(console, 'error').mockImplementation(capture)
    const log = vi.spyOn(console, 'log').mockImplementation(capture)

    for (const outcome of ['pass', 'fail', 'unavailable'] as const) {
      db.turnstile = outcome
      db.welcome.mockResolvedValue(outcome === 'pass' ? 'failed' : 'sent')
      db.members.length = 0
      resetRateLimit()
      await POST(post(WITH_TOKEN, 'application/json'))
      await POST(post(VALID))
      await runAfter()
    }

    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) {
      expect(line).not.toMatch(/Ada|Lovelace|ada@example\.com/i)
    }
    warn.mockRestore()
    error.mockRestore()
    log.mockRestore()
  })
})

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
}))

vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))

vi.mock('next/server', () => ({ after: vi.fn() }))

vi.mock('@/lib/signup/notify', () => ({ notifyTeam: vi.fn(async () => 'skipped') }))

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
  db.create.mockClear()
  resetRateLimit()
})

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

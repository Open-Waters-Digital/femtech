import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The RSVP route against an in-memory stand-in for Payload. Every layer of the
 * route itself runs for real; Payload, the config, Turnstile's network call,
 * the email and `after()` are replaced.
 *
 * Each stand-in operation yields to the event loop first, so two requests
 * really do interleave: without the per-event lock, both would count the last
 * place as free.
 */
type Row = Record<string, unknown> & { id: number }
type Where = Record<string, { equals?: unknown; in?: unknown[] }>

const db = vi.hoisted(() => ({
  events: [] as Record<string, unknown>[],
  registrations: [] as Record<string, unknown>[],
  members: [] as Record<string, unknown>[],
  afterTasks: [] as (() => unknown)[],
  turnstile: 'pass' as 'pass' | 'fail' | 'unavailable',
  sent: [] as unknown[],
}))

vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))
vi.mock('next/server', () => ({ after: (task: () => unknown) => db.afterTasks.push(task) }))
vi.mock('@/lib/events/turnstile', () => ({ verifyTurnstile: async () => db.turnstile }))
vi.mock('@/lib/events/confirm', () => ({
  sendConfirmation: async (registration: unknown) => {
    db.sent.push(registration)
    return 'skipped'
  },
}))

vi.mock('payload', () => {
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
  const table = (collection: string) =>
    collection === 'events' ? db.events : collection === 'members' ? db.members : db.registrations
  const matches = (row: Record<string, unknown>, where: Where = {}) =>
    Object.entries(where).every(([field, test]) =>
      'in' in test ? (test.in ?? []).includes(row[field]) : row[field] === test.equals,
    )
  const publicOnly = (collection: string, rows: Record<string, unknown>[], override: boolean) =>
    collection === 'events' && !override
      ? rows.filter((row) => row.status === 'published' || row.status === 'cancelled')
      : rows
  const payload = {
    find: async ({
      collection,
      where,
      overrideAccess,
    }: {
      collection: string
      where: Where
      overrideAccess?: boolean
    }) => {
      await tick()
      return {
        docs: publicOnly(collection, table(collection), Boolean(overrideAccess)).filter((row) =>
          matches(row, where),
        ),
      }
    },
    count: async ({ collection, where }: { collection: string; where: Where }) => {
      await tick()
      return { totalDocs: table(collection).filter((row) => matches(row, where)).length }
    },
    create: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
      await tick()
      const rows = table(collection)
      const row = { ...data, id: rows.length + 1 }
      rows.push(row)
      return row
    },
    update: async ({
      collection,
      id,
      data,
    }: {
      collection: string
      id: number
      data: Record<string, unknown>
    }) => {
      await tick()
      const row = table(collection).find((candidate) => candidate.id === id)
      if (row) Object.assign(row, data)
      return row
    },
    findGlobal: async () => ({ contactEmail: null }),
  }
  return {
    getPayload: async () => payload,
    createLocalReq: async () => ({}),
    initTransaction: async () => true,
    commitTransaction: async () => undefined,
    killTransaction: async () => undefined,
  }
})

const { POST } = await import('@/app/(frontend)/events/[slug]/rsvp/route')
const { mintDwellToken } = await import('@/lib/dwell-token')
const { resetRateLimit } = await import('@/lib/rate-limit')

const SLUG = 'winter-speakeasy'
const EVENT = {
  id: 1,
  slug: SLUG,
  title: 'Winter Speakeasy',
  kind: 'hosted',
  status: 'published',
  startsAt: '2099-12-03T18:30:00.000Z',
  startsAt_tz: 'Europe/London',
  capacity: 20,
}
const VALID = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' }

let ipCounter = 0
function post(
  fields: Record<string, string>,
  {
    accept = 'application/json',
    dwellAgeMs = 10_000,
    ip,
  }: { accept?: string; dwellAgeMs?: number; ip?: string } = {},
): Promise<Response> {
  const body = new FormData()
  body.append('dwell', mintDwellToken(Date.now() - dwellAgeMs))
  body.append('cf-turnstile-response', 'token')
  for (const [name, value] of Object.entries(fields)) body.append(name, value)
  ipCounter += 1
  const request = new Request(`http://localhost/events/${SLUG}/rsvp`, {
    method: 'POST',
    body,
    headers: { accept, 'x-forwarded-for': ip ?? `198.51.100.${ipCounter}` },
  })
  return POST(request, { params: Promise.resolve({ slug: SLUG }) })
}

async function runAfterTasks(): Promise<void> {
  const tasks = db.afterTasks.splice(0)
  await Promise.all(tasks.map((task) => task()))
}

let secret: string | undefined
beforeEach(() => {
  secret = process.env.PAYLOAD_SECRET
  process.env.PAYLOAD_SECRET = 'test-secret'
  db.events.length = 0
  db.events.push({ ...EVENT })
  db.registrations.length = 0
  db.members.length = 0
  db.afterTasks.length = 0
  db.sent.length = 0
  db.turnstile = 'pass'
  resetRateLimit()
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  if (secret === undefined) delete process.env.PAYLOAD_SECRET
  else process.env.PAYLOAD_SECRET = secret
  vi.restoreAllMocks()
})

describe('POST /events/[slug]/rsvp', () => {
  it('confirms a place and emails the registrant after answering', async () => {
    const response = await post(VALID)
    expect(response.status).toBe(200)
    expect(db.registrations).toEqual([
      expect.objectContaining({ event: 1, email: 'ada@example.com', status: 'confirmed' }),
    ])
    expect(db.sent).toHaveLength(0)
    await runAfterTasks()
    expect(db.sent).toEqual([expect.objectContaining({ email: 'ada@example.com' })])
    expect(db.registrations[0]).toMatchObject({ confirmation: 'skipped' })
  })

  it('links the registration to the member with the same address, and leaves the member alone', async () => {
    db.members.push({ id: 7, email: 'ada@example.com', firstName: 'Ada' })
    await post({ ...VALID, email: 'ADA@Example.com' })
    expect(db.registrations[0]).toMatchObject({ member: 7, email: 'ada@example.com' })
    expect(db.members).toEqual([{ id: 7, email: 'ada@example.com', firstName: 'Ada' }])
  })

  describe('layers', () => {
    it('refuses a native post: RSVP needs JavaScript', async () => {
      expect((await post(VALID, { accept: 'text/html' })).status).toBe(415)
      expect(db.registrations).toHaveLength(0)
    })

    it('answers a filled honeypot as success, and saves and sends nothing', async () => {
      const response = await post({ ...VALID, website: 'https://spam.example' })
      expect(response.status).toBe(200)
      await runAfterTasks()
      expect(db.registrations).toHaveLength(0)
      expect(db.sent).toHaveLength(0)
    })

    it('answers a post faster than a person as success, and saves nothing', async () => {
      expect((await post(VALID, { dwellAgeMs: 500 })).status).toBe(200)
      expect(db.registrations).toHaveLength(0)
    })

    it('tells a visitor whose page has been open for hours to send again', async () => {
      const response = await post(VALID, { dwellAgeMs: 3 * 60 * 60 * 1000 })
      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({ expired: true })
    })

    it('refuses an invalid email with a field error', async () => {
      const response = await post({ ...VALID, email: 'ada@' })
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        ok: false,
        fields: { email: 'Please enter a valid email address.' },
      })
    })

    it('asks the visitor to try again when Turnstile fails, and saves nothing', async () => {
      db.turnstile = 'fail'
      const response = await post(VALID)
      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ turnstile: true })
      expect(db.registrations).toHaveLength(0)
    })

    it('fails closed, and logs an error, when Turnstile is unavailable', async () => {
      db.turnstile = 'unavailable'
      const response = await post(VALID)
      expect(response.status).toBe(503)
      expect(db.registrations).toHaveLength(0)
      expect(console.error).toHaveBeenCalledWith('[rsvp] turnstile unavailable')
    })

    it('rate-limits one address after five attempts', async () => {
      for (let i = 0; i < 5; i += 1) {
        await post({ ...VALID, email: `p${i}@example.com` }, { ip: '203.0.113.9' })
      }
      expect((await post(VALID, { ip: '203.0.113.9' })).status).toBe(429)
    })

    it('never logs a name or an address', async () => {
      await post({ ...VALID, website: 'x' })
      await post({ ...VALID, email: 'ada@' })
      const logged = [...vi.mocked(console.warn).mock.calls, ...vi.mocked(console.error).mock.calls]
        .flat()
        .join(' ')
      expect(logged).not.toContain('Ada')
      expect(logged).not.toContain('ada@')
    })
  })

  describe('the event', () => {
    it('says a full event is full', async () => {
      db.events[0] = { ...EVENT, capacity: 1 }
      await post({ ...VALID, email: 'first@example.com' })
      const response = await post(VALID)
      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({ state: 'full', message: 'This event is full.' })
      expect(db.registrations).toHaveLength(1)
    })

    it('refuses an RSVP after the closing time', async () => {
      db.events[0] = { ...EVENT, rsvpClosesAt: '2000-01-01T00:00:00.000Z' }
      const response = await post(VALID)
      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({ state: 'closed' })
      expect(db.registrations).toHaveLength(0)
    })

    it('refuses an RSVP to a cancelled event', async () => {
      db.events[0] = { ...EVENT, status: 'cancelled' }
      const response = await post(VALID)
      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({ message: 'This event has been cancelled.' })
    })

    it('treats a draft as not there', async () => {
      db.events[0] = { ...EVENT, status: 'draft' }
      expect((await post(VALID)).status).toBe(404)
      expect(db.registrations).toHaveLength(0)
    })
  })

  describe('repeats and withdrawals', () => {
    it('changes nothing on a repeat, resends the confirmation, and answers as for a new place', async () => {
      await post(VALID)
      await runAfterTasks()
      const response = await post({ ...VALID, firstName: 'Someone', lastName: 'Else' })
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ ok: true })
      expect(db.registrations).toHaveLength(1)
      expect(db.registrations[0]).toMatchObject({ firstName: 'Ada', lastName: 'Lovelace' })
      await runAfterTasks()
      expect(db.sent).toHaveLength(2)
    })

    it('confirms a withdrawn registration again when places remain', async () => {
      db.registrations.push({
        id: 1,
        event: 1,
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        status: 'withdrawn',
        withdrawnAt: '2026-11-01T00:00:00.000Z',
      })
      expect((await post(VALID)).status).toBe(200)
      expect(db.registrations).toHaveLength(1)
      expect(db.registrations[0]).toMatchObject({ status: 'confirmed', withdrawnAt: null })
    })
  })

  it('confirms exactly one of two simultaneous RSVPs for the last place', async () => {
    db.events[0] = { ...EVENT, capacity: 20 }
    for (let i = 0; i < 19; i += 1) {
      db.registrations.push({
        id: i + 1,
        event: 1,
        email: `p${i}@example.com`,
        status: 'confirmed',
      } as Row)
    }
    const [first, second] = await Promise.all([
      post({ ...VALID, email: 'one@example.com' }),
      post({ ...VALID, email: 'two@example.com' }),
    ])
    const statuses = [first?.status, second?.status].sort()
    expect(statuses).toEqual([200, 409])
    expect(db.registrations.filter((row) => row.status === 'confirmed')).toHaveLength(20)
  })
})

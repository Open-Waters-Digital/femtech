import type { Payload } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { readWithdrawal, withdraw } from '@/lib/events/withdraw'
import { mintWithdrawToken } from '@/lib/events/withdraw-token'

const EVENT = {
  id: 1,
  title: 'Winter Speakeasy',
  slug: 'winter-speakeasy',
  startsAt: '2026-12-03T18:30:00.000Z',
  startsAt_tz: 'Europe/London',
  endsAt: '2026-12-03T21:30:00.000Z',
  allDay: false,
}
const BEFORE = new Date('2026-11-01T12:00:00.000Z')
const AFTER = new Date('2026-12-04T12:00:00.000Z')

/** A stand-in for Payload holding one registration, recording every write. */
function fakePayload(status: 'confirmed' | 'withdrawn' = 'confirmed') {
  const registration = { id: 12, status, event: EVENT, email: 'ada@example.com' }
  const update = vi.fn(async ({ data }: { data: Record<string, unknown> }) =>
    Object.assign(registration, data),
  )
  const payload = {
    findByID: async ({ id }: { id: number }) => (id === 12 ? registration : null),
    update,
  } as unknown as Payload
  return { payload, update, registration }
}

let saved: string | undefined
beforeEach(() => {
  saved = process.env.PAYLOAD_SECRET
  process.env.PAYLOAD_SECRET = 'test-secret'
})
afterEach(() => {
  if (saved === undefined) delete process.env.PAYLOAD_SECRET
  else process.env.PAYLOAD_SECRET = saved
})

describe('readWithdrawal', () => {
  it('shows the event for a valid link, and changes nothing', async () => {
    const { payload, update, registration } = fakePayload()
    const result = await readWithdrawal(payload, mintWithdrawToken(12), BEFORE)
    expect(result).toMatchObject({ state: 'confirmed', event: { title: 'Winter Speakeasy' } })
    expect(update).not.toHaveBeenCalled()
    expect(registration.status).toBe('confirmed')
  })

  it('shows nothing about the registrant', async () => {
    const { payload } = fakePayload()
    const result = await readWithdrawal(payload, mintWithdrawToken(12), BEFORE)
    expect(JSON.stringify(result)).not.toContain('ada@example.com')
  })

  it('says a tampered, foreign or missing token is not valid', async () => {
    const { payload } = fakePayload()
    const token = mintWithdrawToken(12)
    expect(await readWithdrawal(payload, `${token}x`, BEFORE)).toEqual({ state: 'invalid' })
    expect(await readWithdrawal(payload, mintWithdrawToken(99), BEFORE)).toEqual({
      state: 'invalid',
    })
    expect(await readWithdrawal(payload, null, BEFORE)).toEqual({ state: 'invalid' })
  })

  it('says the event has taken place once it is over', async () => {
    const { payload } = fakePayload()
    expect((await readWithdrawal(payload, mintWithdrawToken(12), AFTER)).state).toBe('past')
  })
})

describe('withdraw', () => {
  it('marks the registration withdrawn, with the time', async () => {
    const { payload, update, registration } = fakePayload()
    expect(await withdraw(payload, mintWithdrawToken(12), BEFORE)).toBe('withdrawn')
    expect(update).toHaveBeenCalledTimes(1)
    expect(registration).toMatchObject({
      status: 'withdrawn',
      withdrawnAt: '2026-11-01T12:00:00.000Z',
    })
  })

  it('is idempotent: a second withdrawal writes nothing and answers the same', async () => {
    const { payload, update } = fakePayload('withdrawn')
    expect(await withdraw(payload, mintWithdrawToken(12), BEFORE)).toBe('withdrawn')
    expect(update).not.toHaveBeenCalled()
  })

  it('changes nothing for a tampered token', async () => {
    const { payload, update } = fakePayload()
    const [id] = mintWithdrawToken(12).split('.')
    expect(await withdraw(payload, `${id}.forged`, BEFORE)).toBe('invalid')
    expect(update).not.toHaveBeenCalled()
  })

  it('leaves a past event alone', async () => {
    const { payload, update } = fakePayload()
    expect(await withdraw(payload, mintWithdrawToken(12), AFTER)).toBe('past')
    expect(update).not.toHaveBeenCalled()
  })
})
